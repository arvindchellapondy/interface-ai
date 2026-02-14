// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "A2UIRenderer",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "A2UIRenderer",
            targets: ["A2UIRenderer"]
        ),
    ],
    targets: [
        .target(
            name: "A2UIRenderer",
            path: "Sources/A2UIRenderer"
        ),
        .testTarget(
            name: "A2UIRendererTests",
            dependencies: ["A2UIRenderer"],
            path: "Tests/A2UIRendererTests"
        ),
    ]
)
