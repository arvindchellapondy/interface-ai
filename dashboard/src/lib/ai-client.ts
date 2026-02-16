import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface DataSchemaEntry {
  path: string;
  currentValue: string;
  boundTo: string; // which component/property uses this
}

export interface PersonalizedResult {
  updates: Array<{ path: string; value: string }>;
  reasoning: string;
}

export async function personalizeDataModel(
  designName: string,
  dataSchema: DataSchemaEntry[],
  userContext: string
): Promise<PersonalizedResult> {
  const schemaDescription = dataSchema
    .map((s) => `- Path: "${s.path}" | Current: "${s.currentValue}" | Used by: ${s.boundTo}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an AI agent that personalizes UI content for a mobile app widget.

The widget design is "${designName}". It uses A2UI (Application-to-UI) protocol where the UI structure is fixed, but the data model content can be personalized.

Here are the data model paths and their current values:
${schemaDescription}

User context: ${userContext}

Your job: Generate personalized replacement values for each data path to make the widget relevant and engaging for this user.

RULES:
- Only modify text content values. Do not change the UI structure.
- All values MUST be plain text strings. Never use code expressions like new Date() or function calls.
- For time values, use the template token {{current_time}} which the renderer will replace with the device's actual current time.
- For date values, use {{current_date}} for the date or {{current_day}} for the weekday name.
- Every value must be a valid JSON string literal (e.g. "Hello" not Hello).

Respond in this exact JSON format:
{
  "updates": [
    { "path": "/path/to/value", "value": "New personalized value" }
  ],
  "reasoning": "Brief explanation of personalization choices"
}

Respond with ONLY valid JSON, no markdown fences, no code expressions.`,
      },
    ],
  });

  let text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  // Replace common code expressions with template tokens
  text = text.replace(/new Date\(\)[^"]*"/g, '{{current_time}}"');

  return JSON.parse(text) as PersonalizedResult;
}

/**
 * Extract data schema from A2UI messages — finds all data binding paths
 * and which components reference them.
 */
export function extractDataSchema(
  messages: unknown[]
): DataSchemaEntry[] {
  const entries: DataSchemaEntry[] = [];
  const dataModel: Record<string, unknown> = {};

  // Find updateDataModel to get current values
  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (m.updateDataModel) {
      const udm = m.updateDataModel as Record<string, unknown>;
      if (udm.value && typeof udm.value === "object") {
        Object.assign(dataModel, udm.value as Record<string, unknown>);
      }
    }
  }

  // Find data bindings in components — bindings are directly on the component (text, label, etc.)
  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (m.updateComponents) {
      const uc = m.updateComponents as Record<string, unknown>;
      const components = (uc.components || []) as Array<Record<string, unknown>>;
      for (const comp of components) {
        for (const [propName, propValue] of Object.entries(comp)) {
          if (typeof propValue === "string" && propValue.startsWith("${") && propValue.endsWith("}")) {
            const path = propValue.slice(2, -1);
            const currentValue = resolvePathValue(dataModel, path);
            entries.push({
              path,
              currentValue: currentValue ?? propValue,
              boundTo: `${comp.component}.${propName} (${comp.id})`,
            });
          }
        }
      }
    }
  }

  return entries;
}

function resolvePathValue(dataModel: Record<string, unknown>, path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  let current: unknown = dataModel;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof current === "string" ? current : null;
}
