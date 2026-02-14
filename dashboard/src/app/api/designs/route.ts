import { NextRequest, NextResponse } from "next/server";
import { listDesigns, saveDesign } from "@/lib/design-store";

export async function GET() {
  const designs = listDesigns();
  return NextResponse.json(designs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, messages } = body;

  if (!id || !messages) {
    return NextResponse.json({ error: "Missing id or messages" }, { status: 400 });
  }

  const design = saveDesign(id, messages);
  return NextResponse.json(design, { status: 201 });
}
