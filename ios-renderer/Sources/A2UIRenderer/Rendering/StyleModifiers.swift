import SwiftUI

/// Applies A2UI style properties as SwiftUI view modifiers.
/// Order matters in SwiftUI: padding → background → clip → border → frame
public struct A2UIStyleModifier: ViewModifier {
    let style: [String: JSONValue]?
    let tokenResolver: TokenResolver

    public func body(content: Content) -> some View {
        let s = style ?? [:]
        let r = tokenResolver

        let width = r.resolveStyleCGFloat(s, key: "width")
        let height = r.resolveStyleCGFloat(s, key: "height")
        let bg = r.resolveColor(s, key: "backgroundColor")
        let radius = r.resolveStyleCGFloat(s, key: "cornerRadius") ?? 0
        let opacity = r.resolveStyleCGFloat(s, key: "opacity")
        let borderColor = r.resolveColor(s, key: "borderColor")
        let borderWidth = r.resolveStyleCGFloat(s, key: "borderWidth")
        let pt = r.resolveStyleCGFloat(s, key: "paddingTop")
        let pr = r.resolveStyleCGFloat(s, key: "paddingRight")
        let pb = r.resolveStyleCGFloat(s, key: "paddingBottom")
        let pl = r.resolveStyleCGFloat(s, key: "paddingLeft")
        let alignment = r.resolveStyleString(s, key: "textAlign")
        let layoutSizingH = r.resolveStyleString(s, key: "layoutSizingHorizontal")
        let layoutSizingV = r.resolveStyleString(s, key: "layoutSizingVertical")

        // Parse shadow array: [{x, y, blur, color}]
        let shadowValues = parseShadows(style: s)

        let effectiveWidth: CGFloat? = layoutSizingH == "fill" ? nil : (layoutSizingH == "hug" ? nil : width)
        let effectiveHeight: CGFloat? = layoutSizingV == "fill" ? nil : (layoutSizingV == "hug" ? nil : height)
        let maxW: CGFloat? = layoutSizingH == "fill" ? .infinity : nil
        let maxH: CGFloat? = layoutSizingV == "fill" ? .infinity : nil

        content
            // 1. Inner padding first
            .if(pt != nil || pr != nil || pb != nil || pl != nil) {
                $0
                    .padding(.top, pt ?? 0)
                    .padding(.trailing, pr ?? 0)
                    .padding(.bottom, pb ?? 0)
                    .padding(.leading, pl ?? 0)
            }
            // 2. Frame size
            .if(effectiveWidth != nil || effectiveHeight != nil) {
                $0.frame(
                    width: effectiveWidth,
                    height: effectiveHeight,
                    alignment: mapAlignment(alignment)
                )
            }
            // 2b. Fill sizing (maxWidth/maxHeight)
            .if(maxW != nil || maxH != nil) {
                $0.frame(
                    maxWidth: maxW,
                    maxHeight: maxH,
                    alignment: mapAlignment(alignment)
                )
            }
            // 3. Background clipped to corner radius
            .if(bg != nil) {
                $0.background(bg!.opacity(1), in: RoundedRectangle(cornerRadius: radius))
            }
            // 4. Clip content to shape
            .if(radius > 0) { $0.clipShape(RoundedRectangle(cornerRadius: radius)) }
            // 5. Border overlay
            .if(borderColor != nil && borderWidth != nil) {
                $0.overlay(
                    RoundedRectangle(cornerRadius: radius)
                        .stroke(borderColor!, lineWidth: borderWidth!)
                )
            }
            // 6. Shadow
            .if(!shadowValues.isEmpty) {
                $0.shadow(
                    color: shadowValues[0].color,
                    radius: shadowValues[0].blur / 2,
                    x: shadowValues[0].x,
                    y: shadowValues[0].y
                )
            }
            // 7. Opacity
            .if(opacity != nil && opacity != 1) { $0.opacity(Double(opacity!)) }
    }
}

// MARK: - Font weight mapping

public func mapFontWeight(_ weight: String) -> Font.Weight {
    let w = weight.lowercased()
    if w.contains("bold") && !w.contains("semi") { return .bold }
    if w.contains("semibold") || w.contains("semi") { return .semibold }
    if w.contains("medium") { return .medium }
    if w.contains("light") { return .light }
    if w.contains("thin") { return .thin }
    if w.contains("heavy") || w.contains("black") { return .heavy }
    return .regular
}

// MARK: - Shadow parsing

private struct ShadowValue {
    let x: CGFloat
    let y: CGFloat
    let blur: CGFloat
    let color: Color
}

private func parseShadows(style: [String: JSONValue]) -> [ShadowValue] {
    guard let shadowsVal = style["shadows"],
          case .array(let arr) = shadowsVal else { return [] }

    var result: [ShadowValue] = []
    for item in arr {
        guard case .object(let obj) = item else { continue }
        let x = obj["x"]?.asCGFloat ?? 0
        let y = obj["y"]?.asCGFloat ?? 0
        let blur = obj["blur"]?.asCGFloat ?? 0
        let colorHex = obj["color"]?.stringValue ?? "#000000"
        let color = Color(hex: colorHex) ?? .black.opacity(0.25)
        result.append(ShadowValue(x: x, y: y, blur: blur, color: color))
    }
    return result
}

// MARK: - Alignment mapping

private func mapAlignment(_ textAlign: String?) -> Alignment {
    switch textAlign?.lowercased() {
    case "center": return .center
    case "right": return .trailing
    default: return .center // default center for A2UI
    }
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
