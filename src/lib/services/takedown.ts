export interface TakedownGuide {
  platform: string;
  recommendedAction: string;
  steps: string[];
  links: Array<{ label: string; url: string }>;
}

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: string }> = [
  { pattern: /reddit\.com/i, platform: "reddit" },
  { pattern: /twitter\.com|x\.com/i, platform: "twitter" },
  { pattern: /instagram\.com/i, platform: "instagram" },
  { pattern: /facebook\.com/i, platform: "facebook" },
  { pattern: /pornhub\.com/i, platform: "pornhub" },
  { pattern: /onlyfans\.com/i, platform: "onlyfans" },
  { pattern: /tiktok\.com/i, platform: "tiktok" },
];

export function detectPlatform(url: string): string {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return "unknown";
}

export function buildTakedownGuide(
  url: string,
  nsfwType: string | null,
  severity: string | null
): TakedownGuide {
  const platform = detectPlatform(url);
  const isIntimate = nsfwType === "intimate_leak" || nsfwType === "explicit";
  const isDeepfake = nsfwType === "deepfake_suspected";

  const recommendedAction = isIntimate
    ? "report_to_platform"
    : isDeepfake
      ? "legal_consult"
      : severity === "high"
        ? "report_dmca"
        : "report_to_platform";

  const steps: string[] = [
    "Document the URL, date found, and take screenshots for your records.",
    "Do not share or re-upload the image — link to the source only.",
  ];

  const links: Array<{ label: string; url: string }> = [
    {
      label: "Google — Remove non-consensual intimate images",
      url: "https://support.google.com/websearch/contact/content_removal_form",
    },
  ];

  switch (platform) {
    case "reddit":
      steps.push("Submit a Reddit report for involuntary pornography or impersonation.");
      links.push({
        label: "Reddit report form",
        url: "https://www.reddit.com/report",
      });
      break;
    case "twitter":
      steps.push("Use X's privacy or impersonation reporting flow.");
      links.push({
        label: "X privacy policy violations",
        url: "https://help.twitter.com/forms/privacy",
      });
      break;
    case "instagram":
    case "facebook":
      steps.push("Report via Meta's non-consensual intimate imagery form.");
      links.push({
        label: "Meta NCII reporting",
        url: "https://www.facebook.com/help/contact/209046679279097",
      });
      break;
    case "pornhub":
      steps.push("Contact the site's DMCA / content removal team with proof of identity.");
      links.push({
        label: "Pornhub content removal",
        url: "https://www.pornhub.com/content-removal",
      });
      break;
    default:
      steps.push("Send a DMCA takedown notice to the hosting provider if applicable.");
      links.push({
        label: "DMCA template (EFF)",
        url: "https://www.eff.org/issues/bloggers/legal/liability/230defense",
      });
  }

  if (isDeepfake) {
    steps.push(
      "Flag as synthetic media / deepfake when reporting. Consider legal counsel for defamation or likeness misuse."
    );
  }

  return { platform, recommendedAction, steps, links };
}

export function formatTakedownNotes(guide: TakedownGuide): string {
  const lines = [
    `Platform: ${guide.platform}`,
    `Recommended: ${guide.recommendedAction}`,
    "",
    ...guide.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Resources:",
    ...guide.links.map((l) => `- ${l.label}: ${l.url}`),
  ];
  return lines.join("\n");
}