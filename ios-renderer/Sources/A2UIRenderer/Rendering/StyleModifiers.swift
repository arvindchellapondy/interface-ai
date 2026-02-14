import SwiftUI

/// Applies A2UI style properties as SwiftUI view modifiers.
/// Port of generateModifiers() from mobile-codegen/src/swiftui/generator.ts (runtime version).
public struct A2UIStyleModifier: ViewModifier {
    let style: [String: JSONValue]?
    let tokenResolver: TokenResolver

    public func body(content: Content) -> some View {
        let s = style ?? [:]
        let r = tokenResolver

        let width = r.resolveStyleCGFloat(s, key: "width")
        let height = r.resolveStyleCGFloat(s, key: "height")
        let bg = r.resolveColor(s, key: "backgroundColor")
        let radius = r.resolveStyleCGFloat(s, key: "cornerRadius")
        let opacity = r.resolveStyleCGFloat(s, key: "opacity")
        let borderColor = r.resolveColor(s, key: "borderColor")
        let borderWidth = r.resolveStyleCGFloat(s, key: "borderWidth")
        let pt = r.resolveStyleCGFloat(s, key: "paddingTop")
        let pr = r.resolveStyleCGFloat(s, key: "paddingRight")
        let pb = r.resolveStyleCGFloat(s, key: "paddingBottom")
        let pl = r.resolveStyleCGFloat(s, key: "paddingLeft")

        content
            .if(bg != nil) { $0.background(bg!) }
            .if(radius != nil) { $0.cornerRadius(radius!) }
            .if(width != nil || height != nil) {
                $0.frame(
                    width: width,
                    height: height
                )
            }
            .if(pt != nil || pr != nil || pb != nil || pl != nil) {
                $0
                    .padding(.top, pt ?? 0)
                    .padding(.trailing, pr ?? 0)
                    .padding(.bottom, pb ?? 0)
                    .padding(.leading, pl ?? 0)
            }
            .if(opacity != nil && opacity != 1) { $0.opacity(Double(opacity!)) }
            .if(borderColor != nil && borderWidth != nil) {
                $0.overlay(
                    RoundedRectangle(cornerRadius: radius ?? 0)
                        .stroke(borderColor!, lineWidth: borderWidth!)
                )
            }
    }
}

// MARK: - Font weight mapping

public func mapFontWeight(_ weight: String) -> Font.Weight {
    let w = weight.lowercased()
    if w.contains("bold") { return .bold }
    if w.contains("semibold") || w.contains("semi") { return .semibold }
    if w.contains("medium") { return .medium }
    if w.contains("light") { return .light }
    if w.contains("thin") { return .thin }
    if w.contains("heavy") || w.contains("black") { return .heavy }
    return .regular
}

// MARK: - Conditional modifier helper

extension View {
    @ViewBuilder
    func `if`<Transform: View>(_ condition: Bool, transform: (Self) -> Transform) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// MARK: - View extension for applying A2UI styles

extension View {
    public func applyA2UIStyle(_ style: [String: JSONValue]?, tokenResolver: TokenResolver) -> some View {
        modifier(A2UIStyleModifier(style: style, tokenResolver: tokenResolver))
    }
}
