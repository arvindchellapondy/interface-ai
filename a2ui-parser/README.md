# A2UI Parser

TypeScript library defining the A2UI schema, parser, and validator. Used by the Figma plugin, dashboard, CLI, and code generators.

---

## Overview

A2UI (Abstract-to-UI) is a JSON-based protocol for describing UI components in a platform-agnostic way. This package provides:

- **TypeScript interfaces** for all A2UI types
- **Parser** to read and construct A2UI documents
- **Validator** to verify message structure and completeness

## Installation

This package is part of the Interface.ai monorepo (npm workspace):

```bash
npm install  # from root
```

Or use directly:

```typescript
import { A2UIComponent, A2UIDocument, DesignToken } from "@interface-ai/a2ui-parser";
```

## A2UI Message Protocol (v0.9)

An A2UI design is described as a sequence of three JSON messages:

```
 Message Flow
 ─────────────────────────────────────────────────────

 1. createSurface         Initialize a rendering surface
    ┌─────────────────────────────────────────────┐
    │  surfaceId:     "tile_hello"                │
    │  catalogId:     "standard_catalog_v0.9"     │
    │  designTokens:  { "Accents.Indigo": ... }   │
    └─────────────────────────────────────────────┘

 2. updateComponents      Define the component tree
    ┌─────────────────────────────────────────────┐
    │  surfaceId:     "tile_hello"                │
    │  components: [                              │
    │    { id: "title", component: "Text", ... }, │
    │    { id: "btn", component: "Button", ... }, │
    │    { id: "root", component: "Card",         │
    │      children: { explicitList: [...] } }    │
    │  ]                                          │
    └─────────────────────────────────────────────┘

 3. updateDataModel       Bind dynamic data
    ┌─────────────────────────────────────────────┐
    │  surfaceId:  "tile_hello"                   │
    │  path:       "/"                            │
    │  value: {                                   │
    │    "title": { "text": "Hello!" },           │
    │    "btn":   { "label": "Click me" }         │
    │  }                                          │
    └─────────────────────────────────────────────┘
```

## Schema Types

### Core Types

```typescript
interface DesignToken {
  value: string;       // Resolved value (e.g., "#6d7cff", "4")
  collection: string;  // Token collection name
}

interface A2UIComponent {
  id: string;                            // Unique component ID
  component: string;                     // Type: "Card", "Text", "Button", etc.
  children?: { explicitList?: string[] }; // Child component IDs
  text?: string;                         // Text content (may contain bindings)
  label?: string;                        // Button label (may contain bindings)
  action?: {                             // User interaction
    event: {
      name: string;
      context?: Record<string, unknown>;
    };
  };
  style?: Record<string, unknown>;       // Visual properties
  labelStyle?: Record<string, unknown>;  // Button label styling
}
```

### Document Type

```typescript
interface A2UIDocument {
  surface: CreateSurface;
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
  designTokens: Record<string, DesignToken>;
}
```

## Binding Syntax

### Design Token References

Styles can reference design tokens using curly braces:

```
{TokenName}  →  resolved from designTokens map

Example:
  style.backgroundColor = "{Accents.Indigo}"
  designTokens["Accents.Indigo"] = { value: "#6d7cff", collection: "Colors" }
  resolved → "#6d7cff"
```

### Data Model Bindings

Text and labels can bind to the data model using `${/path}` syntax:

```
${/path/to/value}  →  resolved from dataModel

Example:
  text = "${/greeting/text}"
  dataModel = { greeting: { text: "Hello, World!" } }
  resolved → "Hello, World!"
```

## Supported Component Types

| Type | Description | Key Properties |
|------|-------------|---------------|
| `Card` | Container with visual styling | children, background, cornerRadius, shadow |
| `Text` | Text display | text (bindable), fontSize, fontWeight, color |
| `Button` | Interactive button | label (bindable), action, labelStyle |
| `Image` | Image display | src, width, height |
| `Icon` | Vector icon | path (SVG), fill, size |
| `Row` | Horizontal layout | children, spacing, alignment |
| `Column` | Vertical layout | children, spacing, alignment |

---

## File Structure

```
a2ui-parser/
├── package.json           # @interface-ai/a2ui-parser
├── tsconfig.json
├── src/
│   ├── index.ts           # Entry point, re-exports
│   ├── schema.ts          # TypeScript interfaces for A2UI
│   └── validator.ts       # Message structure validation
└── dist/                  # Compiled JavaScript + type declarations
```
