import fs from "fs";
import { getCompreFaceApiKey, getCompreFaceUrl } from "@/lib/env";

export async function verifyFaceSimilarity(
  referencePath: string,
  candidateImage: Buffer
): Promise<number | null> {
  const baseUrl = getCompreFaceUrl();
  const apiKey = getCompreFaceApiKey();

  try {
    const health = await fetch(`${baseUrl}/api/v1/status`);
    if (!health.ok) return null;
  } catch {
    return null;
  }

  const refBuffer = fs.readFileSync(referencePath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(refBuffer)], { type: "image/jpeg" }),
    "reference.jpg"
  );
  form.append(
    "file",
    new Blob([new Uint8Array(candidateImage)], { type: "image/jpeg" }),
    "candidate.jpg"
  );

  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(`${baseUrl}/api/v1/recognition/verify`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    result?: Array<{ similarity?: number }>;
    similarity?: number;
  };

  if (typeof data.similarity === "number") return data.similarity;
  const first = data.result?.[0];
  return first?.similarity ?? null;
}