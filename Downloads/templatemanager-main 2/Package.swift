// swift-tools-version: 5.8
import PackageDescription

let package = Package(
    name: "TemplateManager",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(
            name: "TemplateManager",
            targets: ["TemplateManager"]
        )
    ],
    targets: [
        .executableTarget(
            name: "TemplateManager",
            path: "TemplateManager",
            resources: [
                .copy("Resources")
            ]
        )
    ]
)