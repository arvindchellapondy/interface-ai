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

  // Build messages: use original design messages but merge dataModel override with defaults
  const messages = design.messages.map((msg: unknown) => {
    const m = msg as Record<string, unknown>;
    if (m.updateDataModel && dataModel) {
      const udm = m.updateDataModel as Record<string, unknown>;
      // Merge: start with design defaults, overlay with provided dataModel
      const defaultValue = (udm.value && typeof udm.value === "object") ? udm.value as Record<string, unknown> : {};
      const merged = deepMerge(defaultValue, dataModel);
      return {
        updateDataModel: {
          surfaceId: udm.surfaceId,
          path: "/",
          value: merged,
        },
      };
    }
    return msg;
  });

  const count = pushToAllDevices(messages);
  return NextResponse.json({ pushed: count });
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(base));
  for (const [key, val] of Object.entries(overlay)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val) && typeof result[key] === "object") {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        val as Record<string, unknown>
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}
