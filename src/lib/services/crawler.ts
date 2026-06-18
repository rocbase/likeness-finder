import { isAdultSite } from "@/lib/adult-sites";
import type { SearchCandidate } from "@/lib/types";

const ADULT_DOMAINS = /porn|xxx|adult|nsfw|tube|imageboard|leak/i;

export async function deepCrawl(
  seeds: SearchCandidate[],
  includeAdult: boolean,
  maxHops = 1
): Promise<SearchCandidate[]> {
  if (maxHops <= 0) return [];

  const found: SearchCandidate[] = [];
  const seen = new Set(seeds.map((s) => s.url));

  for (const seed of seeds.slice(0, 8)) {
    if (!includeAdult && ADULT_DOMAINS.test(seed.url)) continue;

    try {
      const related = await fetchRelatedUrls(seed.url, includeAdult);
      for (const url of related) {
        if (seen.has(url)) continue;
        seen.add(url);
        found.push({
          url,
          title: `Related to ${seed.title ?? seed.domain ?? "result"}`,
          domain: tryDomain(url),
          source: "deep_crawl",
        });
      }
    } catch {
      // skip unreachable pages
    }
  }

  return found;
}

/** Deep crawl restricted to adult/porn domains only. */
export async function deepCrawlNsfwOnly(
  seeds: SearchCandidate[],
  maxHops = 1
): Promise<SearchCandidate[]> {
  const adultSeeds = seeds.filter((s) => isAdultSite(s.url));
  return deepCrawl(adultSeeds, true, maxHops).then((found) =>
    found.filter((item) => isAdultSite(item.url))
  );
}

async function fetchRelatedUrls(pageUrl: string, includeAdult: boolean): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "LikenessFinder/1.0 (personal research)" },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const links = extractLinks(html, pageUrl);
    return links.filter((link) => {
      if (!includeAdult && ADULT_DOMAINS.test(link)) return false;
      return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(link) || /\/photo|\/image|\/gallery|\/video|\/thread/i.test(link);
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractLinks(html: string, base: string): string[] {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const urls: string[] = [];
  for (const href of hrefs) {
    try {
      const absolute = new URL(href, base).toString();
      urls.push(absolute);
    } catch {
      // skip invalid
    }
  }
  return urls.slice(0, 20);
}

function tryDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}