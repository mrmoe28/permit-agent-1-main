# Swift Programming Language Best Practices Reference

## Documentation Source
- **Swift Programming Language Guide**: https://docs.swift.org/swift-book/documentation/the-swift-programming-language/

## Key Swift Best Practices for CallAI Project

### View Protocol Conformance
- All SwiftUI views must conform to the `View` protocol
- Each struct conforming to `View` must have exactly one `body` property
- The `body` property must return `some View`

### Property Wrappers
- Use `@State` for local state management
- Use `@Binding` for two-way data flow between parent and child views
- Use `@StateObject` for creating observable objects
- Use `@ObservedObject` for observing external objects
- Use `@Environment` for accessing environment values

### Computed Properties
- Computed properties with return types should have explicit `return` statements for clarity
- Use `private` access control for internal view helper properties

### SwiftData Integration
- Use `@Query` for database queries in SwiftData
- Proper syntax: `@Query(sort: [SortDescriptor(\.property, order: .forward)])`
- Use `@Environment(\.modelContext)` for database operations

### Error Handling
- Handle optional values safely with guard statements
- Use proper error propagation with async/await patterns
- Implement graceful degradation for missing permissions

### Code Organization
- Keep view structs focused and small
- Extract complex logic into separate functions
- Use computed properties for reusable view components
- Follow proper indentation and formatting