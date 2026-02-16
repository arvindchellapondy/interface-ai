import SwiftUI

/// Recursively renders an A2UI component by looking up its type in the catalog.
public struct ComponentNodeView: View {
    let componentId: String
    let surface: Surface
    let tokenResolver: TokenResolver
    let dataResolver: DataBindingResolver
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    public var body: some View {
        if let component = surface.component(id: componentId) {
            renderComponent(component)
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private func renderComponent(_ component: A2UIComponent) -> some View {
        switch component.component {
        case "Text":
            A2UITextView(
                component: component,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver
            )

        case "Button":
            A2UIButtonView(
                component: component,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver,
                onAction: onAction
            )

        case "Card":
            A2UICardView(
                component: component,
                surface: surface,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver,
                onAction: onAction
            )

        case "Row":
            A2UIRowView(
                component: component,
                surface: surface,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver,
                onAction: onAction
            )

        case "Column":
            A2UIColumnView(
                component: component,
                surface: surface,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver,
                onAction: onAction
            )

        case "Icon":
            if A2UISwitchView.isSwitchIcon(component) {
                A2UISwitchView(
                    component: component,
                    tokenResolver: tokenResolver,
                    onAction: onAction
                )
            } else {
                A2UIIconView(
                    component: component,
                    tokenResolver: tokenResolver
                )
            }

        case "Switch":
            A2UISwitchView(
                component: component,
                tokenResolver: tokenResolver,
                onAction: onAction
            )

        case "Image":
            A2UIImageView(
                component: component,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver
            )

        case "TextField":
            A2UITextFieldView(
                component: component,
                surface: surface,
                tokenResolver: tokenResolver,
                dataResolver: dataResolver,
                onAction: onAction
            )

        default:
            // Fallback: render as a VStack container if it has children
            let childIds = surface.childIds(for: component)
            if !childIds.isEmpty {
                VStack {
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
            } else {
                EmptyView()
            }
        }
    }
}
