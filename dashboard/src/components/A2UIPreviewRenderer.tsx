"use client";

import React from "react";
import {
  A2UIComponent,
  A2UIDocument,
  DesignToken,
  resolveDataBinding,
  resolveStyleValue,
} from "@/lib/a2ui-types";

const PREVIEW_SCALE = 1.25;

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

  const layoutSizingH = r("layoutSizingHorizontal");
  const layoutSizingV = r("layoutSizingVertical");

  const s = PREVIEW_SCALE;

  if (layoutSizingH === "fill") {
    css.width = "100%";
    css.flexGrow = 1;
  } else if (layoutSizingH === "hug") {
    css.width = "auto";
  } else if (width !== undefined) {
    css.width = Number(width) * s;
  }

  if (layoutSizingV === "fill") {
    css.height = "100%";
    css.flexGrow = 1;
  } else if (layoutSizingV === "hug") {
    css.height = "auto";
  } else if (height !== undefined) {
    css.height = Number(height) * s;
  }
  if (bg) css.backgroundColor = String(bg);
  if (radius !== undefined) css.borderRadius = Number(radius) * s;
  if (opacity !== undefined && opacity !== 1) css.opacity = Number(opacity);
  if (borderColor && borderWidth) {
    css.borderColor = String(borderColor);
    css.borderWidth = Number(borderWidth) * s;
    css.borderStyle = "solid";
  }
  if (pt !== undefined) css.paddingTop = Number(pt) * s;
  if (pr !== undefined) css.paddingRight = Number(pr) * s;
  if (pb !== undefined) css.paddingBottom = Number(pb) * s;
  if (pl !== undefined) css.paddingLeft = Number(pl) * s;
  if (gap !== undefined) css.gap = Number(gap) * s;

  // Shadow support
  const shadows = style.shadows as Array<{ x: number; y: number; blur: number; color: string }> | undefined;
  if (shadows && shadows.length > 0) {
    css.boxShadow = shadows
      .map((sh) => `${sh.x * s}px ${sh.y * s}px ${sh.blur * s}px ${sh.color}`)
      .join(", ");
  }

  return css;
}

function TextComponent({ component, tokens, dataModel }: ComponentProps) {
  const text = resolveDataBinding(component.text, dataModel);
  const style = component.style || {};
  const r = (key: string) => resolveStyleValue(style, key, tokens);
  const s = PREVIEW_SCALE;

  const css: React.CSSProperties = {
    ...resolveStyles(style, tokens),
    color: r("color") ? String(r("color")) : undefined,
    fontSize: r("fontSize") ? Number(r("fontSize")) * s : undefined,
    fontFamily: r("fontFamily") ? `"${String(r("fontFamily"))}", sans-serif` : undefined,
    fontWeight: r("fontWeight") ? (String(r("fontWeight")) as React.CSSProperties["fontWeight"]) : undefined,
    textAlign: r("textAlign") ? (String(r("textAlign")) as React.CSSProperties["textAlign"]) : undefined,
    lineHeight: r("lineHeight") ? `${Number(r("lineHeight")) * s}px` : undefined,
    letterSpacing: r("letterSpacing") ? Number(r("letterSpacing")) * s : undefined,
  };

  return <span style={css}>{text}</span>;
}

function ButtonComponent({ component, tokens, dataModel }: ComponentProps) {
  const label = resolveDataBinding(component.label, dataModel);
  const containerStyle = resolveStyles(component.style, tokens);
  const lStyle = component.labelStyle || {};
  const lr = (key: string) => resolveStyleValue(lStyle, key, tokens);
  const s = PREVIEW_SCALE;

  const labelCss: React.CSSProperties = {
    color: lr("color") ? String(lr("color")) : undefined,
    fontSize: lr("fontSize") ? Number(lr("fontSize")) * s : undefined,
    fontFamily: lr("fontFamily") ? `"${String(lr("fontFamily"))}", sans-serif` : undefined,
    fontWeight: lr("fontWeight") ? (String(lr("fontWeight")) as React.CSSProperties["fontWeight"]) : undefined,
    textAlign: lr("textAlign") ? (String(lr("textAlign")) as React.CSSProperties["textAlign"]) : undefined,
    lineHeight: lr("lineHeight") ? `${Number(lr("lineHeight")) * s}px` : undefined,
    letterSpacing: lr("letterSpacing") ? Number(lr("letterSpacing")) * s : undefined,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 0,
  };

  return (
    <button
      style={{ ...containerStyle, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => console.log("Action:", component.action?.event.name)}
    >
      <span style={labelCss}>{label}</span>
    </button>
  );
}

function mapMainAxisAlign(value: string | undefined): React.CSSProperties["justifyContent"] {
  switch (value) {
    case "center": return "center";
    case "max": return "flex-end";
    case "space_between": return "space-between";
    default: return "flex-start";
  }
}

function mapCrossAxisAlign(value: string | undefined): React.CSSProperties["alignItems"] {
  switch (value) {
    case "center": return "center";
    case "max": return "flex-end";
    case "baseline": return "baseline";
    case "min": return "flex-start";
    default: return "stretch";
  }
}

function ContainerComponent({ component, componentMap, tokens, dataModel }: ComponentProps) {
  const cStyle = component.style || {};
  const r = (key: string) => resolveStyleValue(cStyle, key, tokens);
  const style = resolveStyles(component.style, tokens);
  const isRow = component.component === "Row";
  const childIds = component.children?.explicitList || [];

  const mainAlign = r("mainAxisAlignment") ? String(r("mainAxisAlignment")) : undefined;
  const crossAlign = r("crossAxisAlignment") ? String(r("crossAxisAlignment")) : undefined;

  const containerStyle: React.CSSProperties = {
    ...style,
    display: "flex",
    flexDirection: isRow ? "row" : "column",
    justifyContent: mapMainAxisAlign(mainAlign),
    alignItems: mapCrossAxisAlign(crossAlign),
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

function isSwitchIcon(component: A2UIComponent): boolean {
  if (component.component !== "Icon") return false;
  const iconName = String(component.iconName || "").toLowerCase();
  return iconName.includes("switch") || iconName.includes("toggle");
}

function SwitchComponent({ component, tokens }: ComponentProps) {
  const style = resolveStyles(component.style, tokens);
  const s = PREVIEW_SCALE;
  const w = style.width ? Number(style.width) : 40 * s;
  const h = style.height ? Number(style.height) : 24 * s;

  return (
    <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", width: w, height: h }}>
      <input
        type="checkbox"
        style={{ display: "none" }}
        onChange={(e) => console.log("Switch toggled:", component.id, e.target.checked)}
      />
      <span
        style={{
          width: w,
          height: h,
          backgroundColor: "#e2e2e2",
          borderRadius: h / 2,
          position: "relative",
          transition: "background-color 0.2s",
          display: "inline-block",
        }}
        className="peer-checked:bg-blue-500"
        onClick={(e) => {
          const span = e.currentTarget;
          const knob = span.firstChild as HTMLElement;
          const isOn = knob.style.left !== "2px";
          knob.style.left = isOn ? "2px" : `${w - h + 2}px`;
          span.style.backgroundColor = isOn ? "#e2e2e2" : "#4CAF50";
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: h - 4,
            height: h - 4,
            backgroundColor: "white",
            borderRadius: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.2s",
          }}
        />
      </span>
    </label>
  );
}

function IconComponent({ component, tokens, componentMap, dataModel }: ComponentProps) {
  if (isSwitchIcon(component)) {
    return <SwitchComponent component={component} tokens={tokens} componentMap={componentMap} dataModel={dataModel} />;
  }

  const style = resolveStyles(component.style, tokens);
  const svgData = component.svgData as string | undefined;

  if (svgData) {
    return (
      <div
        style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}
        dangerouslySetInnerHTML={{ __html: svgData }}
      />
    );
  }

  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: style.backgroundColor || "#f0f0f0",
        borderRadius: style.borderRadius || 4,
      }}
    >
      <span className="text-[10px] text-slate-400">{String(component.iconName || "icon")}</span>
    </div>
  );
}

function TextFieldComponent({ component, componentMap, tokens, dataModel }: ComponentProps) {
  const childIds = component.children?.explicitList || [];
  const s = PREVIEW_SCALE;

  // Check if all children are Text components — this is the actual input field
  const isInputField = childIds.length === 0 || childIds.every((id) => {
    const child = componentMap.get(id);
    return child?.component === "Text";
  });

  if (isInputField) {
    // Extract placeholder from child Text component
    let placeholder = "";
    let placeholderStyle: React.CSSProperties = {};
    for (const childId of childIds) {
      const child = componentMap.get(childId);
      if (child?.component === "Text") {
        placeholder = resolveDataBinding(child.text, dataModel);
        const cStyle = child.style || {};
        const cr = (key: string) => resolveStyleValue(cStyle, key, tokens);
        placeholderStyle = {
          color: cr("color") ? String(cr("color")) : undefined,
          fontSize: cr("fontSize") ? Number(cr("fontSize")) * s : undefined,
          fontFamily: cr("fontFamily") ? `"${String(cr("fontFamily"))}", sans-serif` : undefined,
          fontWeight: cr("fontWeight") ? (String(cr("fontWeight")) as React.CSSProperties["fontWeight"]) : undefined,
        };
        break;
      }
    }

    const containerStyle = resolveStyles(component.style, tokens);

    return (
      <input
        type="text"
        placeholder={placeholder}
        style={{
          ...containerStyle,
          ...placeholderStyle,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    );
  }

  // Wrapper — render as column container
  const cStyle = component.style || {};
  const r = (key: string) => resolveStyleValue(cStyle, key, tokens);
  const style = resolveStyles(component.style, tokens);
  const mainAlign = r("mainAxisAlignment") ? String(r("mainAxisAlignment")) : undefined;
  const crossAlign = r("crossAxisAlignment") ? String(r("crossAxisAlignment")) : undefined;

  return (
    <div style={{
      ...style,
      display: "flex",
      flexDirection: "column",
      justifyContent: mapMainAxisAlign(mainAlign),
      alignItems: mapCrossAxisAlign(crossAlign),
    }}>
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
    case "Icon":
      return <IconComponent {...props} />;
    case "Switch":
      return <SwitchComponent {...props} />;
    case "TextField":
      return <TextFieldComponent {...props} />;
    case "Card":
    case "Row":
    case "Column":
      return <ContainerComponent {...props} />;
    default:
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
    return <div className="text-slate-400 p-4">No root component found</div>;
  }

  return (
    <div className="inline-block">
      <RenderComponent
        component={root}
        componentMap={componentMap}
        tokens={doc.designTokens}
        dataModel={doc.dataModel}
      />
    </div>
  );
}
