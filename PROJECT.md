# Interface.ai

Figma design to native mobile code conversion pipeline.

## Architecture

```
Figma Design → [Figma Plugin] → A2UI JSON → [Code Generators] → Native Code
```

### Components

1. **figma-plugin** — Figma plugin that extracts selected components into A2UI format
2. **a2ui-parser** — Schema definition, parser, and validator for the A2UI intermediate format
3. **mobile-codegen** — Code generators that convert A2UI JSON to native mobile code
   - React Native (`.tsx`)
   - SwiftUI (`.swift`)
   - Kotlin Compose (`.kt`)

## Project Structure

```
interface/
├── figma-plugin/       # Figma plugin (TypeScript)
│   ├── src/code.ts     # Plugin main entry
│   ├── src/extractor.ts # Extracts Figma node properties
│   ├── src/converter.ts # Converts extracted data to A2UI
│   ├── ui/index.html   # Plugin UI panel
│   └── manifest.json   # Figma plugin manifest
├── a2ui-parser/        # A2UI format library
│   └── src/
│       ├── schema.ts   # TypeScript interfaces for A2UI
│       ├── validator.ts # Validation logic
│       └── index.ts    # Parser entry point
├── mobile-codegen/     # Native code generators
│   └── src/
│       ├── react-native/generator.ts
│       ├── swiftui/generator.ts
│       ├── kotlin-compose/generator.ts
│       └── index.ts
├── test-designs/       # Sample Figma exports for testing
├── examples/           # Example A2UI JSON and generated output
└── docs/               # Additional documentation
```

## Current Status

- [x] Project structure created
- [x] Figma plugin scaffold with extractor and converter
- [x] A2UI schema and validator defined
- [x] Code generators for React Native, SwiftUI, Kotlin Compose
- [ ] Install dependencies and verify TypeScript compilation
- [ ] Test with real Figma file (tile_hello component)
- [ ] End-to-end pipeline test

## Figma Design Reference

- File: [Moon Design System v1](https://www.figma.com/design/khgNy2HimWcay4KSSxa6jr/Moon-Design-System-v1--Community---Copy-?node-id=32616-12)
- Target component: `tile_hello`

## Tech Stack

- TypeScript 5.4+
- Figma Plugin API
- Node.js monorepo (npm workspaces)
