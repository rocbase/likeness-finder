import { NextRequest, NextResponse } from "next/server";
import { getResult, updateResult } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  updateResult(id, {
    classification: "neutral",
    classificationReason: "Marked as not me by user",
  });

  return NextResponse.json({ dismissed: true });
}