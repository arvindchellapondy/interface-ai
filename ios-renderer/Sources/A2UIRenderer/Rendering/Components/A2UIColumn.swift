import SwiftUI

/// Renders an A2UI "Column" component as a VStack.
public struct A2UIColumnView: View {
    let component: A2UIComponent
    let surface: Surface
    let tokenResolver: TokenResolver
    let dataResolver: DataBindingResolver
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    public var body: some View {
        let gap = tokenResolver.resolveStyleCGFloat(component.style, key: "gap")
        let childIds = surface.childIds(for: component)
        let crossAlign = tokenResolver.resolveStyleString(component.style, key: "crossAxisAlignment")
        let mainAlign = tokenResolver.resolveStyleString(component.style, key: "mainAxisAlignment")

        VStack(alignment: mapHorizontalAlignment(crossAlign), spacing: gap ?? 0) {
            if mainAlign == "center" || mainAlign == "max" {
                Spacer(minLength: 0)
            }
            ForEach(childIds, id: \.self) { childId in
                if mainAlign == "space_between" {
                    ComponentNodeView(
                        componentId: childId,
                        surface: surface,
                        tokenResolver: tokenResolver,
                        dataResolver: dataResolver,
                        onAction: onAction
                    )
                    if childId != childIds.last {
                        Spacer(minLength: 0)
                    }
                } else {
                    ComponentNodeView(
                        componentId: childId,
                        surface: surface,
                        tokenResolver: tokenResolver,
                        dataResolver: dataResolver,
                        onAction: onAction
                    )
                }
            }
            if mainAlign == "center" {
                Spacer(minLength: 0)
            }
        }
        .applyA2UIStyle(component.style, tokenResolver: tokenResolver)
    }
}

private func mapHorizontalAlignment(_ align: String?) -> HorizontalAlignment {
    switch align?.lowercased() {
    case "center": return .center
    case "max": return .trailing
    default: return .leading
    }
}
