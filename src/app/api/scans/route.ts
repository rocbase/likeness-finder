import { NextRequest, NextResponse } from "next/server";
import { createScan, listScans, updateScanPhotos } from "@/lib/db";
import { saveReferencePhoto } from "@/lib/storage/photos";
import { parseSeedUrls } from "@/lib/services/budget-search";
import type { CreateScanInput } from "@/lib/types";

export async function GET() {
  const scans = listScans();
  return NextResponse.json({ scans });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const tier = (form.get("tier") as string) === "budget" ? "budget" : "full";
  const mode = (form.get("mode") as string) === "standard" ? "standard" : "deep";
  const seedUrlsRaw = (form.get("seedUrls") as string) ?? "";
  const includeAdultIndexes = form.get("includeAdultIndexes") === "true";
  const similarityThreshold = Number(form.get("similarityThreshold") ?? 0.75);
  const consentAccepted = form.get("consentAccepted") === "true";
  const adultConsentAccepted = form.get("adultConsentAccepted") === "true";

  if (!consentAccepted) {
    return NextResponse.json(
      { error: "You must confirm this is your face." },
      { status: 400 }
    );
  }

  if (includeAdultIndexes && !adultConsentAccepted) {
    return NextResponse.json(
      { error: "Adult index search requires 18+ confirmation." },
      { status: 400 }
    );
  }

  const photos = form.getAll("photos").filter((f) => f instanceof File) as File[];
  if (photos.length === 0) {
    return NextResponse.json({ error: "Upload at least one face photo." }, { status: 400 });
  }
  if (photos.length > 3) {
    return NextResponse.json({ error: "Maximum 3 reference photos." }, { status: 400 });
  }

  const input: CreateScanInput = {
    tier,
    mode: tier === "budget" ? "standard" : mode,
    seedUrls: parseSeedUrls(seedUrlsRaw),
    includeAdultIndexes,
    similarityThreshold: Math.min(0.95, Math.max(0.5, similarityThreshold)),
    consentAccepted,
    adultConsentAccepted,
  };

  const scan = createScan(input, []);
  const savedPaths: string[] = [];

  for (const photo of photos) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const path = await saveReferencePhoto(scan.id, photo.name || "face.jpg", buffer);
    savedPaths.push(path);
  }

  updateScanPhotos(scan.id, savedPaths);

  return NextResponse.json({ scan: { ...scan, referencePhotoPaths: savedPaths } });
}