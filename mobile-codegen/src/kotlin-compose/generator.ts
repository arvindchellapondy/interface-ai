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
  if (w.includes("bold")) return "Bold";
  if (w.includes("medium")) return "Medium";
  if (w.includes("light")) return "Light";
  if (w.includes("semibold") || w.includes("semi")) return "SemiBold";
  return "Normal";
}

function generateModifiers(
  style: Record<string, unknown>,
  tokens: Record<string, DesignToken>
): string[] {
  const mods: string[] = [];
  const r = (key: string) => resolveStyleValue(style, key, tokens);

  const width = r("width");
  const height = r("height");
  const bg = r("backgroundColor");
  const radius = r("cornerRadius");
  const opacity = r("opacity");
  const borderColor = r("borderColor");
  const borderWidth = r("borderWidth");
  const pt = r("paddingTop");
  const pr = r("paddingRight");
  const pb = r("paddingBottom");
  const pl = r("paddingLeft");

  if (width && height) {
    mods.push(`.size(${width}.dp, ${height}.dp)`);
  } else if (width) {
    mods.push(`.width(${width}.dp)`);
  } else if (height) {
    mods.push(`.height(${height}.dp)`);
  }
  if (bg) mods.push(`.background(Color(android.graphics.Color.parseColor("${bg}")))`);
  if (radius) mods.push(`.clip(RoundedCornerShape(${radius}.dp))`);
  if (pt || pr || pb || pl) {
    mods.push(`.padding(start = ${pl || 0}.dp, top = ${pt || 0}.dp, end = ${pr || 0}.dp, bottom = ${pb || 0}.dp)`);
  }
  if (opacity !== undefined && opacity !== 1) mods.push(`.alpha(${opacity}f)`);
  if (borderColor && borderWidth) {
    mods.push(`.border(${borderWidth}.dp, Color(android.graphics.Color.parseColor("${borderColor}")), RoundedCornerShape(${radius || 0}.dp))`);
  }

  return mods;
}

function generateComposable(
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
    const args: string[] = [`text = "${text}"`];
    const fontSize = r("fontSize");
    const fontWeight = r("fontWeight");
    const color = r("color");
    if (fontSize) args.push(`fontSize = ${fontSize}.sp`);
    if (fontWeight) args.push(`fontWeight = FontWeight.${mapWeight(String(fontWeight))}`);
    if (color) args.push(`color = Color(android.graphics.Color.parseColor("${color}"))`);
    return `${i}Text(\n${args.map((a) => `${ind(depth + 1)}${a}`).join(",\n")}\n${i})`;
  }

  if (comp.component === "Button") {
    const label = resolveDataBinding(comp.label, dataModel);
    const mods = generateModifiers(style, tokens);
    const modStr = mods.length ? `\n${ind(depth + 2)}${mods.join("\n" + ind(depth + 2))}` : "";
    const textArgs: string[] = [`"${label}"`];
    if (comp.labelStyle) {
      const lr = (key: string) => resolveStyleValue(comp.labelStyle!, key, tokens);
      const fc = lr("color");
      const fs = lr("fontSize");
      if (fc) textArgs.push(`color = Color(android.graphics.Color.parseColor("${fc}"))`);
      if (fs) textArgs.push(`fontSize = ${fs}.sp`);
    }
    const btnText = textArgs.length === 1
      ? `${ind(depth + 1)}Text(${textArgs[0]})`
      : `${ind(depth + 1)}Text(\n${textArgs.map(a => `${ind(depth + 2)}${a}`).join(",\n")}\n${ind(depth + 1)})`;
    return `${i}Button(\n${ind(depth + 1)}onClick = {},\n${ind(depth + 1)}modifier = Modifier${modStr}\n${i}) {\n${btnText}\n${i}}`;
  }

  // Container
  const container = comp.component === "Row" ? "Row" : "Column";
  const mods = generateModifiers(style, tokens);
  const modStr = mods.length ? `\n${ind(depth + 1)}modifier = Modifier\n${ind(depth + 2)}${mods.join("\n" + ind(depth + 2))},` : "";
  const r = (key: string) => resolveStyleValue(style, key, tokens);
  const gap = r("gap");
  const spacingArg = gap
    ? `\n${ind(depth + 1)}${comp.component === "Row" ? "horizontalArrangement" : "verticalArrangement"} = Arrangement.spacedBy(${gap}.dp),`
    : "";

  let code = `${i}${container}(${modStr}${spacingArg}\n${i}) {\n`;
  const childIds = comp.children?.explicitList || [];
  for (const childId of childIds) {
    const child = compMap.get(childId);
    if (child) {
      code += generateComposable(child, compMap, tokens, dataModel, depth + 1) + "\n";
    }
  }
  code += `${i}}`;
  return code;
}

export class KotlinComposeGenerator implements CodeGenerator {
  platform = "kotlin-compose";
  fileExtension = ".kt";

  generate(doc: A2UIDocument): string {
    const compMap = buildComponentMap(doc.components);
    const root = compMap.get("root");
    if (!root) throw new Error("No root component found");

    const name = toPascalCase(doc.surface.surfaceId);
    const body = generateComposable(root, compMap, doc.designTokens, doc.dataModel, 1);

    return `package com.interfaceai.generated

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ${name}() {
${body}
}

@Preview
@Composable
fun ${name}Preview() {
    ${name}()
}
`;
  }
}
