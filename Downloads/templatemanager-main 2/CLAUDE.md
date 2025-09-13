# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

TemplateManager is a macOS SwiftUI app for creating projects from templates with GitHub/Vercel integrations. The app uses Swift Package Manager for building and supports both Apple Silicon and Intel Macs.

### Core Architecture
- **SwiftUI + AppKit**: Modern UI with macOS-specific shell execution capabilities
- **Service-Based Architecture**: Modular services for GitHub, Vercel, template management, and project history
- **Template-Driven**: JSON-based template configuration system with script automation
- **Universal Binary**: Cross-architecture support (ARM64 + Intel)

### Key Directory Structure
```
TemplateManager/
├── App/                    # Main app entry point (TemplateManagerApp.swift)
├── Models/                 # Data models (Template, TemplateMetadata)
├── Views/                  # SwiftUI views and UI components
├── Services/              # Business logic services
│   ├── TemplateService.swift      # Template loading and management
│   ├── GitHubService.swift        # GitHub API integration
│   ├── VercelService.swift        # Vercel deployment
│   ├── ProjectHistoryService.swift # Recent projects tracking
│   ├── SettingsService.swift      # App preferences
│   └── ShellExecutor.swift        # Shell command execution
├── Resources/             # Templates, configs, and assets
└── Utilities/             # Helper functions and extensions
```

## Development Commands

### Building
```bash
# Swift Package Manager build (recommended)
./build-spm.sh

# Cross-platform builds
./build-arm64.sh      # Apple Silicon
./build-intel.sh      # Intel Macs
./build-universal.sh  # Universal binary

# Alternative Xcode-based build
./build.sh
```

### Running
```bash
# Run directly with Swift Package Manager
swift run

# Run built app
./run.sh

# Open built app bundle
open build-spm/TemplateManager.app
```

### Testing & Validation
```bash
# Build validation (no formal test suite currently)
swift build -c release

# Check Swift version compatibility
swift --version
```

## Key Configuration Files

### Template System
- **`template-config.json`**: Defines all available project templates with directories/files to generate
- **`setup-from-config.sh`**: Generic template setup script
- **`setup-nextjs-auth.sh`**: Specialized Next.js authentication template script

### Build Configuration
- **`Package.swift`**: Swift Package Manager configuration (requires macOS 13+)
- **`TemplateManager.entitlements`**: macOS app permissions for file access and shell execution

## Template Types

The app supports two categories of templates:

### File-Based Templates (Local Generation)
- `ecommerce`, `blog`, `nextjs-google-auth`, `fullstack-database`
- Defined by `directories` and `files` arrays in `template-config.json`
- Generated using shell scripts with directory/file creation

### GitHub Templates (Repository Cloning)
- `react-typescript-starter`, `nextjs-starter`, `vite-react-ts`, `express-api-starter`
- Defined by `githubRepository` and `githubBranch` properties
- Cloned directly from specified GitHub repositories

## Service Integration Patterns

### GitHub Service (`GitHubService.swift`)
- OAuth token-based authentication via Keychain storage
- Repository creation with configurable visibility (public/private)
- Automatic README/gitignore/license setup

### Vercel Service (`VercelService.swift`)
- Project deployment with framework detection
- Environment variable configuration
- Production/preview environment management

### Template Service (`TemplateService.swift`)
- JSON config parsing and template loading
- File/directory structure generation
- Integration with shell scripts for advanced setup

## Shell Integration

The app heavily relies on shell script execution:

### ShellExecutor Service
- Executes bash commands with output streaming
- Handles AppleScript for opening editors (VS Code, Cursor, Claude Code)
- Git operations (init, add, commit, remote setup)

### Common Shell Operations
- Package manager detection and installation (npm, yarn, pnpm, bun)
- Git repository initialization and GitHub remote setup
- Editor automation and project opening
- Vercel CLI integration for deployment

## App Settings & Preferences

### SettingsService Managed Preferences
- Default project location and editor choice
- Package manager preference (npm/yarn/pnpm/bun)
- GitHub/Vercel authentication tokens
- UI theme and project display options
- Auto-update checking configuration

### Persistent Storage
- Settings stored in UserDefaults
- GitHub/Vercel tokens in macOS Keychain
- Project history with recent projects tracking
- Export/import functionality for settings backup

## Development Notes

### Swift/SwiftUI Specifics
- **Target**: macOS 13.0+ with SwiftUI 4.0
- **Concurrency**: Uses async/await patterns for API calls
- **State Management**: ObservableObject pattern for services
- **UI**: SwiftUI with AppKit integration for shell access

### Build Considerations
- Universal binary support requires architecture-specific compilation
- AppKit imports required for shell execution capabilities
- Resources (template-config.json) must be bundled with app
- Shell scripts need execute permissions

### Architecture Decisions
- Service layer separation for testability and modularity
- JSON-based template configuration for easy extension
- Shell script automation for complex project setup tasks
- Keychain integration for secure credential storage

## Common Development Tasks

### Adding New Templates
1. Update `template-config.json` with new template definition
2. Create custom setup script if needed (follow `setup-nextjs-auth.sh` pattern)
3. Test template creation through UI
4. Update documentation

### Modifying Services
- Services follow ObservableObject pattern with @Published properties
- Error handling should update service error state for UI display
- Async operations should properly handle cancellation and timeouts

### Shell Script Integration
- Use ShellExecutor.execute() for all shell operations
- Handle both stdout and stderr appropriately
- Provide user feedback through service state updates
- Test shell operations on both Intel and ARM architectures

## Known Issues & Limitations

Refer to `DEVELOPMENT.md` for comprehensive error tracking and `KNOWN_ISSUES.md` for current limitations.

### Build-Time Issues
- Ensure proper macOS destination targeting to avoid iOS Simulator builds
- Remove duplicate files that cause compilation conflicts
- Update deprecated Swift APIs (String.write methods, button styles)

### Runtime Considerations
- Shell script execution requires proper entitlements
- GitHub/Vercel rate limiting may affect batch operations
- Template generation can be slow for large projects with many files