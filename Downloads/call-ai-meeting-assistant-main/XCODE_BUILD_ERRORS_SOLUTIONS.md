# Xcode Build Errors & Solutions Guide

## Common Build Errors and Their Solutions

### 1. Force Unwrapping Crashes

**Error**: `Fatal error: Unexpectedly found nil while unwrapping an Optional value`

**Root Cause**: Force unwrapping (`!`) used on optionals that can be nil

**Locations in Codebase**:
- `WhisperService.swift` lines 40, 48-75, 146, 154-164
- `Persistence.swift` line 37
- `ExportService.swift` line 95

**Solution**:
```swift
// ❌ Problematic code
var request = URLRequest(url: URL(string: baseURL)!)

// ✅ Fixed code
guard let url = URL(string: baseURL) else {
    errorMessage = "Invalid API URL"
    return nil
}
var request = URLRequest(url: url)
```

### 2. Memory Management Issues

**Error**: `EXC_BAD_ACCESS` or retain cycles

**Root Cause**: Strong reference cycles in closures

**Solution**:
```swift
// ❌ Problematic code
Task {
    self.someProperty = await someAsyncCall()
}

// ✅ Fixed code
Task { [weak self] in
    self?.someProperty = await someAsyncCall()
}
```

### 3. Concurrency Issues

**Error**: `Main actor-isolated property 'x' can not be referenced from a Sendable closure`

**Root Cause**: Accessing `@MainActor` properties from non-main contexts

**Solution**:
```swift
// ❌ Problematic code
Task {
    self.isLoading = true // @MainActor property
}

// ✅ Fixed code
Task { @MainActor in
    self.isLoading = true
}
```

### 4. SwiftData Context Issues

**Error**: `ModelContext` access from wrong thread

**Root Cause**: Accessing SwiftData context from background thread

**Solution**:
```swift
// ❌ Problematic code
Task {
    modelContext.insert(meeting)
}

// ✅ Fixed code
Task { @MainActor in
    modelContext.insert(meeting)
}
```

### 5. Network Request Failures

**Error**: Network timeouts or invalid responses

**Root Cause**: Insufficient error handling in network calls

**Solution**:
```swift
// ❌ Problematic code
let (data, response) = try await URLSession.shared.data(for: request)

// ✅ Fixed code
do {
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse else {
        throw NetworkError.invalidResponse
    }
    
    guard httpResponse.statusCode == 200 else {
        throw NetworkError.httpError(httpResponse.statusCode)
    }
    
    // Process data
} catch {
    // Handle error appropriately
    errorMessage = "Network request failed: \(error.localizedDescription)"
}
```

## Build Configuration Fixes

### 1. Enable All Warnings
1. Select your project in Xcode
2. Go to Build Settings
3. Search for "Warning Level"
4. Set to "All" for both Debug and Release

### 2. Enable Strict Concurrency
1. Go to Build Settings
2. Search for "Strict Concurrency Checking"
3. Set to "Complete" for both Debug and Release

### 3. Clean Build Folder
```bash
# In Xcode: Product > Clean Build Folder
# Or via command line:
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### 4. Reset Simulator
```bash
# Reset iOS Simulator
xcrun simctl erase all
```

## Common Xcode Issues

### 1. Derived Data Corruption
**Symptoms**: Build failures, strange errors
**Solution**: Delete derived data folder
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### 2. Provisioning Profile Issues
**Symptoms**: Code signing errors
**Solution**: 
1. Check provisioning profiles in Xcode Preferences
2. Ensure profiles are valid and not expired
3. Verify bundle identifier matches

### 3. Swift Package Manager Issues
**Symptoms**: Package resolution failures
**Solution**:
1. File > Workspace Actions > Resolve Package Dependencies
2. Or delete Package.resolved and re-resolve

### 4. Simulator Issues
**Symptoms**: App won't launch on simulator
**Solution**:
1. Reset simulator content and settings
2. Restart Xcode
3. Try different simulator device

## Debugging Tips

### 1. Use Breakpoints Effectively
- Set breakpoints on force unwrapping operations
- Use conditional breakpoints for specific scenarios
- Enable exception breakpoints for crashes

### 2. Enable Address Sanitizer
1. Go to Scheme settings
2. Run > Diagnostics
3. Enable "Address Sanitizer"

### 3. Use Console Logging
```swift
// Add comprehensive logging
print("DEBUG: Starting transcription for meeting: \(meeting.id)")
```

### 4. Memory Graph Debugger
1. Run app in Xcode
2. Click Memory Graph button in debug bar
3. Look for retain cycles

## Prevention Strategies

### 1. Code Review Checklist
- [ ] No force unwrapping (`!`)
- [ ] Proper error handling
- [ ] Memory management (weak/strong references)
- [ ] Thread safety (`@MainActor` usage)
- [ ] Input validation

### 2. Automated Testing
```swift
// Add unit tests for critical paths
func testTranscriptionWithInvalidURL() {
    // Test error handling
}
```

### 3. Static Analysis
- Use SwiftLint for code quality
- Enable all compiler warnings
- Use Xcode's Analyze feature regularly

## Emergency Recovery

### If App Crashes on Launch
1. Check for force unwrapping in `init()` methods
2. Verify all required resources are present
3. Check Info.plist for missing keys

### If Build Fails Completely
1. Clean build folder
2. Delete derived data
3. Restart Xcode
4. Check for syntax errors in recently changed files

### If Simulator Won't Work
1. Reset simulator
2. Try different simulator device
3. Restart Xcode
4. Check system requirements

## Best Practices Summary

1. **Never use force unwrapping** - Always handle optionals safely
2. **Handle all errors** - Provide meaningful error messages
3. **Use proper concurrency** - Respect `@MainActor` boundaries
4. **Manage memory properly** - Avoid retain cycles
5. **Test thoroughly** - Add unit tests for critical functionality
6. **Monitor performance** - Use Instruments for profiling
7. **Keep dependencies updated** - Regular maintenance

This guide should help resolve most common build issues and prevent future problems.