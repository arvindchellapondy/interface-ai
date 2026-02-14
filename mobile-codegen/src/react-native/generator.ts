import {
  A2UIComponent,
  A2UIDocument,
  CodeGenerator,
  DesignToken,
  buildComponentMap,
  resolveToken,
  resolveDataBinding,
  resolveStyleValue,
  toPascalCase,
  camelCase,
} from "../types";

function generateStyleObject(
  style: Record<string, unknown>,
  tokens: Record<string, DesignToken>
): string {
  const entries: string[] = [];
  const r = (key: string) => resolveStyleValue(style, key, tokens);

  const width = r("width");
  const height = r("height");
  const bg = r("backgroundColor");
  const radius = r("cornerRadius");
  const opacity = r("opacity");
  const borderColor = r("borderColor");
  const borderWidth = r("borderWidth");
  const color = r("color");
  const fontSize = r("fontSize");
  const fontFamily = r("fontFamily");
  const fontWeight = r("fontWeight");
  const textAlign = r("textAlign");
  const gap = r("gap");
  const pt = r("paddingTop");
  const pr = r("paddingRight");
  const pb = r("paddingBottom");
  const pl = r("paddingLeft");

  if (width) entries.push(`width: ${width}`);
  if (height) entries.push(`height: ${height}`);
  if (bg) entries.push(`backgroundColor: '${bg}'`);
  if (radius) entries.push(`borderRadius: ${radius}`);
  if (opacity !== undefined && opacity !== 1) entries.push(`opacity: ${opacity}`);
  if (borderColor) entries.push(`borderColor: '${borderColor}'`);
  if (borderWidth) entries.push(`borderWidth: ${borderWidth}`);
  if (color) entries.push(`color: '${color}'`);
  if (fontSize) entries.push(`fontSize: ${fontSize}`);
  if (fontFamily) entries.push(`fontFamily: '${fontFamily}'`);
  if (fontWeight) entries.push(`fontWeight: '${fontWeight}'`);
  if (textAlign) entries.push(`textAlign: '${textAlign}'`);
  if (gap) entries.push(`gap: ${gap}`);
  if (pt) entries.push(`paddingTop: ${pt}`);
  if (pr) entries.push(`paddingRight: ${pr}`);
  if (pb) entries.push(`paddingBottom: ${pb}`);
  if (pl) entries.push(`paddingLeft: ${pl}`);

  return entries.join(",\n    ");
}

function generateJSX(
  comp: A2UIComponent,
  compMap: Map<string, A2UIComponent>,
  tokens: Record<string, DesignToken>,
  dataModel: Record<string, unknown>,
  depth: number
): string {
  const indent = "  ".repeat(depth);
  const styleRef = `styles.${camelCase(comp.id)}`;

  if (comp.component === "Text") {
    const text = resolveDataBinding(comp.text, dataModel);
    return `${indent}<Text style={${styleRef}}>${text}</Text>`;
  }

  if (comp.component === "Button") {
    const label = resolveDataBinding(comp.label, dataModel);
    return `${indent}<TouchableOpacity style={${styleRef}} onPress={() => {}}>\n${indent}  <Text style={styles.${camelCase(comp.id)}Label}>${label}</Text>\n${indent}</TouchableOpacity>`;
  }

  // Container: Row, Column, Card
  const isRow = comp.component === "Row";
  const childIds = comp.children?.explicitList || [];
  const childrenJSX = childIds
    .map((id) => {
      const child = compMap.get(id);
      if (!child) return "";
      return generateJSX(child, compMap, tokens, dataModel, depth + 1);
    })
    .filter(Boolean)
    .join("\n");

  return `${indent}<View style={${styleRef}}>\n${childrenJSX}\n${indent}</View>`;
}

export class ReactNativeGenerator implements CodeGenerator {
  platform = "react-native";
  fileExtension = ".tsx";

  generate(doc: A2UIDocument): string {
    const compMap = buildComponentMap(doc.components);
    const root = compMap.get("root");
    if (!root) throw new Error("No root component found");

    const componentName = toPascalCase(doc.surface.surfaceId);
    const jsx = generateJSX(root, compMap, doc.designTokens, doc.dataModel, 2);

    // Collect styles
    const styleEntries: string[] = [];
    for (const comp of doc.components) {
      const style = comp.style || {};
      // Add flexDirection for Row components
      if (comp.component === "Row") {
        style["flexDirection"] = "row";
      }
      const styleStr = generateStyleObject(style, doc.designTokens);
      if (styleStr) {
        styleEntries.push(`  ${camelCase(comp.id)}: {\n    ${styleStr},\n  }`);
      }

      // Button label style
      if (comp.component === "Button" && comp.labelStyle) {
        const labelStr = generateStyleObject(comp.labelStyle, doc.designTokens);
        if (labelStr) {
          styleEntries.push(`  ${camelCase(comp.id)}Label: {\n    ${labelStr},\n  }`);
        }
      }
    }

    return `import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ${componentName} = () => {
  return (
${jsx}
  );
};

const styles = StyleSheet.create({
${styleEntries.join(",\n")}
});
`;
  }
}
