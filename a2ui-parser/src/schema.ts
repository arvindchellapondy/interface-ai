/**
 * A2UI Schema — the intermediate format between Figma designs and native code.
 *
 * Every UI component extracted from Figma is represented as an A2UIComponent tree.
 */

export interface A2UIPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface A2UILayout {
  mode: "row" | "column" | "stack";
  spacing?: number;
  padding?: A2UIPadding;
  mainAxisAlignment?: "start" | "center" | "end" | "spaceBetween" | "spaceAround";
  crossAxisAlignment?: "start" | "center" | "end" | "stretch";
}

export interface A2UIStyle {
  width?: number;
  height?: number;
  backgroundColor?: string;
  cornerRadius?: number;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  shadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
  };
}

export interface A2UIText {
  content: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
}

export interface A2UIInteraction {
  type: "tap" | "longPress" | "swipe";
  action: string;
  payload?: Record<string, unknown>;
}

export type A2UIComponentType =
  | "container"
  | "card"
  | "text"
  | "button"
  | "image"
  | "input"
  | "box"
  | "circle"
  | "icon"
  | "list"
  | "scroll";

export interface A2UIComponent {
  version: "0.1.0";
  name: string;
  type: A2UIComponentType;
  layout: A2UILayout;
  style: A2UIStyle;
  text?: A2UIText;
  interactions?: A2UIInteraction[];
  children: A2UIComponent[];
}

export interface A2UIDocument {
  version: "0.1.0";
  source: string;
  exportedAt: string;
  root: A2UIComponent;
}
