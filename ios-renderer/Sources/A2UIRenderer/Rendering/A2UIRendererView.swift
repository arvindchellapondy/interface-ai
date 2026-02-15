import SwiftUI

/// Top-level SwiftUI view that renders an A2UI surface.
///
/// Usage:
/// ```swift
/// let processor = MessageProcessor()
/// try processor.processJSON(jsonString)
/// if let surface = processor.surfaces["widget_hello"] {
///     A2UIRendererView(surface: surface)
/// }
/// ```
public struct A2UIRendererView: View {
    let surface: Surface
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    public init(surface: Surface, onAction: ((String, [String: JSONValue]?) -> Void)? = nil) {
        self.surface = surface
        self.onAction = onAction
    }

    public var body: some View {
        let tokenResolver = TokenResolver(tokens: surface.designTokens)
        let dataResolver = DataBindingResolver(dataModel: surface.dataModel)

        ComponentNodeView(
            componentId: surface.rootComponentId,
            surface: surface,
            tokenResolver: tokenResolver,
            dataResolver: dataResolver,
            onAction: onAction
        )
    }
}

/// Convenience: render from raw JSON data.
public struct A2UIFromJSON: View {
    @State private var processor = MessageProcessor()
    @State private var surfaceId: String?
    @State private var error: String?
    let json: Data
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    public init(json: Data, onAction: ((String, [String: JSONValue]?) -> Void)? = nil) {
        self.json = json
        self.onAction = onAction
    }

    public var body: some View {
        Group {
            if let surfaceId, let surface = processor.surfaces[surfaceId] {
                A2UIRendererView(surface: surface, onAction: onAction)
            } else if let error {
                Text("Error: \(error)")
                    .foregroundColor(.red)
                    .font(.caption)
            } else {
                ProgressView()
            }
        }
        .task {
            do {
                let surface = try processor.processJSON(json)
                surfaceId = surface?.surfaceId
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
