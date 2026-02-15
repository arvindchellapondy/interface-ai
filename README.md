<p align="center">
  <img src="interface_full_logo.svg" alt="Interface.ai" width="120" />
</p>

# Interface.ai

**Design-to-native pipeline**: Extract UI components from Figma, represent them in a universal format (A2UI), preview and personalize in a web dashboard, and render natively on iOS and Android — all in real time.

## Highlights

- **AI Chat** — Ask Claude to select and personalize tiles in natural language, auto-pushed to connected devices
- **AI Personalization** — Provide user context and Claude rewrites data-bound fields with personalized content
- **Real-Time Push** — Dashboard and AI edits broadcast instantly to iOS/Android via WebSocket
- **Figma-to-Native** — Extract designs from Figma, preview on web, render natively, or generate SwiftUI/Kotlin/React Native code
- **Universal A2UI Protocol** — One JSON format drives web preview, native rendering, and code generation across all platforms

---

## Architecture

```
                              Interface.ai Pipeline
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                                                                         │
 │   ┌──────────┐     ┌────────────┐     ┌──────────────┐                  │
 │   │  Figma   │────▶│   Figma    │────▶│  A2UI JSON   │                  │
 │   │  Design  │     │   Plugin   │     │  (.a2ui.json) │                  │
 │   └──────────┘     └────────────┘     └──────┬───────┘                  │
 │                                              │                          │
 │                    ┌─────────────────────────┼─────────────────────┐     │
 │                    │                         │                     │     │
 │                    ▼                         ▼                     ▼     │
 │           ┌────────────────┐     ┌───────────────────┐   ┌────────────┐ │
 │           │  Web Dashboard │     │  Code Generators  │   │    CLI     │ │
 │           │  (Next.js)     │     │  (mobile-codegen)  │   │            │ │
 │           └───────┬────────┘     └───────────────────┘   └────────────┘ │
 │                   │                  │       │       │                   │
 │                   │ WebSocket        ▼       ▼       ▼                   │
 │                   │              SwiftUI  Kotlin   React                 │
 │            ┌──────┴──────┐       (.swift) (.kt)   Native                │
 │            │             │                (.tsx)                         │
 │            ▼             ▼                                               │
 │     ┌────────────┐ ┌──────────────┐                                     │
 │     │    iOS     │ │   Android    │                                     │
 │     │  Renderer  │ │   Renderer   │                                     │
 │     │  (SwiftUI) │ │  (Compose)   │                                     │
 │     └────────────┘ └──────────────┘                                     │
 │                                                                         │
 └─────────────────────────────────────────────────────────────────────────┘
```

## How It Works

```
 1. DESIGN                 2. EXTRACT               3. REPRESENT
 ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
 │               │        │               │        │ createSurface │
 │    Figma      │───────▶│  Figma Plugin │───────▶│ updateComps   │
 │    Canvas     │        │  extracts     │        │ updateData    │
 │               │        │  nodes        │        │               │
 └───────────────┘        └───────────────┘        └───────┬───────┘
                                                           │
         ┌─────────────────────────────────────────────────┘
         │
         ▼
 4. PREVIEW & PERSONALIZE         5. RENDER NATIVELY
 ┌──────────────────────┐        ┌───────────────────────────────┐
 │                      │        │                               │
 │  Web Dashboard       │──WS──▶│  iOS (SwiftUI)                │
 │  - Live preview      │       │  - MessageProcessor           │
 │  - Edit data model   │       │  - DataBindingResolver        │
 │  - AI personalization│       │  - ComponentNodeView          │
 │  - Push to devices   │       │                               │
 │                      │       │  Android (Jetpack Compose)    │
 │                      │       │  - MessageProcessor           │
 │                      │       │  - DataBindingResolver        │
 │                      │       │  - ComponentNodeView          │
 └──────────────────────┘       └───────────────────────────────┘
```

## Quick Start

### Prerequisites

| Requirement | Purpose | Install |
|------------|---------|---------|
| Node.js 18+ | Dashboard, CLI, codegen | [nodejs.org](https://nodejs.org) |
| Xcode 15+ | iOS renderer (optional) | Mac App Store |
| XcodeGen | iOS project generation (optional) | `brew install xcodegen` |
| Android Studio | Android renderer (optional) | [developer.android.com](https://developer.android.com/studio) |

### One-Command Setup

```bash
git clone https://github.com/arvindchellapondy/interface-ai.git
cd interface-ai
./setup.sh
```

This installs all dependencies (root workspaces, dashboard, CLI), creates the `.env` file, and generates the iOS Xcode project if XcodeGen is available.

### Or Step by Step

```bash
# 1. Install all dependencies
npm run setup

# 2. Configure AI (optional — needed for AI chat features)
cp dashboard/.env.example dashboard/.env
# Edit dashboard/.env and add your ANTHROPIC_API_KEY

# 3. Start the dashboard
npm run dev
# Dashboard:  http://localhost:3001
# WebSocket:  ws://localhost:3001/ws

# 4. Run iOS app (optional — requires Xcode + XcodeGen)
npm run ios:setup
open ios-renderer/Examples/A2UIDemoApp/InterfaceAI.xcodeproj
# Build and run on simulator (Cmd+R)
```

### 5. Push a design to mobile

Open the dashboard, select a design, and click **Push to Devices** — or use the AI chat to select and personalize tiles automatically.

### Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install all dependencies (root + dashboard + CLI) |
| `npm run dev` | Start dashboard with WebSocket server on port 3001 |
| `npm run build` | Build all workspace packages |
| `npm run build:dashboard` | Build the Next.js dashboard for production |
| `npm run ios:setup` | Generate iOS Xcode project from project.yml |

---

## Project Structure

```
interface/
├── README.md                  # This file
├── A2UI-SPEC.md               # A2UI format specification
├── package.json               # Monorepo root (npm workspaces)
│
├── figma-plugin/              # Figma plugin — extracts designs to A2UI
│   ├── src/code.ts            #   Plugin entry point
│   ├── src/extractor.ts       #   Figma node property extraction
│   ├── src/converter.ts       #   Convert extracted data → A2UI JSON
│   └── ui/index.html          #   Plugin UI panel
│
├── a2ui-parser/               # A2UI schema library
│   └── src/
│       ├── schema.ts          #   TypeScript interfaces
│       ├── validator.ts       #   Validation logic
│       └── index.ts           #   Parser entry point
│
├── dashboard/                 # Next.js web dashboard
│   ├── server.ts              #   Custom HTTP + WebSocket server
│   ├── src/app/               #   Pages (home, chat, design detail)
│   ├── src/components/        #   React components
│   └── src/lib/               #   A2UI types, WS server, AI client
│
├── ios-renderer/              # Swift Package — native iOS renderer
│   ├── Package.swift          #   SPM manifest
│   ├── Sources/A2UIRenderer/  #   Library source
│   │   ├── Models/            #     A2UI schema, Surface
│   │   ├── Processing/        #     Message processor, resolvers
│   │   ├── Rendering/         #     SwiftUI views & style modifiers
│   │   └── Transport/         #     WebSocket client
│   └── Examples/              #   Demo app (InterfaceAI)
│
├── android-renderer/          # Kotlin library — native Android renderer
│   ├── lib/                   #   Library module (Jetpack Compose)
│   │   └── src/main/kotlin/   #     Models, processing, rendering
│   └── demo/                  #   Demo app
│
├── mobile-codegen/            # Static code generators
│   └── src/
│       ├── swiftui/           #   SwiftUI generator
│       ├── kotlin-compose/    #   Kotlin Compose generator
│       └── react-native/      #   React Native generator
│
├── cli/                       # Command-line interface
│   └── src/cli.ts             #   Parse A2UI → generate native code
│
└── examples/                  # Sample A2UI design files
    ├── tile_hello.a2ui.json
    ├── tile_weather.a2ui.json
    └── ...
```

## Key Concepts

### A2UI Protocol (v0.9)

A2UI is a message-based protocol for describing UI declaratively. A design is represented as a sequence of three messages:

| Message | Purpose |
|---------|---------|
| `createSurface` | Initialize a surface with an ID and design tokens |
| `updateComponents` | Define the component tree (Card, Text, Button, etc.) |
| `updateDataModel` | Bind dynamic data to components via `${/path/to/value}` |

### Design Tokens

Styles reference design tokens using `{TokenName}` syntax:
```json
{ "backgroundColor": "{Accents.Indigo}" }
```
Tokens are resolved at render time from the `createSurface.designTokens` map.

### Data Bindings

Text and labels use `${/path}` bindings:
```json
{ "text": "${/greeting/text}" }
```
Values are resolved from the data model, enabling runtime personalization.

### Real-Time Push

The dashboard connects to mobile devices via WebSocket (`ws://localhost:3001/ws`). When you edit a data model or the AI selects a tile, the full design is pushed to all connected devices instantly.

```
 Dashboard                    WebSocket Server              iOS / Android
 ┌──────────┐                ┌──────────────┐              ┌────────────┐
 │ Edit data │───POST /api──▶│  push-design │──WS push───▶│ Renderer   │
 │ model     │               │  endpoint    │              │ updates    │
 └──────────┘                └──────────────┘              └────────────┘
```

## AI-Powered Personalization

The dashboard includes an AI chat interface powered by Claude. You can ask it to:

- **Select tiles**: *"Show me a weather tile for NYC"*
- **Personalize content**: *"Change the greeting to say Good Morning"*
- **Auto-push**: Selected tiles are automatically pushed to connected devices

The AI sees the full tile catalog and intelligently maps your request to the right design with appropriate data model values.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Design Tool | Figma + custom plugin |
| Interchange Format | A2UI JSON (v0.9) |
| Web Dashboard | Next.js 14, React 18, Tailwind CSS |
| AI | Anthropic Claude API |
| Real-time | WebSocket (ws) |
| iOS Renderer | SwiftUI (iOS 17+), Swift Package Manager |
| Android Renderer | Jetpack Compose, Kotlin, Gradle |
| Code Generation | TypeScript (SwiftUI, Kotlin, React Native) |
| CLI | Node.js, TypeScript |
| Monorepo | npm workspaces |

## Sub-Project Documentation

Each sub-project has its own README with detailed setup and API documentation:

- [`figma-plugin/README.md`](figma-plugin/README.md) — Figma plugin installation and usage
- [`a2ui-parser/README.md`](a2ui-parser/README.md) — A2UI schema and validation library
- [`dashboard/README.md`](dashboard/README.md) — Web dashboard, API routes, WebSocket
- [`ios-renderer/README.md`](ios-renderer/README.md) — iOS SwiftUI renderer
- [`android-renderer/README.md`](android-renderer/README.md) — Android Compose renderer
- [`mobile-codegen/README.md`](mobile-codegen/README.md) — Static code generators
- [`cli/README.md`](cli/README.md) — Command-line interface
- [`examples/README.md`](examples/README.md) — Sample A2UI designs

## License

Private — Interface.ai
