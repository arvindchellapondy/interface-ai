import Foundation
import Observation

/// Reactive surface state. When MessageProcessor updates properties, SwiftUI auto-re-renders.
@Observable
public final class Surface {
    public let surfaceId: String
    public var rootComponentId: String = "root"
    public var components: [String: A2UIComponent] = [:]
    public var dataModel: [String: JSONValue] = [:]
    public var designTokens: [String: DesignToken] = [:]

    public init(surfaceId: String) {
        self.surfaceId = surfaceId
    }

    /// Get a component by ID.
    public func component(id: String) -> A2UIComponent? {
        components[id]
    }

    /// Get child component IDs for a given component.
    public func childIds(for component: A2UIComponent) -> [String] {
        component.children?.explicitList ?? []
    }
}
