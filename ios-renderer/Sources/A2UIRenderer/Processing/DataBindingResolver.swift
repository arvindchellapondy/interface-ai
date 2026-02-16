import Foundation

/// Resolves data binding references like "${/hello_world/text}" → "Hello world".
/// Port of resolveDataBinding() from a2ui-parser/src/index.ts.
public struct DataBindingResolver {
    public let dataModel: [String: JSONValue]

    public init(dataModel: [String: JSONValue]) {
        self.dataModel = dataModel
    }

    /// Resolve a data binding reference.
    /// - "${/hello_world_our_1st_tile/text}" → "Hello world, our 1st tile!"
    /// - "Static text" → "Static text" (passthrough)
    /// - nil → ""
    public func resolve(_ value: String?) -> String {
        guard let value, !value.isEmpty else { return "" }

        // Check for data binding pattern: ${/path/to/value}
        guard value.hasPrefix("${/"), value.hasSuffix("}") else {
            return resolveTemplateTokens(value)
        }

        let path = String(value.dropFirst(3).dropLast()) // strip "${/" and "}"
        let parts = path.split(separator: "/").map(String.init)

        var current: JSONValue = .object(dataModel)
        for part in parts {
            guard let obj = current.objectValue, let next = obj[part] else {
                return resolveTemplateTokens(value) // Return original if path doesn't resolve
            }
            current = next
        }

        switch current {
        case .string(let s): return resolveTemplateTokens(s)
        case .number(let n):
            if n == n.rounded() && n < 1_000_000 {
                return String(Int(n))
            }
            return String(n)
        case .bool(let b): return String(b)
        default: return resolveTemplateTokens(value)
        }
    }

    /// Replace template tokens like {{current_time}}, {{current_date}} with device values.
    private func resolveTemplateTokens(_ text: String) -> String {
        guard text.contains("{{") else { return text }

        var result = text
        let now = Date()

        if result.contains("{{current_time}}") {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            result = result.replacingOccurrences(of: "{{current_time}}", with: formatter.string(from: now))
        }

        if result.contains("{{current_time_24h}}") {
            let formatter = DateFormatter()
            formatter.dateFormat = "HH:mm"
            result = result.replacingOccurrences(of: "{{current_time_24h}}", with: formatter.string(from: now))
        }

        if result.contains("{{current_date}}") {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            result = result.replacingOccurrences(of: "{{current_date}}", with: formatter.string(from: now))
        }

        if result.contains("{{current_day}}") {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE"
            result = result.replacingOccurrences(of: "{{current_day}}", with: formatter.string(from: now))
        }

        return result
    }
}
