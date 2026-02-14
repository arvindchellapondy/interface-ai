import { A2UIDocument, CodeGenerator } from "./types";
import { ReactNativeGenerator } from "./react-native/generator";
import { SwiftUIGenerator } from "./swiftui/generator";
import { KotlinComposeGenerator } from "./kotlin-compose/generator";

export { ReactNativeGenerator } from "./react-native/generator";
export { SwiftUIGenerator } from "./swiftui/generator";
export { KotlinComposeGenerator } from "./kotlin-compose/generator";
export type { A2UIDocument, A2UIComponent, CodeGenerator, DesignToken } from "./types";
export { resolveToken, resolveDataBinding } from "./types";

const generators: Record<string, CodeGenerator> = {
  "react-native": new ReactNativeGenerator(),
  swiftui: new SwiftUIGenerator(),
  "kotlin-compose": new KotlinComposeGenerator(),
};

export function generateCode(doc: A2UIDocument, platform: string): string {
  const generator = generators[platform];
  if (!generator) {
    throw new Error(
      `Unknown platform: "${platform}". Available: ${Object.keys(generators).join(", ")}`
    );
  }
  return generator.generate(doc);
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(generators);
}
