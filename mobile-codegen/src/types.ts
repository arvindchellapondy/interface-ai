export interface A2UIPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface A2UIComponent {
  version: string;
  name: string;
  type: string;
  layout: {
    mode: "row" | "column" | "stack";
    spacing?: number;
    padding?: A2UIPadding;
  };
  style: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    cornerRadius?: number;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  text?: {
    content: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    align?: string;
  };
  children: A2UIComponent[];
}

export interface CodeGenerator {
  generate(component: A2UIComponent): string;
  platform: string;
  fileExtension: string;
}
