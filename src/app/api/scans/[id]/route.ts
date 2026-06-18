import { NextRequest, NextResponse } from "next/server";
import { getScan, getScanStats, getResultsForScan } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const results = getResultsForScan(id);
  const stats = getScanStats(id);

  return NextResponse.json({ scan, results, stats });
}