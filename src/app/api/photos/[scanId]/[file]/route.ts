import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getPhotosDir } from "@/lib/storage/photos";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string; file: string }> }
) {
  const { scanId, file } = await params;
  const safeName = path.basename(file);
  const filePath = path.join(getPhotosDir(scanId), safeName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}