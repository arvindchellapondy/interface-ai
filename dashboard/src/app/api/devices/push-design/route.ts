import { NextRequest, NextResponse } from "next/server";
import { getDesign } from "@/lib/design-store";
import { pushToAllDevices } from "@/lib/ws-server";

/**
 * Push a full design to all connected devices with an optional data model override.
 * This avoids client-side JSON serialization issues with SVG data.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { designId, dataModel } = body;

  if (!designId) {
    return NextResponse.json({ error: "Missing designId" }, { status: 400 });
  }

  const design = getDesign(designId);
  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  // Build messages: use original design messages but replace updateDataModel if override provided
  const messages = design.messages.map((msg: unknown) => {
    const m = msg as Record<string, unknown>;
    if (m.updateDataModel && dataModel) {
      const udm = m.updateDataModel as Record<string, unknown>;
      return {
        updateDataModel: {
          surfaceId: udm.surfaceId,
          path: "/",
          value: dataModel,
        },
      };
    }
    return msg;
  });

  const count = pushToAllDevices(messages);
  return NextResponse.json({ pushed: count });
}
