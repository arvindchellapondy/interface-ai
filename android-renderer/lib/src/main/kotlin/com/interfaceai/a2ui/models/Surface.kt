package com.interfaceai.a2ui.models

import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.serialization.json.JsonElement

/**
 * Reactive surface state for Compose.
 * Uses mutableStateMapOf/mutableStateOf so Compose auto-recomposes when state changes.
 */
class Surface(val surfaceId: String) {
    var rootComponentId by mutableStateOf("root")
    val components = mutableStateMapOf<String, A2UIComponent>()
    var dataModel by mutableStateOf<Map<String, JsonElement>>(emptyMap())
    var designTokens by mutableStateOf<Map<String, DesignToken>>(emptyMap())

    fun component(id: String): A2UIComponent? = components[id]

    fun childIds(component: A2UIComponent): List<String> {
        return component.children?.explicitList ?: emptyList()
    }
}
