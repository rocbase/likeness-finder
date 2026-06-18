import type { SearchCandidate } from "@/lib/types";

export function getDemoCandidates(includeAdult: boolean): SearchCandidate[] {
  const base: SearchCandidate[] = [
    {
      url: "https://linkedin.com/in/example-profile",
      title: "Professional headshot — LinkedIn",
      domain: "linkedin.com",
      thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      source: "facecheck",
    },
    {
      url: "https://twitter.com/example/status/123",
      title: "Conference photo",
      domain: "twitter.com",
      thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      source: "google_lens",
    },
    {
      url: "https://company.com/team/jane-doe",
      title: "Team page photo",
      domain: "company.com",
      thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      source: "google_lens",
    },
    {
      url: "https://imgur.com/gallery/awkward-moment",
      title: "Unflattering candid at party",
      domain: "imgur.com",
      thumbnailUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a5678?w=400",
      source: "facecheck",
    },
    {
      url: "https://news.site/local/charity-event",
      title: "Local news charity event",
      domain: "news.site",
      thumbnailUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      source: "yandex",
    },
    {
      url: "https://old-forum.net/thread/45678",
      title: "Embarrassing forum post photo",
      domain: "old-forum.net",
      thumbnailUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400",
      source: "deep_crawl",
    },
  ];

  if (!includeAdult) return base;

  return [
    ...base,
    ...getNsfwOnlyDemoCandidates(),
  ];
}

export function getNsfwOnlyDemoCandidates(): SearchCandidate[] {
  return [
    {
      url: "https://adult-forum.example/leaked-set-991",
      title: "Suspected intimate leak on forum",
      domain: "adult-forum.example",
      thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
      source: "facecheck_adult",
    },
    {
      url: "https://tube-site.example/video/deepfake-abc",
      title: "Suspected deepfake video thumbnail",
      domain: "tube-site.example",
      thumbnailUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
      source: "facecheck_adult",
    },
    {
      url: "https://imageboard.example/thread/nsfw-4421",
      title: "Suggestive image board post",
      domain: "imageboard.example",
      thumbnailUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400",
      source: "yandex_adult",
    },
    {
      url: "https://pornhub.com/view_video.php?viewkey=demo123",
      title: "Demo match on tube site",
      domain: "pornhub.com",
      thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
      source: "facecheck_adult",
    },
    {
      url: "https://imageboard.example/thread/nsfw-face-8812",
      title: "Image board thread — face match",
      domain: "imageboard.example",
      thumbnailUrl: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400",
      source: "deep_crawl_adult",
    },
    {
      url: "https://www.xvideos.com/demo-amateur-tag",
      title: "XVideos tagged result",
      domain: "xvideos.com",
      thumbnailUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
      source: "yandex_adult",
    },
  ];
}