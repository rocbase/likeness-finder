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

  if (result.classification !== "nsfw") {
    return NextResponse.json({ error: "Only NSFW results require reveal" }, { status: 400 });
  }

  updateResult(id, { userRevealed: true });
  return NextResponse.json({ revealed: true });
}