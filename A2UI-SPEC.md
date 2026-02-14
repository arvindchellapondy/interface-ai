# A2UI Format Specification v0.1.0

## Overview

A2UI (Abstract-to-UI) is a JSON-based intermediate format that represents UI components extracted from design tools (Figma) in a platform-agnostic way. Code generators consume A2UI documents to produce native mobile code.

## Document Structure

```typescript
interface A2UIDocument {
  version: "0.1.0";
  source: string;         // Origin (e.g., "figma://file-id/node-id")
  exportedAt: string;     // ISO 8601 timestamp
  root: A2UIComponent;    // Root component tree
}
```

## Component Schema

```typescript
interface A2UIComponent {
  version: "0.1.0";
  name: string;                // Component name from design
  type: A2UIComponentType;     // Semantic type
  layout: A2UILayout;          // Layout properties
  style: A2UIStyle;            // Visual styling
  text?: A2UIText;             // Text content (for text/button types)
  interactions?: A2UIInteraction[];  // User interactions
  children: A2UIComponent[];   // Child components
}
```

## Component Types

| Type | Description |
|------|-------------|
| `container` | Generic container / frame |
| `card` | Card-style container |
| `text` | Text element |
| `button` | Tappable button |
| `image` | Image element |
| `input` | Text input field |
| `box` | Rectangle shape |
| `circle` | Ellipse shape |
| `icon` | Vector/icon element |
| `list` | Scrollable list |
| `scroll` | Scroll container |

## Layout

```typescript
interface A2UILayout {
  mode: "row" | "column" | "stack";
  spacing?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  mainAxisAlignment?: "start" | "center" | "end" | "spaceBetween" | "spaceAround";
  crossAxisAlignment?: "start" | "center" | "end" | "stretch";
}
```

## Style

```typescript
interface A2UIStyle {
  width?: number;
  height?: number;
  backgroundColor?: string;    // Hex color (e.g., "#6366f1")
  cornerRadius?: number;
  opacity?: number;            // 0.0 to 1.0
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
```

## Text

```typescript
interface A2UIText {
  content: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
}
```

## Interactions

```typescript
interface A2UIInteraction {
  type: "tap" | "longPress" | "swipe";
  action: string;
  payload?: Record<string, unknown>;
}
```

## Example: tile_hello

See `examples/tile_hello.a2ui.json` for a complete example.

## Design Decisions

1. **Flat color values** — Colors are stored as hex strings, not design token references. Token mapping is a future enhancement.
2. **Pixel units** — All dimensions are in logical pixels (dp/pt). Generators handle platform-specific unit conversion.
3. **No responsive rules** — v0.1.0 stores fixed dimensions. Responsive/constraint-based layout is planned for v0.2.0.
4. **Version field on every component** — Enables incremental migration when the schema evolves.
