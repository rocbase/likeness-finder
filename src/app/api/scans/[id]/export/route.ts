import fs from "fs";
import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { getGoodResultsForExport, getScan } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const goodResults = getGoodResultsForExport(id);
  if (goodResults.length === 0) {
    return NextResponse.json({ error: "No good photos to export" }, { status: 404 });
  }

  const zip = new JSZip();

  for (const result of goodResults) {
    if (!result.thumbnailPath || !fs.existsSync(result.thumbnailPath)) continue;
    const data = fs.readFileSync(result.thumbnailPath);
    zip.file(`${result.id}.jpg`, data);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="good-photos-${id.slice(0, 8)}.zip"`,
    },
  });
}