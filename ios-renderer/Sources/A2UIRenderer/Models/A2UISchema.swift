import Foundation

// MARK: - Design Token

public struct DesignToken: Codable, Sendable {
    public let value: String
    public let collection: String
}

// MARK: - Child References

public struct ChildList: Codable, Sendable {
    public var explicitList: [String]?

    public struct Template: Codable, Sendable {
        public let dataPath: String
        public let componentId: String
    }
    public var template: Template?
}

// MARK: - Action

public struct ActionEvent: Codable, Sendable {
    public let name: String
    public var context: [String: JSONValue]?
}

public struct ComponentAction: Codable, Sendable {
    public let event: ActionEvent
}

// MARK: - Component

public struct A2UIComponent: Codable, Sendable {
    public let id: String
    public let component: String
    public var children: ChildList?
    public var text: String?
    public var label: String?
    public var action: ComponentAction?
    public var style: [String: JSONValue]?
    public var labelStyle: [String: JSONValue]?

    // Catch-all for unknown properties
    private var additionalProperties: [String: JSONValue] = [:]

    enum CodingKeys: String, CodingKey {
        case id, component, children, text, label, action, style, labelStyle
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        component = try container.decode(String.self, forKey: .component)
        children = try container.decodeIfPresent(ChildList.self, forKey: .children)
        text = try container.decodeIfPresent(String.self, forKey: .text)
        label = try container.decodeIfPresent(String.self, forKey: .label)
        action = try container.decodeIfPresent(ComponentAction.self, forKey: .action)
        style = try container.decodeIfPresent([String: JSONValue].self, forKey: .style)
        labelStyle = try container.decodeIfPresent([String: JSONValue].self, forKey: .labelStyle)

        // Decode additional properties
        let allKeysContainer = try decoder.container(keyedBy: DynamicCodingKey.self)
        let knownKeys = Set(CodingKeys.allCases.map { $0.stringValue })
        for key in allKeysContainer.allKeys {
            if !knownKeys.contains(key.stringValue) {
                if let value = try? allKeysContainer.decode(JSONValue.self, forKey: key) {
                    additionalProperties[key.stringValue] = value
                }
            }
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(component, forKey: .component)
        try container.encodeIfPresent(children, forKey: .children)
        try container.encodeIfPresent(text, forKey: .text)
        try container.encodeIfPresent(label, forKey: .label)
        try container.encodeIfPresent(action, forKey: .action)
        try container.encodeIfPresent(style, forKey: .style)
        try container.encodeIfPresent(labelStyle, forKey: .labelStyle)
    }

    public subscript(key: String) -> JSONValue? {
        additionalProperties[key]
    }
}

extension A2UIComponent.CodingKeys: CaseIterable {}

// MARK: - Messages

public struct CreateSurface: Codable, Sendable {
    public let surfaceId: String
    public var catalogId: String?
    public var sendDataModel: Bool?
    public var designTokens: [String: DesignToken]?
}

public struct UpdateComponents: Codable, Sendable {
    public let surfaceId: String
    public let components: [A2UIComponent]
}

public struct UpdateDataModel: Codable, Sendable {
    public let surfaceId: String
    public var path: String?
    public var value: JSONValue
}

public struct DeleteSurface: Codable, Sendable {
    public let surfaceId: String
}

// MARK: - Message Envelope

/// A2UI message: exactly one of these keys is present.
public enum A2UIMessage: Codable, Sendable {
    case createSurface(CreateSurface)
    case updateComponents(UpdateComponents)
    case updateDataModel(UpdateDataModel)
    case deleteSurface(DeleteSurface)

    enum CodingKeys: String, CodingKey {
        case createSurface
        case updateComponents
        case updateDataModel
        case deleteSurface
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let cs = try container.decodeIfPresent(CreateSurface.self, forKey: .createSurface) {
            self = .createSurface(cs)
        } else if let uc = try container.decodeIfPresent(UpdateComponents.self, forKey: .updateComponents) {
            self = .updateComponents(uc)
        } else if let udm = try container.decodeIfPresent(UpdateDataModel.self, forKey: .updateDataModel) {
            self = .updateDataModel(udm)
        } else if let ds = try container.decodeIfPresent(DeleteSurface.self, forKey: .deleteSurface) {
            self = .deleteSurface(ds)
        } else {
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: container.codingPath, debugDescription: "Unknown A2UI message type")
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .createSurface(let cs): try container.encode(cs, forKey: .createSurface)
        case .updateComponents(let uc): try container.encode(uc, forKey: .updateComponents)
        case .updateDataModel(let udm): try container.encode(udm, forKey: .updateDataModel)
        case .deleteSurface(let ds): try container.encode(ds, forKey: .deleteSurface)
        }
    }
}

// MARK: - Helpers

private struct DynamicCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?

    init?(stringValue: String) {
        self.stringValue = stringValue
        self.intValue = nil
    }

    init?(intValue: Int) {
        self.stringValue = String(intValue)
        self.intValue = intValue
    }
}
