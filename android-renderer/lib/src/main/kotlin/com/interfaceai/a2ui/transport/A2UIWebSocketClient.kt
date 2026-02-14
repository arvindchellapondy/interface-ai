package com.interfaceai.a2ui.transport

import com.interfaceai.a2ui.models.A2UIMessage
import com.interfaceai.a2ui.processing.MessageProcessor
import kotlinx.coroutines.*
import kotlinx.serialization.json.Json
import okhttp3.*
import java.util.concurrent.TimeUnit

/**
 * WebSocket client that connects to a dashboard and receives A2UI messages.
 */
class A2UIWebSocketClient(
    private val processor: MessageProcessor,
    private val scope: CoroutineScope
) {
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private var serverUrl: String? = null

    var isConnected = false
        private set
    var lastError: String? = null
        private set

    private val json = Json { ignoreUnknownKeys = true }

    fun connect(url: String) {
        serverUrl = url
        reconnectAttempts = 0
        establishConnection()
    }

    fun disconnect() {
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        isConnected = false
    }

    private fun establishConnection() {
        val url = serverUrl ?: return
        val request = Request.Builder().url(url).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                isConnected = true
                lastError = null
                reconnectAttempts = 0

                // Send registration
                webSocket.send("""{"type":"register","platform":"android","deviceId":"${android.os.Build.MODEL}"}""")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                scope.launch(Dispatchers.Main) {
                    handleMessage(text)
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                lastError = t.message
                attemptReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isConnected = false
            }
        })
    }

    private fun handleMessage(text: String) {
        try {
            // Try as wrapped message: {"type": "a2ui_messages", "messages": [...]}
            val wrapper = json.decodeFromString<WebSocketMessage>(text)
            if (wrapper.type == "a2ui_messages") {
                processor.process(wrapper.messages)
                return
            }
        } catch (_: Exception) {}

        // Try as raw A2UI messages array
        try {
            processor.processJSON(text)
        } catch (_: Exception) {}
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) return
        reconnectAttempts++
        val delay = minOf(reconnectAttempts * reconnectAttempts * 1000L, 30_000L)

        scope.launch {
            delay(delay)
            establishConnection()
        }
    }
}

@kotlinx.serialization.Serializable
private data class WebSocketMessage(
    val type: String,
    val messages: List<A2UIMessage> = emptyList()
)
