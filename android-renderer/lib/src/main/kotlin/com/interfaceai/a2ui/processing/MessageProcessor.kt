package com.interfaceai.a2ui.processing

import com.interfaceai.a2ui.models.*
import kotlinx.serialization.json.*

/**
 * Processes A2UI messages into reactive Surface state.
 */
class MessageProcessor {
    private val _surfaces = mutableMapOf<String, Surface>()
    val surfaces: Map<String, Surface> get() = _surfaces

    fun process(messages: List<A2UIMessage>): Surface? {
        var lastSurface: Surface? = null

        for (message in messages) {
            when (message) {
                is A2UIMessage.CreateSurfaceMsg -> {
                    val cs = message.data
                    val surface = Surface(cs.surfaceId)
                    surface.designTokens = cs.designTokens ?: emptyMap()
                    _surfaces[cs.surfaceId] = surface
                    lastSurface = surface
                }
                is A2UIMessage.UpdateComponentsMsg -> {
                    val uc = message.data
                    val surface = _surfaces[uc.surfaceId] ?: continue
                    for (comp in uc.components) {
                        surface.components[comp.id] = comp
                    }
                    lastSurface = surface
                }
                is A2UIMessage.UpdateDataModelMsg -> {
                    val udm = message.data
                    val surface = _surfaces[udm.surfaceId] ?: continue
                    if (udm.path == null || udm.path == "/") {
                        val obj = udm.value.jsonObject
                        surface.dataModel = obj.toMap()
                    } else {
                        val current = surface.dataModel.toMutableMap()
                        setNestedValue(current, udm.path, udm.value)
                        surface.dataModel = current
                    }
                    lastSurface = surface
                }
                is A2UIMessage.DeleteSurfaceMsg -> {
                    _surfaces.remove(message.data.surfaceId)
                }
                // Handle wrapper types from deserialization
                else -> {
                    // The wrapper types (CreateSurfaceWrapper, etc.) need to be converted
                    // This is handled by the sealed class hierarchy
                }
            }
        }

        return lastSurface
    }

    fun processJSON(json: String): Surface? {
        val messages = Json { ignoreUnknownKeys = true }
            .decodeFromString<List<A2UIMessage>>(json)
        return process(messages)
    }

    private fun setNestedValue(
        map: MutableMap<String, JsonElement>,
        path: String,
        value: JsonElement
    ) {
        val parts = path.trimStart('/').split("/")
        if (parts.isEmpty()) return

        if (parts.size == 1) {
            map[parts[0]] = value
            return
        }

        val key = parts[0]
        val existing = map[key]
        val nested = if (existing is JsonObject) {
            existing.toMutableMap()
        } else {
            mutableMapOf()
        }
        setNestedValue(nested, parts.drop(1).joinToString("/"), value)
        map[key] = JsonObject(nested)
    }

    private fun JsonObject.toMutableMap(): MutableMap<String, JsonElement> {
        return this.toMap().toMutableMap()
    }
}
