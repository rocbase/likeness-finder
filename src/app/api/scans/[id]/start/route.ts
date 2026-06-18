import { NextRequest, NextResponse } from "next/server";
import { getScan } from "@/lib/db";
import { runScanPipeline } from "@/lib/services/pipeline";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status !== "pending" && scan.status !== "failed") {
    return NextResponse.json({ error: "Scan already started" }, { status: 400 });
  }

  // Run pipeline in background (fire-and-forget within same process)
  runScanPipeline(id).catch((err) => {
    console.error(`Scan ${id} failed:`, err);
  });

  return NextResponse.json({ started: true, scanId: id });
}