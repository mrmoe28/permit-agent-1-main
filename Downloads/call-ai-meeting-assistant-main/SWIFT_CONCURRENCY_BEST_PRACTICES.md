# Swift Concurrency Best Practices for CallAI

## Overview
This document contains Swift concurrency patterns and fixes for @MainActor isolation issues to prevent future compilation errors.

## Error Pattern 1: @MainActor Service Factory Calls

### ❌ INCORRECT (Causes "call to main actor-isolated" Errors)
```swift
// Service factory methods marked with @MainActor can't be called from non-isolated contexts
class ServiceFactory {
    @MainActor
    static func createAuthenticationService() -> any AuthenticationService {
        return AuthenticationServiceImpl()
    }
}

// This fails because init() is not @MainActor
class AuthenticationViewModel: ObservableObject {
    init() {
        self.authService = ServiceFactory.createAuthenticationService() // ❌ Error
    }
}
```

### ✅ CORRECT (Proper @MainActor Usage)
```swift
// Option 1: Make the factory method non-isolated
class ServiceFactory {
    static func createAuthenticationService() -> any AuthenticationService {
        return AuthenticationServiceImpl()
    }
}

// Option 2: Use dependency injection
class AuthenticationViewModel: ObservableObject {
    init(authenticationService: any AuthenticationService? = nil) {
        self.authService = authenticationService ?? AuthenticationServiceImpl()
    }
}

// Option 3: Make the initializer @MainActor
@MainActor
class AuthenticationViewModel: ObservableObject {
    init() {
        self.authService = ServiceFactory.createAuthenticationService() // ✅ Works
    }
}
```

## Error Pattern 2: Protocol-Based Service Binding

### ❌ INCORRECT (Causes "no member" Errors)
```swift
// Protocol types don't expose @Published properties for Combine binding
protocol AuthenticationService: ObservableObject {
    var isAuthenticated: Bool { get }
}

class AuthenticationViewModel: ObservableObject {
    private let authService: any AuthenticationService
    
    private func setupBindings() {
        authService.$isAuthenticated // ❌ Error: no member '$isAuthenticated'
            .assign(to: \.isAuthenticated, on: self)
            .store(in: &cancellables)
    }
}
```

### ✅ CORRECT (Manual State Management)
```swift
// Option 1: Manual state updates after service calls
class AuthenticationViewModel: ObservableObject {
    private let authService: any AuthenticationService
    
    func signIn(email: String, password: String) async {
        do {
            try await authService.signIn(email: email, password: password)
            // Manually update local state
            isAuthenticated = authService.isAuthenticated
            currentUser = authService.currentUser
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// Option 2: Use concrete service types instead of protocols
class AuthenticationViewModel: ObservableObject {
    private let authService: AuthenticationServiceImpl
    
    private func setupBindings() {
        authService.$isAuthenticated // ✅ Works with concrete type
            .assign(to: \.isAuthenticated, on: self)
            .store(in: &cancellables)
    }
}
```

## Error Pattern 3: @MainActor Protocol Conformance

### ❌ INCORRECT (Causes Isolation Errors)
```swift
// Protocol with @MainActor but implementation not properly isolated
@MainActor
protocol AudioRecordingService: ObservableObject {
    var isRecording: Bool { get }
}

class AudioRecordingServiceImpl: AudioRecordingService {
    @Published var isRecording = false // ❌ Main actor-isolated property
    
    // This method is not @MainActor but tries to access @Published property
    func startRecording() async throws {
        isRecording = true // ❌ Error: main actor-isolated property
    }
}
```

### ✅ CORRECT (Proper Actor Isolation)
```swift
// Option 1: Make the entire implementation @MainActor
@MainActor
class AudioRecordingServiceImpl: AudioRecordingService {
    @Published var isRecording = false
    
    func startRecording() async throws {
        isRecording = true // ✅ Works - same actor context
    }
}

// Option 2: Use nonisolated for delegate methods
@MainActor
class AudioRecordingServiceImpl: AudioRecordingService {
    @Published var isRecording = false
    
    func startRecording() async throws {
        isRecording = true
    }
    
    // Delegate methods should be nonisolated
    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        // Handle error without accessing @Published properties
    }
}
```

## Error Pattern 4: Storage Service Actor Isolation

### ❌ INCORRECT (Causes Actor Isolation Errors)
```swift
actor StorageManager {
    func createDirectoryIfNeeded() throws {
        // Implementation
    }
}

// Called from non-isolated context
class StorageServiceImpl {
    init() {
        try createDirectoryIfNeeded() // ❌ Error: actor-isolated method
    }
}
```

### ✅ CORRECT (Proper Actor Usage)
```swift
actor StorageManager {
    func createDirectoryIfNeeded() throws {
        // Implementation
    }
}

class StorageServiceImpl {
    init() {
        // Don't call actor methods from init
        // Call them when needed with await
    }
    
    func setup() async throws {
        try await storageManager.createDirectoryIfNeeded() // ✅ Works
    }
}
```

## Best Practices Summary

### 1. Service Factory Pattern
```swift
// ✅ RECOMMENDED: Non-isolated factory methods
class ServiceFactory {
    static func createAuthenticationService() -> any AuthenticationService {
        return AuthenticationServiceImpl()
    }
    
    static func createAudioRecordingService() -> any AudioRecordingService {
        return AudioRecordingServiceImpl()
    }
}
```

### 2. ViewModel Initialization
```swift
// ✅ RECOMMENDED: Dependency injection with defaults
@MainActor
class AuthenticationViewModel: ObservableObject {
    private let authService: any AuthenticationService
    
    init(authenticationService: any AuthenticationService? = nil) {
        self.authService = authenticationService ?? AuthenticationServiceImpl()
    }
}
```

### 3. State Management
```swift
// ✅ RECOMMENDED: Manual state updates for protocol-based services
class AuthenticationViewModel: ObservableObject {
    func signIn(email: String, password: String) async {
        do {
            try await authService.signIn(email: email, password: password)
            // Update local state from service
            isAuthenticated = authService.isAuthenticated
            currentUser = authService.currentUser
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

### 4. Actor Usage
```swift
// ✅ RECOMMENDED: Proper actor method calls
class StorageServiceImpl {
    private let storageManager = StorageManager.shared
    
    func save<T: Codable>(_ object: T, key: String) async throws {
        try await storageManager.save(object, key: key) // ✅ With await
    }
}
```

## Prevention Checklist

### Before Making Changes:
1. ✅ Check if methods are marked with @MainActor
2. ✅ Verify actor isolation for async methods
3. ✅ Use dependency injection for service creation
4. ✅ Handle protocol-based services with manual state updates
5. ✅ Use `await` for actor method calls

### After Making Changes:
1. ✅ Build project to verify concurrency issues are resolved
2. ✅ Test async/await patterns in simulator
3. ✅ Verify @MainActor isolation is working correctly
4. ✅ Update this document with new patterns

### Code Review Checklist:
1. ✅ No @MainActor factory calls from non-isolated contexts
2. ✅ Proper actor method calls with await
3. ✅ Manual state updates for protocol-based services
4. ✅ Nonisolated delegate methods where appropriate
5. ✅ Dependency injection for service creation

## Automated Detection Scripts

### @MainActor Check:
```bash
grep -r "@MainActor" . --include="*.swift"
```

### Actor Method Call Check:
```bash
grep -r "storageManager\." . --include="*.swift" | grep -v "await"
```

### Service Factory Check:
```bash
grep -r "ServiceFactory\." . --include="*.swift"
```

---

## Last Updated
- Date: $(date)
- Errors Fixed: @MainActor isolation, Protocol binding, Actor method calls, Service factory patterns
- Files Scanned: All Swift files in project
- Key Fix: Proper Swift concurrency patterns for @MainActor and actor isolation
