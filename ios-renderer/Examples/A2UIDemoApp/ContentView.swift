import SwiftUI
import A2UIRenderer

struct ContentView: View {
    @State private var processor = MessageProcessor()
    @State private var surfaceId: String?

    // The tile_hello A2UI JSON (embedded for demo)
    let tileHelloJSON = """
    [
      {
        "createSurface": {
          "surfaceId": "tile_hello",
          "catalogId": "standard_catalog_v0.9",
          "sendDataModel": true,
          "designTokens": {
            "Accents.Red": { "value": "#ff4245", "collection": "Colors" },
            "Interactive border radius.--radius-i-xs": { "value": "4", "collection": "Colors" },
            "Paddings & Gaps.p-1": { "value": "4", "collection": "Colors" },
            "Paddings & Gaps.p-2": { "value": "8", "collection": "Colors" },
            "gap.0": { "value": "0", "collection": "Primitives" },
            "Main.goten": { "value": "#ffffff", "collection": "Colors" }
          }
        }
      },
      {
        "updateComponents": {
          "surfaceId": "tile_hello",
          "components": [
            {
              "id": "hello_world_our_1st_tile",
              "component": "Text",
              "text": "${/hello_world_our_1st_tile/text}",
              "style": {
                "width": 136, "height": 16,
                "color": "#000000", "fontSize": 12,
                "fontFamily": "DM Sans", "fontWeight": "Bold",
                "textAlign": "center"
              }
            },
            {
              "id": "mdsbutton",
              "component": "Button",
              "label": "${/mdsbutton/label}",
              "action": { "event": { "name": "mdsbutton_click" } },
              "style": {
                "width": 84, "height": 24,
                "backgroundColor": "{Accents.Red}",
                "cornerRadius": "{Interactive border radius.--radius-i-xs}",
                "paddingTop": "{Paddings & Gaps.p-1}",
                "paddingRight": "{Paddings & Gaps.p-2}",
                "paddingBottom": "{Paddings & Gaps.p-1}",
                "paddingLeft": "{Paddings & Gaps.p-2}",
                "gap": "{gap.0}"
              },
              "labelStyle": {
                "width": 68, "height": 16,
                "color": "{Main.goten}", "fontSize": 12,
                "fontFamily": "DM Sans", "fontWeight": "Bold",
                "textAlign": "center"
              }
            },
            {
              "id": "root",
              "component": "Card",
              "children": { "explicitList": ["hello_world_our_1st_tile", "mdsbutton"] },
              "style": {
                "width": 168, "height": 82,
                "cornerRadius": 16, "borderColor": "#c8c8c8", "borderWidth": 1,
                "paddingTop": 16, "paddingRight": 16,
                "paddingBottom": 16, "paddingLeft": 16,
                "gap": 10
              }
            }
          ]
        }
      },
      {
        "updateDataModel": {
          "surfaceId": "tile_hello",
          "path": "/",
          "value": {
            "hello_world_our_1st_tile": { "text": "Hello world, our 1st tile!" },
            "mdsbutton": { "label": "Button text" }
          }
        }
      }
    ]
    """

    var body: some View {
        VStack(spacing: 24) {
            Text("A2UI Renderer Demo")
                .font(.title2)
                .fontWeight(.bold)

            if let surfaceId, let surface = processor.surfaces[surfaceId] {
                A2UIRendererView(surface: surface) { actionName, context in
                    print("Action triggered: \(actionName)")

                    // Demo: update data model on button click
                    if actionName == "mdsbutton_click" {
                        surface.dataModel = [
                            "hello_world_our_1st_tile": .object(["text": .string("Button was clicked!")]),
                            "mdsbutton": .object(["label": .string("Clicked!")])
                        ]
                    }
                }

                Divider()

                Text("Surface: \(surfaceId)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("Components: \(surface.components.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("Tokens: \(surface.designTokens.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                ProgressView("Loading...")
            }
        }
        .padding()
        .task {
            do {
                let surface = try processor.processJSON(tileHelloJSON)
                surfaceId = surface?.surfaceId
            } catch {
                print("Error: \(error)")
            }
        }
    }
}

#Preview {
    ContentView()
}
