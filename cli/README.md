# CLI

Command-line tool for converting A2UI JSON files to native mobile code (SwiftUI, Kotlin Compose, React Native).

---

## Overview

```
 ┌─────────────────────────────────────────────────┐
 │  interface-ai CLI                                │
 │                                                  │
 │  Input:  tile_hello.a2ui.json                    │
 │                                                  │
 │  ┌───────────────┐                               │
 │  │  Parse A2UI   │  Read JSON, build document    │
 │  └───────┬───────┘                               │
 │          │                                       │
 │          ▼                                       │
 │  ┌───────────────┐                               │
 │  │  Generate     │  Target-specific code gen     │
 │  └───────┬───────┘                               │
 │          │                                       │
 │     ┌────┼────────────────┐                      │
 │     ▼    ▼                ▼                      │
 │  SwiftUI  Kotlin     React Native                │
 │  (.swift) (.kt)      (.tsx)                      │
 └─────────────────────────────────────────────────┘
```

## Installation

```bash
cd cli
npm install
npm run build
```

## Usage

```bash
# Generate SwiftUI code
npx interface-ai examples/tile_hello.a2ui.json --target swiftui

# Generate Kotlin Compose code
npx interface-ai examples/tile_hello.a2ui.json --target kotlin

# Generate React Native code
npx interface-ai examples/tile_hello.a2ui.json --target react-native

# Output to file
npx interface-ai examples/tile_hello.a2ui.json --target swiftui -o output/TileHello.swift
```

## How It Works

1. **Parse**: Reads the `.a2ui.json` file and processes the three A2UI messages (`createSurface`, `updateComponents`, `updateDataModel`)
2. **Build document**: Constructs an in-memory `A2UIDocument` with components, tokens, and data model
3. **Generate**: Passes the document to the selected code generator
4. **Output**: Prints generated native code to stdout or writes to a file

## Generated Code

The CLI produces **static** native code with design tokens and default data values baked in. This is different from the runtime renderers (iOS/Android), which dynamically render A2UI messages.

### SwiftUI Output Example

```swift
struct TileHello: View {
    var body: some View {
        VStack(spacing: 10) {
            Text("Hello world, our 1st tile!")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Color(hex: "#000000"))

            Button("Button text") { }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(hex: "#6d7cff"))
                .cornerRadius(4)
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(hex: "#c8c8c8"), lineWidth: 1)
        )
    }
}
```

---

## File Structure

```
cli/
├── package.json           # @interface-ai/cli package
├── tsconfig.json
├── src/
│   └── cli.ts             # Main CLI entry point
│                           #   - Argument parsing
│                           #   - A2UI message parsing
│                           #   - Code generation dispatch
└── dist/
    └── cli.js             # Compiled JavaScript (npm run build)
```
