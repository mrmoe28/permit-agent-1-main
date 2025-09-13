# Changelog

All notable changes to Template Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Easy installation script (`install.sh`)
- GitHub Actions workflow for automated builds
- DMG creation script for distribution
- Uninstall script for clean removal
- Auto-update functionality
  - Automatic update checks on app launch
  - Manual update check via menu or settings
  - Download updates directly from GitHub releases
  - Configurable auto-check and notification preferences

## [1.1.0] - 2024-01-XX

### Added
- Recent Projects management with search, filter, and favorites
- Comprehensive Settings/Preferences system
  - Default project location
  - Package manager selection (npm, yarn, pnpm, bun)
  - Editor preferences
  - Theme selection
  - Import/export settings
- Vercel deployment integration
  - One-click deployment
  - Environment configuration
  - Production/preview modes
- GitHub integration
  - Create repositories from app
  - OAuth authentication
  - Public/private repo options
- Template variables for dynamic configuration
- Environment variables UI with secret management
- Automatic dependency installation
- Auto-open in preferred editor after creation

### Changed
- Improved UI with tab navigation
- Enhanced template gallery with categories
- Better error handling and user feedback
- Updated README with comprehensive documentation

### Fixed
- Build directory exclusion from git
- Template configuration loading issues
- Editor detection on different systems

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Template selection from pre-configured options
- Project creation with customizable location
- Editor integration (VS Code, Cursor, Claude Code)
- Real-time progress tracking
- Template preview functionality
- Basic template types:
  - E-commerce (full and blank)
  - Blog (with MDX support)
  - Next.js with Google Auth
  - Full-stack with database

### Security
- Keychain integration for secure credential storage
- Sandboxed file system access
- No external analytics or tracking

## Installation

### From Release
1. Download the latest `.dmg` file from [Releases](https://github.com/mrmoe28/templatemanager/releases)
2. Mount and drag to Applications
3. Right-click and "Open" on first launch

### Using Install Script
```bash
curl -fsSL https://raw.githubusercontent.com/mrmoe28/templatemanager/main/install.sh | bash
```

### From Source
```bash
git clone https://github.com/mrmoe28/templatemanager.git
cd templatemanager
./build.sh
```

## Links
- [GitHub Repository](https://github.com/mrmoe28/templatemanager)
- [Report Issues](https://github.com/mrmoe28/templatemanager/issues)
- [Documentation](https://github.com/mrmoe28/templatemanager#readme)