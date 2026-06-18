import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getResult } from "@/lib/db";
import { getThumbnailsDir } from "@/lib/storage/photos";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const result = getResult(resultId);

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  if (result.blockedCsam) {
    return NextResponse.json(
      { error: "Content blocked. Report to NCMEC if applicable.", ncmec: "https://www.missingkids.org/gethelpnow/cybertipline" },
      { status: 451 }
    );
  }

  const reveal = request.nextUrl.searchParams.get("reveal") === "1";
  if (result.nsfwBlurRequired && !result.userRevealed && !reveal) {
    return NextResponse.json({ error: "Reveal required for NSFW content" }, { status: 403 });
  }

  const filePath =
    result.thumbnailPath ?? path.join(getThumbnailsDir(), `${resultId}.jpg`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}