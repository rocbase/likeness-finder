import { getAppUrl, hasSerpApi } from "@/lib/env";
import { getDemoCandidates } from "@/lib/services/demo-data";
import { searchGoogleLens } from "@/lib/services/serp-lens";
import type { SearchCandidate } from "@/lib/types";

export function parseSeedUrls(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => {
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, 50);
}

export function seedUrlsToCandidates(urls: string[]): SearchCandidate[] {
  return urls.map((url) => {
    let domain: string | undefined;
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = undefined;
    }
    return {
      url,
      title: "User-provided URL",
      domain,
      source: "manual_seed",
    };
  });
}

/** Budget search: manual seeds + at most one Lens call. No FaceCheck/Yandex/crawl. */
export async function runBudgetSearch(input: {
  scanId: string;
  refPhotoFilename: string;
  seedUrls: string[];
  includeAdult: boolean;
  useDemo: boolean;
}): Promise<SearchCandidate[]> {
  const candidates: SearchCandidate[] = [];

  if (input.seedUrls.length > 0) {
    candidates.push(...seedUrlsToCandidates(input.seedUrls));
  }

  if (hasSerpApi()) {
    const publicImageUrl = `${getAppUrl()}/api/photos/${input.scanId}/${encodeURIComponent(input.refPhotoFilename)}`;
    const lens = await searchGoogleLens(publicImageUrl).catch(() => []);
    candidates.push(...lens.slice(0, 15));
  }

  if (candidates.length === 0 && input.useDemo) {
    const demo = getDemoCandidates(input.includeAdult);
    return demo.slice(0, input.includeAdult ? 6 : 4);
  }

  return dedupe(candidates);
}

function dedupe(items: SearchCandidate[]): SearchCandidate[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}