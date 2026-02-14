import { A2UIComponent, CodeGenerator } from "../types";

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function indent(level: number): string {
  return "    ".repeat(level);
}

function generateModifiers(component: A2UIComponent): string[] {
  const mods: string[] = [];

  if (component.style.width && component.style.height) {
    mods.push(`.size(${component.style.width}.dp, ${component.style.height}.dp)`);
  } else if (component.style.width) {
    mods.push(`.width(${component.style.width}.dp)`);
  } else if (component.style.height) {
    mods.push(`.height(${component.style.height}.dp)`);
  }

  if (component.style.backgroundColor) {
    mods.push(`.background(Color(android.graphics.Color.parseColor("${component.style.backgroundColor}")))`);
  }

  if (component.style.cornerRadius) {
    mods.push(`.clip(RoundedCornerShape(${component.style.cornerRadius}.dp))`);
  }

  if (component.layout.padding) {
    const p = component.layout.padding;
    mods.push(`.padding(start = ${p.left}.dp, top = ${p.top}.dp, end = ${p.right}.dp, bottom = ${p.bottom}.dp)`);
  }

  if (component.style.opacity !== undefined && component.style.opacity < 1) {
    mods.push(`.alpha(${component.style.opacity}f)`);
  }

  if (component.style.borderColor && component.style.borderWidth) {
    mods.push(
      `.border(${component.style.borderWidth}.dp, Color(android.graphics.Color.parseColor("${component.style.borderColor}")), RoundedCornerShape(${component.style.cornerRadius || 0}.dp))`
    );
  }

  return mods;
}

function generateComposable(component: A2UIComponent, depth: number): string {
  const i = indent(depth);

  if (component.type === "text" && component.text) {
    let args: string[] = [`text = "${component.text.content}"`];
    if (component.text.fontSize) args.push(`fontSize = ${component.text.fontSize}.sp`);
    if (component.text.fontWeight) args.push(`fontWeight = FontWeight.${mapWeight(component.text.fontWeight)}`);
    if (component.text.color) args.push(`color = Color(android.graphics.Color.parseColor("${component.text.color}"))`);
    return `${i}Text(\n${args.map((a) => `${indent(depth + 1)}${a}`).join(",\n")}\n${i})`;
  }

  if (component.type === "button" && component.text) {
    const mods = generateModifiers(component);
    const modStr = mods.length ? `\n${indent(depth + 2)}${mods.join("\n" + indent(depth + 2))}` : "";
    return `${i}Button(\n${indent(depth + 1)}onClick = {},\n${indent(depth + 1)}modifier = Modifier${modStr}\n${i}) {\n${indent(depth + 1)}Text("${component.text.content}")\n${i}}`;
  }

  const container = component.layout.mode === "row" ? "Row" : "Column";
  const mods = generateModifiers(component);
  const modStr = mods.length ? `\n${indent(depth + 1)}modifier = Modifier\n${indent(depth + 2)}${mods.join("\n" + indent(depth + 2))},` : "";
  const spacingArg = component.layout.spacing
    ? `\n${indent(depth + 1)}${component.layout.mode === "row" ? "horizontalArrangement" : "verticalArrangement"} = Arrangement.spacedBy(${component.layout.spacing}.dp),`
    : "";

  let code = `${i}${container}(${modStr}${spacingArg}\n${i}) {\n`;
  for (const child of component.children) {
    code += generateComposable(child, depth + 1) + "\n";
  }
  code += `${i}}`;
  return code;
}

function mapWeight(weight: string): string {
  const w = weight.toLowerCase();
  if (w.includes("bold")) return "Bold";
  if (w.includes("medium")) return "Medium";
  if (w.includes("light")) return "Light";
  if (w.includes("semibold") || w.includes("semi")) return "SemiBold";
  return "Normal";
}

export class KotlinComposeGenerator implements CodeGenerator {
  platform = "kotlin-compose";
  fileExtension = ".kt";

  generate(component: A2UIComponent): string {
    const name = toPascalCase(component.name);
    const body = generateComposable(component, 1);

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
