# iOS Renderer

Swift Package that renders A2UI designs natively using SwiftUI. Connects to the dashboard via WebSocket to receive designs in real time.

---

## Overview

```
 ┌────────────────────────────────────────────────────────┐
 │                  A2UIRenderer (Swift Package)          │
 │                                                        │
 │  ┌──────────────┐    ┌─────────────────────────────┐   │
 │  │  Transport   │    │       Processing             │   │
 │  │              │    │                               │   │
 │  │  WebSocket   │───▶│  MessageProcessor             │   │
 │  │  Client      │    │    ├── DataBindingResolver    │   │
 │  │              │    │    └── TokenResolver          │   │
 │  └──────────────┘    └──────────────┬──────────────┘   │
 │                                     │                   │
 │                                     ▼                   │
 │                      ┌─────────────────────────────┐   │
 │                      │        Rendering             │   │
 │                      │                               │   │
 │                      │  A2UIRendererView             │   │
 │                      │    ├── ComponentNodeView      │   │
 │                      │    │    ├── A2UICard          │   │
 │                      │    │    ├── A2UIText          │   │
 │                      │    │    ├── A2UIButton        │   │
 │                      │    │    ├── A2UIImage         │   │
 │                      │    │    ├── A2UIIcon          │   │
 │                      │    │    ├── A2UIRow           │   │
 │                      │    │    └── A2UIColumn        │   │
 │                      │    └── StyleModifiers         │   │
 │                      └─────────────────────────────┘   │
 └────────────────────────────────────────────────────────┘
```

## Requirements

- iOS 17.0+ / macOS 14.0+
- Swift 5.9+
- Xcode 15.2+

## Integration

### Swift Package Manager

Add to your `Package.swift`:

```swift
dependencies: [
    .package(path: "../ios-renderer")
    // or .package(url: "<repo-url>", from: "0.1.0")
]
```

Or in Xcode: File → Add Package Dependencies → Add local package.

### XcodeGen

```yaml
packages:
  A2UIRenderer:
    path: ../path/to/ios-renderer

targets:
  YourApp:
    dependencies:
      - package: A2UIRenderer
```

---

## Usage

### Basic Rendering

```swift
import SwiftUI
import A2UIRenderer

struct ContentView: View {
    @State private var processor = MessageProcessor()

    var body: some View {
        A2UIRendererView(surface: surface) { actionName, context in
            print("Action: \(actionName), context: \(context ?? [:])")
        }
    }
}
```

### WebSocket Connection

```swift
import A2UIRenderer

@State private var processor = MessageProcessor()
@State private var wsClient: A2UIWebSocketClient?

func connect() {
    let url = URL(string: "ws://localhost:3001/ws")!
    let client = A2UIWebSocketClient(processor: processor)
    client.connect(to: url)
    wsClient = client
}
```

The `A2UIWebSocketClient`:
1. Connects to the dashboard's WebSocket server
2. Sends a `register` message with device ID and platform
3. Receives `a2ui_messages` and passes them to `MessageProcessor`
4. `MessageProcessor` updates `Surface` objects which trigger SwiftUI re-renders

---

## Architecture

### Message Processing Pipeline

```
 WebSocket Message
       │
       ▼
 ┌─────────────────────┐
 │  MessageProcessor    │  Parses A2UI messages, maintains Surface state
 │                      │
 │  surfaces: [String:  │  Dictionary of active surfaces
 │    Surface]          │
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐
 │  Surface             │  Holds components, tokens, data model
 │                      │
 │  components: [...]   │  Flat list of A2UI components
 │  designTokens: {...} │  Token name → value mapping
 │  dataModel: {...}    │  Nested data for binding resolution
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐
 │  A2UIRendererView    │  Entry point SwiftUI view
 │                      │
 │  Finds root component│  Component with id "root" or first Card
 │  Renders tree        │  Recursively renders children
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐
 │  ComponentNodeView   │  Switches on component type
 │                      │
 │  Card → A2UICard     │  Each type has a dedicated SwiftUI view
 │  Text → A2UIText     │  Styles applied via StyleModifiers
 │  Button → A2UIButton │  Tokens resolved via TokenResolver
 │  Image → A2UIImage   │  Bindings resolved via DataBindingResolver
 │  Icon → A2UIIcon     │
 │  Row → A2UIRow       │
 │  Column → A2UIColumn │
 └─────────────────────┘
```

### Token Resolution

Design tokens are referenced with `{TokenName}` syntax in component styles:

```
Style value: "{Accents.Indigo}"
     │
     ▼
TokenResolver.resolve("{Accents.Indigo}", tokens)
     │
     ▼
Looks up: tokens["Accents.Indigo"].value → "#6d7cff"
     │
     ▼
Returns: Color(hex: "#6d7cff")
```

### Data Binding Resolution

Component text uses `${/path}` bindings:

```
Text value: "${/greeting/text}"
     │
     ▼
DataBindingResolver.resolve("${/greeting/text}", dataModel)
     │
     ▼
Traverses: dataModel["greeting"]["text"] → "Hello, World!"
     │
     ▼
Returns: "Hello, World!"
```

---

## Supported Components

| Component | SwiftUI View | Properties |
|-----------|-------------|------------|
| `Card` | `A2UICard` | Background, corner radius, border, shadow, padding, children |
| `Text` | `A2UIText` | Text content (bindable), font, color, alignment |
| `Button` | `A2UIButton` | Label (bindable), action event, background, corner radius |
| `Image` | `A2UIImage` | URL source, width, height, corner radius |
| `Icon` | `A2UIIcon` | SVG path data, fill color, size |
| `Row` | `A2UIRow` | Horizontal layout, spacing, alignment |
| `Column` | `A2UIColumn` | Vertical layout, spacing, alignment |

## Style Properties

All components support these style properties (applied via `StyleModifiers`):

| Property | Type | Example |
|----------|------|---------|
| `width` / `height` | Number | `168` |
| `backgroundColor` | Token or hex | `"{Accents.Indigo}"` or `"#6d7cff"` |
| `cornerRadius` | Token or number | `"{Interactive border radius.--radius-i-xs}"` |
| `borderColor` / `borderWidth` | String / Number | `"#c8c8c8"`, `1` |
| `paddingTop/Right/Bottom/Left` | Token or number | `"{Paddings & Gaps.p-2}"` |
| `gap` | Token or number | Spacing between children |
| `shadow` | Object | `{ color, offsetX, offsetY, blur }` |
| `mainAxisAlignment` | String | `"center"`, `"min"`, `"max"` |
| `crossAxisAlignment` | String | `"center"`, `"min"`, `"max"` |

---

## Demo App

The `Examples/A2UIDemoApp` directory contains a demo iOS app called **Interface AI**:

```bash
cd Examples/A2UIDemoApp
xcodegen generate          # Generate Xcode project from project.yml
open InterfaceAI.xcodeproj # Open in Xcode
# Build and run (Cmd+R)
```

The demo app:
- Connects to the dashboard WebSocket at `ws://localhost:3001/ws`
- Shows connection status with editable server URL
- Renders all received surfaces as native SwiftUI views
- Displays component/token/binding metadata per surface

### File Structure

```
ios-renderer/
├── Package.swift
├── Sources/A2UIRenderer/
│   ├── Models/
│   │   ├── A2UISchema.swift           # Component, ChildList, DesignToken types
│   │   ├── Surface.swift              # Surface state container
│   │   └── AnyCodable.swift           # Type-erased Codable wrapper
│   ├── Processing/
│   │   ├── MessageProcessor.swift     # A2UI message parser + surface manager
│   │   ├── DataBindingResolver.swift  # ${/path} → value resolution
│   │   └── TokenResolver.swift        # {TokenName} → value resolution
│   ├── Rendering/
│   │   ├── A2UIRendererView.swift     # Top-level renderer entry point
│   │   ├── StyleModifiers.swift       # Shared style application
│   │   └── Components/
│   │       ├── ComponentNodeView.swift # Component type switch
│   │       ├── A2UICard.swift
│   │       ├── A2UIText.swift
│   │       ├── A2UIButton.swift
│   │       ├── A2UIImage.swift
│   │       ├── A2UIIcon.swift
│   │       ├── A2UIRow.swift
│   │       └── A2UIColumn.swift
│   └── Transport/
│       └── A2UIWebSocketClient.swift  # WebSocket connection + message relay
├── Tests/A2UIRendererTests/
└── Examples/A2UIDemoApp/
    ├── project.yml                    # XcodeGen project definition
    ├── A2UIDemoApp.swift              # App entry point
    └── ContentView.swift              # Main UI with connection controls
```
