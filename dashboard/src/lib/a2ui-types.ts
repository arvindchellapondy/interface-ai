/**
 * A2UI v0.9 types for the dashboard.
 * Mirrors a2ui-parser/src/schema.ts.
 */

export interface DesignToken {
  value: string;
  collection: string;
}

export interface ChildList {
  explicitList?: string[];
}

export interface A2UIComponent {
  id: string;
  component: string;
  children?: ChildList;
  text?: string;
  label?: string;
  action?: { event: { name: string; context?: Record<string, unknown> } };
  style?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateSurface {
  surfaceId: string;
  catalogId?: string;
  sendDataModel?: boolean;
  designTokens?: Record<string, DesignToken>;
}

export interface UpdateComponents {
  surfaceId: string;
  components: A2UIComponent[];
}

export interface UpdateDataModel {
  surfaceId: string;
  path?: string;
  value: unknown;
}

export interface DeleteSurface {
  surfaceId: string;
}

export type A2UIMessage =
  | { createSurface: CreateSurface }
  | { updateComponents: UpdateComponents }
  | { updateDataModel: UpdateDataModel }
  | { deleteSurface: DeleteSurface };

export interface A2UIDocument {
  surface: CreateSurface;
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
  designTokens: Record<string, DesignToken>;
  rawMessages: A2UIMessage[];
}

// --- Parsing ---

export function parseA2UIMessages(messages: A2UIMessage[]): A2UIDocument {
  let surface: CreateSurface = { surfaceId: "" };
  let components: A2UIComponent[] = [];
  let dataModel: Record<string, unknown> = {};
  let designTokens: Record<string, DesignToken> = {};

  for (const msg of messages) {
    if ("createSurface" in msg) {
      surface = msg.createSurface;
      if (surface.designTokens) designTokens = surface.designTokens;
    } else if ("updateComponents" in msg) {
      components = msg.updateComponents.components;
    } else if ("updateDataModel" in msg) {
      if (!msg.updateDataModel.path || msg.updateDataModel.path === "/") {
        dataModel = msg.updateDataModel.value as Record<string, unknown>;
      }
    }
  }

  return { surface, components, dataModel, designTokens, rawMessages: messages };
}

// --- Resolution utilities ---

export function resolveToken(
  value: unknown,
  tokens: Record<string, DesignToken>
): string | number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return String(value ?? "");
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;
  const token = tokens[match[1]];
  return token ? token.value : value;
}

function resolveTemplateTokens(text: string): string {
  if (!text.includes("{{")) return text;
  const now = new Date();
  return text
    .replace(/\{\{current_time\}\}/g, now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))
    .replace(/\{\{current_time_24h\}\}/g, now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }))
    .replace(/\{\{current_date\}\}/g, now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }))
    .replace(/\{\{current_day\}\}/g, now.toLocaleDateString([], { weekday: "long" }));
}

export function resolveDataBinding(
  value: string | undefined,
  dataModel: Record<string, unknown>
): string {
  if (!value) return "";
  const match = value.match(/^\$\{\/(.+)\}$/);
  if (!match) return resolveTemplateTokens(value);
  const parts = match[1].split("/");
  let current: unknown = dataModel;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return resolveTemplateTokens(value);
    }
  }
  const resolved = typeof current === "string" ? current : String(current);
  return resolveTemplateTokens(resolved);
}

export function resolveStyleValue(
  style: Record<string, unknown> | undefined,
  key: string,
  tokens: Record<string, DesignToken>
): string | number | undefined {
  if (!style) return undefined;
  const val = style[key];
  if (val === undefined) return undefined;
  return resolveToken(val, tokens);
}
