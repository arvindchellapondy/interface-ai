export * from "./schema";
export * from "./validator";

import { A2UIDocument } from "./schema";
import { validate, isValid } from "./validator";

export function parseA2UI(json: string): A2UIDocument {
  const doc: A2UIDocument = JSON.parse(json);
  const errors = validate(doc);
  if (errors.length > 0) {
    throw new Error(
      `Invalid A2UI document:\n${errors.map((e) => `  [${e.path}] ${e.message}`).join("\n")}`
    );
  }
  return doc;
}
