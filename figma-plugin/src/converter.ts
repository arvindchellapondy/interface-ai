/// <reference types="@figma/plugin-typings" />

import { ExtractedNode, TokenBinding } from "./extractor";

// A2UI v0.9 types — per https://a2ui.org/specification/v0.9-a2ui/

export interface A2UIComponentDef {
  id: string;
  component: string;
  children?: { explicitList: string[] };
  // Text
  text?: string;
  // Button
  label?: string;
  action?: { event: { name: string; context?: Record<string, unknown> } };
  // Style properties (custom extensions for design-to-code)
  style?: Record<string, unknown>;
  // Any other component-specific props
  [key: string]: unknown;
}

export interface A2UICreateSurface {
  createSurface: {
    surfaceId: string;
    catalogId?: string;
    theme?: {
      primaryColor?: string;
      agentDisplayName?: string;
    };
    sendDataModel?: boolean;
  };
}

export interface A2UIUpdateComponents {
  updateComponents: {
    surfaceId: string;
    components: A2UIComponentDef[];
  };
}

export interface A2UIUpdateDataModel {
  updateDataModel: {
    surfaceId: string;
    path?: string;
    value: unknown;
  };
}

export type A2UIMessage = A2UICreateSurface | A2UIUpdateComponents | A2UIUpdateDataModel;

// --- Helpers ---

function rgbaToHex(r: number, g: number, b: number, a?: number): string {
  var toHex = function (v: number) {
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  var hex = "#" + toHex(r) + toHex(g) + toHex(b);
  if (a !== undefined && a < 1) {
    return hex + toHex(a);
  }
  return hex;
}

function extractColor(fills?: readonly Paint[]): string | undefined {
  if (!fills || fills.length === 0) return undefined;
  var fill = fills[0];
  if (fill.type === "SOLID") {
    return rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.opacity);
  }
  return undefined;
}

function sanitizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function mapComponentType(figmaType: string, name: string): string {
  var lowerName = name.toLowerCase();

  if (figmaType === "TEXT") return "Text";
  if (lowerName.includes("button") || lowerName.includes("btn")) return "Button";
  if (lowerName.includes("image") || lowerName.includes("img")) return "Image";
  if (lowerName.includes("input") || lowerName.includes("field")) return "TextField";
  if (lowerName.includes("card") || lowerName.includes("tile")) return "Card";

  switch (figmaType) {
    case "FRAME":
    case "GROUP":
    case "COMPONENT":
    case "INSTANCE":
      return "Column";
    default:
      return "Column";
  }
}

function mapLayoutComponent(mode?: string): string {
  switch (mode) {
    case "HORIZONTAL":
      return "Row";
    case "VERTICAL":
      return "Column";
    default:
      return "Column";
  }
}

// --- Flattening ---

interface FlattenContext {
  components: A2UIComponentDef[];
  dataModel: Record<string, unknown>;
  idCounter: Record<string, number>;
  tokens: Record<string, { value: string; collection: string }>;
}

function uniqueId(ctx: FlattenContext, base: string): string {
  var sanitized = sanitizeId(base);
  if (!sanitized) sanitized = "component";
  if (!ctx.idCounter[sanitized]) {
    ctx.idCounter[sanitized] = 1;
    return sanitized;
  }
  ctx.idCounter[sanitized]++;
  return sanitized + "_" + ctx.idCounter[sanitized];
}

function findTextChild(node: ExtractedNode): ExtractedNode | undefined {
  if (node.type === "TEXT" && node.characters) return node;
  for (var i = 0; i < node.children.length; i++) {
    var found = findTextChild(node.children[i]);
    if (found) return found;
  }
  return undefined;
}

// Format a token binding as "{token.name}" for A2UI output
function tokenRef(binding: TokenBinding): string {
  // Convert slash-separated path to dot-separated: "color/primary/500" → "color.primary.500"
  return "{" + binding.token.replace(/\//g, ".") + "}";
}

function collectToken(ctx: FlattenContext, binding: TokenBinding): void {
  var key = binding.token.replace(/\//g, ".");
  if (!ctx.tokens[key]) {
    ctx.tokens[key] = { value: binding.fallback, collection: binding.collection };
  }
}

function useToken(ctx: FlattenContext | undefined, binding: TokenBinding): string {
  if (ctx) collectToken(ctx, binding);
  return tokenRef(binding);
}

function buildStyle(node: ExtractedNode, isText: boolean, ctx?: FlattenContext): Record<string, unknown> {
  var style: Record<string, unknown> = {};
  var bv = node.boundVariables;
  var fillColor = extractColor(node.fills);

  if (node.width) style.width = node.width;
  if (node.height) style.height = node.height;

  if (isText) {
    if (bv && bv.fills && bv.fills.length > 0) {
      style.color = useToken(ctx, bv.fills[0]);
    } else if (fillColor) {
      style.color = fillColor;
    }

    if (bv && bv.fontSize) {
      style.fontSize = useToken(ctx, bv.fontSize);
    } else if (node.fontSize) {
      style.fontSize = node.fontSize;
    }

    if (bv && bv.fontFamily) {
      style.fontFamily = useToken(ctx, bv.fontFamily);
    } else if (node.fontName) {
      style.fontFamily = node.fontName.family;
    }

    if (node.fontName) {
      style.fontWeight = node.fontName.style;
    }
    if (node.textAlignHorizontal) style.textAlign = node.textAlignHorizontal.toLowerCase();
  } else {
    if (bv && bv.fills && bv.fills.length > 0) {
      style.backgroundColor = useToken(ctx, bv.fills[0]);
    } else if (fillColor) {
      style.backgroundColor = fillColor;
    }
  }

  if (bv && bv.cornerRadius) {
    style.cornerRadius = useToken(ctx, bv.cornerRadius);
  } else if (node.cornerRadius) {
    style.cornerRadius = node.cornerRadius;
  }

  if (bv && bv.opacity) {
    style.opacity = useToken(ctx, bv.opacity);
  } else if (node.opacity !== undefined && node.opacity < 1) {
    style.opacity = node.opacity;
  }

  if (bv && bv.strokes && bv.strokes.length > 0) {
    style.borderColor = useToken(ctx, bv.strokes[0]);
    style.borderWidth = 1;
  } else if (node.strokes && node.strokes.length > 0) {
    var stroke = node.strokes[0];
    if (stroke.type === "SOLID") {
      style.borderColor = rgbaToHex(stroke.color.r, stroke.color.g, stroke.color.b);
      style.borderWidth = 1;
    }
  }

  if (node.padding) {
    style.paddingTop = (bv && bv.paddingTop) ? useToken(ctx, bv.paddingTop) : node.padding.top;
    style.paddingRight = (bv && bv.paddingRight) ? useToken(ctx, bv.paddingRight) : node.padding.right;
    style.paddingBottom = (bv && bv.paddingBottom) ? useToken(ctx, bv.paddingBottom) : node.padding.bottom;
    style.paddingLeft = (bv && bv.paddingLeft) ? useToken(ctx, bv.paddingLeft) : node.padding.left;
  }

  if (bv && bv.itemSpacing) {
    style.gap = useToken(ctx, bv.itemSpacing);
  } else if (node.itemSpacing) {
    style.gap = node.itemSpacing;
  }

  return style;
}

function flattenNode(
  node: ExtractedNode,
  ctx: FlattenContext,
  isRoot: boolean
): string {
  var id = isRoot ? "root" : uniqueId(ctx, node.name);
  var componentType = mapComponentType(node.type, node.name);
  var isText = node.type === "TEXT";

  // For layout containers, use Row/Column based on layoutMode
  if (!isText && componentType !== "Button" && componentType !== "Card"
      && componentType !== "Image" && componentType !== "TextField") {
    componentType = mapLayoutComponent(node.layoutMode);
  }

  var style = buildStyle(node, isText, ctx);

  if (isText && node.characters) {
    // Store text content in data model
    var dataPath = "/" + id + "/text";
    ctx.dataModel[id] = { text: node.characters };

    var comp: A2UIComponentDef = {
      id: id,
      component: "Text",
      text: "${" + dataPath + "}",
    };
    if (Object.keys(style).length > 0) comp.style = style;
    ctx.components.push(comp);
    return id;
  }

  if (componentType === "Button") {
    var textChild = findTextChild(node);
    var buttonLabel = textChild ? textChild.characters || "Button" : "Button";
    var btnDataPath = "/" + id + "/label";
    ctx.dataModel[id] = { label: buttonLabel };

    var btnComp: A2UIComponentDef = {
      id: id,
      component: "Button",
      label: "${" + btnDataPath + "}",
      action: { event: { name: id + "_click" } },
    };
    if (Object.keys(style).length > 0) btnComp.style = style;

    // Add text styling from the inner text child
    if (textChild) {
      var textStyle = buildStyle(textChild, true, ctx);
      if (Object.keys(textStyle).length > 0) {
        btnComp.labelStyle = textStyle;
      }
    }

    ctx.components.push(btnComp);
    return id;
  }

  // Container (Column, Row, Card)
  var childIds: string[] = [];
  for (var i = 0; i < node.children.length; i++) {
    var childId = flattenNode(node.children[i], ctx, false);
    childIds.push(childId);
  }

  var containerComp: A2UIComponentDef = {
    id: id,
    component: componentType,
  };
  if (childIds.length > 0) {
    containerComp.children = { explicitList: childIds };
  }
  if (Object.keys(style).length > 0) containerComp.style = style;

  ctx.components.push(containerComp);
  return id;
}

// --- Public API ---

export function toA2UI(node: ExtractedNode): A2UIMessage[] {
  var surfaceId = sanitizeId(node.name) || "surface";

  var ctx: FlattenContext = {
    components: [],
    dataModel: {},
    idCounter: {},
    tokens: {},
  };

  flattenNode(node, ctx, true);

  var messages: A2UIMessage[] = [];

  // 1. createSurface — includes design tokens registry
  var surface: A2UICreateSurface = {
    createSurface: {
      surfaceId: surfaceId,
      catalogId: "standard_catalog_v0.9",
      sendDataModel: true,
    },
  };
  if (Object.keys(ctx.tokens).length > 0) {
    (surface.createSurface as any).designTokens = ctx.tokens;
  }
  messages.push(surface);

  // 2. updateComponents
  messages.push({
    updateComponents: {
      surfaceId: surfaceId,
      components: ctx.components,
    },
  });

  // 3. updateDataModel
  if (Object.keys(ctx.dataModel).length > 0) {
    messages.push({
      updateDataModel: {
        surfaceId: surfaceId,
        path: "/",
        value: ctx.dataModel,
      },
    });
  }

  return messages;
}
