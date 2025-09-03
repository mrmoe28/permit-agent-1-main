# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CallAI is a macOS SwiftUI application that provides AI-powered meeting assistance with automatic recording, transcription, and summary generation. The app integrates with the macOS Calendar app to detect meetings and uses OpenAI's API for transcription and summary generation.

## Architecture

### Core Components
- **SwiftUI + SwiftData**: Modern iOS/macOS app architecture with SwiftData for persistence
- **EventKit Integration**: Calendar access for automatic meeting detection
- **AVFoundation**: Audio recording capabilities
- **Keychain Services**: Secure storage of OpenAI API keys
- **Core Data**: Legacy data persistence (being migrated to SwiftData)

### Key Services
- `AudioRecordingService.swift`: Handles microphone access and audio recording
- `AISummaryService.swift`: OpenAI API integration for transcription and summaries  
- `CalendarService.swift`: EventKit integration for calendar access
- `TranscriptionService.swift`: Audio transcription workflow management
- `KeychainManager.swift`: Secure credential storage
- `WhisperService.swift`: Local/remote transcription processing
- `ExportService.swift`: Data export functionality (PDF, TXT, etc.)

### Data Models
- `Meeting.swift`: SwiftData model for meeting entities
- `Transcript.swift`: SwiftData model for transcription data
- Uses UUID-based primary keys with relationship management

### Views Architecture
- `ContentView.swift`: Main app container
- `MeetingPickerView.swift`: Calendar integration and meeting selection
- `RecordingView.swift`: Audio recording interface with real-time feedback
- `TranscriptionProcessingView.swift`: Transcription workflow UI
- `MeetingDetailView.swift`: Meeting details and transcript display
- `SettingsView.swift`: App configuration and API key management

## Development Commands

### Building and Testing
```bash
# Build the project
xcodebuild -project callai.xcodeproj -scheme callai build

# Run tests
swift test -v

# Build for release
xcodebuild -project callai.xcodeproj -scheme callai -configuration Release build
```

### Xcode Development
- Open `callai.xcodeproj` in Xcode
- Main scheme: `callai`
- Test schemes: `callaiTests`, `callaiUITests`
- Minimum deployment target: macOS 13.0

## Privacy and Permissions

The app requires several sensitive permissions:
- **Microphone**: For audio recording (`NSMicrophoneUsageDescription`)
- **Calendar**: For meeting detection (`NSCalendarsUsageDescription`)
- **Speech Recognition**: For transcription (`NSSpeechRecognitionUsageDescription`)

## API Integration

### OpenAI Configuration
- API keys stored securely in Keychain
- Configured through `SettingsView.swift`
- Accessed via `AppConfig.swift` and `APIKeyConfig.swift`
- Validation requires keys to start with "sk-"

### Key Management
- Uses `KeychainManager.swift` for secure credential storage
- API key initialization handled in `CallAIApp.swift`
- Configuration validation in `AppConfig.swift`

## File Structure

```
callai/                     # Main application code
├── Services/              # Business logic services
├── Views/                 # SwiftUI view components  
├── Models/               # SwiftData model definitions
├── Config/              # App configuration
├── Assets.xcassets/     # App assets and resources
└── callai.entitlements  # App sandboxing permissions

callaiTests/              # Unit tests
callaiUITests/           # UI automation tests
```

## Testing Strategy

- Uses Swift Testing framework (`import Testing`)
- Separate unit tests (`callaiTests`) and UI tests (`callaiUITests`)
- Test files follow naming convention: `*Tests.swift`
- Run tests with `swift test -v` or through Xcode Test Navigator

## Build Configuration

- Target: macOS 13.0+
- Bundle ID configured via build settings
- Entitlements defined in `callai.entitlements`
- Info.plist contains required usage descriptions
- CI/CD via GitHub Actions (`.github/workflows/swift.yml`)

## Data Persistence

### SwiftData Models
- `Meeting`: Core meeting entity with calendar integration
- `Transcript`: Associated transcription data
- Relationships managed through SwiftData annotations
- Model container initialized in `CallAIApp.swift`

### Migration Notes
- Legacy Core Data stack exists (`callai.xcdatamodeld`)
- Gradual migration to SwiftData in progress
- Persistence handled through `Persistence.swift`

## Development Notes

- App follows macOS Human Interface Guidelines
- Uses system color schemes and accessibility features
- Proper error handling for permission requests
- Secure handling of sensitive audio data and API credentials
- Real-time UI updates during recording and transcription