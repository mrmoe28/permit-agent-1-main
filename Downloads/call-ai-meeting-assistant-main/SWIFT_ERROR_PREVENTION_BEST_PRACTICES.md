# Swift Error Prevention Best Practices

## Overview
This document contains patterns of recurring Swift/SwiftUI errors and their fixes to prevent future occurrences.

## Error Pattern 1: SwiftUI Date Formatting Syntax

### ❌ INCORRECT (Causes Compilation Errors)
```swift
// Old syntax - causes "Cannot infer contextual base" errors
Text(date.formatted(date: .omitted, time: .shortened))
Text(date.formatted(date: .abbreviated, time: .omitted))
```

### ✅ CORRECT (Modern SwiftUI Syntax)
```swift
// Time only (HH:MM format)
Text(date, format: .dateTime.hour().minute())

// Date only (abbreviated format)
Text(date, format: .dateTime.month(.abbreviated).day().year())

// Date and time
Text(date, format: .dateTime.month(.abbreviated).day().year().hour().minute())

// Alternative: Using .formatted() method
Text(date.formatted(.dateTime.hour().minute()))
```

### 🔍 Files to Check
- All SwiftUI views with date formatting
- Look for `.formatted(date: .omitted, time: .shortened)` patterns
- Look for `.formatted(date: .abbreviated, time: .omitted)` patterns

---

## Error Pattern 2: SwiftData Import Issues

### ❌ INCORRECT (Causes "No member" Errors)
```swift
// Missing SwiftData import causes Meeting type issues
import SwiftUI
// Missing: import SwiftData

struct MyView: View {
    let meeting: Meeting // ❌ Meeting type not recognized
}
```

### ✅ CORRECT
```swift
// Always import SwiftData when using @Model classes
import SwiftUI
import SwiftData

struct MyView: View {
    let meeting: Meeting // ✅ Meeting type properly recognized
}
```

### 🔍 Files to Check
- All files using SwiftData @Model classes (Meeting, Transcript)
- Look for missing `import SwiftData` statements
- Verify SwiftData types are properly imported

---

## Error Pattern 3: Meeting Type Property Mismatches

### ❌ INCORRECT (Causes "No member" Errors)
```swift
// Meeting type uses startDate/endDate, not startTime/endTime
Text(meeting.startTime?.formatted(...))  // ❌ startTime doesn't exist
Text(meeting.endTime?.formatted(...))    // ❌ endTime doesn't exist
```

### ✅ CORRECT
```swift
// Meeting type properties
Text(meeting.startDate.formatted(...))   // ✅ startDate exists
Text(meeting.endDate.formatted(...))     // ✅ endDate exists
```

### 🔍 Type Definitions
- **Meeting** (SwiftData @Model): `startDate`, `endDate`, `title`, `location`, `participants`
- **MeetingModel** (Custom class): `startDate`, `endDate`, `title`, `location`, `participants`

### 🔍 Files to Check
- All views using Meeting/MeetingModel types
- Look for `.startTime` and `.endTime` usage
- Verify property names match the actual type definition

---

## Error Pattern 4: Transcript Type Mismatches

### ❌ INCORRECT (Causes Type Conversion Errors)
```swift
// TranscriptDetailView expects Transcript, not TranscriptModel
NavigationLink(destination: TranscriptDetailView(transcript: transcriptModel)) // ❌
```

### ✅ CORRECT
```swift
// Use appropriate view for each type
NavigationLink(destination: TranscriptModelDetailView(transcript: transcriptModel)) // ✅
NavigationLink(destination: TranscriptDetailView(transcript: transcript)) // ✅
```

### 🔍 Type Definitions
- **Transcript** (SwiftData @Model): Used with TranscriptDetailView
- **TranscriptModel** (Custom class): Used with TranscriptModelDetailView

### 🔍 Files to Check
- All NavigationLink destinations using transcript types
- Verify view types match the data model types

---

## Error Pattern 5: Optional Unwrapping Issues

### ❌ INCORRECT (Causes Unwrapping Errors)
```swift
// Force unwrapping optionals
Text(meeting.title!) // ❌ Dangerous
```

### ✅ CORRECT
```swift
// Safe optional handling
Text(meeting.title ?? "Untitled Meeting") // ✅ With default
Text(meeting.title) // ✅ If property is non-optional
```

### 🔍 Files to Check
- All optional property usage
- Look for force unwrapping (`!`) operators
- Verify optional vs non-optional property types

---

## Error Pattern 6: ToolbarItem Placement Issues

### ❌ INCORRECT (Causes Toolbar Errors)
```swift
// Invalid placement
ToolbarItem(placement: .navigation) { // ❌ Invalid placement
    Button("Cancel") { dismiss() }
}
```

### ✅ CORRECT
```swift
// Valid placements
ToolbarItem(placement: .cancellationAction) { // ✅ For cancel buttons
    Button("Cancel") { dismiss() }
}
ToolbarItem(placement: .primaryAction) { // ✅ For save/action buttons
    Button("Save") { save() }
}
```

### 🔍 Files to Check
- All `.toolbar` usage
- Look for `.navigation` placement
- Use appropriate placement for button actions

---

## Prevention Checklist

### Before Making Changes:
1. ✅ Import SwiftData when using @Model classes
2. ✅ Check the actual type definition (Meeting vs MeetingModel)
3. ✅ Verify property names exist on the type
4. ✅ Use modern SwiftUI syntax for date formatting
5. ✅ Match view types with data model types
6. ✅ Handle optionals safely

### After Making Changes:
1. ✅ Run linter to catch immediate errors
2. ✅ Build project to verify compilation
3. ✅ Test affected views in simulator
4. ✅ Update this document with new error patterns

### Code Review Checklist:
1. ✅ SwiftData imported when using @Model classes
2. ✅ No `.formatted(date: .omitted, time: .shortened)` patterns
3. ✅ No `.startTime`/`.endTime` on Meeting types
4. ✅ Correct transcript view types
5. ✅ Safe optional handling
6. ✅ Valid ToolbarItem placements

---

## Automated Detection Scripts

### Date Formatting Check:
```bash
grep -r "\.formatted(date: \.omitted" . --include="*.swift"
grep -r "\.formatted(date: \.abbreviated" . --include="*.swift"
```

### SwiftData Import Check:
```bash
grep -r "import SwiftData" . --include="*.swift"
```

### Property Mismatch Check:
```bash
grep -r "\.startTime\|\.endTime" . --include="*.swift"
```

### Type Mismatch Check:
```bash
grep -r "TranscriptDetailView.*TranscriptModel" . --include="*.swift"
```

---

## Last Updated
- Date: $(date)
- Errors Fixed: SwiftData imports, Date formatting, Meeting properties, Transcript types, ToolbarItem placements
- Files Scanned: All Swift files in project
- Key Fix: Added `import SwiftData` to resolve Meeting type recognition issues
