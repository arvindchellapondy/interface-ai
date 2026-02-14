import Foundation

/// Processes A2UI messages into reactive Surface state.
@Observable
public final class MessageProcessor {
    public private(set) var surfaces: [String: Surface] = [:]

    public init() {}

    /// Process an array of A2UI messages (e.g., from JSON file or WebSocket).
    @discardableResult
    public func process(messages: [A2UIMessage]) -> Surface? {
        var lastSurface: Surface?

        for message in messages {
            switch message {
            case .createSurface(let cs):
                let surface = Surface(surfaceId: cs.surfaceId)
                surface.designTokens = cs.designTokens ?? [:]
                surfaces[cs.surfaceId] = surface
                lastSurface = surface

            case .updateComponents(let uc):
                guard let surface = surfaces[uc.surfaceId] else { continue }
                for comp in uc.components {
                    surface.components[comp.id] = comp
                }
                lastSurface = surface

            case .updateDataModel(let udm):
                guard let surface = surfaces[udm.surfaceId] else { continue }
                if udm.path == nil || udm.path == "/" {
                    if let obj = udm.value.objectValue {
                        surface.dataModel = obj
                    }
                } else if let path = udm.path {
                    setNestedValue(in: &surface.dataModel, path: path, value: udm.value)
                }
                lastSurface = surface

            case .deleteSurface(let ds):
                surfaces.removeValue(forKey: ds.surfaceId)
            }
        }

        return lastSurface
    }

    /// Parse JSON string into messages and process them.
    @discardableResult
    public func processJSON(_ json: String) throws -> Surface? {
        guard let data = json.data(using: .utf8) else {
            throw A2UIError.invalidJSON
        }
        let messages = try JSONDecoder().decode([A2UIMessage].self, from: data)
        return process(messages: messages)
    }

    /// Parse JSON data into messages and process them.
    @discardableResult
    public func processJSON(_ data: Data) throws -> Surface? {
        let messages = try JSONDecoder().decode([A2UIMessage].self, from: data)
        return process(messages: messages)
    }

    // MARK: - Private

    private func setNestedValue(in dict: inout [String: JSONValue], path: String, value: JSONValue) {
        let parts = path.split(separator: "/").map(String.init)
        guard !parts.isEmpty else { return }

        if parts.count == 1 {
            dict[parts[0]] = value
            return
        }

        let key = parts[0]
        var nested = dict[key]?.objectValue ?? [:]
        let remainingPath = parts.dropFirst().joined(separator: "/")
        setNestedValue(in: &nested, path: remainingPath, value: value)
        dict[key] = .object(nested)
    }
}

public enum A2UIError: Error {
    case invalidJSON
    case noRootComponent
    case surfaceNotFound(String)
}
