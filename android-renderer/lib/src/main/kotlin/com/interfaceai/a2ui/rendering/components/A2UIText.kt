package com.interfaceai.a2ui.rendering.components

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import com.interfaceai.a2ui.models.A2UIComponent
import com.interfaceai.a2ui.processing.DataBindingResolver
import com.interfaceai.a2ui.processing.TokenResolver
import com.interfaceai.a2ui.rendering.applyA2UIStyle

@Composable
fun A2UITextView(
    component: A2UIComponent,
    tokenResolver: TokenResolver,
    dataResolver: DataBindingResolver,
    modifier: Modifier = Modifier
) {
    val resolvedText = dataResolver.resolve(component.text)
    val style = component.style

    val fontSize = tokenResolver.resolveStyleFloat(style, "fontSize")
    val fontWeight = tokenResolver.resolveStyleString(style, "fontWeight")
    val color = tokenResolver.resolveColor(style, "color")
    val textAlign = tokenResolver.resolveStyleString(style, "textAlign")

    Text(
        text = resolvedText,
        modifier = modifier.applyA2UIStyle(style, tokenResolver),
        fontSize = fontSize?.sp ?: 14.sp,
        fontWeight = mapFontWeight(fontWeight),
        color = color ?: androidx.compose.ui.graphics.Color.Unspecified,
        textAlign = mapTextAlign(textAlign)
    )
}

private fun mapFontWeight(weight: String?): FontWeight {
    if (weight == null) return FontWeight.Normal
    val w = weight.lowercase()
    return when {
        w.contains("bold") -> FontWeight.Bold
        w.contains("semibold") || w.contains("semi") -> FontWeight.SemiBold
        w.contains("medium") -> FontWeight.Medium
        w.contains("light") -> FontWeight.Light
        w.contains("thin") -> FontWeight.Thin
        else -> FontWeight.Normal
    }
}

private fun mapTextAlign(align: String?): TextAlign? {
    return when (align?.lowercase()) {
        "center" -> TextAlign.Center
        "right" -> TextAlign.End
        "left" -> TextAlign.Start
        else -> null
    }
}
