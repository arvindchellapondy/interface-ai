#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

// --- Inline types (matches a2ui-parser and mobile-codegen) ---

interface DesignToken {
  value: string;
  collection: string;
}

interface A2UIComponent {
  id: string;
  component: string;
  children?: { explicitList?: string[] };
  text?: string;
  label?: string;
  action?: { event: { name: string; context?: Record<string, unknown> } };
  style?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

interface A2UIDocument {
  surface: { surfaceId: string; designTokens?: Record<string, DesignToken> };
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
  designTokens: Record<string, DesignToken>;
}

// --- Parsing ---

function parseMessages(json: string): A2UIDocument {
  const messages = JSON.parse(json);
  let surface = { surfaceId: "" } as A2UIDocument["surface"];
  let components: A2UIComponent[] = [];
  let dataModel: Record<string, unknown> = {};
  let designTokens: Record<string, DesignToken> = {};

  for (const msg of messages) {
    if (msg.createSurface) {
      surface = msg.createSurface;
      if (surface.designTokens) designTokens = surface.designTokens;
    } else if (msg.updateComponents) {
      components = msg.updateComponents.components;
    } else if (msg.updateDataModel) {
      if (!msg.updateDataModel.path || msg.updateDataModel.path === "/") {
        dataModel = msg.updateDataModel.value;
      }
    }
  }

  return { surface, components, dataModel, designTokens };
}

// --- Utilities ---

function resolveToken(value: unknown, tokens: Record<string, DesignToken>): string | number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return String(value ?? "");
  const m = value.match(/^\{(.+)\}$/);
  if (!m) return value;
  const t = tokens[m[1]];
  return t ? t.value : value;
}

function resolveData(value: string | undefined, data: Record<string, unknown>): string {
  if (!value) return "";
  const m = value.match(/^\$\{\/(.+)\}$/);
  if (!m) return value;
  const parts = m[1].split("/");
  let cur: unknown = data;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as any)) {
      cur = (cur as any)[p];
    } else return value;
  }
  return typeof cur === "string" ? cur : String(cur);
}

function rv(style: Record<string, unknown>, key: string, tokens: Record<string, DesignToken>): string | number | undefined {
  const v = style[key];
  if (v === undefined) return undefined;
  return resolveToken(v, tokens);
}

function toPascal(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, " ").split(" ").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join("");
}

function toCamel(s: string): string {
  const p = toPascal(s);
  return p[0].toLowerCase() + p.slice(1);
}

function buildMap(comps: A2UIComponent[]): Map<string, A2UIComponent> {
  const m = new Map<string, A2UIComponent>();
  for (const c of comps) m.set(c.id, c);
  return m;
}

// --- React Native Generator ---

function rnStyles(style: Record<string, unknown>, tokens: Record<string, DesignToken>): string {
  const e: string[] = [];
  const r = (k: string) => rv(style, k, tokens);
  const add = (k: string, rk: string, quote = false) => {
    const v = r(rk);
    if (v !== undefined) e.push(quote ? `${k}: '${v}'` : `${k}: ${v}`);
  };
  add("width", "width"); add("height", "height");
  add("backgroundColor", "backgroundColor", true);
  add("borderRadius", "cornerRadius");
  add("borderColor", "borderColor", true); add("borderWidth", "borderWidth");
  add("color", "color", true); add("fontSize", "fontSize");
  add("fontFamily", "fontFamily", true); add("fontWeight", "fontWeight", true);
  add("textAlign", "textAlign", true);
  add("gap", "gap");
  add("paddingTop", "paddingTop"); add("paddingRight", "paddingRight");
  add("paddingBottom", "paddingBottom"); add("paddingLeft", "paddingLeft");
  const op = r("opacity");
  if (op !== undefined && op !== 1) e.push(`opacity: ${op}`);
  return e.join(",\n    ");
}

function rnJSX(comp: A2UIComponent, map: Map<string, A2UIComponent>, tokens: Record<string, DesignToken>, data: Record<string, unknown>, d: number): string {
  const ind = "  ".repeat(d);
  const ref = `styles.${toCamel(comp.id)}`;
  if (comp.component === "Text") return `${ind}<Text style={${ref}}>${resolveData(comp.text, data)}</Text>`;
  if (comp.component === "Button") {
    const lbl = resolveData(comp.label, data);
    return `${ind}<TouchableOpacity style={${ref}} onPress={() => {}}>\n${ind}  <Text style={styles.${toCamel(comp.id)}Label}>${lbl}</Text>\n${ind}</TouchableOpacity>`;
  }
  const kids = (comp.children?.explicitList || []).map(id => { const c = map.get(id); return c ? rnJSX(c, map, tokens, data, d + 1) : ""; }).filter(Boolean).join("\n");
  return `${ind}<View style={${ref}}>\n${kids}\n${ind}</View>`;
}

function generateReactNative(doc: A2UIDocument): string {
  const map = buildMap(doc.components);
  const root = map.get("root");
  if (!root) throw new Error("No root component");
  const name = toPascal(doc.surface.surfaceId);
  const jsx = rnJSX(root, map, doc.designTokens, doc.dataModel, 2);
  const styles: string[] = [];
  for (const c of doc.components) {
    const s = c.style || {};
    if (c.component === "Row") s["flexDirection"] = "row";
    const str = rnStyles(s, doc.designTokens);
    if (str) styles.push(`  ${toCamel(c.id)}: {\n    ${str},\n  }`);
    if (c.component === "Button" && c.labelStyle) {
      const ls = rnStyles(c.labelStyle, doc.designTokens);
      if (ls) styles.push(`  ${toCamel(c.id)}Label: {\n    ${ls},\n  }`);
    }
  }
  return `import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ${name} = () => {
  return (
${jsx}
  );
};

const styles = StyleSheet.create({
${styles.join(",\n")}
});
`;
}

// --- SwiftUI Generator ---

function swiftMods(style: Record<string, unknown>, tokens: Record<string, DesignToken>, d: number): string {
  const lines: string[] = [];
  const i = "    ".repeat(d);
  const r = (k: string) => rv(style, k, tokens);
  const bg = r("backgroundColor"), rad = r("cornerRadius"), w = r("width"), h = r("height");
  const bc = r("borderColor"), bw = r("borderWidth");
  const pt = r("paddingTop"), pr = r("paddingRight"), pb = r("paddingBottom"), pl = r("paddingLeft");
  const op = r("opacity");
  if (bg) lines.push(`${i}.background(Color(hex: "${bg}"))`);
  if (rad) lines.push(`${i}.cornerRadius(${rad})`);
  if (w && h) lines.push(`${i}.frame(width: ${w}, height: ${h})`);
  else if (w) lines.push(`${i}.frame(width: ${w})`);
  else if (h) lines.push(`${i}.frame(height: ${h})`);
  if (pt || pr || pb || pl) {
    lines.push(`${i}.padding(.top, ${pt||0})`); lines.push(`${i}.padding(.trailing, ${pr||0})`);
    lines.push(`${i}.padding(.bottom, ${pb||0})`); lines.push(`${i}.padding(.leading, ${pl||0})`);
  }
  if (op !== undefined && op !== 1) lines.push(`${i}.opacity(${op})`);
  if (bc && bw) lines.push(`${i}.overlay(RoundedRectangle(cornerRadius: ${rad||0}).stroke(Color(hex: "${bc}"), lineWidth: ${bw}))`);
  return lines.join("\n");
}

function mapW(w: string): string {
  const l = w.toLowerCase();
  if (l.includes("bold")) return "bold"; if (l.includes("medium")) return "medium";
  if (l.includes("light")) return "light"; if (l.includes("semi")) return "semibold";
  return "regular";
}

function swiftView(comp: A2UIComponent, map: Map<string, A2UIComponent>, tokens: Record<string, DesignToken>, data: Record<string, unknown>, d: number): string {
  const i = "    ".repeat(d), s = comp.style || {};
  if (comp.component === "Text") {
    const txt = resolveData(comp.text, data);
    let v = `${i}Text("${txt}")`;
    const fs = rv(s, "fontSize", tokens), fw = rv(s, "fontWeight", tokens), c = rv(s, "color", tokens);
    if (fs) v += `\n${"    ".repeat(d+1)}.font(.system(size: ${fs}))`;
    if (fw) v += `\n${"    ".repeat(d+1)}.fontWeight(.${mapW(String(fw))})`;
    if (c) v += `\n${"    ".repeat(d+1)}.foregroundColor(Color(hex: "${c}"))`;
    return v;
  }
  if (comp.component === "Button") {
    const lbl = resolveData(comp.label, data);
    let v = `${i}Button(action: {}) {\n${"    ".repeat(d+1)}Text("${lbl}")\n`;
    if (comp.labelStyle) {
      const fc = rv(comp.labelStyle, "color", tokens), fs = rv(comp.labelStyle, "fontSize", tokens);
      if (fs) v += `${"    ".repeat(d+2)}.font(.system(size: ${fs}))\n`;
      if (fc) v += `${"    ".repeat(d+2)}.foregroundColor(Color(hex: "${fc}"))\n`;
    }
    v += `${i}}`; const m = swiftMods(s, tokens, d); if (m) v += "\n" + m; return v;
  }
  const ct = comp.component === "Row" ? "HStack" : "VStack";
  const gap = rv(s, "gap", tokens); const sp = gap ? `spacing: ${gap}` : "";
  let v = `${i}${ct}(${sp}) {\n`;
  for (const id of comp.children?.explicitList || []) { const c = map.get(id); if (c) v += swiftView(c, map, tokens, data, d+1) + "\n"; }
  v += `${i}}`; const m = swiftMods(s, tokens, d); if (m) v += "\n" + m; return v;
}

function generateSwiftUI(doc: A2UIDocument): string {
  const map = buildMap(doc.components), root = map.get("root");
  if (!root) throw new Error("No root component");
  const name = toPascal(doc.surface.surfaceId);
  return `import SwiftUI

struct ${name}: View {
    var body: some View {
${swiftView(root, map, doc.designTokens, doc.dataModel, 2)}
    }
}

struct ${name}_Previews: PreviewProvider {
    static var previews: some View {
        ${name}()
    }
}
`;
}

// --- Kotlin Compose Generator ---

function ktMods(style: Record<string, unknown>, tokens: Record<string, DesignToken>): string[] {
  const m: string[] = [], r = (k: string) => rv(style, k, tokens);
  const w = r("width"), h = r("height"), bg = r("backgroundColor"), rad = r("cornerRadius");
  const bc = r("borderColor"), bw = r("borderWidth"), op = r("opacity");
  const pt = r("paddingTop"), pr = r("paddingRight"), pb = r("paddingBottom"), pl = r("paddingLeft");
  if (w && h) m.push(`.size(${w}.dp, ${h}.dp)`); else if (w) m.push(`.width(${w}.dp)`); else if (h) m.push(`.height(${h}.dp)`);
  if (bg) m.push(`.background(Color(android.graphics.Color.parseColor("${bg}")))`);
  if (rad) m.push(`.clip(RoundedCornerShape(${rad}.dp))`);
  if (pt || pr || pb || pl) m.push(`.padding(start = ${pl||0}.dp, top = ${pt||0}.dp, end = ${pr||0}.dp, bottom = ${pb||0}.dp)`);
  if (op !== undefined && op !== 1) m.push(`.alpha(${op}f)`);
  if (bc && bw) m.push(`.border(${bw}.dp, Color(android.graphics.Color.parseColor("${bc}")), RoundedCornerShape(${rad||0}.dp))`);
  return m;
}

function mapWK(w: string): string {
  const l = w.toLowerCase();
  if (l.includes("bold")) return "Bold"; if (l.includes("medium")) return "Medium";
  if (l.includes("light")) return "Light"; if (l.includes("semi")) return "SemiBold"; return "Normal";
}

function ktComp(comp: A2UIComponent, map: Map<string, A2UIComponent>, tokens: Record<string, DesignToken>, data: Record<string, unknown>, d: number): string {
  const i = "    ".repeat(d), s = comp.style || {};
  if (comp.component === "Text") {
    const txt = resolveData(comp.text, data), r = (k: string) => rv(s, k, tokens);
    const a: string[] = [`text = "${txt}"`];
    const fs = r("fontSize"), fw = r("fontWeight"), c = r("color");
    if (fs) a.push(`fontSize = ${fs}.sp`);
    if (fw) a.push(`fontWeight = FontWeight.${mapWK(String(fw))}`);
    if (c) a.push(`color = Color(android.graphics.Color.parseColor("${c}"))`);
    return `${i}Text(\n${a.map(x => `${"    ".repeat(d+1)}${x}`).join(",\n")}\n${i})`;
  }
  if (comp.component === "Button") {
    const lbl = resolveData(comp.label, data), ms = ktMods(s, tokens);
    const mStr = ms.length ? `\n${"    ".repeat(d+2)}${ms.join("\n"+"    ".repeat(d+2))}` : "";
    const textArgs: string[] = [`"${lbl}"`];
    if (comp.labelStyle) {
      const fc = rv(comp.labelStyle, "color", tokens);
      const fs = rv(comp.labelStyle, "fontSize", tokens);
      if (fc) textArgs.push(`color = Color(android.graphics.Color.parseColor("${fc}"))`);
      if (fs) textArgs.push(`fontSize = ${fs}.sp`);
    }
    const bt = textArgs.length === 1
      ? `${"    ".repeat(d+1)}Text(${textArgs[0]})`
      : `${"    ".repeat(d+1)}Text(\n${textArgs.map(a => `${"    ".repeat(d+2)}${a}`).join(",\n")}\n${"    ".repeat(d+1)})`;
    return `${i}Button(\n${"    ".repeat(d+1)}onClick = {},\n${"    ".repeat(d+1)}modifier = Modifier${mStr}\n${i}) {\n${bt}\n${i}}`;
  }
  const ct = comp.component === "Row" ? "Row" : "Column", ms = ktMods(s, tokens);
  const mStr = ms.length ? `\n${"    ".repeat(d+1)}modifier = Modifier\n${"    ".repeat(d+2)}${ms.join("\n"+"    ".repeat(d+2))},` : "";
  const gap = rv(s, "gap", tokens);
  const sp = gap ? `\n${"    ".repeat(d+1)}${comp.component === "Row" ? "horizontalArrangement" : "verticalArrangement"} = Arrangement.spacedBy(${gap}.dp),` : "";
  let code = `${i}${ct}(${mStr}${sp}\n${i}) {\n`;
  for (const id of comp.children?.explicitList || []) { const c = map.get(id); if (c) code += ktComp(c, map, tokens, data, d+1) + "\n"; }
  return code + `${i}}`;
}

function generateKotlinCompose(doc: A2UIDocument): string {
  const map = buildMap(doc.components), root = map.get("root");
  if (!root) throw new Error("No root component");
  const name = toPascal(doc.surface.surfaceId);
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
${ktComp(root, map, doc.designTokens, doc.dataModel, 1)}
}

@Preview
@Composable
fun ${name}Preview() {
    ${name}()
}
`;
}

// --- CLI ---

const PLATFORMS: Record<string, (doc: A2UIDocument) => string> = {
  "react-native": generateReactNative,
  swiftui: generateSwiftUI,
  "kotlin-compose": generateKotlinCompose,
};

function usage(): void {
  console.log(`
interface-ai - Convert A2UI JSON to native mobile code

Usage:
  interface-ai generate <input.json> --platform <platform> [--output <file>]
  interface-ai validate <input.json>
  interface-ai platforms

Platforms: ${Object.keys(PLATFORMS).join(", ")}

Examples:
  interface-ai generate widget_hello.a2ui.json --platform react-native
  interface-ai generate widget_hello.a2ui.json --platform swiftui --output WidgetHello.swift
  cat widget_hello.a2ui.json | interface-ai generate - --platform react-native
  `);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    usage();
    process.exit(0);
  }

  const command = args[0];

  if (command === "platforms") {
    console.log("Supported platforms:");
    for (const p of Object.keys(PLATFORMS)) {
      console.log(`  - ${p}`);
    }
    process.exit(0);
  }

  if (command === "validate") {
    const inputFile = args[1];
    if (!inputFile) { console.error("Error: Missing input file"); process.exit(1); }
    try {
      const json = fs.readFileSync(inputFile, "utf-8");
      parseMessages(json);
      console.log("Valid A2UI v0.9 document.");
    } catch (e: any) {
      console.error("Validation failed:", e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  if (command === "generate") {
    const inputFile = args[1];
    if (!inputFile) { console.error("Error: Missing input file. Use '-' for stdin."); process.exit(1); }

    let platform = "";
    let outputFile = "";
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--platform" || args[i] === "-p") { platform = args[++i]; }
      else if (args[i] === "--output" || args[i] === "-o") { outputFile = args[++i]; }
    }

    if (!platform) { console.error("Error: --platform is required"); process.exit(1); }
    const generator = PLATFORMS[platform];
    if (!generator) {
      console.error(`Error: Unknown platform "${platform}". Available: ${Object.keys(PLATFORMS).join(", ")}`);
      process.exit(1);
    }

    let json: string;
    if (inputFile === "-") {
      json = fs.readFileSync(0, "utf-8"); // stdin
    } else {
      if (!fs.existsSync(inputFile)) { console.error(`Error: File not found: ${inputFile}`); process.exit(1); }
      json = fs.readFileSync(inputFile, "utf-8");
    }

    try {
      const doc = parseMessages(json);
      const code = generator(doc);

      if (outputFile) {
        fs.writeFileSync(outputFile, code);
        console.log(`Generated ${platform} code → ${outputFile}`);
      } else {
        process.stdout.write(code);
      }
    } catch (e: any) {
      console.error("Error:", e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  usage();
  process.exit(1);
}

main();
