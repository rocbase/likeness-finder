import OpenAI from "openai";
import { hasOpenAI } from "@/lib/env";
import type { Classification, NsfwSeverity, NsfwType } from "@/lib/types";
import { isAdultSite } from "@/lib/adult-sites";
import type { NudeNetScores } from "@/lib/services/nudenet";

export interface ClassificationResult {
  classification: Classification;
  reason: string;
  nsfwType: NsfwType;
  nsfwSeverity: NsfwSeverity;
  blockedCsam: boolean;
  deepfakeSuspected: boolean;
}

export async function classifyResult(input: {
  sourceUrl: string;
  sourceTitle?: string;
  similarity: number;
  nudenet?: NudeNetScores | null;
  includeAdultContext: boolean;
  thumbnailBase64?: string;
  budgetMode?: boolean;
  nsfwOnlyMode?: boolean;
}): Promise<ClassificationResult> {
  let result: ClassificationResult;

  if (!input.budgetMode && hasOpenAI() && input.thumbnailBase64) {
    try {
      result = await classifyWithOpenAI(input);
    } catch {
      result = classifyHeuristic(input);
    }
  } else {
    result = classifyHeuristic(input);
  }

  if (input.nsfwOnlyMode && isAdultSite(input.sourceUrl)) {
    return applyNsfwOnlyBias(result, input);
  }

  return result;
}

function applyNsfwOnlyBias(
  result: ClassificationResult,
  input: { sourceUrl: string; nudenet?: NudeNetScores | null }
): ClassificationResult {
  if (result.blockedCsam || result.classification === "nsfw") return result;

  const explicit = input.nudenet?.explicit ?? 0;
  const suggestive = input.nudenet?.suggestive ?? 0;

  if (explicit > 0.35 || suggestive > 0.45) {
    return {
      classification: "nsfw",
      reason: "Adult-site match with elevated NSFW score.",
      nsfwType: explicit > 0.5 ? "explicit" : "suggestive",
      nsfwSeverity: explicit > 0.7 ? "high" : "medium",
      blockedCsam: false,
      deepfakeSuspected: /deepfake/i.test(input.sourceUrl),
    };
  }

  return {
    classification: "nsfw",
    reason: "Face match on restricted adult site or image board.",
    nsfwType: "suggestive",
    nsfwSeverity: "medium",
    blockedCsam: false,
    deepfakeSuspected: /deepfake/i.test(input.sourceUrl),
  };
}

async function classifyWithOpenAI(input: {
  sourceUrl: string;
  sourceTitle?: string;
  similarity: number;
  nudenet?: NudeNetScores | null;
  includeAdultContext: boolean;
  thumbnailBase64?: string;
}): Promise<ClassificationResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system = `You classify web images that may depict a specific person.
Return JSON only with keys:
- classification: "good" | "neutral" | "bad" | "nsfw"
- reason: short explanation
- nsfw_type: "explicit" | "suggestive" | "deepfake_suspected" | "intimate_leak" | null
- nsfw_severity: "high" | "medium" | "low" | null
- blocked_csam: boolean — true ONLY if content appears to depict a minor in sexual context (never describe it)
- deepfake_suspected: boolean

Rules:
- good = flattering, professional, profile-worthy
- bad = embarrassing, unflattering, wrong context (non-sexual)
- nsfw = explicit, suggestive, intimate leak, or deepfake adult content
- If blocked_csam is true, set classification to "nsfw" and do not describe the image.`;

  const userText = `URL: ${input.sourceUrl}
Title: ${input.sourceTitle ?? "unknown"}
Face similarity: ${(input.similarity * 100).toFixed(1)}%
NudeNet explicit: ${input.nudenet?.explicit ?? "n/a"}
NudeNet suggestive: ${input.nudenet?.suggestive ?? "n/a"}
Adult search enabled: ${input.includeAdultContext}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${input.thumbnailBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
    max_tokens: 400,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    classification?: Classification;
    reason?: string;
    nsfw_type?: NsfwType;
    nsfw_severity?: NsfwSeverity;
    blocked_csam?: boolean;
    deepfake_suspected?: boolean;
  };

  if (parsed.blocked_csam) {
    return {
      classification: "nsfw",
      reason: "Potential illegal content detected. Do not view. Report to NCMEC if applicable.",
      nsfwType: null,
      nsfwSeverity: "high",
      blockedCsam: true,
      deepfakeSuspected: false,
    };
  }

  const classification = parsed.classification ?? "neutral";
  const nsfwType =
    parsed.deepfake_suspected && !parsed.nsfw_type
      ? "deepfake_suspected"
      : (parsed.nsfw_type ?? null);

  return {
    classification,
    reason: parsed.reason ?? "Classified by AI",
    nsfwType: classification === "nsfw" ? nsfwType : null,
    nsfwSeverity: classification === "nsfw" ? (parsed.nsfw_severity ?? "medium") : null,
    blockedCsam: false,
    deepfakeSuspected: Boolean(parsed.deepfake_suspected),
  };
}

function classifyHeuristic(input: {
  sourceUrl: string;
  sourceTitle?: string;
  similarity: number;
  nudenet?: NudeNetScores | null;
  includeAdultContext: boolean;
}): ClassificationResult {
  const title = (input.sourceTitle ?? "").toLowerCase();
  const url = input.sourceUrl.toLowerCase();
  const explicit = input.nudenet?.explicit ?? 0;
  const suggestive = input.nudenet?.suggestive ?? 0;

  const adultKeywords = /deepfake|leak|nsfw|adult|intimate|porn|tube-site|imageboard|adult-forum/;
  const badKeywords = /awkward|embarrass|candid|forum|old-forum/;
  const goodKeywords = /linkedin|professional|headshot|team|company|charity/;

  if (explicit > 0.6 || (input.includeAdultContext && adultKeywords.test(url + title))) {
    const isDeepfake = /deepfake/.test(url + title);
    const isLeak = /leak|intimate/.test(url + title);
    return {
      classification: "nsfw",
      reason: isDeepfake
        ? "High explicit score with deepfake indicators."
        : isLeak
          ? "Possible intimate leak on public site."
          : "Explicit content detected by local NSFW scorer.",
      nsfwType: isDeepfake ? "deepfake_suspected" : isLeak ? "intimate_leak" : "explicit",
      nsfwSeverity: explicit > 0.8 ? "high" : "medium",
      blockedCsam: false,
      deepfakeSuspected: isDeepfake,
    };
  }

  if (suggestive > 0.55 && input.includeAdultContext) {
    return {
      classification: "nsfw",
      reason: "Suggestive content detected.",
      nsfwType: "suggestive",
      nsfwSeverity: "low",
      blockedCsam: false,
      deepfakeSuspected: false,
    };
  }

  if (badKeywords.test(url + title)) {
    return {
      classification: "bad",
      reason: "Embarrassing or unflattering context detected from source metadata.",
      nsfwType: null,
      nsfwSeverity: null,
      blockedCsam: false,
      deepfakeSuspected: false,
    };
  }

  if (goodKeywords.test(url + title) && input.similarity > 0.8) {
    return {
      classification: "good",
      reason: "Professional or flattering context from source metadata.",
      nsfwType: null,
      nsfwSeverity: null,
      blockedCsam: false,
      deepfakeSuspected: false,
    };
  }

  return {
    classification: "neutral",
    reason: "Average match — review manually.",
    nsfwType: null,
    nsfwSeverity: null,
    blockedCsam: false,
    deepfakeSuspected: false,
  };
}