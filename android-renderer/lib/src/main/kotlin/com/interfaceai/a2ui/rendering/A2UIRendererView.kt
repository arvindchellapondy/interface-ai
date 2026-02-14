package com.interfaceai.a2ui.rendering

import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.interfaceai.a2ui.models.Surface
import com.interfaceai.a2ui.processing.DataBindingResolver
import com.interfaceai.a2ui.processing.MessageProcessor
import com.interfaceai.a2ui.processing.TokenResolver
import kotlinx.serialization.json.JsonElement

/**
 * Top-level Composable that renders an A2UI surface.
 *
 * Usage:
 * ```kotlin
 * val processor = MessageProcessor()
 * val surface = processor.processJSON(jsonString)
 * if (surface != null) {
 *     A2UIRendererView(surface = surface)
 * }
 * ```
 */
@Composable
fun A2UIRendererView(
    surface: Surface,
    onAction: ((String, Map<String, JsonElement>?) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val tokenResolver = TokenResolver(surface.designTokens)
    val dataResolver = DataBindingResolver(surface.dataModel)

    ComponentNodeView(
        componentId = surface.rootComponentId,
        surface = surface,
        tokenResolver = tokenResolver,
        dataResolver = dataResolver,
        onAction = onAction,
        modifier = modifier
    )
}

/**
 * Convenience: render from raw JSON string.
 */
@Composable
fun A2UIFromJSON(
    json: String,
    onAction: ((String, Map<String, JsonElement>?) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var surface by remember { mutableStateOf<Surface?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(json) {
        try {
            val processor = MessageProcessor()
            surface = processor.processJSON(json)
        } catch (e: Exception) {
            error = e.message
        }
    }

    when {
        surface != null -> A2UIRendererView(
            surface = surface!!,
            onAction = onAction,
            modifier = modifier
        )
        error != null -> Text("Error: $error", color = Color.Red)
        else -> CircularProgressIndicator()
    }
}
