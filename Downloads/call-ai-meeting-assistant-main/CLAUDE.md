# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CallAI is a macOS SwiftUI application that provides AI-powered meeting assistance with automatic recording, transcription, and summary generation. The app integrates with the macOS Calendar app to detect meetings and uses OpenAI's API for transcription and summary generation.

## Development Commands

### Building and Testing
```bash
# Build the project for iOS Simulator (default)
xcodebuild -project callai.xcodeproj -scheme callai -destination 'generic/platform=iOS Simulator' build

# Build the project for macOS
xcodebuild -project callai.xcodeproj -scheme callai build

# Run unit tests only
xcodebuild -project callai.xcodeproj -scheme callai test -destination 'platform=iOS Simulator,name=iPhone 15'

# Run UI tests
xcodebuild -project callai.xcodeproj -scheme callai -destination 'platform=iOS Simulator,name=iPhone 15' test

# Build for release
xcodebuild -project callai.xcodeproj -scheme callai -configuration Release build

# Clean build folder
xcodebuild clean -project callai.xcodeproj -scheme callai
```

### Xcode Development
- Open `callai.xcodeproj` in Xcode
- Main scheme: `callai`
- Test schemes: `callaiTests`, `callaiUITests`
- Minimum deployment target: iOS 18.5+ / macOS 13.0+
- Bundle ID: `ekodev.callai`

## Architecture

### Protocol-Based Service Layer
The app uses a clean protocol-based architecture defined in `ServiceProtocols.swift`:
- All services implement protocols for testability and dependency injection
- Services are injected through `AppConfig.swift` factory methods
- All service protocols are marked `@MainActor` for thread safety

### Core Components
- **SwiftUI + SwiftData**: Modern iOS/macOS app architecture with SwiftData for persistence
- **EventKit Integration**: Calendar access for automatic meeting detection
- **AVFoundation**: Audio recording capabilities with proper session management
- **Keychain Services**: Secure storage of OpenAI API keys
- **Dependency Injection**: Services created through `AppConfig` factory pattern

### Key Services
- `AudioRecordingServiceImpl`: Handles microphone access and high-quality audio recording
- `AISummaryServiceImpl`: OpenAI API integration (currently stub implementation)
- `CalendarServiceImpl`: EventKit integration for calendar access
- `TranscriptionServiceImpl`: Audio transcription workflow management
- `AuthenticationService`: User authentication and session management
- `WhisperService`: Local/remote transcription processing using OpenAI Whisper
- `ExportService`: Data export functionality (PDF, TXT, etc.)
- `StorageService`: File system management for recordings and data

### Data Models (SwiftData)
- `Meeting.swift`: Core meeting entity with comprehensive metadata
- `Transcript.swift`: Associated transcription data with content and metadata
- `RecordingQuality.swift`: Audio quality configuration enum
- Uses UUID-based primary keys with proper relationship management
- Model container with fallback to in-memory storage on initialization failure

### Modern UI Architecture
- `ContentView.swift`: Main TabView container with permission handling
- `ModernDashboardView.swift`: Enhanced dashboard with analytics
- `EnhancedTabBarView.swift`: Custom tab bar implementation
- `BreadcrumbNavigation.swift`: Navigation breadcrumb system
- `AppCoordinatorView.swift`: App-wide navigation coordination
- Authentication flow: `AuthGateView` → `SignInView` / `SignUpView`
- Splash screens: `InitialSplashView` → `IntroSplashView`

### Design System
- `AppDesignTokens.swift`: Centralized design tokens (colors, typography, spacing)
- `AppComponents.swift`: Reusable UI components following design system

## API Integration & Security

### OpenAI Configuration
- API keys stored securely in macOS Keychain via `KeychainManager.swift`
- Environment variable support: `openai_api_key` in Xcode scheme
- Validation requires keys to start with "sk-"
- Fallback hierarchy: Keychain → Environment → Empty string

### Key Management
- Automatic keychain initialization on app launch
- Secure service identifier: `com.ekodev.callai`
- Configuration validation in `AppConfig.hasValidOpenAIAPIKey`

## Privacy and Entitlements

### Required Permissions (callai.entitlements)
- `com.apple.security.app-sandbox`: App sandboxing enabled
- `com.apple.security.device.microphone`: Audio recording access
- `com.apple.security.personal-information.calendars`: Calendar integration
- `com.apple.security.network.client`: OpenAI API network access
- `com.apple.security.files.downloads.read-write`: Export functionality
- `com.apple.security.files.user-selected.read-only`: File import support

### Permission Flow
- Proactive permission requests in `ContentView.onAppear`
- Permission debug service for troubleshooting: `PermissionDebugService.shared`
- Debug permission panel available in DEBUG builds

## Data Persistence Strategy

### SwiftData (Primary)
- Modern SwiftData models with proper relationships
- Container initialization with error recovery (fallback to in-memory)
- Model container shared across app via `.modelContainer(modelContainer)`

### Legacy Migration
- `Persistence.swift`: Core Data stack (legacy, being phased out)
- Gradual migration from Core Data to SwiftData in progress

## File Organization

```
callai/                     # Main application code
├── Services/              # Protocol-based business services
│   ├── ServiceProtocols.swift
│   ├── AudioRecordingService.swift
│   ├── CalendarService.swift
│   ├── AISummaryService.swift
│   ├── TranscriptionService.swift
│   ├── AuthenticationService.swift
│   └── StorageService.swift
├── Views/                 # SwiftUI view components
│   ├── ModernDashboardView.swift
│   ├── EnhancedTabBarView.swift
│   ├── BreadcrumbNavigation.swift
│   └── AppCoordinatorView.swift
├── Models/               # SwiftData model definitions
│   ├── Meeting.swift
│   ├── Transcript.swift
│   └── RecordingQuality.swift
├── ViewModels/           # MVVM view models
│   ├── AuthenticationViewModel.swift
│   ├── MeetingViewModel.swift
│   └── RecordingViewModel.swift
├── Design/               # Design system
│   ├── AppDesignTokens.swift
│   └── AppComponents.swift
├── Assets.xcassets/      # App assets and app icons
├── callai.entitlements   # App sandboxing permissions
├── AppConfig.swift       # Service factories and configuration
├── APIKeyConfig.swift    # API key management
└── KeychainManager.swift # Secure credential storage

callaiTests/              # Unit tests
callaiUITests/           # UI automation tests
```

## Testing Strategy

### Unit Tests (`callaiTests/`)
- Service protocol implementations
- Model validation and business logic
- Keychain operations and security

### UI Tests (`callaiUITests/`)
- End-to-end user workflows
- Permission handling flows
- UI component behavior

### Running Tests
```bash
# All tests through Xcode
xcodebuild test -project callai.xcodeproj -scheme callai -destination 'platform=iOS Simulator,name=iPhone 15'

# Unit tests only
xcodebuild test -project callai.xcodeproj -scheme callai -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:callaiTests

# UI tests only  
xcodebuild test -project callai.xcodeproj -scheme callai -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:callaiUITests
```

## Development Rules (from .cursorrules)

### Critical Configuration Protection
- **NEVER modify** development team settings, code signing identities, or provisioning profiles
- **NEVER change** bundle identifiers or existing working configurations
- **ALWAYS backup** project files before making configuration changes
- **ALWAYS ask permission** before modifying any project settings
- Certificate/provisioning issues should be solved through system settings, not project modification

### Build Process
- Build targets: iOS 18.5+ and macOS 13.0+
- Primary development: iOS Simulator builds
- Code signing managed through project configuration
- Asset catalog warnings about unassigned app icons are expected

## CI/CD Integration

### GitHub Actions
- Workflow: `.github/workflows/claude.yml`
- Claude Code integration for automated code assistance
- Triggers: PR comments, reviews, and PR creation with `@claude` mentions
- Required secrets: `ANTHROPIC_API_KEY`

## Troubleshooting

### Common Build Issues
1. **Permission Errors**: Check entitlements and Info.plist usage descriptions
2. **API Key Issues**: Verify keychain storage and environment variable setup
3. **SwiftData Errors**: Container fallback to in-memory storage is automatic
4. **Asset Catalog Warnings**: App icon assignment warnings are expected and non-blocking

### Debug Features
- Permission debug panel available in DEBUG builds via toolbar
- Console logging for service initialization and permission states
- Proactive permission requests prevent runtime permission dialogs