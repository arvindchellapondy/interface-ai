# Mobile Codegen

Code generators that convert A2UI documents into static native mobile code for SwiftUI, Kotlin Compose, and React Native.

---

## Overview

```
                        A2UI Document
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────────┐
     │  SwiftUI   │  │  Kotlin    │  │  React Native  │
     │  Generator │  │  Compose   │  │  Generator     │
     │            │  │  Generator │  │                │
     └─────┬──────┘  └─────┬──────┘  └───────┬────────┘
           │               │                 │
           ▼               ▼                 ▼
     TileHello.swift  TileHello.kt    TileHello.tsx
```

## How It Works

Each generator takes an `A2UIDocument` and produces a complete, self-contained source file:

1. **Resolve tokens** — Replace `{TokenName}` references with concrete values
2. **Resolve bindings** — Replace `${/path}` with default data model values
3. **Map components** — Convert A2UI types to platform-native equivalents
4. **Generate code** — Emit properly formatted source code with imports

## Generator Mapping

### Component Type → Native Widget

| A2UI Component | SwiftUI | Kotlin Compose | React Native |
|---------------|---------|---------------|-------------|
| `Card` | `VStack` + modifiers | `Card` + `Column` | `View` + styles |
| `Text` | `Text()` | `Text()` | `<Text>` |
| `Button` | `Button()` | `Button()` | `<TouchableOpacity>` |
| `Image` | `AsyncImage()` | `AsyncImage()` | `<Image>` |
| `Row` | `HStack` | `Row` | `View` + `flexDirection: row` |
| `Column` | `VStack` | `Column` | `View` + `flexDirection: column` |

### Style Property → Native Property

| A2UI Style | SwiftUI | Kotlin Compose | React Native |
|-----------|---------|---------------|-------------|
| `backgroundColor` | `.background(Color(...))` | `Modifier.background(Color(...))` | `backgroundColor` |
| `cornerRadius` | `.cornerRadius(n)` | `RoundedCornerShape(n.dp)` | `borderRadius` |
| `paddingTop` | `.padding(.top, n)` | `Modifier.padding(top = n.dp)` | `paddingTop` |
| `fontSize` | `.font(.system(size: n))` | `fontSize = n.sp` | `fontSize` |
| `fontWeight` | `.fontWeight(.bold)` | `fontWeight = FontWeight.Bold` | `fontWeight` |
| `borderWidth` | `.overlay(RoundedRect...)` | `Modifier.border(n.dp, ...)` | `borderWidth` |

## Usage

```typescript
import { generateSwiftUI } from "@interface-ai/mobile-codegen/swiftui/generator";
import { generateKotlin } from "@interface-ai/mobile-codegen/kotlin-compose/generator";
import { generateReactNative } from "@interface-ai/mobile-codegen/react-native/generator";

// From a parsed A2UIDocument:
const swiftCode = generateSwiftUI(document);
const kotlinCode = generateKotlin(document);
const rnCode = generateReactNative(document);
```

## Static vs. Runtime

This package generates **static code** — tokens are resolved and data values are baked in at generation time. For **dynamic rendering** with real-time updates and data binding, use the iOS or Android renderer packages instead.

```
 Static Code Generation (this package)
 ──────────────────────────────────────
 A2UI JSON  ──▶  Generator  ──▶  .swift / .kt / .tsx
                                  (design baked in)

 Runtime Rendering (ios-renderer / android-renderer)
 ──────────────────────────────────────────────────
 A2UI JSON  ──▶  WebSocket  ──▶  MessageProcessor  ──▶  Live UI
                                  (dynamic updates)
```

---

## File Structure

```
mobile-codegen/
├── package.json             # @interface-ai/mobile-codegen
├── tsconfig.json
├── src/
│   ├── index.ts             # Entry point, re-exports
│   ├── types.ts             # Shared type definitions
│   ├── swiftui/
│   │   └── generator.ts     # SwiftUI code generator
│   ├── kotlin-compose/
│   │   └── generator.ts     # Kotlin Compose code generator
│   └── react-native/
│       └── generator.ts     # React Native code generator
└── dist/                    # Compiled JavaScript
```
