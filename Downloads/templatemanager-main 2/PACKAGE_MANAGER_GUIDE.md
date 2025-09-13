# Package Manager Installation Guide

## Overview
TemplateManager uses system package managers (npm, yarn, pnpm, bun) to install dependencies and run development servers. Users need to install their preferred package manager on their system.

## Installation Methods

### 1. Using Homebrew (Recommended)
```bash
# Install Node.js (includes npm)
brew install node

# Install Yarn
brew install yarn

# Install pnpm
brew install pnpm

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### 2. Direct Downloads
- **Node.js/npm**: https://nodejs.org/
- **Yarn**: https://yarnpkg.com/getting-started/install
- **pnpm**: https://pnpm.io/installation
- **Bun**: https://bun.sh/docs/installation

## App Features

### Enhanced Detection
The app now checks multiple common installation paths:
- `/usr/local/bin/` (Homebrew Intel)
- `/opt/homebrew/bin/` (Homebrew Apple Silicon)
- `/usr/bin/` (System)
- `~/.bun/bin/` (Bun user installation)

### Installation Assistance
- **Install buttons** appear next to uninstalled package managers
- **One-click installation** opens Terminal with the correct command
- **Copy to clipboard** option for manual installation
- **Visual indicators** show installation status (✓ Installed / Not installed)

## User Experience

### For New Users
1. Open TemplateManager Settings
2. Go to "Package Manager" tab
3. Click "Install" next to your preferred package manager
4. Choose "Open Terminal" to run the installation command
5. Restart TemplateManager to detect the new installation

### For Existing Users
- App automatically detects existing installations
- No additional setup required
- Can switch between installed package managers anytime

## Troubleshooting

### Package Manager Not Detected
1. Ensure the package manager is in your PATH
2. Try restarting TemplateManager
3. Check installation with: `which [package-manager-name]`

### Installation Fails
1. Ensure you have admin privileges
2. Try installing via Homebrew first
3. Check the package manager's official documentation

## Best Practices

### For Developers
- Install your preferred package manager globally
- Use consistent package managers across projects
- Keep package managers updated

### For Teams
- Document which package manager your team uses
- Include installation instructions in project README
- Consider using `.nvmrc` or similar version files

## Technical Details

### Detection Logic
1. Check common installation paths first
2. Fall back to `which` command
3. Cache results for performance
4. Refresh on app restart

### Installation Commands
- **npm**: `brew install node`
- **yarn**: `brew install yarn`
- **pnpm**: `brew install pnpm`
- **bun**: `curl -fsSL https://bun.sh/install | bash`

## Support

If you encounter issues:
1. Check the package manager's official documentation
2. Ensure your system meets the requirements
3. Try reinstalling the package manager
4. Contact support with specific error messages
