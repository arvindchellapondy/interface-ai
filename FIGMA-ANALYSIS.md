# Figma Design Analysis

## Source File

- **URL:** https://www.figma.com/design/khgNy2HimWcay4KSSxa6jr/Moon-Design-System-v1--Community---Copy-?node-id=32616-12
- **Design System:** Moon Design System v1

## tile_hello Component

### Visual Description

A card-style component containing:
- A card container with rounded corners and padding
- Title text (heading)
- Subtitle/description text
- A purple action button

### Estimated Design Tokens

| Token | Value |
|-------|-------|
| Button color | `#6366f1` (indigo/purple) |
| Card background | `#ffffff` (white) |
| Card corner radius | ~12px |
| Card padding | ~16-24px |
| Title font size | ~18-20px |
| Subtitle font size | ~14px |
| Button corner radius | ~8px |
| Button padding | ~12px vertical, 24px horizontal |

### Component Hierarchy

```
tile_hello (FRAME / COMPONENT)
├── Title (TEXT)
│   └── "Hello" or similar heading
├── Subtitle (TEXT)
│   └── Description text
└── Button (FRAME / INSTANCE)
    └── Button Label (TEXT)
        └── "Get Started" or similar CTA
```

### Notes

- Exact values need to be extracted via the Figma plugin once installed
- The component likely uses auto-layout (vertical stack)
- Button may be a component instance from the Moon Design System
- Colors and spacing will be confirmed after plugin extraction
