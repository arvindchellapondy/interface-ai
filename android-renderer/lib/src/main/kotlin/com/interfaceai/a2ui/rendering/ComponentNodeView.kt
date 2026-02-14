package com.interfaceai.a2ui.rendering

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.interfaceai.a2ui.models.Surface
import com.interfaceai.a2ui.processing.DataBindingResolver
import com.interfaceai.a2ui.processing.TokenResolver
import com.interfaceai.a2ui.rendering.components.*
import kotlinx.serialization.json.JsonElement

/**
 * Recursively renders an A2UI component by looking up its type.
 */
@Composable
fun ComponentNodeView(
    componentId: String,
    surface: Surface,
    tokenResolver: TokenResolver,
    dataResolver: DataBindingResolver,
    onAction: ((String, Map<String, JsonElement>?) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val component = surface.component(componentId) ?: return

    when (component.component) {
        "Text" -> A2UITextView(
            component = component,
            tokenResolver = tokenResolver,
            dataResolver = dataResolver,
            modifier = modifier
        )

        "Button" -> A2UIButtonView(
            component = component,
            tokenResolver = tokenResolver,
            dataResolver = dataResolver,
            onAction = onAction,
            modifier = modifier
        )

        "Card" -> A2UICardView(
            component = component,
            surface = surface,
            tokenResolver = tokenResolver,
            dataResolver = dataResolver,
            onAction = onAction,
            modifier = modifier
        )

        "Row" -> A2UIRowView(
            component = component,
            surface = surface,
            tokenResolver = tokenResolver,
            dataResolver = dataResolver,
            onAction = onAction,
            modifier = modifier
        )

        "Column" -> A2UIColumnView(
            component = component,
            surface = surface,
            tokenResolver = tokenResolver,
            dataResolver = dataResolver,
            onAction = onAction,
            modifier = modifier
        )

        "Image" -> A2UIImageView(
            component = component,
            tokenResolver = tokenResolver,
            dataResolver = dataResolver,
            modifier = modifier
        )

        else -> {
            // Fallback: render as Column if it has children
            val childIds = surface.childIds(component)
            if (childIds.isNotEmpty()) {
                Column(modifier = modifier.applyA2UIStyle(component.style, tokenResolver)) {
                    for (childId in childIds) {
                        ComponentNodeView(
                            componentId = childId,
                            surface = surface,
                            tokenResolver = tokenResolver,
                            dataResolver = dataResolver,
                            onAction = onAction
                        )
                    }
                }
            }
        }
    }
}
