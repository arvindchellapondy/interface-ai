import SwiftUI

/// Renders an A2UI "Row" component as an HStack.
public struct A2UIRowView: View {
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

        HStack(alignment: mapVerticalAlignment(crossAlign), spacing: gap ?? 0) {
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

private func mapVerticalAlignment(_ align: String?) -> VerticalAlignment {
    switch align?.lowercased() {
    case "center": return .center
    case "max": return .bottom
    case "baseline": return .firstTextBaseline
    default: return .top
    }
}
