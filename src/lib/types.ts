export type Classification = "good" | "neutral" | "bad" | "nsfw" | "unclassified";

export type NsfwType =
  | "explicit"
  | "suggestive"
  | "deepfake_suspected"
  | "intimate_leak"
  | null;

export type NsfwSeverity = "high" | "medium" | "low" | null;

export type ScanStatus =
  | "pending"
  | "searching"
  | "verifying"
  | "classifying"
  | "completed"
  | "failed";

export type ScanMode = "standard" | "deep";
export type ScanTier = "budget" | "full";

export interface ScanRecord {
  id: string;
  status: ScanStatus;
  tier: ScanTier;
  mode: ScanMode;
  seedUrls: string[];
  includeAdultIndexes: boolean;
  similarityThreshold: number;
  consentAccepted: boolean;
  adultConsentAccepted: boolean;
  referencePhotoPaths: string[];
  progress: number;
  progressMessage: string;
  error: string | null;
  nsfwAlertCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ResultRecord {
  id: string;
  scanId: string;
  sourceUrl: string;
  sourceTitle: string | null;
  sourceDomain: string | null;
  thumbnailPath: string | null;
  similarity: number | null;
  verified: boolean;
  classification: Classification;
  classificationReason: string | null;
  nsfwType: NsfwType;
  nsfwSeverity: NsfwSeverity;
  nsfwBlurRequired: boolean;
  nudenetExplicit: number | null;
  nudenetSuggestive: number | null;
  takedownNotes: string | null;
  takedownPlatform: string | null;
  recommendedAction: string | null;
  userRevealed: boolean;
  blockedCsam: boolean;
  searchSource: string;
  createdAt: string;
}

export interface ScanStats {
  total: number;
  good: number;
  neutral: number;
  bad: number;
  nsfw: number;
  unclassified: number;
}

export interface CreateScanInput {
  tier: ScanTier;
  mode: ScanMode;
  seedUrls?: string[];
  includeAdultIndexes: boolean;
  similarityThreshold: number;
  consentAccepted: boolean;
  adultConsentAccepted: boolean;
}

export interface SearchCandidate {
  url: string;
  title?: string;
  domain?: string;
  thumbnailUrl?: string;
  source: string;
}