import { NextResponse } from "next/server";
import { getConnectedDevices } from "@/lib/ws-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const devices = getConnectedDevices();
  return NextResponse.json(devices);
}
