import SwiftUI

/// Renders an A2UI "Text" component as a SwiftUI Text view.
public struct A2UITextView: View {
    let component: A2UIComponent
    let tokenResolver: TokenResolver
    let dataResolver: DataBindingResolver

    public var body: some View {
        let resolvedText = dataResolver.resolve(component.text)
        let style = component.style

        let fontSize = tokenResolver.resolveStyleCGFloat(style, key: "fontSize")
        let fontWeight = tokenResolver.resolveStyleString(style, key: "fontWeight")
        let color = tokenResolver.resolveColor(style, key: "color")
        let textAlign = tokenResolver.resolveStyleString(style, key: "textAlign")
        let width = tokenResolver.resolveStyleCGFloat(style, key: "width")
        let height = tokenResolver.resolveStyleCGFloat(style, key: "height")

        Text(resolvedText)
            .if(fontSize != nil) { $0.font(.system(size: fontSize!)) }
            .if(fontWeight != nil) { $0.fontWeight(mapFontWeight(fontWeight!)) }
            .if(color != nil) { $0.foregroundColor(color!) }
            .if(textAlign != nil) { $0.multilineTextAlignment(mapTextAlignment(textAlign!)) }
            .if(width != nil || height != nil) { $0.frame(width: width, height: height) }
    }
}

private func mapTextAlignment(_ align: String) -> TextAlignment {
    switch align.lowercased() {
    case "center": return .center
    case "right": return .trailing
    default: return .leading
    }
}
