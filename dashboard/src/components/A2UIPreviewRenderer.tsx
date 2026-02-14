"use client";

import React from "react";
import {
  A2UIComponent,
  A2UIDocument,
  DesignToken,
  resolveDataBinding,
  resolveStyleValue,
} from "@/lib/a2ui-types";

interface RendererProps {
  doc: A2UIDocument;
}

interface ComponentProps {
  component: A2UIComponent;
  componentMap: Map<string, A2UIComponent>;
  tokens: Record<string, DesignToken>;
  dataModel: Record<string, unknown>;
}

function resolveStyles(
  style: Record<string, unknown> | undefined,
  tokens: Record<string, DesignToken>
): React.CSSProperties {
  if (!style) return {};
  const r = (key: string) => resolveStyleValue(style, key, tokens);
  const css: React.CSSProperties = {};

  const width = r("width");
  const height = r("height");
  const bg = r("backgroundColor");
  const radius = r("cornerRadius");
  const opacity = r("opacity");
  const borderColor = r("borderColor");
  const borderWidth = r("borderWidth");
  const pt = r("paddingTop");
  const pr = r("paddingRight");
  const pb = r("paddingBottom");
  const pl = r("paddingLeft");
  const gap = r("gap");

  if (width !== undefined) css.width = Number(width);
  if (height !== undefined) css.height = Number(height);
  if (bg) css.backgroundColor = String(bg);
  if (radius !== undefined) css.borderRadius = Number(radius);
  if (opacity !== undefined && opacity !== 1) css.opacity = Number(opacity);
  if (borderColor && borderWidth) {
    css.borderColor = String(borderColor);
    css.borderWidth = Number(borderWidth);
    css.borderStyle = "solid";
  }
  if (pt !== undefined) css.paddingTop = Number(pt);
  if (pr !== undefined) css.paddingRight = Number(pr);
  if (pb !== undefined) css.paddingBottom = Number(pb);
  if (pl !== undefined) css.paddingLeft = Number(pl);
  if (gap !== undefined) css.gap = Number(gap);

  return css;
}

function TextComponent({ component, tokens, dataModel }: ComponentProps) {
  const text = resolveDataBinding(component.text, dataModel);
  const style = component.style || {};
  const r = (key: string) => resolveStyleValue(style, key, tokens);

  const css: React.CSSProperties = {
    ...resolveStyles(style, tokens),
    color: r("color") ? String(r("color")) : undefined,
    fontSize: r("fontSize") ? Number(r("fontSize")) : undefined,
    fontFamily: r("fontFamily") ? String(r("fontFamily")) : undefined,
    fontWeight: r("fontWeight") ? (String(r("fontWeight")) as React.CSSProperties["fontWeight"]) : undefined,
    textAlign: r("textAlign") ? (String(r("textAlign")) as React.CSSProperties["textAlign"]) : undefined,
  };

  return <span style={css}>{text}</span>;
}

function ButtonComponent({ component, tokens, dataModel }: ComponentProps) {
  const label = resolveDataBinding(component.label, dataModel);
  const containerStyle = resolveStyles(component.style, tokens);
  const lStyle = component.labelStyle || {};
  const lr = (key: string) => resolveStyleValue(lStyle, key, tokens);

  const labelCss: React.CSSProperties = {
    color: lr("color") ? String(lr("color")) : undefined,
    fontSize: lr("fontSize") ? Number(lr("fontSize")) : undefined,
    fontFamily: lr("fontFamily") ? String(lr("fontFamily")) : undefined,
    fontWeight: lr("fontWeight") ? (String(lr("fontWeight")) as React.CSSProperties["fontWeight"]) : undefined,
    textAlign: lr("textAlign") ? (String(lr("textAlign")) as React.CSSProperties["textAlign"]) : undefined,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 0,
  };

  return (
    <button
      style={{ ...containerStyle, cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => console.log("Action:", component.action?.event.name)}
    >
      <span style={labelCss}>{label}</span>
    </button>
  );
}

function ContainerComponent({ component, componentMap, tokens, dataModel }: ComponentProps) {
  const style = resolveStyles(component.style, tokens);
  const isRow = component.component === "Row";
  const childIds = component.children?.explicitList || [];

  const containerStyle: React.CSSProperties = {
    ...style,
    display: "flex",
    flexDirection: isRow ? "row" : "column",
    alignItems: isRow ? "center" : "stretch",
  };

  return (
    <div style={containerStyle}>
      {childIds.map((childId) => {
        const child = componentMap.get(childId);
        if (!child) return null;
        return (
          <RenderComponent
            key={childId}
            component={child}
            componentMap={componentMap}
            tokens={tokens}
            dataModel={dataModel}
          />
        );
      })}
    </div>
  );
}

function RenderComponent(props: ComponentProps) {
  const { component } = props;

  switch (component.component) {
    case "Text":
      return <TextComponent {...props} />;
    case "Button":
      return <ButtonComponent {...props} />;
    case "Card":
    case "Row":
    case "Column":
      return <ContainerComponent {...props} />;
    default:
      // Fallback: render as container if has children
      if (component.children?.explicitList?.length) {
        return <ContainerComponent {...props} />;
      }
      return null;
  }
}

export default function A2UIPreviewRenderer({ doc }: RendererProps) {
  const componentMap = new Map<string, A2UIComponent>();
  for (const comp of doc.components) {
    componentMap.set(comp.id, comp);
  }

  const root = componentMap.get("root");
  if (!root) {
    return <div style={{ color: "#999", padding: 16 }}>No root component found</div>;
  }

  return (
    <div style={{ display: "inline-block" }}>
      <RenderComponent
        component={root}
        componentMap={componentMap}
        tokens={doc.designTokens}
        dataModel={doc.dataModel}
      />
    </div>
  );
}
