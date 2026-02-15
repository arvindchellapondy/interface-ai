# Figma Plugin

Figma plugin that extracts selected design components and converts them into the A2UI intermediate format.

---

## Overview

```
 ┌────────────────────────────────────────────────────┐
 │                   Figma Canvas                     │
 │                                                    │
 │   ┌──────────────────────────────────────────┐     │
 │   │  Selected Component (e.g. widget_hello)    │     │
 │   │  ┌─────────────────┐                     │     │
 │   │  │  Title (TEXT)    │                     │     │
 │   │  │  Subtitle (TEXT) │                     │     │
 │   │  │  Button (FRAME)  │                     │     │
 │   │  └─────────────────┘                     │     │
 │   └──────────────────────────────────────────┘     │
 └──────────────────────┬─────────────────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────────┐
 │  Figma Plugin (Interface.ai - Design to Code)│
 │                                              │
 │  1. extractor.ts                             │
 │     Walks the Figma node tree               │
 │     Extracts properties (size, color, font)  │
 │     Reads auto-layout settings               │
 │     Captures design token references          │
 │                                              │
 │  2. converter.ts                             │
 │     Maps Figma types → A2UI component types  │
 │     Builds component hierarchy               │
 │     Creates data bindings for text content    │
 │     Assembles design tokens                   │
 │                                              │
 │  3. code.ts (entry point)                    │
 │     Orchestrates extraction + conversion      │
 │     Sends result to plugin UI panel          │
 └──────────────────────┬───────────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────────┐
 │  Output: A2UI JSON                           │
 │                                              │
 │  [                                           │
 │    { "createSurface": { ... } },             │
 │    { "updateComponents": { ... } },          │
 │    { "updateDataModel": { ... } }            │
 │  ]                                           │
 └──────────────────────────────────────────────┘
```

## Setup

### Install Dependencies

```bash
cd figma-plugin
npm install
```

### Build

```bash
npm run build
# Output: dist/code.js
```

### Watch Mode

```bash
npm run watch
```

### Load in Figma

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest...**
3. Select `figma-plugin/manifest.json`
4. The plugin appears under **Plugins → Development → Interface.ai - Design to Code**

---

## Usage

1. Select a component or frame on the Figma canvas
2. Run the plugin from **Plugins → Interface.ai - Design to Code**
3. The plugin UI panel shows the extracted A2UI JSON
4. Copy the JSON and save as a `.a2ui.json` file in the `examples/` directory

## Extraction Pipeline

```
 Figma SceneNode
       │
       ▼
 ┌─────────────────────┐
 │  extractor.ts       │
 │                     │
 │  extractNode()      │  Walks the Figma node tree recursively
 │    ├── type         │  FRAME, TEXT, INSTANCE, RECTANGLE, etc.
 │    ├── size         │  width, height
 │    ├── fills        │  background colors
 │    ├── strokes      │  border colors and widths
 │    ├── effects      │  drop shadows, blur
 │    ├── text props   │  font, size, weight, line height
 │    ├── auto-layout  │  direction, spacing, padding, alignment
 │    └── children     │  recursive extraction
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐
 │  converter.ts       │
 │                     │
 │  convertToA2UI()    │
 │    ├── Map type     │  FRAME → Card/Row/Column, TEXT → Text, etc.
 │    ├── Build style  │  width, height, colors, radii, padding
 │    ├── Create binds │  Text content → ${/componentId/text}
 │    ├── Collect tokens│  Color variables → {TokenName}
 │    └── Build tree   │  Parent-child relationships via explicitList
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐
 │  A2UI Messages      │
 │                     │
 │  createSurface      │  surfaceId from component name
 │  updateComponents   │  flat component array with children refs
 │  updateDataModel    │  default text values
 └─────────────────────┘
```

## Figma Node → A2UI Component Mapping

| Figma Node Type | A2UI Component | Notes |
|----------------|----------------|-------|
| `FRAME` (with auto-layout) | `Card`, `Row`, or `Column` | Based on layout direction |
| `FRAME` (no auto-layout) | `Card` | Default container |
| `TEXT` | `Text` | Content becomes data binding |
| `INSTANCE` | `Button` or inferred | Component instances |
| `RECTANGLE` | Part of parent style | Corner radius, fills |
| `VECTOR` / `BOOLEAN_OPERATION` | `Icon` | SVG path extraction |

---

## File Structure

```
figma-plugin/
├── manifest.json          # Figma plugin manifest
├── package.json
├── tsconfig.json
├── src/
│   ├── code.ts            # Plugin entry point
│   ├── extractor.ts       # Figma node property extraction
│   └── converter.ts       # Extracted data → A2UI conversion
├── ui/
│   └── index.html         # Plugin UI panel (shows JSON output)
└── dist/
    └── code.js            # Built plugin (esbuild output)
```
