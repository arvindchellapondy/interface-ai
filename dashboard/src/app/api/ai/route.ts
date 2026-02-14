import { NextRequest, NextResponse } from "next/server";
import { getDesign } from "@/lib/design-store";
import { personalizeDataModel, extractDataSchema } from "@/lib/ai-client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { designId, userContext } = body;

  if (!designId || !userContext) {
    return NextResponse.json(
      { error: "Missing designId or userContext" },
      { status: 400 }
    );
  }

  const design = getDesign(designId);
  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const dataSchema = extractDataSchema(design.messages);
  if (dataSchema.length === 0) {
    return NextResponse.json(
      { error: "No data bindings found in this design" },
      { status: 400 }
    );
  }

  try {
    const result = await personalizeDataModel(
      design.name,
      dataSchema,
      userContext
    );

    // Build an updateDataModel message from the AI result
    const dataModelUpdate: Record<string, unknown> = {};
    for (const update of result.updates) {
      setPathValue(dataModelUpdate, update.path, update.value);
    }

    const updateMessage = {
      updateDataModel: {
        surfaceId: design.id,
        dataModel: dataModelUpdate,
      },
    };

    return NextResponse.json({
      result,
      updateMessage,
    });
  } catch (err) {
    console.error("AI personalization error:", err);
    return NextResponse.json(
      { error: "AI personalization failed" },
      { status: 500 }
    );
  }
}

function setPathValue(
  obj: Record<string, unknown>,
  path: string,
  value: string
) {
  const parts = path.split("/").filter(Boolean);
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}
