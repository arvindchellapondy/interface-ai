package com.interfaceai.a2ui.rendering

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.interfaceai.a2ui.processing.TokenResolver
import kotlinx.serialization.json.JsonElement

/**
 * Applies A2UI style properties as Compose Modifier chains.
 * Port of generateModifiers() from mobile-codegen/src/kotlin-compose/generator.ts (runtime version).
 */
fun Modifier.applyA2UIStyle(
    style: Map<String, JsonElement>?,
    tokenResolver: TokenResolver
): Modifier {
    if (style == null) return this

    var mod = this

    val width = tokenResolver.resolveStyleFloat(style, "width")
    val height = tokenResolver.resolveStyleFloat(style, "height")
    val bg = tokenResolver.resolveColor(style, "backgroundColor")
    val radius = tokenResolver.resolveStyleFloat(style, "cornerRadius")
    val opacity = tokenResolver.resolveStyleFloat(style, "opacity")
    val borderColor = tokenResolver.resolveColor(style, "borderColor")
    val borderWidth = tokenResolver.resolveStyleFloat(style, "borderWidth")
    val pt = tokenResolver.resolveStyleFloat(style, "paddingTop")
    val pr = tokenResolver.resolveStyleFloat(style, "paddingRight")
    val pb = tokenResolver.resolveStyleFloat(style, "paddingBottom")
    val pl = tokenResolver.resolveStyleFloat(style, "paddingLeft")

    // Size
    if (width != null && height != null) {
        mod = mod.size(width.dp, height.dp)
    } else if (width != null) {
        mod = mod.width(width.dp)
    } else if (height != null) {
        mod = mod.height(height.dp)
    }

    // Corner radius (clip before background)
    if (radius != null) {
        mod = mod.clip(RoundedCornerShape(radius.dp))
    }

    // Background
    if (bg != null) {
        mod = mod.background(bg)
    }

    // Padding
    if (pt != null || pr != null || pb != null || pl != null) {
        mod = mod.padding(
            start = (pl ?: 0f).dp,
            top = (pt ?: 0f).dp,
            end = (pr ?: 0f).dp,
            bottom = (pb ?: 0f).dp
        )
    }

    // Opacity
    if (opacity != null && opacity != 1f) {
        mod = mod.alpha(opacity)
    }

    // Border
    if (borderColor != null && borderWidth != null) {
        mod = mod.border(
            borderWidth.dp,
            borderColor,
            RoundedCornerShape((radius ?: 0f).dp)
        )
    }

    return mod
}
