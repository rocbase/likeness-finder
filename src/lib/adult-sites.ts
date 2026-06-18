/** Domains and patterns for porn tubes, image boards, and adult forums. */

const EXACT_DOMAINS = new Set([
  "pornhub.com",
  "www.pornhub.com",
  "xvideos.com",
  "www.xvideos.com",
  "xhamster.com",
  "www.xhamster.com",
  "redtube.com",
  "www.redtube.com",
  "youporn.com",
  "www.youporn.com",
  "spankbang.com",
  "www.spankbang.com",
  "xnxx.com",
  "www.xnxx.com",
  "eporner.com",
  "www.eporner.com",
  "tube8.com",
  "www.tube8.com",
  "onlyfans.com",
  "www.onlyfans.com",
  "chaturbate.com",
  "www.chaturbate.com",
  "erome.com",
  "www.erome.com",
  "imagefap.com",
  "www.imagefap.com",
  "motherless.com",
  "www.motherless.com",
  "efukt.com",
  "www.efukt.com",
  "heavy-r.com",
  "www.heavy-r.com",
  "sex.com",
  "www.sex.com",
  "fapality.com",
  "www.fapality.com",
  "hqporner.com",
  "www.hqporner.com",
  "beeg.com",
  "www.beeg.com",
  "tnaflix.com",
  "www.tnaflix.com",
  "drtuber.com",
  "www.drtuber.com",
  "4chan.org",
  "www.4chan.org",
  "8kun.top",
  "www.8kun.top",
  "chan.sankakucomplex.com",
  "rule34.xxx",
  "www.rule34.xxx",
  "e621.net",
  "booru.org",
  "gelbooru.com",
  "danbooru.donmai.us",
  "nhentai.net",
  "www.nhentai.net",
  "literotica.com",
  "www.literotica.com",
  "fetlife.com",
  "www.fetlife.com",
  "redgifs.com",
  "www.redgifs.com",
  "leakimedia.com",
  "simpcity.su",
  "forums.socialmediagirls.com",
]);

const DOMAIN_PATTERNS = [
  /(^|\.)pornhub\./i,
  /(^|\.)xvideos\./i,
  /(^|\.)xhamster\./i,
  /(^|\.)porn\./i,
  /(^|\.)xxx\./i,
  /(^|\.)xnxx\./i,
  /(^|\.)tube8\./i,
  /(^|\.)youporn\./i,
  /(^|\.)spankbang\./i,
  /(^|\.)onlyfans\./i,
  /(^|\.)chaturbate\./i,
  /(^|\.)imagefap\./i,
  /(^|\.)motherless\./i,
  /(^|\.)erome\./i,
  /(^|\.)redgifs\./i,
  /(^|\.)rule34\./i,
  /(^|\.)booru\./i,
  /(^|\.)nhentai\./i,
  /(^|\.)chan\./i,
  /(^|\.)4chan\./i,
  /(^|\.)8kun\./i,
  /(^|\.)imageboard\./i,
  /(^|\.)adult-?forum\./i,
  /(^|\.)leak\./i,
  /(^|\.)nsfw\./i,
  /(^|\.)adult\./i,
  /(^|\.)tube-?site\./i,
  /(^|\.)simpcity\./i,
  /(^|\.)coomer\./i,
  /(^|\.)kemono\./i,
  /(^|\.)fap\./i,
  /(^|\.)hentai/i,
  /(^|\.)porntrex\./i,
  /(^|\.)txxx\./i,
  /(^|\.)pornzog\./i,
  /(^|\.)cam4\./i,
  /(^|\.)myfreecams\./i,
  /(^|\.)stripchat\./i,
];

const PATH_PATTERNS = [
  /\/nsfw\//i,
  /\/xxx\//i,
  /\/porn\//i,
  /\/adult\//i,
  /\/imageboard\//i,
  /\/thread\/nsfw/i,
  /\/video\/deeps?fake/i,
  /\/leaked?-/i,
];

export function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAdultSite(url: string): boolean {
  const host = hostnameFromUrl(url);
  if (!host) return false;

  if (EXACT_DOMAINS.has(host)) return true;

  for (const pattern of DOMAIN_PATTERNS) {
    if (pattern.test(host)) return true;
  }

  for (const pattern of PATH_PATTERNS) {
    if (pattern.test(url)) return true;
  }

  return false;
}

export function filterToAdultSites<T extends { url: string }>(items: T[]): T[] {
  return items.filter((item) => isAdultSite(item.url));
}

export const ADULT_SITE_CATEGORIES = [
  "Porn tubes (Pornhub, XVideos, XHamster, etc.)",
  "Image boards (4chan, booru sites, rule34)",
  "Adult forums & leak boards",
  "Cam / creator platforms (OnlyFans, Chaturbate)",
] as const;