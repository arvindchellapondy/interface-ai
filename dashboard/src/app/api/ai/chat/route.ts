import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { listDesigns } from "@/lib/design-store";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
  }

  // Build tile catalog context from stored designs
  const designs = listDesigns();
  const catalog = designs.map((d) => {
    const components = extractComponentSummary(d.messages);
    const dataBindings = extractDataBindings(d.messages);
    return {
      id: d.id,
      name: d.name,
      components,
      dataBindings,
    };
  });

  const systemPrompt = `You are an AI assistant for Interface AI, a platform that manages mobile app UI tiles using the A2UI protocol.

You have access to a catalog of tile designs. Each tile is a pre-designed UI component that can be shown on mobile devices. You can select which tile to show and personalize its content.

AVAILABLE TILE DESIGNS:
${catalog.map((t) => `- "${t.id}" (${t.name}): Components: ${t.components.join(", ")}. Data bindings: ${t.dataBindings.map((b) => `${b.path} = "${b.currentValue}"`).join(", ")}`).join("\n")}

When the user asks you to show a tile or asks about content/weather/greetings/etc., respond with a JSON block that selects and personalizes a tile.

CRITICAL: The dataModel must use NESTED object format matching the tile's data binding structure.
For example, if a tile has binding "\${/aubrey_tx/text}", the dataModel must be: {"aubrey_tx": {"text": "new value"}}
Do NOT use flat path keys like "/aubrey_tx/text".

Use this exact format:

\`\`\`json
{"action": "show_tile", "tileId": "the_tile_id", "dataModel": {"binding_key": {"field": "personalized value"}}, "reasoning": "why you chose this"}
\`\`\`

Rules:
- Always include the JSON block when selecting/personalizing a tile
- The dataModel MUST use nested objects (e.g. {"aubrey_tx": {"text": "value"}}) not flat paths
- You MUST include ALL data bindings for the selected tile in the dataModel — do not skip any
- Personalize text values to be contextual and engaging for the user's request
- Respond conversationally before the JSON block
- If the user just wants to chat without showing a tile, respond normally without JSON`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON action block if present
    const jsonMatch = text.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
    let tileAction = null;
    if (jsonMatch) {
      try {
        tileAction = JSON.parse(jsonMatch[1]);
      } catch {
        // ignore parse errors
      }
    }

    return NextResponse.json({
      message: text,
      tileAction,
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}

function extractComponentSummary(messages: unknown[]): string[] {
  const components: string[] = [];
  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (m.updateComponents) {
      const uc = m.updateComponents as Record<string, unknown>;
      const comps = (uc.components || []) as Array<Record<string, unknown>>;
      for (const c of comps) {
        if (c.id !== "root") {
          components.push(`${c.component}(${c.id})`);
        }
      }
    }
  }
  return components;
}

function extractDataBindings(messages: unknown[]): Array<{ path: string; currentValue: string }> {
  const bindings: Array<{ path: string; currentValue: string }> = [];
  let dataModel: Record<string, unknown> = {};

  // Get data model values
  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (m.updateDataModel) {
      const udm = m.updateDataModel as Record<string, unknown>;
      if (udm.value && typeof udm.value === "object") {
        dataModel = udm.value as Record<string, unknown>;
      }
    }
  }

  // Find bindings in components
  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (m.updateComponents) {
      const uc = m.updateComponents as Record<string, unknown>;
      const comps = (uc.components || []) as Array<Record<string, unknown>>;
      for (const comp of comps) {
        for (const [, val] of Object.entries(comp)) {
          if (typeof val === "string" && val.startsWith("${") && val.endsWith("}")) {
            const path = val.slice(2, -1);
            const parts = path.split("/").filter(Boolean);
            let current: unknown = dataModel;
            for (const part of parts) {
              if (current && typeof current === "object") {
                current = (current as Record<string, unknown>)[part];
              }
            }
            bindings.push({
              path,
              currentValue: typeof current === "string" ? current : val,
            });
          }
        }
      }
    }
  }

  return bindings;
}
