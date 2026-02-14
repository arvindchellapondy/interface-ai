import { A2UIComponent, A2UIDocument, A2UIComponentType } from "./schema";

const VALID_TYPES: A2UIComponentType[] = [
  "container", "card", "text", "button", "image",
  "input", "box", "circle", "icon", "list", "scroll",
];

const VALID_LAYOUT_MODES = ["row", "column", "stack"];

export interface ValidationError {
  path: string;
  message: string;
}

function validateComponent(
  component: A2UIComponent,
  path: string,
  errors: ValidationError[]
): void {
  if (!component.version) {
    errors.push({ path, message: "Missing version field" });
  }

  if (!component.name || typeof component.name !== "string") {
    errors.push({ path, message: "Missing or invalid name" });
  }

  if (!VALID_TYPES.includes(component.type)) {
    errors.push({ path, message: `Invalid type: "${component.type}"` });
  }

  if (!component.layout || !VALID_LAYOUT_MODES.includes(component.layout.mode)) {
    errors.push({ path, message: "Missing or invalid layout.mode" });
  }

  if (!component.style) {
    errors.push({ path, message: "Missing style object" });
  }

  if (component.text) {
    if (typeof component.text.content !== "string") {
      errors.push({ path: `${path}.text`, message: "text.content must be a string" });
    }
  }

  if (component.children) {
    if (!Array.isArray(component.children)) {
      errors.push({ path, message: "children must be an array" });
    } else {
      component.children.forEach((child, i) => {
        validateComponent(child, `${path}.children[${i}]`, errors);
      });
    }
  }
}

export function validate(doc: A2UIDocument): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!doc.version) {
    errors.push({ path: "root", message: "Missing document version" });
  }

  if (!doc.source) {
    errors.push({ path: "root", message: "Missing source field" });
  }

  if (!doc.root) {
    errors.push({ path: "root", message: "Missing root component" });
  } else {
    validateComponent(doc.root, "root", errors);
  }

  return errors;
}

export function isValid(doc: A2UIDocument): boolean {
  return validate(doc).length === 0;
}
