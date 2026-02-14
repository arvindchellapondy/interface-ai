import { A2UIComponent, A2UIMessage, A2UIDocument } from "./schema";

export interface ValidationError {
  path: string;
  message: string;
}

function validateComponent(
  comp: A2UIComponent,
  index: number,
  allIds: Set<string>,
  errors: ValidationError[]
): void {
  const path = `components[${index}]`;

  if (!comp.id || typeof comp.id !== "string") {
    errors.push({ path, message: "Missing or invalid id" });
  }

  if (!comp.component || typeof comp.component !== "string") {
    errors.push({ path, message: "Missing or invalid component type" });
  }

  if (comp.children) {
    if (comp.children.explicitList) {
      if (!Array.isArray(comp.children.explicitList)) {
        errors.push({ path: `${path}.children`, message: "explicitList must be an array" });
      }
    }
  }

  if (comp.action) {
    if (!comp.action.event || !comp.action.event.name) {
      errors.push({ path: `${path}.action`, message: "action.event.name is required" });
    }
  }

  allIds.add(comp.id);
}

function validateChildReferences(
  components: A2UIComponent[],
  errors: ValidationError[]
): void {
  const ids = new Set(components.map((c) => c.id));

  components.forEach((comp, i) => {
    if (comp.children?.explicitList) {
      comp.children.explicitList.forEach((childId) => {
        if (!ids.has(childId)) {
          errors.push({
            path: `components[${i}].children`,
            message: `References unknown component id: "${childId}"`,
          });
        }
      });
    }
  });

  if (!ids.has("root")) {
    errors.push({ path: "components", message: 'No component with id "root" found' });
  }
}

export function validateMessages(messages: A2UIMessage[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(messages) || messages.length === 0) {
    errors.push({ path: "root", message: "Expected a non-empty array of messages" });
    return errors;
  }

  let hasCreateSurface = false;
  let hasUpdateComponents = false;

  messages.forEach((msg, i) => {
    const path = `messages[${i}]`;

    if ("createSurface" in msg) {
      hasCreateSurface = true;
      if (!msg.createSurface.surfaceId) {
        errors.push({ path: `${path}.createSurface`, message: "Missing surfaceId" });
      }
    } else if ("updateComponents" in msg) {
      hasUpdateComponents = true;
      if (!msg.updateComponents.surfaceId) {
        errors.push({ path: `${path}.updateComponents`, message: "Missing surfaceId" });
      }
      if (!Array.isArray(msg.updateComponents.components)) {
        errors.push({ path: `${path}.updateComponents`, message: "components must be an array" });
      } else {
        const allIds = new Set<string>();
        msg.updateComponents.components.forEach((comp, j) => {
          validateComponent(comp, j, allIds, errors);
        });
        validateChildReferences(msg.updateComponents.components, errors);
      }
    } else if ("updateDataModel" in msg) {
      if (!msg.updateDataModel.surfaceId) {
        errors.push({ path: `${path}.updateDataModel`, message: "Missing surfaceId" });
      }
    } else if ("deleteSurface" in msg) {
      // valid
    } else {
      errors.push({ path, message: "Unknown message type" });
    }
  });

  if (!hasCreateSurface) {
    errors.push({ path: "root", message: "Missing createSurface message" });
  }
  if (!hasUpdateComponents) {
    errors.push({ path: "root", message: "Missing updateComponents message" });
  }

  return errors;
}

export function validateDocument(doc: A2UIDocument): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!doc.surface || !doc.surface.surfaceId) {
    errors.push({ path: "surface", message: "Missing surface or surfaceId" });
  }

  if (!Array.isArray(doc.components) || doc.components.length === 0) {
    errors.push({ path: "components", message: "components must be a non-empty array" });
  } else {
    const allIds = new Set<string>();
    doc.components.forEach((comp, i) => {
      validateComponent(comp, i, allIds, errors);
    });
    validateChildReferences(doc.components, errors);
  }

  return errors;
}

export function isValid(messages: A2UIMessage[]): boolean {
  return validateMessages(messages).length === 0;
}
