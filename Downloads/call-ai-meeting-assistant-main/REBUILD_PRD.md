# CallAI Meeting Assistant - Backend Rebuild PRD

## Project Overview
**Objective:** Completely rebuild the backend of CallAI Meeting Assistant while preserving the existing UI layer, using Swift best practices and clean architecture.

## Scope
- **PRESERVE:** All SwiftUI views, navigation, design tokens, and UI components
- **REBUILD:** All backend services, data models, storage, and business logic
- **DELETE:** All existing backend files (services, models, data layers)

## Technical Requirements

### 1. Domain Models (New)
```swift
// Core data structures
struct Meeting {
    let id: UUID
    let title: String
    let startDate: Date
    let endDate: Date
    let participants: [String]
    let phoneNumber: String?
    let participantName: String?
    let recordingURL: URL?
    let transcript: Transcript?
    let callType: CallType
    let callDirection: CallDirection
    let isInProgress: Bool
}

struct Transcript {
    let id: UUID
    let content: String
    let confidence: Double
    let meetingID: UUID
    let createdAt: Date
}

enum CallType: String, CaseIterable {
    case voice, video, facetime, unknown
}

enum CallDirection: String, CaseIterable {
    case incoming, outgoing, missed, unknown
}
```

### 2. Service Layer (New)
```swift
// Protocol-based architecture
protocol AudioRecordingService {
    func startRecording() async throws
    func stopRecording() async throws -> URL
    var isRecording: Bool { get }
    var recordingDuration: TimeInterval { get }
}

protocol TranscriptionService {
    func transcribe(audioURL: URL) async throws -> Transcript
    var isTranscribing: Bool { get }
    var progress: Double { get }
}

protocol CalendarService {
    func loadUpcomingMeetings() async throws -> [Meeting]
    var meetings: [Meeting] { get }
}

protocol StorageService {
    func save<T: Codable>(_ object: T, key: String) async throws
    func load<T: Codable>(_ type: T.Type, key: String) async throws -> T?
    func delete(key: String) async throws
}
```

### 3. Storage Implementation
- **File-based JSON storage** for meetings and transcripts
- **Keychain** for sensitive data (API keys, auth tokens)
- **No Core Data or SwiftData** - pure Swift file I/O

### 4. UI Integration
- **ViewModels** to bridge UI and services
- **@Published properties** for reactive updates
- **Async/await** for all service calls
- **Error handling** with user-friendly messages

## Implementation Plan

### Phase 1: Clean Slate
1. Delete all existing backend files
2. Preserve UI files in `/Views/` directory
3. Clean Xcode project references

### Phase 2: Core Foundation
1. Create domain models
2. Implement storage service
3. Create service protocols

### Phase 3: Service Implementation
1. AudioRecordingService (AVAudioSession)
2. TranscriptionService (Speech framework)
3. CalendarService (EventKit)
4. AISummaryService (stub for future)

### Phase 4: UI Integration
1. Create ViewModels
2. Wire UI to new services
3. Update navigation and data flow

### Phase 5: Testing & Polish
1. Clean build verification
2. Basic functionality testing
3. Error handling validation

## Success Criteria
- [ ] App compiles and runs without errors
- [ ] UI remains identical to current version
- [ ] Core flows work: record → transcribe → save → view
- [ ] Clean, maintainable Swift code
- [ ] No legacy dependencies or conflicts

## Files to DELETE
- All files in `/Services/` (root level)
- All files in `/Models/` (root level)
- All backend files in `/callai/` except Views
- Core Data model files
- SwiftData model files

## Files to PRESERVE
- All files in `/callai/Views/`
- `/callai/Design/`
- `/callai/Assets.xcassets/`
- Navigation and UI components
- Design tokens and colors

## Timeline
- Phase 1: 15 minutes
- Phase 2: 30 minutes  
- Phase 3: 45 minutes
- Phase 4: 30 minutes
- Phase 5: 15 minutes
- **Total: ~2.5 hours**

---

**This PRD is the single source of truth. No deviations.**
