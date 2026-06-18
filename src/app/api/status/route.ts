import { NextResponse } from "next/server";
import {
  allowDemoMode,
  getCompreFaceUrl,
  getNudeNetUrl,
  hasFaceCheck,
  hasOpenAI,
  hasSerpApi,
  hasYandex,
  isNudeNetEnabled,
} from "@/lib/env";

export async function GET() {
  let compreface = false;
  let nudenet = false;

  try {
    const res = await fetch(`${getCompreFaceUrl()}/api/v1/status`, {
      signal: AbortSignal.timeout(3000),
    });
    compreface = res.ok;
  } catch {
    compreface = false;
  }

  if (isNudeNetEnabled()) {
    try {
      const res = await fetch(`${getNudeNetUrl()}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      nudenet = res.ok;
    } catch {
      nudenet = false;
    }
  }

  return NextResponse.json({
    demoMode: allowDemoMode(),
    tiers: {
      budget: { perScan: "~$0-0.02", monthly: "~$0-5" },
      full: { perScan: "~$6-12", monthly: "~$65-115" },
    },
    services: {
      openai: hasOpenAI(),
      facecheck: hasFaceCheck(),
      serpapi: hasSerpApi(),
      yandex: hasYandex(),
      compreface,
      nudenet,
    },
  });
}