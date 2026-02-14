import Foundation
import SwiftUI

/// Resolves design token references like "{Accents.Red}" → "#ff4245".
/// Port of resolveToken() from a2ui-parser/src/index.ts.
public struct TokenResolver {
    public let tokens: [String: DesignToken]

    public init(tokens: [String: DesignToken]) {
        self.tokens = tokens
    }

    /// Resolve a value that may be a token reference.
    /// - "{Accents.Red}" → token's value ("#ff4245")
    /// - "#ff4245" → "#ff4245" (passthrough)
    /// - 16 → 16 (passthrough)
    public func resolve(_ value: JSONValue?) -> JSONValue? {
        guard let value else { return nil }
        guard let str = value.stringValue else { return value }

        // Check for token reference pattern: {token.name}
        guard str.hasPrefix("{"), str.hasSuffix("}"),
              !str.hasPrefix("${") else { return value }

        let tokenName = String(str.dropFirst().dropLast())
        if let token = tokens[tokenName] {
            // Try to return as number if it's a numeric value
            if let num = Double(token.value) {
                return .number(num)
            }
            return .string(token.value)
        }
        return value
    }

    /// Resolve a style property value.
    public func resolveStyle(_ style: [String: JSONValue]?, key: String) -> JSONValue? {
        guard let val = style?[key] else { return nil }
        return resolve(val)
    }

    /// Resolve a style property as CGFloat.
    public func resolveStyleCGFloat(_ style: [String: JSONValue]?, key: String) -> CGFloat? {
        resolveStyle(style, key: key)?.asCGFloat
    }

    /// Resolve a style property as String.
    public func resolveStyleString(_ style: [String: JSONValue]?, key: String) -> String? {
        resolveStyle(style, key: key)?.asStyleValue
    }

    /// Resolve a color from a style property (hex string → Color).
    public func resolveColor(_ style: [String: JSONValue]?, key: String) -> Color? {
        guard let hex = resolveStyleString(style, key: key) else { return nil }
        return Color(hex: hex)
    }
}

// MARK: - Color from hex

extension Color {
    public init?(hex: String) {
        var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexString.hasPrefix("#") {
            hexString.removeFirst()
        }

        guard hexString.count == 6 || hexString.count == 8 else { return nil }

        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)

        if hexString.count == 8 {
            self.init(
                red: Double((rgb >> 24) & 0xFF) / 255.0,
                green: Double((rgb >> 16) & 0xFF) / 255.0,
                blue: Double((rgb >> 8) & 0xFF) / 255.0,
                opacity: Double(rgb & 0xFF) / 255.0
            )
        } else {
            self.init(
                red: Double((rgb >> 16) & 0xFF) / 255.0,
                green: Double((rgb >> 8) & 0xFF) / 255.0,
                blue: Double(rgb & 0xFF) / 255.0
            )
        }
    }
}
