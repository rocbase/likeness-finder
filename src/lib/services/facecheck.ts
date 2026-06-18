import type { SearchCandidate } from "@/lib/types";

const FACECHECK_BASE = "https://facecheck.id/api";

export async function searchFaceCheck(
  imageBuffer: Buffer,
  includeAdult: boolean
): Promise<SearchCandidate[]> {
  const apiKey = process.env.FACECHECK_API_KEY;
  if (!apiKey) return [];

  const form = new FormData();
  form.append(
    "images",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
    "face.jpg"
  );
  if (includeAdult) {
    form.append("adult_content", "1");
  }

  const uploadRes = await fetch(`${FACECHECK_BASE}/upload_pic`, {
    method: "POST",
    headers: { Authorization: apiKey },
    body: form,
  });

  if (!uploadRes.ok) {
    throw new Error(`FaceCheck upload failed: ${uploadRes.status}`);
  }

  const uploadData = (await uploadRes.json()) as { id_search?: string };
  const searchId = uploadData.id_search;
  if (!searchId) return [];

  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const searchRes = await fetch(`${FACECHECK_BASE}/search`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_search: searchId }),
    });

    if (!searchRes.ok) continue;
    const data = (await searchRes.json()) as {
      output?: {
        items?: Array<{
          url?: string;
          title?: string;
          guid?: string;
          score?: number;
        }>;
      };
      progress?: number;
    };

    const items = data.output?.items ?? [];
    if (items.length > 0 || (data.progress ?? 0) >= 100) {
      return items
        .filter((item) => item.url)
        .map((item) => ({
          url: item.url!,
          title: item.title,
          domain: tryDomain(item.url!),
          source: includeAdult ? "facecheck_adult" : "facecheck",
        }));
    }
  }

  return [];
}

function tryDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}