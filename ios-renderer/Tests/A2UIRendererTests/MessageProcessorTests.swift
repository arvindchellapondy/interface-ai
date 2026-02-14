import Testing
@testable import A2UIRenderer

@Test func testParsesTileHelloMessages() throws {
    let json = """
    [
      {
        "createSurface": {
          "surfaceId": "tile_hello",
          "designTokens": {
            "Accents.Red": { "value": "#ff4245", "collection": "Colors" }
          }
        }
      },
      {
        "updateComponents": {
          "surfaceId": "tile_hello",
          "components": [
            { "id": "text1", "component": "Text", "text": "${/text1/content}" },
            { "id": "root", "component": "Card", "children": { "explicitList": ["text1"] } }
          ]
        }
      },
      {
        "updateDataModel": {
          "surfaceId": "tile_hello",
          "path": "/",
          "value": { "text1": { "content": "Hello!" } }
        }
      }
    ]
    """

    let processor = MessageProcessor()
    let surface = try processor.processJSON(json)

    #expect(surface != nil)
    #expect(surface?.surfaceId == "tile_hello")
    #expect(surface?.components.count == 2)
    #expect(surface?.designTokens["Accents.Red"]?.value == "#ff4245")
    #expect(surface?.dataModel["text1"]?.objectValue?["content"]?.stringValue == "Hello!")
}

@Test func testTokenResolution() {
    let tokens: [String: DesignToken] = [
        "Accents.Red": DesignToken(value: "#ff4245", collection: "Colors"),
        "Spacing.sm": DesignToken(value: "4", collection: "Spacing"),
    ]
    let resolver = TokenResolver(tokens: tokens)

    // Token reference resolves
    #expect(resolver.resolve(.string("{Accents.Red}"))?.asStyleValue == "#ff4245")
    #expect(resolver.resolve(.string("{Spacing.sm}"))?.asCGFloat == 4)

    // Non-token passes through
    #expect(resolver.resolve(.string("#000000"))?.asStyleValue == "#000000")
    #expect(resolver.resolve(.number(16))?.asCGFloat == 16)

    // Data binding is NOT a token (should pass through)
    #expect(resolver.resolve(.string("${/some/path}"))?.stringValue == "${/some/path}")
}

@Test func testDataBindingResolution() {
    let dataModel: [String: JSONValue] = [
        "hello": .object(["text": .string("Hello world!")]),
        "button": .object(["label": .string("Click me")])
    ]
    let resolver = DataBindingResolver(dataModel: dataModel)

    #expect(resolver.resolve("${/hello/text}") == "Hello world!")
    #expect(resolver.resolve("${/button/label}") == "Click me")
    #expect(resolver.resolve("Static text") == "Static text")
    #expect(resolver.resolve(nil) == "")
    #expect(resolver.resolve("${/nonexistent/path}") == "${/nonexistent/path}")
}
