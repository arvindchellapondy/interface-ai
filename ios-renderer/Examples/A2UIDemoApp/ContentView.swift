import SwiftUI
import A2UIRenderer

struct ContentView: View {
    @State private var processor = MessageProcessor()
    @State private var wsClient: A2UIWebSocketClient?
    @State private var serverURL = "ws://localhost:3001/ws"
    @State private var isEditing = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Connection status
                connectionBar

                if processor.surfaces.isEmpty {
                    Spacer()
                    waitingView
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 24) {
                            ForEach(Array(processor.surfaces.keys.sorted()), id: \.self) { surfaceId in
                                if let surface = processor.surfaces[surfaceId] {
                                    surfaceCard(surface: surface, surfaceId: surfaceId)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Interface AI")
            .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            connect()
        }
    }

    // MARK: - Connection Bar

    private var connectionBar: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(wsClient?.isConnected == true ? .green : .red)
                .frame(width: 8, height: 8)

            if isEditing {
                TextField("Server URL", text: $serverURL)
                    .textFieldStyle(.roundedBorder)
                    .font(.caption)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .onSubmit {
                        isEditing = false
                        reconnect()
                    }
            } else {
                Text(serverURL)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .onTapGesture { isEditing = true }
            }

            Spacer()

            Button(wsClient?.isConnected == true ? "Disconnect" : "Connect") {
                if wsClient?.isConnected == true {
                    wsClient?.disconnect()
                } else {
                    connect()
                }
            }
            .font(.caption)
            .buttonStyle(.bordered)
        }
        .padding(.horizontal)
        .padding(.top, 4)
    }

    // MARK: - Waiting View

    private var waitingView: some View {
        VStack(spacing: 12) {
            Image(systemName: "antenna.radiowaves.left.and.right")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            if wsClient?.isConnected == true {
                Text("Connected to dashboard")
                    .font(.headline)
                Text("Waiting for a design to be pushed...")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                Text("Not connected")
                    .font(.headline)
                if let error = wsClient?.lastError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                Text("Start the dashboard with:\nnpm run dev:ws")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    // MARK: - Surface Card

    private func surfaceCard(surface: Surface, surfaceId: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(surfaceId)
                .font(.caption)
                .foregroundColor(.secondary)
                .textCase(.uppercase)

            // Rendered A2UI surface
            HStack {
                Spacer()
                A2UIRendererView(surface: surface) { actionName, context in
                    print("Action: \(actionName), context: \(context ?? [:])")
                }
                Spacer()
            }

            // Metadata
            HStack(spacing: 16) {
                Label("\(surface.components.count)", systemImage: "square.stack.3d.up")
                Label("\(surface.designTokens.count)", systemImage: "paintpalette")
                Label("\(surface.dataModel.count)", systemImage: "doc.text")
            }
            .font(.caption2)
            .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
    }

    // MARK: - Connection

    private func connect() {
        guard let url = URL(string: serverURL) else { return }
        let client = A2UIWebSocketClient(processor: processor)
        client.connect(to: url)
        wsClient = client
    }

    private func reconnect() {
        wsClient?.disconnect()
        connect()
    }
}

#Preview {
    ContentView()
}
