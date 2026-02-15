import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// WebSocket client that connects to a dashboard and receives A2UI messages.
@Observable
public final class A2UIWebSocketClient {
    public let processor: MessageProcessor
    public private(set) var isConnected = false
    public private(set) var lastError: String?

    private var webSocketTask: URLSessionWebSocketTask?
    private var url: URL?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 10

    public init(processor: MessageProcessor) {
        self.processor = processor
    }

    /// Connect to a WebSocket server.
    public func connect(to url: URL) {
        self.url = url
        reconnectAttempts = 0
        establishConnection()
    }

    /// Disconnect from the server.
    public func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
    }

    // MARK: - Private

    private func establishConnection() {
        guard let url else { return }

        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        lastError = nil
        reconnectAttempts = 0

        // Send registration message
        let register = """
        {"type":"register","platform":"ios","deviceId":"\(deviceId())"}
        """
        webSocketTask?.send(.string(register)) { _ in }

        receiveMessage()
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }

            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                self.receiveMessage()

            case .failure(let error):
                self.isConnected = false
                self.lastError = error.localizedDescription
                self.attemptReconnect()
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        // Expected format: {"type": "a2ui_messages", "messages": [...]}
        do {
            let wrapper = try JSONDecoder().decode(WebSocketMessage.self, from: data)
            if wrapper.type == "a2ui_messages" {
                print("[A2UI WS] Received \(wrapper.messages.count) message(s)")
                DispatchQueue.main.async { [weak self] in
                    self?.processor.process(messages: wrapper.messages)
                }
            }
        } catch {
            // Try parsing as raw A2UI messages array
            print("[A2UI WS] Wrapper decode failed: \(error), trying raw array...")
            do {
                let messages = try JSONDecoder().decode([A2UIMessage].self, from: data)
                print("[A2UI WS] Raw array: \(messages.count) message(s)")
                DispatchQueue.main.async { [weak self] in
                    self?.processor.process(messages: messages)
                }
            } catch {
                print("[A2UI WS] Raw array decode also failed: \(error)")
            }
        }
    }

    private func attemptReconnect() {
        guard reconnectAttempts < maxReconnectAttempts else { return }
        reconnectAttempts += 1
        let delay = min(Double(reconnectAttempts * reconnectAttempts), 30.0) // exponential backoff, max 30s

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.establishConnection()
        }
    }

    private func deviceId() -> String {
        #if os(iOS)
        return UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        #else
        return Host.current().localizedName ?? UUID().uuidString
        #endif
    }
}

// MARK: - WebSocket message wrapper

private struct WebSocketMessage: Codable {
    let type: String
    var messages: [A2UIMessage] = []
}
