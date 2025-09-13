# Template Manager

A powerful macOS app for quickly creating new projects from templates with integrated code editor support, deployment options, and project management features.

## 📥 Installation

**Quick Install**: See our comprehensive [Installation Guide](INSTALLATION.md) for detailed instructions for both Apple Silicon and Intel Macs.

**Requirements**: macOS 13.0+, Xcode 15.0+

### 🔐 Code Signing & Security

Template Manager now includes comprehensive code signing support to eliminate macOS security warnings:

- **Ad Hoc Signing** (Free): Uses your Apple Development certificate for minimal security warnings
- **Developer ID Signing** (Professional): Requires Apple Developer Program for zero security warnings
- **Complete Documentation**: See [Code Signing Guide](CODE_SIGNING_GUIDE.md) for all options
- **Security Troubleshooting**: See [macOS Security Fixes](MACOS_SECURITY_FIXES.md) for common issues

**Quick Start:**
```bash
# Free Ad Hoc signing (minimal warnings)
./build-adhoc.sh

# Professional signing (zero warnings - requires Apple Developer Program)
./build-signed.sh
```

## 🚀 Features

### Core Features
- **Template Gallery**: Choose from various pre-configured project templates
  - E-commerce (full & blank starter)
  - Blog (with MDX support & blank starter)
  - Next.js with Google OAuth
  - Full-stack with database
  - GitHub template repositories
- **Smart Project Creation**: Intelligent file generation with proper boilerplate code
- **Editor Integration**: Open projects directly in VS Code, Cursor, or Claude Code
- **Real-time Progress**: Live output of project creation process

### 🔗 Integrations
- **GitHub Integration**
  - Create repositories automatically
  - Configure public/private repos
  - Set up .gitignore and licenses
  - OAuth authentication
- **Vercel Deployment**
  - One-click deployment to Vercel
  - Production/preview environments
  - Automatic framework detection
  - Deployment URL management

### 📁 Project Management
- **Recent Projects View**
  - Grid layout with project cards
  - Quick access to previous projects
  - Git status indicators
  - Favorites system
  - Search and filter capabilities
  - Sort by date, name, or template
- **Quick Actions**
  - Open in preferred editor
  - Open in Finder
  - Launch terminal at project location
  - View on GitHub/Vercel

### ⚙️ Settings & Preferences
- **Customizable Defaults**
  - Default project location
  - Preferred code editor
  - Package manager selection (npm, yarn, pnpm, bun)
  - Git configuration
- **UI Preferences**
  - Theme selection (Light/Dark/System)
  - Project preview options
  - Confirmation dialogs
- **Advanced Options**
  - Terminal app selection
  - Debug logging
  - Import/export settings

## Installation

### Option 1: Xcode Development
1. Open the `TemplateManager.xcodeproj` in Xcode
2. Build and run the app (⌘+R)
3. The app will use the scripts and templates from the current directory

### Option 2: Command Line Build (Recommended)

#### Ad Hoc Signing (Free)
```bash
# Build with minimal security warnings
./build-adhoc.sh
```

#### Professional Signing (Apple Developer Program)
```bash
# Build with zero security warnings
./build-signed.sh
```

#### Universal Binary (Unsigned)
```bash
# Build without code signing (shows security warnings)
./build-universal.sh
```

### Option 3: Pre-built DMG Download

**Quick Download**: Download the pre-built DMG installer for immediate use.

[![Download TemplateManager](https://img.shields.io/badge/Download-TemplateManager-1.0.0-blue?style=for-the-badge&logo=apple)](TemplateManager-1.0.0.dmg)

**Installation Steps:**
1. Download `TemplateManager-1.0.0.dmg`
2. Double-click to mount the disk image
3. Drag TemplateManager to your Applications folder
4. Launch from Applications (may require right-click → "Open" for first launch)

**Note**: The DMG contains a signed version that reduces security warnings. For zero warnings, use the command-line build with Apple Developer Program.

## Usage

### Creating a New Project
1. Launch Template Manager
2. Click "Create New" tab (if not already selected)
3. Browse and select a template from the gallery
4. Enter your project name
5. Choose location (or use default from settings)
6. Configure deployment options (GitHub/Vercel)
7. Click "Create Project"
8. Open in your preferred editor or view in Recent Projects

### Managing Recent Projects
1. Click "Recent Projects" tab
2. Search or filter projects as needed
3. Click on a project card for quick actions
4. Star frequently used projects as favorites

### Configuring Settings
1. Click the "Settings" button in the header
2. Navigate through different settings tabs
3. Customize defaults and preferences
4. Export settings for backup or sharing

## Available Templates

### Full-Featured Templates

#### 🛍️ E-Commerce
- Product catalog with categories
- Shopping cart functionality
- Stripe payment integration
- Inventory management
- Order processing system
- Next.js + React + Tailwind CSS

#### 📝 Blog
- Markdown editor with live preview
- MDX support for interactive content
- Blog post management
- Categories and tags
- SEO optimized
- RSS feed generation

#### 🔐 Next.js with Google OAuth
- Complete authentication setup
- NextAuth.js configuration
- Prisma database integration
- Protected routes
- User session management
- TypeScript + Tailwind CSS

#### 🌐 Full-Stack Database
- Express.js REST API
- Prisma ORM with migrations
- Docker Compose setup
- User authentication
- CRUD operations
- PostgreSQL database

### Starter Templates

#### 🛒 E-Commerce (Blank)
- Basic product listing
- Simple product pages
- Minimal styling
- Ready to customize

#### 📄 Blog (Blank)
- Basic blog layout
- Markdown support
- Minimal design
- Easy to extend

#### 🔑 Next.js Auth (Blank)
- Basic auth setup
- Login/logout functionality
- Simple protected routes
- TypeScript ready

#### 🖥️ Full-Stack (Blank)
- Basic Express server
- React client setup
- API communication ready
- Simple project structure

### GitHub Templates
- **React TypeScript Starter**: Official React template
- **Next.js Starter**: Vercel's Next.js template
- **Vite React**: Fast build tool template
- **Express API**: REST API starter

## Requirements

### System Requirements
- macOS 13.0 or later
- 100MB free disk space

### Required Dependencies
- `jq` command-line tool (for JSON parsing)
  ```bash
  brew install jq
  ```

### Optional Dependencies
- **Code Editors**: VS Code, Cursor, or Claude Code
- **Package Managers**: npm, yarn, pnpm, or bun
- **Version Control**: Git (for repository features)
- **Deployment**: Vercel CLI (for deployment features)
- **Terminal Apps**: Terminal, iTerm2, Warp, or Hyper

## Adding New Templates

1. Edit `template-config.json` to add your template
2. Optionally create a custom setup script in the same directory
3. The app will automatically detect the new template

## Project Structure

```
template-manager/
├── TemplateManager.xcodeproj    # Xcode project
├── TemplateManager/             # App source code
│   ├── App/                     # Main app files
│   ├── Views/                   # SwiftUI views
│   ├── Models/                  # Data models
│   ├── Services/                # Business logic
│   └── Resources/               # Scripts and config
├── template-config.json         # Template definitions
├── setup-from-config.sh         # Generic setup script
├── setup-nextjs-auth.sh        # Next.js specific setup
├── build-universal.sh           # Universal binary build (unsigned)
├── build-adhoc.sh              # Ad Hoc code signing (free)
├── build-signed.sh             # Developer ID signing (professional)
├── CODE_SIGNING_GUIDE.md       # Code signing documentation
└── MACOS_SECURITY_FIXES.md     # Security troubleshooting guide
```

## Development

The app is built with:
- SwiftUI for the user interface
- Process API for shell script execution
- JSON parsing for template configuration

### Creating Distribution DMG

To create a DMG for distribution:

```bash
# Create DMG from signed build
./create-dmg.sh

# Or create DMG from Ad Hoc signed build
./build-adhoc.sh
./create-dmg.sh
```

The DMG creation script will:
- Create a properly formatted disk image
- Include the app bundle
- Add a link to Applications folder
- Apply proper permissions and metadata
- Optionally sign the DMG (if certificates available)

## Keyboard Shortcuts

- `⌘N` - Create new project
- `⌘R` - Switch to Recent Projects
- `⌘,` - Open Settings
- `⌘W` - Close current window
- `⌘Q` - Quit application

## Security & Privacy

### Entitlements
The app requires the following entitlements:
- **File System Access**: For creating projects and reading templates
- **Shell Execution**: For running setup scripts and git commands
- **User-Selected Files**: For custom project locations
- **Network Access**: For GitHub and Vercel integrations

### Data Storage
- **Project History**: Stored locally in UserDefaults
- **Settings**: Stored locally, can be exported/imported
- **Credentials**: GitHub tokens stored in macOS Keychain
- **No Analytics**: The app does not collect any usage data

## Troubleshooting

### Common Issues

#### "Template not found" error
- Ensure `template-config.json` is in the correct location
- Check file permissions

#### Editor won't open
- Verify the editor is installed
- Check automation permissions in System Settings > Privacy & Security

#### Vercel deployment fails
- Run `vercel login` in Terminal
- Check network connection
- Verify project is Vercel-compatible

#### GitHub integration issues
- Re-authenticate in GitHub settings
- Check Personal Access Token permissions
- Ensure repository name is unique

### Security Issues

#### "App Not Opened" Security Dialog
- **Quick Fix**: Right-click the app → "Open" → Click "Open" in dialog
- **Permanent Fix**: Use code signing (see [Code Signing Guide](CODE_SIGNING_GUIDE.md))
- **Remove Quarantine**: `xattr -d com.apple.quarantine TemplateManager.app`

#### Code Signing Issues
- **No Certificate**: See [Code Signing Guide](CODE_SIGNING_GUIDE.md) for setup
- **Signing Failed**: Check certificate validity and permissions
- **Still Shows Warnings**: Consider Apple Developer Program for complete security

#### Build Script Issues
- **Permission Denied**: `chmod +x build-*.sh`
- **Certificate Not Found**: Run `security find-identity -p codesigning -v`
- **Build Fails**: Check Xcode and Swift installation

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with SwiftUI and Swift
- Uses various open-source templates
- Integrates with GitHub and Vercel APIs