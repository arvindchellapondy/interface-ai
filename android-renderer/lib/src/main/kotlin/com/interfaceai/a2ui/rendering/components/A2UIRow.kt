package com.interfaceai.a2ui.rendering.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.interfaceai.a2ui.models.A2UIComponent
import com.interfaceai.a2ui.models.Surface
import com.interfaceai.a2ui.processing.DataBindingResolver
import com.interfaceai.a2ui.processing.TokenResolver
import com.interfaceai.a2ui.rendering.ComponentNodeView
import com.interfaceai.a2ui.rendering.applyA2UIStyle
import kotlinx.serialization.json.JsonElement

@Composable
fun A2UIRowView(
    component: A2UIComponent,
    surface: Surface,
    tokenResolver: TokenResolver,
    dataResolver: DataBindingResolver,
    onAction: ((String, Map<String, JsonElement>?) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val gap = tokenResolver.resolveStyleFloat(component.style, "gap")
    val childIds = surface.childIds(component)

    Row(
        modifier = modifier.applyA2UIStyle(component.style, tokenResolver),
        horizontalArrangement = Arrangement.spacedBy((gap ?: 0f).dp)
    ) {
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
