import SwiftUI

/// Renders an A2UI "TextField" component as a native SwiftUI TextField.
///
/// The A2UI schema defines TextField in two forms:
/// 1. **Input field** — children contain a single Text component used as placeholder
/// 2. **Wrapper** — children contain the input field + supporting text (rendered as VStack)
public struct A2UITextFieldView: View {
    let component: A2UIComponent
    let surface: Surface
    let tokenResolver: TokenResolver
    let dataResolver: DataBindingResolver
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    @State private var inputText: String = ""

    public var body: some View {
        let childIds = surface.childIds(for: component)

        if isInputField(childIds: childIds) {
            // This is the actual input field — render a native TextField
            let placeholder = extractPlaceholder(childIds: childIds)
            let style = component.style
            let fontSize = tokenResolver.resolveStyleCGFloat(style, key: "fontSize")
            let fontFamily = tokenResolver.resolveStyleString(style, key: "fontFamily")
            let color = tokenResolver.resolveColor(style, key: "color")
                ?? placeholderColor(childIds: childIds)

            TextField(placeholder, text: $inputText)
                .if(fontFamily != nil && fontSize != nil) {
                    $0.font(.custom(fontFamily!, size: fontSize!))
                }
                .if(fontFamily == nil && fontSize != nil) {
                    $0.font(.system(size: fontSize!))
                }
                .if(fontFamily == nil && fontSize == nil) {
                    $0.font(.system(size: placeholderFontSize(childIds: childIds)))
                }
                .if(color != nil) { $0.foregroundColor(color!) }
                .applyA2UIStyle(component.style, tokenResolver: tokenResolver)
        } else {
            // This is a wrapper — render as VStack container
            let gap = tokenResolver.resolveStyleCGFloat(component.style, key: "gap")
            let crossAlign = tokenResolver.resolveStyleString(component.style, key: "crossAxisAlignment")

            VStack(alignment: mapHorizontalAlignment(crossAlign), spacing: gap ?? 0) {
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

    /// Returns true if all children are Text components (this is the actual input field)
    private func isInputField(childIds: [String]) -> Bool {
        guard !childIds.isEmpty else { return true }
        return childIds.allSatisfy { childId in
            surface.component(id: childId)?.component == "Text"
        }
    }

    /// Extract placeholder text from child Text components
    private func extractPlaceholder(childIds: [String]) -> String {
        for childId in childIds {
            if let child = surface.component(id: childId), child.component == "Text" {
                return dataResolver.resolve(child.text)
            }
        }
        return ""
    }

    /// Extract font size from child Text component for the placeholder
    private func placeholderFontSize(childIds: [String]) -> CGFloat {
        for childId in childIds {
            if let child = surface.component(id: childId), child.component == "Text" {
                if let size = tokenResolver.resolveStyleCGFloat(child.style, key: "fontSize") {
                    return size
                }
            }
        }
        return 14
    }

    /// Extract text color from child Text component
    private func placeholderColor(childIds: [String]) -> Color? {
        for childId in childIds {
            if let child = surface.component(id: childId), child.component == "Text" {
                return tokenResolver.resolveColor(child.style, key: "color")
            }
        }
        return nil
    }
}

private func mapHorizontalAlignment(_ align: String?) -> HorizontalAlignment {
    switch align?.lowercased() {
    case "center": return .center
    case "max": return .trailing
    default: return .leading
    }
}
