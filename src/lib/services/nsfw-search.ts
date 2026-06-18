import { filterToAdultSites } from "@/lib/adult-sites";
import { getAppUrl, hasFaceCheck, hasSerpApi, hasYandex } from "@/lib/env";
import { runBudgetSearch } from "@/lib/services/budget-search";
import { getNsfwOnlyDemoCandidates } from "@/lib/services/demo-data";
import { searchFaceCheck } from "@/lib/services/facecheck";
import { searchGoogleLens } from "@/lib/services/serp-lens";
import { searchYandexImages } from "@/lib/services/yandex";
import { deepCrawlNsfwOnly } from "@/lib/services/crawler";
import type { SearchCandidate } from "@/lib/types";

export interface NsfwSearchInput {
  scanId: string;
  refPhotoFilename: string;
  refBuffer: Buffer;
  tier: "budget" | "full";
  seedUrls: string[];
  mode: "standard" | "deep";
  useDemo: boolean;
}

/** Search only adult/porn image boards and sites; drop all other domains. */
export async function runNsfwOnlySearch(input: NsfwSearchInput): Promise<SearchCandidate[]> {
  let candidates: SearchCandidate[] = [];

  if (input.tier === "budget") {
    const adultSeeds = filterToAdultSites(
      input.seedUrls.map((url) => ({ url }))
    ).map((s) => s.url);

    candidates = await runBudgetSearch({
      scanId: input.scanId,
      refPhotoFilename: input.refPhotoFilename,
      seedUrls: adultSeeds,
      includeAdult: true,
      useDemo: false,
    });
    candidates = filterToAdultSites(candidates);
  } else {
    const tasks: Promise<SearchCandidate[]>[] = [];

    if (hasFaceCheck()) {
      tasks.push(searchFaceCheck(input.refBuffer, true).catch(() => []));
    }

    const publicImageUrl = `${getAppUrl()}/api/photos/${input.scanId}/${encodeURIComponent(input.refPhotoFilename)}`;
    if (hasSerpApi()) {
      tasks.push(searchGoogleLens(publicImageUrl).catch(() => []));
    }
    if (hasYandex()) {
      tasks.push(searchYandexImages(publicImageUrl, true).catch(() => []));
    }

    const batches = await Promise.all(tasks);
    candidates = dedupe(batches.flat());

    if (input.mode === "deep") {
      const crawled = await deepCrawlNsfwOnly(candidates);
      candidates = dedupe([...candidates, ...crawled]);
    }
  }

  candidates = filterToAdultSites(candidates);

  if (input.seedUrls.length > 0) {
    const seeds = filterToAdultSites(
      input.seedUrls.map((url) => ({
        url,
        title: "User-provided adult URL",
        source: "manual_seed_adult",
      }))
    );
    candidates = dedupe([...seeds, ...candidates]);
  }

  if (candidates.length === 0 && input.useDemo) {
    return getNsfwOnlyDemoCandidates();
  }

  return candidates;
}

function dedupe(items: SearchCandidate[]): SearchCandidate[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}