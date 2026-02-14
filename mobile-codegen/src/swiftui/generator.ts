import {
  A2UIComponent,
  A2UIDocument,
  CodeGenerator,
  DesignToken,
  buildComponentMap,
  resolveDataBinding,
  resolveStyleValue,
  toPascalCase,
} from "../types";

function ind(level: number): string {
  return "    ".repeat(level);
}

function mapWeight(weight: string): string {
  const w = weight.toLowerCase();
  if (w.includes("bold")) return "bold";
  if (w.includes("medium")) return "medium";
  if (w.includes("light")) return "light";
  if (w.includes("semibold") || w.includes("semi")) return "semibold";
  return "regular";
}

function generateModifiers(
  style: Record<string, unknown>,
  tokens: Record<string, DesignToken>,
  depth: number
): string {
  const lines: string[] = [];
  const i = ind(depth);
  const r = (key: string) => resolveStyleValue(style, key, tokens);

  const bg = r("backgroundColor");
  const radius = r("cornerRadius");
  const width = r("width");
  const height = r("height");
  const opacity = r("opacity");
  const borderColor = r("borderColor");
  const borderWidth = r("borderWidth");
  const pt = r("paddingTop");
  const pr = r("paddingRight");
  const pb = r("paddingBottom");
  const pl = r("paddingLeft");

  if (bg) lines.push(`${i}.background(Color(hex: "${bg}"))`);
  if (radius) lines.push(`${i}.cornerRadius(${radius})`);
  if (width && height) {
    lines.push(`${i}.frame(width: ${width}, height: ${height})`);
  } else if (width) {
    lines.push(`${i}.frame(width: ${width})`);
  } else if (height) {
    lines.push(`${i}.frame(height: ${height})`);
  }
  if (pt || pr || pb || pl) {
    lines.push(`${i}.padding(.top, ${pt || 0})`);
    lines.push(`${i}.padding(.trailing, ${pr || 0})`);
    lines.push(`${i}.padding(.bottom, ${pb || 0})`);
    lines.push(`${i}.padding(.leading, ${pl || 0})`);
  }
  if (opacity !== undefined && opacity !== 1) lines.push(`${i}.opacity(${opacity})`);
  if (borderColor && borderWidth) {
    lines.push(`${i}.overlay(RoundedRectangle(cornerRadius: ${radius || 0}).stroke(Color(hex: "${borderColor}"), lineWidth: ${borderWidth}))`);
  }

  return lines.join("\n");
}

function generateView(
  comp: A2UIComponent,
  compMap: Map<string, A2UIComponent>,
  tokens: Record<string, DesignToken>,
  dataModel: Record<string, unknown>,
  depth: number
): string {
  const i = ind(depth);
  const style = comp.style || {};

  if (comp.component === "Text") {
    const text = resolveDataBinding(comp.text, dataModel);
    const r = (key: string) => resolveStyleValue(style, key, tokens);
    let view = `${i}Text("${text}")`;
    const fontSize = r("fontSize");
    const fontWeight = r("fontWeight");
    const color = r("color");
    if (fontSize) view += `\n${ind(depth + 1)}.font(.system(size: ${fontSize}))`;
    if (fontWeight) view += `\n${ind(depth + 1)}.fontWeight(.${mapWeight(String(fontWeight))})`;
    if (color) view += `\n${ind(depth + 1)}.foregroundColor(Color(hex: "${color}"))`;
    return view;
  }

  if (comp.component === "Button") {
    const label = resolveDataBinding(comp.label, dataModel);
    let view = `${i}Button(action: {}) {\n`;
    view += `${ind(depth + 1)}Text("${label}")\n`;
    if (comp.labelStyle) {
      const lr = (key: string) => resolveStyleValue(comp.labelStyle!, key, tokens);
      const fc = lr("color");
      const fs = lr("fontSize");
      if (fs) view += `${ind(depth + 2)}.font(.system(size: ${fs}))\n`;
      if (fc) view += `${ind(depth + 2)}.foregroundColor(Color(hex: "${fc}"))\n`;
    }
    view += `${i}}`;
    const mods = generateModifiers(style, tokens, depth);
    if (mods) view += "\n" + mods;
    return view;
  }

  // Container
  const container = comp.component === "Row" ? "HStack" : "VStack";
  const r = (key: string) => resolveStyleValue(style, key, tokens);
  const gap = r("gap");
  const spacingArg = gap ? `spacing: ${gap}` : "";

  let view = `${i}${container}(${spacingArg}) {\n`;
  const childIds = comp.children?.explicitList || [];
  for (const childId of childIds) {
    const child = compMap.get(childId);
    if (child) {
      view += generateView(child, compMap, tokens, dataModel, depth + 1) + "\n";
    }
  }
  view += `${i}}`;
  const mods = generateModifiers(style, tokens, depth);
  if (mods) view += "\n" + mods;
  return view;
}

export class SwiftUIGenerator implements CodeGenerator {
  platform = "swiftui";
  fileExtension = ".swift";

  generate(doc: A2UIDocument): string {
    const compMap = buildComponentMap(doc.components);
    const root = compMap.get("root");
    if (!root) throw new Error("No root component found");

    const name = toPascalCase(doc.surface.surfaceId);
    const body = generateView(root, compMap, doc.designTokens, doc.dataModel, 2);

    return `import SwiftUI

struct ${name}: View {
    var body: some View {
${body}
    }
}

struct ${name}_Previews: PreviewProvider {
    static var previews: some View {
        ${name}()
    }
}
`;
  }
}
