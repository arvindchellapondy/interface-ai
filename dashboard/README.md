# Dashboard

Next.js web application for previewing, inspecting, and personalizing A2UI designs with real-time push to native mobile devices.

---

## Overview

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                        Dashboard (Next.js)                      │
 │                                                                  │
 │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
 │  │   Home Page    │  │   Design Detail  │  │    AI Chat      │  │
 │  │                │  │                  │  │                  │  │
 │  │  Tile catalog  │  │  Live preview    │  │  Natural lang.  │  │
 │  │  grid with     │  │  Component tree  │  │  tile selection  │  │
 │  │  click-through │  │  Data model edit │  │  & personalize  │  │
 │  │                │  │  Token inspector │  │                  │  │
 │  │                │  │  Push to devices │  │  Auto-push to   │  │
 │  │                │  │  AI agent panel  │  │  connected devs │  │
 │  └────────────────┘  └─────────────────┘  └──────────────────┘  │
 │                                                                  │
 │  ┌──────────────────────────────────────────────────────────┐    │
 │  │                   Custom Server (server.ts)               │    │
 │  │   HTTP (port 3001)  +  WebSocket (/ws)                    │    │
 │  │   Handles Next.js requests + real-time device push        │    │
 │  └──────────────────────────────────────────────────────────┘    │
 └──────────────────────────────────────────────────────────────────┘
```

## Setup

```bash
cd dashboard
npm install
```

### Environment Variables

Create `.env.local` for AI features:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Run Development Server

```bash
npx tsx server.ts
```

This starts:
- **HTTP server** at `http://localhost:3001`
- **WebSocket server** at `ws://localhost:3001/ws`

The custom server is required (not `next dev`) because it integrates the WebSocket server for real-time device communication.

---

## Pages

### Home (`/`)

Displays all A2UI designs from the `examples/` directory as a responsive card grid. Each card shows:
- Surface ID and friendly name
- Component count, token count, data binding count
- Click to open the design detail page

### Design Detail (`/designs/[id]`)

Two-column layout for inspecting and editing a design:

| Left Panel | Right Panel |
|-----------|-------------|
| Live A2UI preview (rendered in browser) | Component tree view |
| Data model editor (editable JSON fields) | Design token inspector |
| | Connected devices list |
| | AI agent panel |
| | Raw A2UI JSON |

Editing the data model automatically pushes changes to connected devices via WebSocket (300ms debounce).

### AI Chat (`/chat`)

Chat interface powered by Claude for natural language tile selection and personalization:

```
 User: "Show me a weather tile for San Francisco"
  │
  ▼
 ┌──────────────────────────────────────────┐
 │  /api/ai/chat                            │
 │  1. Sends tile catalog to Claude         │
 │  2. Claude selects tile + data model     │
 │  3. Returns tileAction response          │
 └──────────────┬───────────────────────────┘
                │
  ┌─────────────▼──────────────┐
  │  Dashboard applies action   │
  │  1. Merges data model       │
  │  2. Updates preview         │
  │  3. Pushes to devices       │
  └────────────────────────────┘
```

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/designs` | GET | List all designs from `examples/` directory |
| `/api/devices` | GET | List connected WebSocket devices |
| `/api/devices/push` | POST | Push raw A2UI messages to all devices |
| `/api/devices/push-design` | POST | Push a full design (with data model merge) to devices |
| `/api/ai/chat` | POST | AI-powered chat for tile selection |
| `/api/ai/personalize` | POST | AI-powered data model personalization |

### Push Design Endpoint

`POST /api/devices/push-design` is the primary way to push designs to mobile devices. It:

1. Reads the full design from disk by `designId`
2. Deep-merges the provided `dataModel` overlay with the design's defaults
3. Sends `createSurface` + `updateComponents` + `updateDataModel` messages via WebSocket

```bash
curl -X POST http://localhost:3001/api/devices/push-design \
  -H "Content-Type: application/json" \
  -d '{"designId": "tile_hello", "dataModel": {"mdsbutton": {"label": "Click me"}}}'
```

---

## WebSocket Protocol

### Device Registration

When a mobile device connects to `ws://localhost:3001/ws`, it sends:

```json
{ "type": "register", "deviceId": "iphone-1", "platform": "ios" }
```

Server responds:
```json
{ "type": "registered", "deviceId": "iphone-1" }
```

### Pushing A2UI Messages

Server sends A2UI messages to devices:

```json
{
  "type": "a2ui_messages",
  "messages": [
    { "createSurface": { ... } },
    { "updateComponents": { ... } },
    { "updateDataModel": { ... } }
  ]
}
```

---

## Components

| Component | Description |
|-----------|-------------|
| `A2UIPreviewRenderer` | Renders A2UI designs in the browser with token/binding resolution |
| `TreeView` | Visualizes the component hierarchy as an expandable tree |
| `DataModelEditor` | Editable form for the design's data model (recursive key-value) |
| `TokenInspector` | Displays design tokens with color swatches |
| `ConnectedDevices` | Shows connected devices with push controls |
| `AIAgentPanel` | AI-powered personalization of data bindings |

## Styling

The dashboard uses **Tailwind CSS** with a custom theme:

- **Palette**: Slate + Indigo
- **Typography**: DM Sans (headings), Inter (body)
- **Cards**: Subtle shadows with hover lift effects
- **Animations**: Fade-in for AI responses, slide-up for panels

---

## File Structure

```
dashboard/
├── server.ts                    # Custom HTTP + WebSocket server
├── package.json
├── tailwind.config.ts           # Tailwind theme configuration
├── postcss.config.js
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind base + custom components
│   │   ├── layout.tsx           # Root layout with dark nav
│   │   ├── page.tsx             # Home — design catalog grid
│   │   ├── chat/page.tsx        # AI chat interface
│   │   └── designs/[id]/page.tsx # Design detail + inspector
│   ├── components/
│   │   ├── A2UIPreviewRenderer.tsx
│   │   ├── TreeView.tsx
│   │   ├── DataModelEditor.tsx
│   │   ├── TokenInspector.tsx
│   │   ├── ConnectedDevices.tsx
│   │   └── AIAgentPanel.tsx
│   └── lib/
│       ├── a2ui-types.ts        # A2UI TypeScript types + parser
│       ├── ws-server.ts         # WebSocket server + device registry
│       ├── design-store.ts      # File-based design storage
│       └── ai-client.ts         # Anthropic Claude integration
└── next.config.js
```
