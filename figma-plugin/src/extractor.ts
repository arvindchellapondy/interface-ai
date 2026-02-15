/// <reference types="@figma/plugin-typings" />

export interface TokenBinding {
  token: string;       // Variable name path, e.g. "color/primary/500"
  collection: string;  // Collection name, e.g. "Moon Design Tokens"
  fallback: string;    // Resolved hex value as fallback
}

export interface ExtractedNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: readonly Paint[];
  strokes?: readonly Paint[];
  strokeWeight?: number;
  cornerRadius?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE" | "GRID";
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutSizingHorizontal?: string;
  layoutSizingVertical?: string;
  itemSpacing?: number;
  characters?: string;
  fontSize?: number;
  fontName?: FontName;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  opacity?: number;
  svgContent?: string;
  isIcon?: boolean;
  effects?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number }; offset?: { x: number; y: number }; radius?: number; visible?: boolean }>;
  children: ExtractedNode[];
  // Token bindings resolved from Figma variables
  boundVariables?: {
    fills?: TokenBinding[];
    strokes?: TokenBinding[];
    cornerRadius?: TokenBinding;
    paddingTop?: TokenBinding;
    paddingRight?: TokenBinding;
    paddingBottom?: TokenBinding;
    paddingLeft?: TokenBinding;
    itemSpacing?: TokenBinding;
    fontSize?: TokenBinding;
    fontFamily?: TokenBinding;
    opacity?: TokenBinding;
  };
}

// --- Variable resolution ---

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

function resolveVariableBinding(
  binding: VariableAlias
): TokenBinding | undefined {
  try {
    var variable = figma.variables.getVariableById(binding.id);
    if (!variable) return undefined;

    var collection = figma.variables.getVariableCollectionById(
      variable.variableCollectionId
    );

    // Get the resolved value from the default mode
    var modeId = collection ? collection.modes[0].modeId : "";
    var resolvedValue = variable.resolveForConsumer(
      { id: "0:0", name: "" } as any
    );

    // Build fallback hex for color variables
    var fallback = "";
    var value = modeId ? variable.valuesByMode[modeId] : undefined;
    if (value && typeof value === "object" && "r" in value) {
      var colorVal = value as RGBA;
      fallback = rgbaToHex(colorVal.r, colorVal.g, colorVal.b, colorVal.a);
    } else if (typeof value === "number") {
      fallback = String(value);
    } else if (typeof value === "string") {
      fallback = value;
    }

    return {
      token: variable.name,
      collection: collection ? collection.name : "",
      fallback: fallback,
    };
  } catch (e) {
    return undefined;
  }
}

function extractVariableBindings(
  node: SceneNode
): ExtractedNode["boundVariables"] {
  var bindings: ExtractedNode["boundVariables"] = {};
  var hasAny = false;

  if ("boundVariables" in node) {
    var bv = (node as any).boundVariables;
    if (!bv) return undefined;

    // Fill variables
    if (bv.fills && Array.isArray(bv.fills)) {
      var fillTokens: TokenBinding[] = [];
      for (var i = 0; i < bv.fills.length; i++) {
        var resolved = resolveVariableBinding(bv.fills[i]);
        if (resolved) {
          fillTokens.push(resolved);
          hasAny = true;
        }
      }
      if (fillTokens.length > 0) bindings.fills = fillTokens;
    }

    // Stroke variables
    if (bv.strokes && Array.isArray(bv.strokes)) {
      var strokeTokens: TokenBinding[] = [];
      for (var j = 0; j < bv.strokes.length; j++) {
        var resolvedStroke = resolveVariableBinding(bv.strokes[j]);
        if (resolvedStroke) {
          strokeTokens.push(resolvedStroke);
          hasAny = true;
        }
      }
      if (strokeTokens.length > 0) bindings.strokes = strokeTokens;
    }

    // Scalar variables
    var scalarKeys: Array<{
      figmaKey: string;
      ourKey: keyof NonNullable<ExtractedNode["boundVariables"]>;
    }> = [
      { figmaKey: "topLeftRadius", ourKey: "cornerRadius" },
      { figmaKey: "paddingTop", ourKey: "paddingTop" },
      { figmaKey: "paddingRight", ourKey: "paddingRight" },
      { figmaKey: "paddingBottom", ourKey: "paddingBottom" },
      { figmaKey: "paddingLeft", ourKey: "paddingLeft" },
      { figmaKey: "itemSpacing", ourKey: "itemSpacing" },
      { figmaKey: "fontSize", ourKey: "fontSize" },
      { figmaKey: "fontFamily", ourKey: "fontFamily" },
      { figmaKey: "opacity", ourKey: "opacity" },
    ];

    for (var k = 0; k < scalarKeys.length; k++) {
      var entry = scalarKeys[k];
      if (bv[entry.figmaKey]) {
        var resolvedScalar = resolveVariableBinding(bv[entry.figmaKey]);
        if (resolvedScalar) {
          (bindings as any)[entry.ourKey] = resolvedScalar;
          hasAny = true;
        }
      }
    }
  }

  return hasAny ? bindings : undefined;
}

// --- Standard extractors ---

function extractFills(node: SceneNode): readonly Paint[] | undefined {
  if ("fills" in node && Array.isArray(node.fills)) {
    return node.fills;
  }
  return undefined;
}

function extractStrokes(node: SceneNode): readonly Paint[] | undefined {
  if ("strokes" in node && Array.isArray(node.strokes)) {
    return node.strokes;
  }
  return undefined;
}

function extractCornerRadius(node: SceneNode): number | undefined {
  if ("cornerRadius" in node && typeof node.cornerRadius === "number") {
    return node.cornerRadius;
  }
  return undefined;
}

function extractPadding(
  node: SceneNode
): { top: number; right: number; bottom: number; left: number } | undefined {
  if ("paddingTop" in node) {
    var frame = node as FrameNode;
    return {
      top: frame.paddingTop,
      right: frame.paddingRight,
      bottom: frame.paddingBottom,
      left: frame.paddingLeft,
    };
  }
  return undefined;
}

var VECTOR_TYPES = ["VECTOR", "BOOLEAN_OPERATION", "STAR", "LINE", "ELLIPSE", "POLYGON"];

function isIconContainer(node: SceneNode): boolean {
  if (VECTOR_TYPES.indexOf(node.type) >= 0) return true;
  if ("children" in node) {
    var kids = (node as FrameNode).children;
    if (kids.length > 0 && kids.every(function(c) { return VECTOR_TYPES.indexOf(c.type) >= 0; })) {
      return true;
    }
  }
  return false;
}

export function extractNode(node: SceneNode): ExtractedNode {
  var children: ExtractedNode[] = [];
  var isIcon = isIconContainer(node);

  // Don't recurse into icon containers — they'll be exported as SVG
  if (!isIcon && "children" in node) {
    var parentNode = node as FrameNode;
    for (var i = 0; i < parentNode.children.length; i++) {
      children.push(extractNode(parentNode.children[i]));
    }
  }

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills: extractFills(node),
    strokes: extractStrokes(node),
    strokeWeight: "strokeWeight" in node && typeof (node as any).strokeWeight === "number" ? (node as any).strokeWeight : undefined,
    cornerRadius: extractCornerRadius(node),
    padding: extractPadding(node),
    layoutMode:
      "layoutMode" in node
        ? (node as FrameNode).layoutMode
        : undefined,
    primaryAxisAlignItems:
      "primaryAxisAlignItems" in node
        ? (node as FrameNode).primaryAxisAlignItems
        : undefined,
    counterAxisAlignItems:
      "counterAxisAlignItems" in node
        ? (node as FrameNode).counterAxisAlignItems
        : undefined,
    layoutSizingHorizontal:
      "layoutSizingHorizontal" in node
        ? (node as any).layoutSizingHorizontal
        : undefined,
    layoutSizingVertical:
      "layoutSizingVertical" in node
        ? (node as any).layoutSizingVertical
        : undefined,
    itemSpacing:
      "itemSpacing" in node
        ? (node as FrameNode).itemSpacing
        : undefined,
    opacity: "opacity" in node ? (node as SceneNode & { opacity: number }).opacity : undefined,
    characters: node.type === "TEXT" ? (node as TextNode).characters : undefined,
    fontSize: node.type === "TEXT" && typeof (node as TextNode).fontSize === "number" ? (node as TextNode).fontSize as number : undefined,
    fontName: node.type === "TEXT" && typeof (node as TextNode).fontName === "object" && "family" in ((node as TextNode).fontName as object) ? (node as TextNode).fontName as FontName : undefined,
    lineHeight: node.type === "TEXT" && typeof (node as TextNode).lineHeight === "object" && (node as TextNode).lineHeight !== figma.mixed
      ? ((node as TextNode).lineHeight as { value: number; unit: string }).unit === "PIXELS"
        ? ((node as TextNode).lineHeight as { value: number }).value
        : undefined
      : undefined,
    letterSpacing: node.type === "TEXT" && typeof (node as TextNode).letterSpacing === "object" && (node as TextNode).letterSpacing !== figma.mixed
      ? ((node as TextNode).letterSpacing as { value: number; unit: string }).unit === "PIXELS"
        ? ((node as TextNode).letterSpacing as { value: number }).value
        : undefined
      : undefined,
    textAlignHorizontal: node.type === "TEXT" ? (node as TextNode).textAlignHorizontal : undefined,
    textAlignVertical: node.type === "TEXT" ? (node as TextNode).textAlignVertical : undefined,
    boundVariables: extractVariableBindings(node),
    isIcon: isIcon || undefined,
    effects: "effects" in node && Array.isArray((node as any).effects)
      ? ((node as any).effects as Effect[]).filter(function(e) { return e.visible !== false; }).map(function(e: any) {
          return {
            type: e.type,
            color: e.color ? { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a } : undefined,
            offset: e.offset ? { x: e.offset.x, y: e.offset.y } : undefined,
            radius: e.radius,
            visible: e.visible,
          };
        })
      : undefined,
    children: children,
  };
}

// Walk the extracted tree and find all nodes that need SVG export
export function findIconNodes(extracted: ExtractedNode): ExtractedNode[] {
  var icons: ExtractedNode[] = [];
  if (extracted.isIcon) icons.push(extracted);
  for (var i = 0; i < extracted.children.length; i++) {
    icons = icons.concat(findIconNodes(extracted.children[i]));
  }
  return icons;
}

// Export SVG from a Figma node by its ID
export async function exportSvg(nodeId: string): Promise<string | undefined> {
  var node = figma.getNodeById(nodeId);
  if (!node || !("exportAsync" in node)) return undefined;
  try {
    var svgBytes = await (node as SceneNode).exportAsync({ format: "SVG" });
    return String.fromCharCode.apply(null, Array.from(svgBytes));
  } catch (e) {
    return undefined;
  }
}
