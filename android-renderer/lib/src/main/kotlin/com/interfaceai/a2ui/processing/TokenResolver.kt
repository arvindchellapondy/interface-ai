package com.interfaceai.a2ui.processing

import androidx.compose.ui.graphics.Color
import com.interfaceai.a2ui.models.DesignToken
import kotlinx.serialization.json.*

/**
 * Resolves design token references like "{Accents.Red}" → "#ff4245".
 * Port of resolveToken() from a2ui-parser/src/index.ts.
 */
class TokenResolver(val tokens: Map<String, DesignToken>) {

    /**
     * Resolve a JSON value that may be a token reference.
     */
    fun resolve(value: JsonElement?): JsonElement? {
        if (value == null) return null
        val str = (value as? JsonPrimitive)?.contentOrNull ?: return value

        // Check for token reference: {token.name}
        if (!str.startsWith("{") || !str.endsWith("}") || str.startsWith("\${")) return value

        val tokenName = str.substring(1, str.length - 1)
        val token = tokens[tokenName] ?: return value

        // Return as number if numeric, else as string
        token.value.toDoubleOrNull()?.let {
            return JsonPrimitive(it)
        }
        return JsonPrimitive(token.value)
    }

    /**
     * Resolve a style property value.
     */
    fun resolveStyle(style: Map<String, JsonElement>?, key: String): JsonElement? {
        val value = style?.get(key) ?: return null
        return resolve(value)
    }

    /**
     * Resolve a style property as Float.
     */
    fun resolveStyleFloat(style: Map<String, JsonElement>?, key: String): Float? {
        val resolved = resolveStyle(style, key) ?: return null
        return when (resolved) {
            is JsonPrimitive -> resolved.floatOrNull ?: resolved.contentOrNull?.toFloatOrNull()
            else -> null
        }
    }

    /**
     * Resolve a style property as String.
     */
    fun resolveStyleString(style: Map<String, JsonElement>?, key: String): String? {
        val resolved = resolveStyle(style, key) ?: return null
        return (resolved as? JsonPrimitive)?.contentOrNull
    }

    /**
     * Resolve a color from a hex string style property.
     */
    fun resolveColor(style: Map<String, JsonElement>?, key: String): Color? {
        val hex = resolveStyleString(style, key) ?: return null
        return parseHexColor(hex)
    }
}

/**
 * Parse a hex color string like "#ff4245" into a Compose Color.
 */
fun parseHexColor(hex: String): Color? {
    val clean = hex.removePrefix("#")
    return try {
        when (clean.length) {
            6 -> Color(android.graphics.Color.parseColor("#$clean"))
            8 -> Color(android.graphics.Color.parseColor("#$clean"))
            else -> null
        }
    } catch (e: Exception) {
        null
    }
}
