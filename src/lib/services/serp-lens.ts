import type { SearchCandidate } from "@/lib/types";

export async function searchGoogleLens(imageUrl: string): Promise<SearchCandidate[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    engine: "google_lens",
    url: imageUrl,
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) {
    throw new Error(`SerpAPI Google Lens failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    visual_matches?: Array<{
      link?: string;
      title?: string;
      source?: string;
      thumbnail?: string;
    }>;
    exact_matches?: Array<{ link?: string; title?: string; source?: string }>;
  };

  const matches = [
    ...(data.visual_matches ?? []),
    ...(data.exact_matches ?? []),
  ];

  const seen = new Set<string>();
  const results: SearchCandidate[] = [];

  for (const match of matches) {
    if (!match.link || seen.has(match.link)) continue;
    seen.add(match.link);
    results.push({
      url: match.link,
      title: match.title ?? match.source,
      domain: tryDomain(match.link),
      thumbnailUrl: (match as { thumbnail?: string }).thumbnail,
      source: "google_lens",
    });
  }

  return results;
}

function tryDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}