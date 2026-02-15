# Android Renderer

Kotlin library that renders A2UI designs natively using Jetpack Compose. Connects to the dashboard via WebSocket to receive designs in real time.

---

## Overview

```
 ┌───────────────────────────────────────────────────────────┐
 │              A2UI Android Renderer (Kotlin)               │
 │                                                           │
 │  ┌──────────────┐     ┌──────────────────────────────┐    │
 │  │  Transport   │     │       Processing              │    │
 │  │              │     │                                │    │
 │  │  WebSocket   │────▶│  MessageProcessor              │    │
 │  │  Client      │     │    ├── DataBindingResolver     │    │
 │  │  (OkHttp)    │     │    └── TokenResolver           │    │
 │  └──────────────┘     └──────────────┬─────────────┘    │
 │                                      │                    │
 │                                      ▼                    │
 │                       ┌──────────────────────────────┐    │
 │                       │        Rendering              │    │
 │                       │                                │    │
 │                       │  A2UIRendererView              │    │
 │                       │    ├── ComponentNodeView       │    │
 │                       │    │    ├── A2UICard           │    │
 │                       │    │    ├── A2UIText           │    │
 │                       │    │    ├── A2UIButton         │    │
 │                       │    │    ├── A2UIImage          │    │
 │                       │    │    ├── A2UIRow            │    │
 │                       │    │    └── A2UIColumn         │    │
 │                       │    └── StyleModifiers          │    │
 │                       └──────────────────────────────┘    │
 └───────────────────────────────────────────────────────────┘
```

## Requirements

- Android API 24+ (Android 7.0)
- Kotlin 1.9.22+
- Jetpack Compose BOM 2024.01.00+
- Android Studio Hedgehog (2023.1) or later

## Dependencies

| Library | Purpose |
|---------|---------|
| Jetpack Compose (Material3) | Native UI rendering |
| kotlinx-serialization-json | A2UI JSON parsing |
| OkHttp 4.12 | WebSocket transport |
| Coil Compose 2.5 | Async image loading |

---

## Integration

### Gradle

Add the library module as a dependency in your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation(project(":lib"))
}
```

### Usage

```kotlin
import com.interfaceai.a2ui.rendering.A2UIRendererView
import com.interfaceai.a2ui.processing.MessageProcessor
import com.interfaceai.a2ui.transport.A2UIWebSocketClient

@Composable
fun MyScreen() {
    val processor = remember { MessageProcessor() }
    val client = remember { A2UIWebSocketClient(processor) }

    LaunchedEffect(Unit) {
        client.connect("ws://10.0.2.2:3001/ws") // Android emulator → host
    }

    // Render all surfaces
    processor.surfaces.forEach { (surfaceId, surface) ->
        A2UIRendererView(
            surface = surface,
            onAction = { name, context ->
                Log.d("A2UI", "Action: $name, context: $context")
            }
        )
    }
}
```

> **Note**: Use `10.0.2.2` instead of `localhost` when running on the Android emulator — it maps to the host machine's loopback interface.

---

## Architecture

The Android renderer mirrors the iOS renderer's architecture:

```
 WebSocket Message (JSON)
       │
       ▼
 MessageProcessor          Parses createSurface / updateComponents /
       │                   updateDataModel messages
       ▼
 Surface                   Holds component list, tokens, data model
       │
       ▼
 A2UIRendererView          Top-level @Composable
       │
       ▼
 ComponentNodeView         Switches on component type
       │
       ├── A2UICard        Card with Modifier styling
       ├── A2UIText        Text with resolved bindings
       ├── A2UIButton      Button with action callbacks
       ├── A2UIImage       AsyncImage via Coil
       ├── A2UIRow         Row layout
       └── A2UIColumn      Column layout
```

### Token & Data Binding Resolution

Same resolution rules as the iOS renderer:

- **Design tokens**: `{Accents.Indigo}` → resolved from `designTokens` map
- **Data bindings**: `${/greeting/text}` → resolved from nested `dataModel`

---

## File Structure

```
android-renderer/
├── build.gradle.kts                              # Root Gradle config
├── settings.gradle.kts
├── gradle/
│   └── wrapper/
├── lib/                                           # Library module
│   ├── build.gradle.kts                           #   Compose + serialization config
│   └── src/main/kotlin/com/interfaceai/a2ui/
│       ├── models/
│       │   ├── A2UISchema.kt                      #   Component data classes
│       │   └── Surface.kt                         #   Surface state holder
│       ├── processing/
│       │   ├── MessageProcessor.kt                #   Message parser
│       │   ├── TokenResolver.kt                   #   {Token} resolution
│       │   └── DataBindingResolver.kt             #   ${/path} resolution
│       ├── rendering/
│       │   ├── A2UIRendererView.kt                #   Root @Composable
│       │   ├── StyleModifiers.kt                  #   Modifier extensions
│       │   └── components/
│       │       ├── ComponentNodeView.kt           #   Type switch
│       │       ├── A2UICard.kt
│       │       ├── A2UIText.kt
│       │       ├── A2UIButton.kt
│       │       ├── A2UIImage.kt
│       │       ├── A2UIRow.kt
│       │       └── A2UIColumn.kt
│       └── transport/
│           └── A2UIWebSocketClient.kt             #   OkHttp WebSocket client
└── demo/                                          # Demo app
    └── ...
```

## Supported Components

| Component | Composable | Properties |
|-----------|-----------|------------|
| `Card` | `A2UICard` | Background, corner radius, border, shadow, padding, children |
| `Text` | `A2UIText` | Text (bindable), font size, color, weight, alignment |
| `Button` | `A2UIButton` | Label (bindable), action event, background, corner radius |
| `Image` | `A2UIImage` | URL source (Coil), width, height, corner radius |
| `Row` | `A2UIRow` | Horizontal arrangement, spacing, alignment |
| `Column` | `A2UIColumn` | Vertical arrangement, spacing, alignment |
