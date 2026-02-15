import { NextRequest, NextResponse } from "next/server";
import { listDesigns, saveDesign, clearDesigns } from "@/lib/design-store";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const designs = listDesigns();
  return NextResponse.json(designs, { headers: corsHeaders });
}

export async function DELETE() {
  const count = clearDesigns();
  return NextResponse.json({ cleared: count }, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, messages } = body;

  if (!id || !messages) {
    return NextResponse.json({ error: "Missing id or messages" }, { status: 400, headers: corsHeaders });
  }

  const design = saveDesign(id, messages);
  return NextResponse.json(design, { status: 201, headers: corsHeaders });
}
