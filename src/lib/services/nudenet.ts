import { getNudeNetUrl, isNudeNetEnabled } from "@/lib/env";

export interface NudeNetScores {
  explicit: number;
  suggestive: number;
}

export async function scoreImage(buffer: Buffer): Promise<NudeNetScores | null> {
  if (!isNudeNetEnabled()) return null;

  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }),
      "image.jpg"
    );

    const res = await fetch(`${getNudeNetUrl()}/score`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) return null;
    return (await res.json()) as NudeNetScores;
  } catch {
    return null;
  }
}