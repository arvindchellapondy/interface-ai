package com.interfaceai.demo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.interfaceai.a2ui.processing.MessageProcessor
import com.interfaceai.a2ui.rendering.A2UIRendererView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                A2UIDemoScreen()
            }
        }
    }
}

@Composable
fun A2UIDemoScreen() {
    val processor = remember { MessageProcessor() }
    var surfaceId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        val surface = processor.processJSON(TILE_HELLO_JSON)
        surfaceId = surface?.surfaceId
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "A2UI Renderer Demo",
            style = MaterialTheme.typography.headlineSmall
        )

        val sid = surfaceId
        if (sid != null) {
            val surface = processor.surfaces[sid]
            if (surface != null) {
                A2UIRendererView(
                    surface = surface,
                    onAction = { actionName, _ ->
                        println("Action triggered: $actionName")
                    }
                )

                Divider()

                Text("Surface: $sid", style = MaterialTheme.typography.labelSmall)
                Text("Components: ${surface.components.size}", style = MaterialTheme.typography.labelSmall)
                Text("Tokens: ${surface.designTokens.size}", style = MaterialTheme.typography.labelSmall)
            }
        } else {
            CircularProgressIndicator()
        }
    }
}

private const val TILE_HELLO_JSON = """
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
          "text": "${'$'}{/hello_world_our_1st_tile/text}",
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
          "label": "${'$'}{/mdsbutton/label}",
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
