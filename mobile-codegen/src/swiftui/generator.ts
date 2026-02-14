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

function generateModifiers(component: A2UIComponent, depth: number): string {
  const lines: string[] = [];
  const i = indent(depth);

  if (component.style.backgroundColor) {
    lines.push(`${i}.background(Color(hex: "${component.style.backgroundColor}"))`);
  }
  if (component.style.cornerRadius) {
    lines.push(`${i}.cornerRadius(${component.style.cornerRadius})`);
  }
  if (component.layout.padding) {
    const p = component.layout.padding;
    lines.push(`${i}.padding(.top, ${p.top})`);
    lines.push(`${i}.padding(.trailing, ${p.right})`);
    lines.push(`${i}.padding(.bottom, ${p.bottom})`);
    lines.push(`${i}.padding(.leading, ${p.left})`);
  }
  if (component.style.width) {
    lines.push(`${i}.frame(width: ${component.style.width})`);
  }
  if (component.style.opacity !== undefined && component.style.opacity < 1) {
    lines.push(`${i}.opacity(${component.style.opacity})`);
  }
  if (component.style.borderColor && component.style.borderWidth) {
    lines.push(
      `${i}.overlay(RoundedRectangle(cornerRadius: ${component.style.cornerRadius || 0}).stroke(Color(hex: "${component.style.borderColor}"), lineWidth: ${component.style.borderWidth}))`
    );
  }

  return lines.join("\n");
}

function generateView(component: A2UIComponent, depth: number): string {
  const i = indent(depth);

  if (component.type === "text" && component.text) {
    let view = `${i}Text("${component.text.content}")`;
    if (component.text.fontSize) view += `\n${indent(depth + 1)}.font(.system(size: ${component.text.fontSize}))`;
    if (component.text.fontWeight) view += `\n${indent(depth + 1)}.fontWeight(.${mapWeight(component.text.fontWeight)})`;
    if (component.text.color) view += `\n${indent(depth + 1)}.foregroundColor(Color(hex: "${component.text.color}"))`;
    return view;
  }

  if (component.type === "button" && component.text) {
    let view = `${i}Button(action: {}) {\n`;
    view += `${indent(depth + 1)}Text("${component.text.content}")\n`;
    if (component.text.fontSize) view += `${indent(depth + 2)}.font(.system(size: ${component.text.fontSize}))\n`;
    view += `${i}}`;
    const modifiers = generateModifiers(component, depth);
    if (modifiers) view += "\n" + modifiers;
    return view;
  }

  const container = component.layout.mode === "row" ? "HStack" : "VStack";
  const spacingArg = component.layout.spacing ? `spacing: ${component.layout.spacing}` : "";

  let view = `${i}${container}(${spacingArg}) {\n`;
  for (const child of component.children) {
    view += generateView(child, depth + 1) + "\n";
  }
  view += `${i}}`;

  const modifiers = generateModifiers(component, depth);
  if (modifiers) view += "\n" + modifiers;

  return view;
}

function mapWeight(weight: string): string {
  const w = weight.toLowerCase();
  if (w.includes("bold")) return "bold";
  if (w.includes("medium")) return "medium";
  if (w.includes("light")) return "light";
  if (w.includes("semibold") || w.includes("semi")) return "semibold";
  return "regular";
}

export class SwiftUIGenerator implements CodeGenerator {
  platform = "swiftui";
  fileExtension = ".swift";

  generate(component: A2UIComponent): string {
    const name = toPascalCase(component.name);
    const body = generateView(component, 2);

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
