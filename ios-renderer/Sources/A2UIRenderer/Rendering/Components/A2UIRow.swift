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

        HStack(spacing: gap ?? 0) {
            ForEach(childIds, id: \.self) { childId in
                ComponentNodeView(
                    componentId: childId,
                    surface: surface,
                    tokenResolver: tokenResolver,
                    dataResolver: dataResolver,
                    onAction: onAction
                )
            }
        }
        .applyA2UIStyle(component.style, tokenResolver: tokenResolver)
    }
}
