import { A2UIComponent, CodeGenerator } from "../types";

function indent(code: string, level: number): string {
  const spaces = "  ".repeat(level);
  return code
    .split("\n")
    .map((line) => (line.trim() ? spaces + line : line))
    .join("\n");
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function generateStyles(component: A2UIComponent): string {
  const styles: string[] = [];

  if (component.layout.mode === "row") styles.push("flexDirection: 'row'");
  if (component.layout.spacing) styles.push(`gap: ${component.layout.spacing}`);
  if (component.layout.padding) {
    const p = component.layout.padding;
    styles.push(`paddingTop: ${p.top}`);
    styles.push(`paddingRight: ${p.right}`);
    styles.push(`paddingBottom: ${p.bottom}`);
    styles.push(`paddingLeft: ${p.left}`);
  }
  if (component.style.width) styles.push(`width: ${component.style.width}`);
  if (component.style.height) styles.push(`height: ${component.style.height}`);
  if (component.style.backgroundColor)
    styles.push(`backgroundColor: '${component.style.backgroundColor}'`);
  if (component.style.cornerRadius)
    styles.push(`borderRadius: ${component.style.cornerRadius}`);
  if (component.style.opacity !== undefined && component.style.opacity < 1)
    styles.push(`opacity: ${component.style.opacity}`);
  if (component.style.borderColor)
    styles.push(`borderColor: '${component.style.borderColor}'`);
  if (component.style.borderWidth)
    styles.push(`borderWidth: ${component.style.borderWidth}`);

  return styles.join(",\n    ");
}

function generateTextStyles(component: A2UIComponent): string {
  if (!component.text) return "";
  const styles: string[] = [];
  if (component.text.fontSize) styles.push(`fontSize: ${component.text.fontSize}`);
  if (component.text.fontFamily)
    styles.push(`fontFamily: '${component.text.fontFamily}'`);
  if (component.text.fontWeight)
    styles.push(`fontWeight: '${component.text.fontWeight}'`);
  if (component.text.color) styles.push(`color: '${component.text.color}'`);
  if (component.text.align) styles.push(`textAlign: '${component.text.align}'`);
  return styles.join(",\n    ");
}

function generateJSX(component: A2UIComponent, depth: number): string {
  if (component.type === "text" && component.text) {
    return `${indent("", depth)}<Text style={styles.${camelCase(component.name)}}>${component.text.content}</Text>`;
  }

  if (component.type === "button" && component.text) {
    return `${indent("", depth)}<TouchableOpacity style={styles.${camelCase(component.name)}}>\n${indent("", depth + 1)}<Text style={styles.${camelCase(component.name)}Text}>${component.text.content}</Text>\n${indent("", depth)}</TouchableOpacity>`;
  }

  const children = component.children.map((c) => generateJSX(c, depth + 1)).join("\n");
  return `${indent("", depth)}<View style={styles.${camelCase(component.name)}}>\n${children}\n${indent("", depth)}</View>`;
}

function camelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function collectStyles(component: A2UIComponent): string[] {
  const entries: string[] = [];
  entries.push(`  ${camelCase(component.name)}: {\n    ${generateStyles(component)}\n  }`);

  if (component.text) {
    const suffix = component.type === "button" ? "Text" : "";
    const textStyleStr = generateTextStyles(component);
    if (textStyleStr) {
      entries.push(`  ${camelCase(component.name)}${suffix}: {\n    ${textStyleStr}\n  }`);
    }
  }

  for (const child of component.children) {
    entries.push(...collectStyles(child));
  }
  return entries;
}

export class ReactNativeGenerator implements CodeGenerator {
  platform = "react-native";
  fileExtension = ".tsx";

  generate(component: A2UIComponent): string {
    const componentName = toPascalCase(component.name);
    const jsx = generateJSX(component, 2);
    const styleEntries = collectStyles(component).join(",\n");

    return `import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ${componentName} = () => {
  return (
${jsx}
  );
};

const styles = StyleSheet.create({
${styleEntries}
});
`;
  }
}
