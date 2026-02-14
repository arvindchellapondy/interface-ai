package com.interfaceai.a2ui.processing

import kotlinx.serialization.json.*

/**
 * Resolves data binding references like "${/hello_world/text}" → "Hello world".
 * Port of resolveDataBinding() from a2ui-parser/src/index.ts.
 */
class DataBindingResolver(val dataModel: Map<String, JsonElement>) {

    /**
     * Resolve a data binding reference.
     * "${/hello_world_our_1st_tile/text}" → "Hello world, our 1st tile!"
     * "Static text" → "Static text" (passthrough)
     * null → ""
     */
    fun resolve(value: String?): String {
        if (value.isNullOrEmpty()) return ""

        // Check for data binding pattern: ${/path/to/value}
        if (!value.startsWith("\${/") || !value.endsWith("}")) return value

        val path = value.substring(3, value.length - 1) // strip "${/" and "}"
        val parts = path.split("/")

        var current: JsonElement = JsonObject(dataModel)
        for (part in parts) {
            val obj = (current as? JsonObject) ?: return value
            current = obj[part] ?: return value
        }

        return when {
            current is JsonPrimitive && current.isString -> current.content
            current is JsonPrimitive -> current.content
            else -> value
        }
    }
}
