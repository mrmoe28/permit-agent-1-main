# CallAI Development Guidelines & Guardrails

## 🚨 **CRITICAL TYPE SAFETY RULES**

### **1. Meeting vs MeetingModel Usage**
- **ALWAYS use `MeetingModel`** for custom business logic and data storage
- **ONLY use `Meeting` (Core Data entity)** for Core Data operations and calendar integration
- **NEVER mix these types** in the same method or property

#### ✅ **Correct Usage:**
```swift
// For business logic and storage
let meeting: MeetingModel = MeetingModel(title: "Test", startDate: Date(), endDate: Date())
storageManager.saveMeeting(meeting)

// For Core Data operations
let coreDataMeeting: Meeting = // Core Data entity
calendarService.addToCalendar(meeting: coreDataMeeting)
```

#### ❌ **Incorrect Usage:**
```swift
// DON'T mix types
let meeting: MeetingModel = MeetingModel(...)
calendarService.addToCalendar(meeting: meeting) // WRONG!
```

### **2. Transcript vs TranscriptModel Usage**
- **ALWAYS use `TranscriptModel`** for custom business logic and data storage
- **ONLY use `Transcript` (Core Data entity)** for Core Data operations
- **NEVER mix these types** in the same method or property

#### ✅ **Correct Usage:**
```swift
// For business logic and storage
let transcript: TranscriptModel = TranscriptModel(content: "Hello", confidence: 0.9)
storageManager.saveTranscript(transcript)

// For Core Data operations
let coreDataTranscript: Transcript = // Core Data entity
```

### **3. Optional Unwrapping Rules**
- **ALWAYS provide default values** for optional properties in UI
- **NEVER force unwrap** without explicit error handling
- **USE nil coalescing operator** (`??`) for safe unwrapping

#### ✅ **Correct Usage:**
```swift
Text(meeting.title ?? "Untitled Meeting")
Text(meeting.id?.uuidString ?? UUID().uuidString)
```

#### ❌ **Incorrect Usage:**
```swift
Text(meeting.title) // CRASH if title is nil
Text(meeting.id.uuidString) // CRASH if id is nil
```

### **4. Constructor Usage Rules**
- **ALWAYS use `MeetingModel(...)`** for custom class instantiation
- **ALWAYS use `TranscriptModel(...)`** for custom class instantiation
- **NEVER use `Meeting(...)` or `Transcript(...)`** - these don't exist

#### ✅ **Correct Usage:**
```swift
let meeting = MeetingModel(title: "Test", startDate: Date(), endDate: Date())
let transcript = TranscriptModel(content: "Hello", confidence: 0.9)
```

#### ❌ **Incorrect Usage:**
```swift
let meeting = Meeting(title: "Test", startDate: Date(), endDate: Date()) // WRONG!
let transcript = Transcript(content: "Hello", confidence: 0.9) // WRONG!
```

## 🔧 **Type Conversion Guidelines**

### **When You Need to Convert Between Types:**

1. **MeetingModel → Meeting (Core Data)**
   ```swift
   // Create a conversion method in MeetingModel
   func toCoreDataEntity(context: NSManagedObjectContext) -> Meeting {
       let entity = Meeting(context: context)
       entity.title = self.title
       entity.startDate = self.startDate
       entity.endDate = self.endDate
       // ... map other properties
       return entity
   }
   ```

2. **Meeting (Core Data) → MeetingModel**
   ```swift
   // Create a conversion method in MeetingModel
   static func fromCoreDataEntity(_ entity: Meeting) -> MeetingModel {
       return MeetingModel(
           title: entity.title ?? "",
           startDate: entity.startDate ?? Date(),
           endDate: entity.endDate ?? Date()
       )
   }
   ```

## 🚫 **Common Anti-Patterns to Avoid**

1. **Type Mixing in Method Signatures**
   ```swift
   // DON'T do this
   func processMeeting(_ meeting: Meeting) {
       storageManager.saveMeeting(meeting) // Type mismatch!
   }
   ```

2. **Unsafe Optional Access**
   ```swift
   // DON'T do this
   let title = meeting.title // Could be nil
   let id = meeting.id.uuidString // Could crash
   ```

3. **Wrong Constructor Calls**
   ```swift
   // DON'T do this
   let meeting = Meeting(...) // This constructor doesn't exist
   ```

## 🧪 **Testing Guidelines**

### **Before Committing Code:**
1. **Run the build** to check for type mismatches
2. **Test with nil values** to ensure optional unwrapping works
3. **Verify constructor calls** are using the correct types
4. **Check method signatures** match the expected types

### **Build Verification Checklist:**
- [ ] No "Cannot convert value of type X to expected argument type Y" errors
- [ ] No "Value of type X has no member Y" errors  
- [ ] No "Argument passed to call that takes no arguments" errors
- [ ] No "Value of optional type X must be unwrapped" errors

## 📝 **Code Review Checklist**

When reviewing code, check for:
- [ ] Correct type usage (MeetingModel vs Meeting, TranscriptModel vs Transcript)
- [ ] Safe optional unwrapping with default values
- [ ] Correct constructor calls
- [ ] Method signatures match expected types
- [ ] No type mixing in the same method

## 🚨 **Emergency Fix Protocol**

If you encounter type mismatch errors:

1. **Identify the root cause** - is it Meeting vs MeetingModel or Transcript vs TranscriptModel?
2. **Check the method signature** - what type does it expect?
3. **Use the correct type** - update the variable declaration or method call
4. **Add safe unwrapping** - use `??` operator for optionals
5. **Test the fix** - run the build to verify

## 📚 **Reference**

- **MeetingModel**: Custom class for business logic (`/callai/Meeting.swift`)
- **Meeting**: Core Data entity for persistence (`/callai/Meeting+CoreDataClass.swift`)
- **TranscriptModel**: Custom class for business logic (`/callai/Transcript.swift`)
- **Transcript**: Core Data entity for persistence (`/callai/Transcript+CoreDataClass.swift`)

---

**Remember: Type safety is critical for app stability. When in doubt, use the custom model classes (MeetingModel, TranscriptModel) and provide safe defaults for optionals.**
