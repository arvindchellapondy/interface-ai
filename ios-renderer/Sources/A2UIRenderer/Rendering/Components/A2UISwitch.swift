import SwiftUI

/// Renders an A2UI "Switch" component as a native SwiftUI Toggle.
/// Also handles Icon components with switch-like iconNames from Figma exports.
public struct A2UISwitchView: View {
    let component: A2UIComponent
    let tokenResolver: TokenResolver
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    @State private var isOn: Bool = false

    public var body: some View {
        let width = tokenResolver.resolveStyleCGFloat(component.style, key: "width") ?? 51
        let height = tokenResolver.resolveStyleCGFloat(component.style, key: "height") ?? 31
        let scale = min(width / 51, height / 31) // scale relative to default Toggle size

        Toggle("", isOn: $isOn)
            .labelsHidden()
            .scaleEffect(scale)
            .frame(width: width, height: height)
            .onChange(of: isOn) { _, newValue in
                if let action = component.action {
                    onAction?(action.event.name, ["isOn": .bool(newValue)])
                } else {
                    onAction?("switch_toggled", ["componentId": .string(component.id), "isOn": .bool(newValue)])
                }
            }
    }

    /// Returns true if an Icon component should be rendered as a native Switch.
    static func isSwitchIcon(_ component: A2UIComponent) -> Bool {
        guard component.component == "Icon" else { return false }
        let iconName = component["iconName"]?.stringValue?.lowercased() ?? ""
        return iconName.contains("switch") || iconName.contains("toggle")
    }
}
