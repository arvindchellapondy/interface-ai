package com.interfaceai.a2ui.rendering.components

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.interfaceai.a2ui.models.A2UIComponent
import com.interfaceai.a2ui.processing.DataBindingResolver
import com.interfaceai.a2ui.processing.TokenResolver
import com.interfaceai.a2ui.rendering.applyA2UIStyle
import kotlinx.serialization.json.JsonElement

@Composable
fun A2UIButtonView(
    component: A2UIComponent,
    tokenResolver: TokenResolver,
    dataResolver: DataBindingResolver,
    onAction: ((String, Map<String, JsonElement>?) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val label = dataResolver.resolve(component.label)
    val style = component.style
    val lStyle = component.labelStyle

    val labelFontSize = tokenResolver.resolveStyleFloat(lStyle, "fontSize")
    val labelFontWeight = tokenResolver.resolveStyleString(lStyle, "fontWeight")
    val labelColor = tokenResolver.resolveColor(lStyle, "color")

    Button(
        onClick = {
            component.action?.let { action ->
                onAction?.invoke(action.event.name, action.event.context)
            }
        },
        modifier = modifier.applyA2UIStyle(style, tokenResolver)
    ) {
        Text(
            text = label,
            fontSize = labelFontSize?.sp ?: 14.sp,
            fontWeight = when {
                labelFontWeight?.lowercase()?.contains("bold") == true -> FontWeight.Bold
                labelFontWeight?.lowercase()?.contains("medium") == true -> FontWeight.Medium
                else -> FontWeight.Normal
            },
            color = labelColor ?: androidx.compose.ui.graphics.Color.Unspecified
        )
    }
}
