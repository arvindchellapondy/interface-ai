import SwiftUI

/// Renders an A2UI "Button" component as a SwiftUI Button.
public struct A2UIButtonView: View {
    let component: A2UIComponent
    let tokenResolver: TokenResolver
    let dataResolver: DataBindingResolver
    var onAction: ((String, [String: JSONValue]?) -> Void)?

    public var body: some View {
        let label = dataResolver.resolve(component.label)
        let lStyle = component.labelStyle

        let labelFontSize = tokenResolver.resolveStyleCGFloat(lStyle, key: "fontSize")
        let labelFontWeight = tokenResolver.resolveStyleString(lStyle, key: "fontWeight")
        let labelFontFamily = tokenResolver.resolveStyleString(lStyle, key: "fontFamily")
        let labelColor = tokenResolver.resolveColor(lStyle, key: "color")

        Button(action: {
            if let action = component.action {
                onAction?(action.event.name, action.event.context)
            }
        }) {
            Text(label)
                .if(labelFontFamily != nil && labelFontSize != nil) {
                    $0.font(.custom(labelFontFamily!, size: labelFontSize!))
                }
                .if(labelFontFamily == nil && labelFontSize != nil) {
                    $0.font(.system(size: labelFontSize!))
                }
                .if(labelFontWeight != nil) { $0.fontWeight(mapFontWeight(labelFontWeight!)) }
                .if(labelColor != nil) { $0.foregroundColor(labelColor!) }
        }
        .buttonStyle(.plain)
        .applyA2UIStyle(component.style, tokenResolver: tokenResolver)
    }
}
