import type { ScanTier } from "@/lib/types";

export interface CostTierInfo {
  id: ScanTier;
  label: string;
  perScan: string;
  monthly: string;
  description: string;
  includes: string[];
  skips: string[];
}

export const COST_TIERS: Record<ScanTier, CostTierInfo> = {
  budget: {
    id: "budget",
    label: "Budget",
    perScan: "~$0–0.02",
    monthly: "~$0–5",
    description:
      "Local face verification + NSFW detection. Optional 1 Google Lens call. Paste your own URLs to check.",
    includes: [
      "CompreFace face match (local, free)",
      "NudeNet NSFW scoring (local, free)",
      "Heuristic good/bad/NSFW sort (no OpenAI)",
      "Paste URLs to verify & classify",
      "Optional: 1 SerpAPI Lens search per scan",
    ],
    skips: [
      "FaceCheck API (adult indexes)",
      "Yandex image search",
      "Deep web crawl",
      "GPT-4o vision classification",
    ],
  },
  full: {
    id: "full",
    label: "Full deep",
    perScan: "~$6–12",
    monthly: "~$65–115",
    description:
      "Multi-source deep search across face indexes, Lens, Yandex, and AI classification.",
    includes: [
      "FaceCheck face search (+ adult indexes)",
      "Google Lens + Yandex",
      "Deep crawl of related pages",
      "CompreFace verification",
      "NudeNet + GPT-4o classification",
    ],
    skips: [],
  },
};