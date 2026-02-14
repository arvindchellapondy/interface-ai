import { NextRequest, NextResponse } from "next/server";
import { pushToDevice, pushToAllDevices } from "@/lib/ws-server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deviceId, messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
  }

  if (deviceId) {
    const ok = pushToDevice(deviceId, messages);
    if (!ok) {
      return NextResponse.json({ error: "Device not connected" }, { status: 404 });
    }
    return NextResponse.json({ pushed: 1 });
  }

  // Push to all devices
  const count = pushToAllDevices(messages);
  return NextResponse.json({ pushed: count });
}
