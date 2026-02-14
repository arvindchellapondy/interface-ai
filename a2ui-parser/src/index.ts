export * from "./schema";
export * from "./validator";

import {
  A2UIMessage,
  A2UIDocument,
  A2UIComponent,
  CreateSurface,
  DesignToken,
} from "./schema";
import { validateMessages } from "./validator";

/**
 * Parse an array of A2UI v0.9 messages (as produced by the Figma plugin)
 * into a convenient A2UIDocument structure.
 */
export function parseA2UIMessages(json: string): A2UIDocument {
  const messages: A2UIMessage[] = JSON.parse(json);

  const errors = validateMessages(messages);
  if (errors.length > 0) {
    throw new Error(
      `Invalid A2UI messages:\n${errors.map((e) => `  [${e.path}] ${e.message}`).join("\n")}`
    );
  }

  let surface: CreateSurface = { surfaceId: "" };
  let components: A2UIComponent[] = [];
  let dataModel: Record<string, unknown> = {};
  let designTokens: Record<string, DesignToken> = {};

  for (const msg of messages) {
    if ("createSurface" in msg) {
      surface = msg.createSurface;
      if (surface.designTokens) {
        designTokens = surface.designTokens;
      }
    } else if ("updateComponents" in msg) {
      components = msg.updateComponents.components;
    } else if ("updateDataModel" in msg) {
      if (msg.updateDataModel.path === "/" || !msg.updateDataModel.path) {
        dataModel = msg.updateDataModel.value as Record<string, unknown>;
      }
    }
  }

  return { surface, components, dataModel, designTokens };
}

/**
 * Resolve a token reference like "{Accents.Red}" to its value using the token map.
 * Returns the original string if not a token reference or token not found.
 */
export function resolveToken(
  value: string | number | undefined,
  tokens: Record<string, DesignToken>
): string | number | undefined {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;
  const token = tokens[match[1]];
  return token ? token.value : value;
}

/**
 * Resolve a data binding like "${/path/to/value}" from the data model.
 */
export function resolveDataBinding(
  value: string | undefined,
  dataModel: Record<string, unknown>
): string | undefined {
  if (!value) return undefined;
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
