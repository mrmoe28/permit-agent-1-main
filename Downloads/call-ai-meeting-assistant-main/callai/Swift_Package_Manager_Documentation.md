# Swift Package Manager Documentation

## Overview

Swift Package Manager is a tool for managing the distribution of Swift code. It's integrated with the Swift build system to automate the process of downloading, compiling, and linking dependencies.

## Table of Contents

### Getting Started
- [Using the Package Manager](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/using-the-package-manager)
- [Creating a Package](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/creating-a-package)
- [Publishing a Package](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/publishing-a-package)

### Package Manager Reference
- [Package Manager Commands](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/package-manager-commands)
- [Package Manager Configuration](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/package-manager-configuration)
- [Package Manager Plugins](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/package-manager-plugins)

### Package Manager Plugins
- [Package Manager Plugins](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/package-manager-plugins)
- [Package Manager Plugins](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/package-manager-plugins)

## Getting Started

### Using the Package Manager

Swift Package Manager is integrated with the Swift build system. You can use it to:

- **Add dependencies** to your project
- **Build and test** your code
- **Publish packages** to share with others

#### Basic Commands

```bash
# Initialize a new package
swift package init

# Build the package
swift build

# Run tests
swift test

# Generate Xcode project
swift package generate-xcodeproj

# Update dependencies
swift package update

# Resolve dependencies
swift package resolve
```

### Creating a Package

A Swift package is a collection of Swift source files and a manifest file. The manifest file, `Package.swift`, defines the package's name, its contents, and its dependencies.

#### Package Structure

```
MyPackage/
├── Package.swift
├── README.md
├── Sources/
│   └── MyPackage/
│       └── MyPackage.swift
└── Tests/
    └── MyPackageTests/
        └── MyPackageTests.swift
```

#### Package.swift Example

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyPackage",
    platforms: [
        .macOS(.v10_15),
        .iOS(.v13),
        .watchOS(.v6),
        .tvOS(.v13)
    ],
    products: [
        .library(
            name: "MyPackage",
            targets: ["MyPackage"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-algorithms", from: "1.0.0"),
    ],
    targets: [
        .target(
            name: "MyPackage",
            dependencies: ["Algorithms"]),
        .testTarget(
            name: "MyPackageTests",
            dependencies: ["MyPackage"]),
    ]
)
```

### Publishing a Package

To publish a package:

1. **Create a Git repository** for your package
2. **Add a version tag** (e.g., `1.0.0`)
3. **Push to a public repository** (GitHub, GitLab, etc.)
4. **Share the repository URL** with others

#### Version Tagging

```bash
# Create and push a version tag
git tag 1.0.0
git push origin 1.0.0
```

## Package Manager Reference

### Package Manager Commands

#### `swift package init`

Creates a new Swift package in the current directory.

```bash
swift package init --type library
swift package init --type executable
swift package init --type system-module
```

#### `swift build`

Builds the package and its dependencies.

```bash
swift build
swift build --configuration release
swift build --target MyTarget
```

#### `swift test`

Runs the package's tests.

```bash
swift test
swift test --parallel
swift test --filter MyTestClass
```

#### `swift run`

Runs an executable target.

```bash
swift run MyExecutable
swift run MyExecutable --argument value
```

#### `swift package resolve`

Resolves package dependencies.

```bash
swift package resolve
```

#### `swift package update`

Updates package dependencies to their latest versions.

```bash
swift package update
swift package update MyDependency
```

#### `swift package show-dependencies`

Shows the dependency tree.

```bash
swift package show-dependencies
swift package show-dependencies --format json
```

### Package Manager Configuration

#### Package.swift Manifest

The `Package.swift` file is the manifest for your package. It defines:

- **Package name** and metadata
- **Platform requirements**
- **Products** (libraries, executables)
- **Dependencies**
- **Targets** and their configurations

#### Platform Requirements

```swift
let package = Package(
    name: "MyPackage",
    platforms: [
        .macOS(.v10_15),    // macOS 10.15+
        .iOS(.v13),         // iOS 13+
        .watchOS(.v6),      // watchOS 6+
        .tvOS(.v13),        // tvOS 13+
        .visionOS(.v1)      // visionOS 1+
    ],
    // ...
)
```

#### Products

```swift
products: [
    .library(
        name: "MyLibrary",
        targets: ["MyLibrary"]),
    .executable(
        name: "MyTool",
        targets: ["MyTool"]),
]
```

#### Dependencies

```swift
dependencies: [
    // From a Git repository
    .package(url: "https://github.com/apple/swift-algorithms", from: "1.0.0"),
    
    // From a local path
    .package(path: "../MyLocalPackage"),
    
    // With specific branch
    .package(url: "https://github.com/user/repo", .branch("main")),
    
    // With specific revision
    .package(url: "https://github.com/user/repo", .revision("abc123")),
]
```

#### Targets

```swift
targets: [
    .target(
        name: "MyTarget",
        dependencies: ["Algorithms"],
        path: "Sources/MyTarget",
        sources: ["MyTarget.swift"],
        resources: [
            .process("Resources")
        ],
        swiftSettings: [
            .define("MY_FLAG")
        ],
        linkerSettings: [
            .linkedLibrary("sqlite3")
        ]
    ),
    .testTarget(
        name: "MyTargetTests",
        dependencies: ["MyTarget"]
    ),
    .executableTarget(
        name: "MyExecutable",
        dependencies: ["MyTarget"]
    )
]
```

### Package Manager Plugins

Swift Package Manager supports plugins that can extend the build process.

#### Build Tool Plugins

```swift
.target(
    name: "MyTarget",
    plugins: ["MyBuildToolPlugin"]
),
.plugin(
    name: "MyBuildToolPlugin",
    capability: .buildTool(),
    dependencies: ["MyBuildTool"]
)
```

#### Command Plugins

```swift
.plugin(
    name: "MyCommandPlugin",
    capability: .command(
        intent: .custom(verb: "my-command", description: "My custom command")
    )
)
```

## Advanced Features

### Conditional Dependencies

```swift
dependencies: [
    .package(url: "https://github.com/apple/swift-algorithms", from: "1.0.0"),
    .package(url: "https://github.com/apple/swift-collections", from: "1.0.0"),
]

targets: [
    .target(
        name: "MyTarget",
        dependencies: [
            .product(name: "Algorithms", package: "swift-algorithms"),
            .product(name: "Collections", package: "swift-collections", condition: .when(platforms: [.macOS, .iOS]))
        ]
    )
]
```

### Resources

```swift
.target(
    name: "MyTarget",
    resources: [
        .process("Resources"),           // Process and optimize
        .copy("StaticFiles"),            // Copy as-is
        .embedInCode("EmbeddedData.bin") // Embed in binary
    ]
)
```

### Build Settings

```swift
.target(
    name: "MyTarget",
    swiftSettings: [
        .define("DEBUG", .when(configuration: .debug)),
        .unsafeFlags(["-Xfrontend", "-warn-long-function-bodies=100"])
    ],
    cSettings: [
        .define("MY_C_FLAG"),
        .headerSearchPath("include")
    ],
    linkerSettings: [
        .linkedLibrary("sqlite3"),
        .linkedFramework("Foundation")
    ]
)
```

### Binary Dependencies

```swift
dependencies: [
    .binaryTarget(
        name: "MyBinary",
        path: "MyBinary.xcframework"
    )
]
```

## Best Practices

### Package Design

1. **Single Responsibility**: Each package should have a clear, single purpose
2. **Semantic Versioning**: Use semantic versioning for releases
3. **Documentation**: Include comprehensive README and API documentation
4. **Testing**: Write tests for all public APIs
5. **Platform Support**: Clearly specify supported platforms

### Dependency Management

1. **Minimal Dependencies**: Only include necessary dependencies
2. **Version Pinning**: Pin to specific versions for stability
3. **Regular Updates**: Keep dependencies up to date
4. **Security**: Audit dependencies for security vulnerabilities

### Performance

1. **Lazy Loading**: Use lazy loading for heavy dependencies
2. **Conditional Compilation**: Use conditional compilation for platform-specific code
3. **Resource Optimization**: Optimize resources and assets
4. **Build Optimization**: Use appropriate build configurations

## Troubleshooting

### Common Issues

#### Dependency Resolution Failures

```bash
# Clean and resolve
swift package clean
swift package resolve
```

#### Build Failures

```bash
# Clean build
swift package clean
swift build
```

#### Test Failures

```bash
# Run specific tests
swift test --filter TestClassName
```

### Debug Commands

```bash
# Verbose build output
swift build --verbose

# Show dependency tree
swift package show-dependencies

# Check package configuration
swift package describe --type json
```

## Integration with Xcode

### Adding Package Dependencies in Xcode

1. **File → Add Package Dependencies**
2. **Enter repository URL**
3. **Select version rules**
4. **Add to target**

### Package.swift in Xcode

- Xcode automatically recognizes `Package.swift` files
- Provides syntax highlighting and autocompletion
- Shows package structure in navigator
- Integrates with build system

## Resources

- [Swift Package Manager Documentation](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/)
- [Swift Package Manager GitHub Repository](https://github.com/apple/swift-package-manager)
- [Swift Package Index](https://swiftpackageindex.com/)
- [Swift Package Manager Evolution](https://github.com/apple/swift-evolution)

## Examples

### Simple Library Package

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "StringUtilities",
    products: [
        .library(
            name: "StringUtilities",
            targets: ["StringUtilities"]),
    ],
    targets: [
        .target(
            name: "StringUtilities",
            dependencies: []),
        .testTarget(
            name: "StringUtilitiesTests",
            dependencies: ["StringUtilities"]),
    ]
)
```

### Executable Package

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyCLI",
    platforms: [.macOS(.v10_15)],
    products: [
        .executable(
            name: "mycli",
            targets: ["MyCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "MyCLI",
            dependencies: [.product(name: "ArgumentParser", package: "swift-argument-parser")]),
    ]
)
```

---

*This documentation is based on the official Swift Package Manager documentation from [docs.swift.org](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/) and is intended for educational purposes.*
