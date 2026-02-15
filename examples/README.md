# Examples

Sample A2UI design files used by the dashboard and pushed to mobile devices.

---

## Overview

Each `.a2ui.json` file contains a complete A2UI design as an array of three messages. The dashboard reads these files from this directory and displays them in the widget catalog.

## Designs

### `widget_hello.a2ui.json`

A simple greeting card with a title and button.

```
 ┌──────────────────────────┐
 │                          │
 │  Hello world, our 1st    │
 │  tile!                   │
 │                          │
 │  ┌────────────────────┐  │
 │  │    Button text     │  │
 │  └────────────────────┘  │
 │                          │
 └──────────────────────────┘
```

**Components**: Card → Text + Button
**Data bindings**:
| Binding | Default Value |
|---------|--------------|
| `${/hello_world_our_1st_tile/text}` | "Hello world, our 1st tile!" |
| `${/mdsbutton/label}` | "Button text" |

**Design tokens**: Accents.Indigo (`#6d7cff`), padding/gap tokens, border radius

---

### `widget_weather.a2ui.json`

A weather card with icon, location, and temperature display.

```
 ┌──────────────────────────┐
 │  ☀️                       │
 │                          │
 │  New York City           │
 │  75°F, Clear Sky         │
 │                          │
 └──────────────────────────┘
```

**Components**: Card → Icon + Text (location) + Text (conditions)
**Data bindings**:
| Binding | Default Value |
|---------|--------------|
| `${/aubrey_tx/text}` | "New York City" |
| `${/75_f_clear_sky/text}` | "75°F, Clear Sky" |

**Design tokens**: Background colors, shadow, font styles

---

### `widget_weather_clear_sky.a2ui.json`

Variant of the weather widget with clear sky styling.

### `widget_weather_simple.a2ui.json`

Simplified weather widget variant.

---

## A2UI Message Structure

Every `.a2ui.json` file follows this structure:

```json
[
  {
    "createSurface": {
      "surfaceId": "widget_name",
      "catalogId": "standard_catalog_v0.9",
      "sendDataModel": true,
      "designTokens": {
        "TokenName": { "value": "#hexcolor", "collection": "Colors" }
      }
    }
  },
  {
    "updateComponents": {
      "surfaceId": "widget_name",
      "components": [
        {
          "id": "component_id",
          "component": "Text",
          "text": "${/component_id/text}",
          "style": { "fontSize": 12, "color": "#000000" }
        },
        {
          "id": "root",
          "component": "Card",
          "children": { "explicitList": ["component_id"] },
          "style": { "cornerRadius": 16, "paddingTop": 16 }
        }
      ]
    }
  },
  {
    "updateDataModel": {
      "surfaceId": "widget_name",
      "path": "/",
      "value": {
        "component_id": { "text": "Default text value" }
      }
    }
  }
]
```

### Key Concepts

**Design Tokens** — Named style values referenced with `{TokenName}`:
```json
"backgroundColor": "{Accents.Indigo}"
```

**Data Bindings** — Dynamic text referenced with `${/path}`:
```json
"text": "${/greeting/text}"
```

**Component Tree** — Flat array with parent-child references via `children.explicitList`:
```json
{
  "id": "root",
  "component": "Card",
  "children": { "explicitList": ["title", "button"] }
}
```

## Adding a New Design

1. Create a new `.a2ui.json` file in this directory
2. Follow the three-message structure above
3. Use a unique `surfaceId` (this becomes the design's ID)
4. Restart the dashboard server — the new design appears in the catalog automatically

You can also use the **Figma plugin** to extract designs directly from Figma into this format.
