import type { SearchCandidate } from "@/lib/types";

export async function searchYandexImages(
  imageUrl: string,
  includeAdult: boolean
): Promise<SearchCandidate[]> {
  const apiKey = process.env.YANDEX_SEARCH_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    engine: "yandex_images",
    url: imageUrl,
    api_key: apiKey,
  });
  if (includeAdult) {
    params.set("safe", "off");
  }

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) {
    throw new Error(`Yandex image search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    images_results?: Array<{
      link?: string;
      title?: string;
      source?: string;
      thumbnail?: string;
    }>;
  };

  const seen = new Set<string>();
  const results: SearchCandidate[] = [];

  for (const img of data.images_results ?? []) {
    if (!img.link || seen.has(img.link)) continue;
    seen.add(img.link);
    results.push({
      url: img.link,
      title: img.title ?? img.source,
      domain: tryDomain(img.link),
      thumbnailUrl: img.thumbnail,
      source: includeAdult ? "yandex_adult" : "yandex",
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