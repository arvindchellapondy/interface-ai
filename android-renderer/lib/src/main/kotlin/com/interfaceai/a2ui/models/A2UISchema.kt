package com.interfaceai.a2ui.models

import kotlinx.serialization.*
import kotlinx.serialization.json.*

// MARK: - Design Token

@Serializable
data class DesignToken(
    val value: String,
    val collection: String
)

// MARK: - Child References

@Serializable
data class ChildList(
    val explicitList: List<String>? = null,
    val template: ChildTemplate? = null
)

@Serializable
data class ChildTemplate(
    val dataPath: String,
    val componentId: String
)

// MARK: - Action

@Serializable
data class ActionEvent(
    val name: String,
    val context: Map<String, JsonElement>? = null
)

@Serializable
data class ComponentAction(
    val event: ActionEvent
)

// MARK: - Component

@Serializable
data class A2UIComponent(
    val id: String,
    val component: String,
    val children: ChildList? = null,
    val text: String? = null,
    val label: String? = null,
    val action: ComponentAction? = null,
    val style: Map<String, JsonElement>? = null,
    val labelStyle: Map<String, JsonElement>? = null
)

// MARK: - Messages

@Serializable
data class CreateSurface(
    val surfaceId: String,
    val catalogId: String? = null,
    val sendDataModel: Boolean? = null,
    val designTokens: Map<String, DesignToken>? = null
)

@Serializable
data class UpdateComponents(
    val surfaceId: String,
    val components: List<A2UIComponent>
)

@Serializable
data class UpdateDataModel(
    val surfaceId: String,
    val path: String? = null,
    val value: JsonElement
)

@Serializable
data class DeleteSurface(
    val surfaceId: String
)

// MARK: - Message Envelope

/**
 * A2UI message: exactly one of these keys is present.
 * Custom serializer handles the {"createSurface": {...}} envelope format.
 */
@Serializable(with = A2UIMessageSerializer::class)
sealed class A2UIMessage {
    data class CreateSurfaceMsg(val data: CreateSurface) : A2UIMessage()
    data class UpdateComponentsMsg(val data: UpdateComponents) : A2UIMessage()
    data class UpdateDataModelMsg(val data: UpdateDataModel) : A2UIMessage()
    data class DeleteSurfaceMsg(val data: DeleteSurface) : A2UIMessage()
}

object A2UIMessageSerializer : JsonContentPolymorphicSerializer<A2UIMessage>(A2UIMessage::class) {
    override fun selectDeserializer(element: JsonElement): DeserializationStrategy<A2UIMessage> {
        val obj = element.jsonObject
        return when {
            "createSurface" in obj -> CreateSurfaceWrapper.serializer()
            "updateComponents" in obj -> UpdateComponentsWrapper.serializer()
            "updateDataModel" in obj -> UpdateDataModelWrapper.serializer()
            "deleteSurface" in obj -> DeleteSurfaceWrapper.serializer()
            else -> throw SerializationException("Unknown A2UI message type: ${obj.keys}")
        }
    }
}

@Serializable
private data class CreateSurfaceWrapper(val createSurface: CreateSurface) : A2UIMessage() {
    fun toMessage() = CreateSurfaceMsg(createSurface)
}

@Serializable
private data class UpdateComponentsWrapper(val updateComponents: UpdateComponents) : A2UIMessage() {
    fun toMessage() = UpdateComponentsMsg(updateComponents)
}

@Serializable
private data class UpdateDataModelWrapper(val updateDataModel: UpdateDataModel) : A2UIMessage() {
    fun toMessage() = UpdateDataModelMsg(updateDataModel)
}

@Serializable
private data class DeleteSurfaceWrapper(val deleteSurface: DeleteSurface) : A2UIMessage() {
    fun toMessage() = DeleteSurfaceMsg(deleteSurface)
}
