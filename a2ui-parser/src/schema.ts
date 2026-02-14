/**
 * A2UI v0.9 Schema — per https://a2ui.org/specification/v0.9-a2ui/
 *
 * Messages are streamed as JSONL. Each message contains exactly one of:
 * createSurface, updateComponents, updateDataModel, deleteSurface
 */

// --- Design Tokens ---

export interface DesignToken {
  value: string;
  collection: string;
}

// --- Component Definition ---

export interface ChildList {
  explicitList?: string[];
  template?: {
    dataPath: string;
    componentId: string;
  };
}

export interface ActionEvent {
  name: string;
  context?: Record<string, unknown>;
}

export interface ComponentAction {
  event: ActionEvent;
}

export interface A2UIComponent {
  id: string;
  component: string;
  children?: ChildList;
  text?: string;
  label?: string;
  action?: ComponentAction;
  style?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

// --- Messages ---

export interface CreateSurface {
  surfaceId: string;
  catalogId?: string;
  theme?: {
    primaryColor?: string;
    agentDisplayName?: string;
    iconUrl?: string;
  };
  sendDataModel?: boolean;
  designTokens?: Record<string, DesignToken>;
}

export interface UpdateComponents {
  surfaceId: string;
  components: A2UIComponent[];
}

export interface UpdateDataModel {
  surfaceId: string;
  path?: string;
  value: unknown;
}

export interface DeleteSurface {
  surfaceId: string;
}

// --- Message Envelope ---

export type A2UIMessage =
  | { createSurface: CreateSurface }
  | { updateComponents: UpdateComponents }
  | { updateDataModel: UpdateDataModel }
  | { deleteSurface: DeleteSurface };

// --- Parsed Document (convenience wrapper for a full extraction) ---

export interface A2UIDocument {
  surface: CreateSurface;
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
  designTokens: Record<string, DesignToken>;
}
