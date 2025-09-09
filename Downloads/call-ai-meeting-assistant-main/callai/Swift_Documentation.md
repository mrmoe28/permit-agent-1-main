# Swift Programming Language Documentation

## Overview

Swift is a powerful and intuitive programming language developed by Apple for iOS, macOS, watchOS, and tvOS development. It's designed to be safe, fast, and expressive.

## Table of Contents

### Welcome to Swift
- **About Swift**: Understand the high-level goals of the language
- **Version Compatibility**: Learn what functionality is available in older language modes
- **A Swift Tour**: Explore the features and syntax of Swift

### Language Guide

#### The Basics
- Work with common kinds of data and write basic syntax
- Variables and constants
- Type annotations and type inference
- Comments and semicolons

#### Basic Operators
- Assignment operators
- Arithmetic operators
- Comparison operators
- Logical operators
- Range operators

#### Strings and Characters
- String literals
- String interpolation
- String mutability
- Unicode support

#### Collection Types
- Arrays
- Sets
- Dictionaries
- Mutability of collections

#### Control Flow
- For-in loops
- While loops
- Conditional statements (if, guard, switch)
- Control transfer statements

#### Functions
- Function syntax
- Function parameters and return values
- Function argument labels
- Function types
- Nested functions

#### Closures
- Closure expressions
- Trailing closures
- Capturing values
- Closures are reference types

#### Enumerations
- Enumeration syntax
- Matching enumeration values with a switch statement
- Associated values
- Raw values
- Recursive enumerations

#### Structures and Classes
- Comparing structures and classes
- Properties
- Methods
- Subscripts
- Inheritance
- Initialization
- Deinitialization
- Automatic reference counting

#### Properties
- Stored properties
- Computed properties
- Property observers
- Property wrappers
- Global and local variables
- Type properties

#### Methods
- Instance methods
- Type methods
- The self property
- Modifying value types from within instance methods

#### Subscripts
- Subscript syntax
- Subscript usage
- Subscript options

#### Inheritance
- Defining a base class
- Subclassing
- Overriding
- Preventing overrides

#### Initialization
- Setting initial values for stored properties
- Customizing initialization
- Default initializers
- Initializer delegation
- Failable initializers
- Required initializers

#### Deinitialization
- How deinitialization works
- Deinitializers in action

#### Optional Chaining
- Optional chaining as an alternative to forced unwrapping
- Defining model classes for optional chaining
- Calling properties through optional chaining
- Calling methods through optional chaining
- Accessing subscripts through optional chaining
- Linking multiple levels of chaining
- Chaining on methods with optional return values

#### Error Handling
- Representing and throwing errors
- Handling errors
- Specifying cleanup actions

#### Concurrency
- Defining and calling asynchronous functions
- Asynchronous sequences
- Calling asynchronous functions in parallel
- Tasks and task groups
- Actors

#### Macros
- Using macros to generate code at compile time

#### Type Casting
- Defining a class hierarchy for type casting
- Checking type
- Downcasting
- Type casting for any and anyobject
- Type casting for any
- Type casting for anyobject

#### Nested Types
- Nested types in action
- Referring to nested types

#### Extensions
- Extension syntax
- Computed properties
- Initializers
- Methods
- Mutating instance methods
- Subscripts
- Nested types

#### Protocols
- Protocol syntax
- Property requirements
- Method requirements
- Mutating method requirements
- Initializer requirements
- Protocols as types
- Delegation
- Adding protocol conformance with an extension
- Collections of protocol types
- Protocol inheritance
- Class-only protocols
- Protocol composition
- Checking for protocol conformance
- Optional protocol requirements
- Protocol extensions

#### Generics
- The problem that generics solve
- Generic functions
- Type parameters
- Naming type parameters
- Generic types
- Extending a generic type
- Type constraints
- Associated types
- Generic where clauses
- Extensions with a generic where clause
- Contextual where clauses
- Associated types with a generic where clause

#### Opaque and Boxed Protocol Types
- The problem that opaque types solve
- Returning an opaque type
- Differences between opaque types and protocol types

#### Automatic Reference Counting
- How arc works
- Arc in action
- Strong reference cycles between class instances
- Resolving strong reference cycles between class instances
- Strong reference cycles for closures
- Resolving strong reference cycles for closures

#### Memory Safety
- Understanding conflicting access to memory
- Conflicting access to in-out parameters
- Conflicting access to self in methods
- Conflicting access to properties

#### Access Control
- Modules and source files
- Access levels
- Access control syntax
- Custom types
- Subclassing
- Constants, variables, properties, and subscripts
- Initializers
- Protocols
- Extensions
- Generics
- Type aliases

#### Advanced Operators
- Bitwise operators
- Overflow operators
- Precedence and associativity
- Operator methods
- Custom operators

### Language Reference

#### About the Language Reference
- Read the notation that the formal grammar uses

#### Lexical Structure
- Use the lowest-level components of the syntax
- Comments
- Identifiers
- Keywords and punctuation
- Literals
- Operators

#### Types
- Use built-in named and compound types
- Type annotation
- Type identifier
- Tuple type
- Function type
- Array type
- Dictionary type
- Optional type
- Implicitly unwrapped optional type
- Protocol composition type
- Metatype type
- Any type
- Self type

#### Expressions
- Access, modify, and assign values
- Prefix expressions
- Binary expressions
- Primary expressions
- Postfix expressions

#### Statements
- Group expressions and control the flow of execution
- Loop statements
- Branch statements
- Labeled statement
- Control transfer statements
- Defer statement
- Do statement
- Compiler control statements

#### Declarations
- Introduce types, operators, variables, and other names and constructs
- Top-level code
- Code blocks
- Import declaration
- Constant declaration
- Variable declaration
- Type alias declaration
- Function declaration
- Enumeration declaration
- Structure declaration
- Class declaration
- Protocol declaration
- Initializer declaration
- Deinitializer declaration
- Extension declaration
- Subscript declaration
- Operator declaration
- Precedence group declaration

#### Attributes
- Add information to declarations and types
- Declaration attributes
- Type attributes

#### Patterns
- Match and destructure values
- Wildcard pattern
- Identifier pattern
- Value-binding pattern
- Tuple pattern
- Enumeration case pattern
- Optional pattern
- Type-casting patterns
- Expression pattern

#### Generic Parameters and Arguments
- Generalize declarations to abstract away concrete types
- Generic parameter clause
- Generic argument clause

#### Summary of the Grammar
- Read the whole formal grammar

## Key Swift Features

### Safety
- **Type Safety**: Swift is type-safe, meaning the language helps you be clear about the types of values your code can work with
- **Memory Safety**: Automatic memory management prevents common programming errors
- **Optionals**: Handle the absence of a value explicitly

### Performance
- **Fast**: Swift is designed to be fast, with performance comparable to C
- **Optimized**: The Swift compiler optimizes your code for performance

### Modern Syntax
- **Clean**: Swift has a clean, readable syntax
- **Expressive**: Powerful features like closures, generics, and protocols
- **Interactive**: Playgrounds allow you to experiment with code

### Interoperability
- **Objective-C**: Full interoperability with Objective-C
- **C**: Can import C libraries and frameworks
- **C++**: Can import C++ libraries (with some limitations)

## Getting Started

### Hello World Example
```swift
print("Hello, world!")
// Prints "Hello, world!"
```

### Basic Syntax
```swift
// Variables and constants
var myVariable = 42
let myConstant = 42

// Type annotations
var explicitDouble: Double = 70

// String interpolation
let apples = 3
let oranges = 5
let appleSummary = "I have \(apples) apples."
let fruitSummary = "I have \(apples + oranges) pieces of fruit."
```

### Control Flow
```swift
// Conditional statements
let individualScores = [75, 43, 103, 87, 12]
var teamScore = 0
for score in individualScores {
    if score > 50 {
        teamScore += 3
    } else {
        teamScore += 1
    }
}

// Optional handling
var optionalString: String? = "Hello"
print(optionalString == nil)

var optionalName: String? = "John Appleseed"
var greeting = "Hello!"
if let name = optionalName {
    greeting = "Hello, \(name)"
}
```

### Functions and Closures
```swift
// Function
func greet(person: String, day: String) -> String {
    return "Hello \(person), today is \(day)."
}
greet(person: "Bob", day: "Tuesday")

// Closure
let numbers = [20, 19, 7, 12]
let mappedNumbers = numbers.map({ number in 3 * number })
```

### Classes and Objects
```swift
class Shape {
    var numberOfSides = 0
    func simpleDescription() -> String {
        return "A shape with \(numberOfSides) sides."
    }
}

var shape = Shape()
shape.numberOfSides = 7
var shapeDescription = shape.simpleDescription()
```

## Swift API Design Guidelines

The Swift API Design Guidelines provide comprehensive principles to help developers create clear, consistent, and intuitive APIs in Swift. These guidelines emphasize clarity at the point of use, ensuring that code is both readable and maintainable.

### Core Principles

#### 1. Clarity Over Brevity
Prioritize clear and descriptive names over short, ambiguous ones.

**Good:**
```swift
func remove(at position: Index)
func move(to position: CGPoint)
func addObserver(_ observer: NSObject, forKeyPath path: String)
```

**Avoid:**
```swift
func remove(x)
func move(pos)
func add(_ observer: NSObject, for keyPath: String)
```

#### 2. Use Descriptive Names
Choose method and property names that clearly convey their purpose.

**Good:**
```swift
var isEmpty: Bool
var count: Int
func append(_ newElement: Element)
func removeLast() -> Element
```

**Avoid:**
```swift
var empty: Bool
var cnt: Int
func add(_ element: Element)
func pop() -> Element
```

#### 3. Consistent Naming Conventions
- **Methods that perform actions**: Use verbs (`append(_:)`, `remove(_:)`, `insert(_:at:)`)
- **Properties that represent state**: Use nouns (`count`, `isEmpty`, `capacity`)
- **Boolean properties**: Use `is`, `has`, or `can` prefixes (`isEnabled`, `hasChildren`, `canEdit`)

#### 4. Parameter Labels for Clarity
Utilize parameter labels to clarify the role of each argument.

**Good:**
```swift
func move(to position: CGPoint)
func insert(_ newElement: Element, at index: Int)
func replaceSubrange(_ bounds: Range<Index>, with newElements: C)
```

#### 5. Avoid Redundancy
Eliminate unnecessary words that don't add value.

**Good:**
```swift
func remove(_ element: Element)
var count: Int
```

**Avoid:**
```swift
func removeElement(_ element: Element)
var elementCount: Int
```

### Naming Conventions

#### Types and Protocols
- Use **PascalCase** for types, protocols, and enums
- Use descriptive names that indicate purpose

```swift
class AudioRecorder { }
protocol AudioProcessor { }
enum RecordingState { }
struct AudioFormat { }
```

#### Functions and Variables
- Use **camelCase** for functions, variables, and properties
- Use descriptive names that indicate purpose

```swift
func startRecording() { }
var isRecording: Bool = false
let maximumDuration: TimeInterval = 3600
```

#### Constants
- Use **camelCase** for constants
- Use descriptive names

```swift
let defaultSampleRate: Double = 44100
let maximumFileSize: Int = 100_000_000
```

### Method Design

#### Mutating vs Non-Mutating
- Use `mutating` for methods that modify the instance
- Use non-mutating for methods that return new values

```swift
// Mutating
mutating func append(_ newElement: Element)
mutating func removeLast() -> Element

// Non-mutating
func appending(_ newElement: Element) -> Array<Element>
func removingLast() -> Array<Element>
```

#### Parameter Design
- Use meaningful parameter labels
- Group related parameters
- Use default values when appropriate

```swift
func configure(
    sampleRate: Double = 44100,
    channels: Int = 2,
    bitDepth: Int = 16
) { }
```

### Error Handling

#### Use Descriptive Error Types
```swift
enum AudioError: Error {
    case invalidFormat
    case permissionDenied
    case deviceUnavailable
    case recordingFailed(reason: String)
}
```

#### Use `throws` for Operations That Can Fail
```swift
func startRecording() throws
func saveToFile(at url: URL) throws
```

### Property Design

#### Use Computed Properties for Derived Values
```swift
var duration: TimeInterval {
    return endTime - startTime
}

var isComplete: Bool {
    return status == .completed
}
```

#### Use Property Observers for Side Effects
```swift
var isRecording: Bool = false {
    didSet {
        updateUI()
        if isRecording {
            startTimer()
        } else {
            stopTimer()
        }
    }
}
```

### Protocol Design

#### Use Protocols for Abstractions
```swift
protocol AudioProcessor {
    func process(_ audioData: Data) -> Data
    var isEnabled: Bool { get set }
}

protocol AudioRecorderDelegate: AnyObject {
    func recorderDidStart(_ recorder: AudioRecorder)
    func recorderDidStop(_ recorder: AudioRecorder)
    func recorder(_ recorder: AudioRecorder, didEncounterError error: Error)
}
```

### Extension Guidelines

#### Use Extensions for Organization
```swift
// MARK: - Audio Processing
extension AudioRecorder {
    func normalizeAudio() { }
    func applyFilter(_ filter: AudioFilter) { }
}

// MARK: - File Management
extension AudioRecorder {
    func saveToFile(at url: URL) throws { }
    func loadFromFile(at url: URL) throws { }
}
```

## Best Practices

1. **Use meaningful names**: Choose descriptive names for variables, functions, and types
2. **Leverage type safety**: Use optionals and type checking to prevent runtime errors
3. **Follow Swift conventions**: Use camelCase for variables and functions, PascalCase for types
4. **Use guard statements**: For early returns and cleaner code flow
5. **Prefer value types**: Use structs and enums when possible
6. **Use protocols**: Define interfaces and abstractions with protocols
7. **Handle errors properly**: Use Swift's error handling mechanisms
8. **Write tests**: Use XCTest framework for unit testing
9. **Follow API Design Guidelines**: Apply the principles above for consistent, clear APIs

## Resources

- [Swift.org](https://swift.org) - Official Swift website
- [Apple Developer Documentation](https://developer.apple.com/documentation/swift) - Official Apple documentation
- [Swift Playgrounds](https://apps.apple.com/app/swift-playgrounds/id908519492) - Interactive learning app
- [Swift Evolution](https://github.com/apple/swift-evolution) - Swift language evolution process

## AVFoundation Framework Documentation

### AVCaptureDevice
- [AVCaptureDevice Class Reference](https://developer.apple.com/documentation/avfoundation/avcapturedevice) - Core documentation for device enumeration and properties
- [AVCaptureDevice.DiscoverySession](https://developer.apple.com/documentation/avfoundation/avcapturedevice/discoverysession) - Device discovery methods
- [AVCaptureDevice.DeviceType](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype) - Available device types

### Audio Channel Layout
- [AVAudioSession](https://developer.apple.com/documentation/avfoundation/avaudiosession) - Audio session management and channel layout access
- [AVAudioSessionPortDescription](https://developer.apple.com/documentation/avfoundation/avaudiosessionportdescription) - Audio port information including channel layout
- [Still and Video Media Capture](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/AVFoundationPG/Articles/04_MediaCapture.html) - Comprehensive media capture guide

### Device Types for Discovery
- `.microphone` - Built-in microphone devices
- `.externalUnknown` - External audio devices (USB interfaces, etc.)
- `.builtInMicrophone` - Deprecated in macOS 14.0, use `.microphone` instead

---

*This documentation is based on the official Swift programming language documentation and is intended for educational purposes.*
