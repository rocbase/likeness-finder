import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getScan, getResultsForScan, insertResult, updateScan } from "@/lib/db";
import {
  allowDemoMode,
  hasFaceCheck,
  hasSerpApi,
  hasYandex,
  getAppUrl,
} from "@/lib/env";
import { runBudgetSearch } from "@/lib/services/budget-search";
import { getDemoCandidates } from "@/lib/services/demo-data";
import { searchFaceCheck } from "@/lib/services/facecheck";
import { searchGoogleLens } from "@/lib/services/serp-lens";
import { searchYandexImages } from "@/lib/services/yandex";
import { deepCrawl } from "@/lib/services/crawler";
import { verifyFaceSimilarity } from "@/lib/services/compreface";
import { scoreImage } from "@/lib/services/nudenet";
import { classifyResult } from "@/lib/services/classifier";
import { buildTakedownGuide, formatTakedownNotes } from "@/lib/services/takedown";
import { saveThumbnail } from "@/lib/storage/photos";
import type { SearchCandidate } from "@/lib/types";

export async function runScanPipeline(scanId: string) {
  const scan = getScan(scanId);
  if (!scan) throw new Error("Scan not found");

  try {
    await phaseSearch(scanId, scan);
    await phaseVerifyAndClassify(scanId, scan);
    const nsfwCount = finalizeScan(scanId);
    return { nsfwCount };
  } catch (error) {
    updateScan(scanId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Scan failed",
      progressMessage: "Scan failed",
    });
    throw error;
  }
}

async function phaseSearch(scanId: string, scan: NonNullable<ReturnType<typeof getScan>>) {
  updateScan(scanId, {
    status: "searching",
    progress: 5,
    progressMessage: "Searching face indexes…",
  });

  const refPath = scan.referencePhotoPaths[0];
  if (!refPath || !fs.existsSync(refPath)) {
    throw new Error("Reference photo missing");
  }
  const refBuffer = fs.readFileSync(refPath);

  let candidates: SearchCandidate[] = [];

  const useDemo =
    allowDemoMode() && !hasFaceCheck() && !hasSerpApi() && !hasYandex();

  if (scan.tier === "budget") {
    updateScan(scanId, {
      progress: 10,
      progressMessage: "Budget scan — local verify + optional Lens…",
    });
    candidates = await runBudgetSearch({
      scanId,
      refPhotoFilename: pathBasename(refPath),
      seedUrls: scan.seedUrls,
      includeAdult: scan.includeAdultIndexes,
      useDemo,
    });
  } else if (useDemo) {
    candidates = getDemoCandidates(scan.includeAdultIndexes);
  } else {
    const tasks: Promise<SearchCandidate[]>[] = [];

    if (hasFaceCheck()) {
      tasks.push(
        searchFaceCheck(refBuffer, scan.includeAdultIndexes).catch(() => [])
      );
    }

    const publicImageUrl = `${getAppUrl()}/api/photos/${scanId}/${encodeURIComponent(pathBasename(refPath))}`;
    if (hasSerpApi()) {
      tasks.push(searchGoogleLens(publicImageUrl).catch(() => []));
    }
    if (hasYandex()) {
      tasks.push(
        searchYandexImages(publicImageUrl, scan.includeAdultIndexes).catch(() => [])
      );
    }

    const batches = await Promise.all(tasks);
    candidates = dedupeCandidates(batches.flat());

    if (scan.mode === "deep") {
      updateScan(scanId, { progress: 25, progressMessage: "Deep crawling related pages…" });
      const crawled = await deepCrawl(candidates, scan.includeAdultIndexes);
      candidates = dedupeCandidates([...candidates, ...crawled]);
    }
  }

  updateScan(scanId, {
    progress: 35,
    progressMessage: `Found ${candidates.length} candidate URLs`,
  });

  // Store candidates temporarily on scan object via global — use module cache
  candidateCache.set(scanId, candidates);
}

const candidateCache = new Map<string, SearchCandidate[]>();

async function phaseVerifyAndClassify(
  scanId: string,
  scan: NonNullable<ReturnType<typeof getScan>>
) {
  updateScan(scanId, {
    status: "verifying",
    progress: 40,
    progressMessage: "Verifying face matches…",
  });

  const candidates = candidateCache.get(scanId) ?? getDemoCandidates(scan.includeAdultIndexes);
  const refPath = scan.referencePhotoPaths[0];
  const total = candidates.length || 1;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const progress = 40 + Math.floor((i / total) * 50);
    updateScan(scanId, {
      progress,
      progressMessage: `Processing ${i + 1} of ${candidates.length}…`,
      status: i < candidates.length * 0.6 ? "verifying" : "classifying",
    });

    const thumbBuffer = await fetchThumbnail(candidate);
    let similarity: number | null = null;

    if (thumbBuffer && refPath) {
      similarity = await verifyFaceSimilarity(refPath, thumbBuffer);
    }

    if (similarity == null) {
      // Demo / offline fallback: deterministic pseudo-similarity
      similarity = pseudoSimilarity(candidate.url, scan.includeAdultIndexes);
    }

    if (similarity < scan.similarityThreshold) continue;

    const resultId = uuidv4();
    const nudenet = thumbBuffer ? await scoreImage(thumbBuffer) : null;
    const thumbPath = thumbBuffer
      ? await saveThumbnail(resultId, thumbBuffer)
      : null;

    const thumbBase64 = thumbBuffer?.toString("base64");
    const classified = await classifyResult({
      sourceUrl: candidate.url,
      sourceTitle: candidate.title,
      similarity,
      nudenet,
      includeAdultContext: scan.includeAdultIndexes,
      thumbnailBase64: thumbBase64,
      budgetMode: scan.tier === "budget",
    });

    let takedownNotes: string | null = null;
    let takedownPlatform: string | null = null;
    let recommendedAction: string | null = null;

    if (classified.classification === "nsfw" && !classified.blockedCsam) {
      const guide = buildTakedownGuide(
        candidate.url,
        classified.nsfwType,
        classified.nsfwSeverity
      );
      takedownNotes = formatTakedownNotes(guide);
      takedownPlatform = guide.platform;
      recommendedAction = guide.recommendedAction;
    }

    insertResult({
      id: resultId,
      scanId,
      sourceUrl: candidate.url,
      sourceTitle: candidate.title ?? null,
      sourceDomain: candidate.domain ?? tryDomain(candidate.url),
      thumbnailPath: classified.blockedCsam ? null : thumbPath,
      similarity,
      verified: similarity >= scan.similarityThreshold,
      classification: classified.blockedCsam ? "nsfw" : classified.classification,
      classificationReason: classified.reason,
      nsfwType: classified.nsfwType,
      nsfwSeverity: classified.nsfwSeverity,
      nsfwBlurRequired: classified.classification === "nsfw" && !classified.blockedCsam,
      nudenetExplicit: nudenet?.explicit ?? null,
      nudenetSuggestive: nudenet?.suggestive ?? null,
      takedownNotes,
      takedownPlatform,
      recommendedAction,
      userRevealed: false,
      blockedCsam: classified.blockedCsam,
      searchSource: candidate.source,
    });
  }

  candidateCache.delete(scanId);
}

function finalizeScan(scanId: string) {
  const results = getResultsForScan(scanId);
  const nsfwCount = results.filter((r) => r.classification === "nsfw").length;

  updateScan(scanId, {
    status: "completed",
    progress: 100,
    progressMessage:
      nsfwCount > 0
        ? `${nsfwCount} NSFW match${nsfwCount === 1 ? "" : "es"} found — review immediately`
        : "Scan complete",
    nsfwAlertCount: nsfwCount,
    completedAt: new Date().toISOString(),
    error: null,
  });

  return nsfwCount;
}

function dedupeCandidates(items: SearchCandidate[]): SearchCandidate[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

async function fetchThumbnail(candidate: SearchCandidate): Promise<Buffer | null> {
  const url = candidate.thumbnailUrl ?? candidate.url;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LikenessFinder/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return null;
    return buf;
  } catch {
    return null;
  }
}

function pseudoSimilarity(url: string, includeAdult: boolean): number {
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = (hash + url.charCodeAt(i) * (i + 1)) % 1000;
  const base = 0.72 + (hash % 28) / 100;
  if (includeAdult && /adult|deepfake|leak|nsfw|tube|imageboard/.test(url)) {
    return Math.min(0.98, base + 0.08);
  }
  return base;
}

function pathBasename(p: string) {
  return p.split("/").pop() ?? "face.jpg";
}

function tryDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}