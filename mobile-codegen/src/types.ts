/**
 * Shared types for code generators.
 * These mirror the A2UI v0.9 schema from a2ui-parser.
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

export interface A2UIDocument {
  surface: {
    surfaceId: string;
    designTokens?: Record<string, DesignToken>;
  };
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
  designTokens: Record<string, DesignToken>;
}

export interface CodeGenerator {
  generate(doc: A2UIDocument): string;
  platform: string;
  fileExtension: string;
}

// --- Token & data resolution utilities ---

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

export function resolveDataBinding(
  value: string | undefined,
  dataModel: Record<string, unknown>
): string {
  if (!value) return "";
  const match = value.match(/^\$\{\/(.+)\}$/);
  if (!match) return value;
  const parts = match[1].split("/");
  let current: unknown = dataModel;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return value;
    }
  }
  return typeof current === "string" ? current : String(current);
}

export function resolveStyleValue(
  style: Record<string, unknown>,
  key: string,
  tokens: Record<string, DesignToken>
): string | number | undefined {
  const val = style[key];
  if (val === undefined) return undefined;
  return resolveToken(val, tokens);
}

export function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function camelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** Build a component lookup map from the flat list */
export function buildComponentMap(
  components: A2UIComponent[]
): Map<string, A2UIComponent> {
  const map = new Map<string, A2UIComponent>();
  for (const comp of components) {
    map.set(comp.id, comp);
  }
  return map;
}
