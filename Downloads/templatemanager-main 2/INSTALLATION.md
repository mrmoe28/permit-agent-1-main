# TemplateManager Installation Guide

## System Requirements

### Minimum Requirements
- **macOS**: 13.0 (Ventura) or later
- **Xcode**: 15.0 or later
- **Swift**: 5.8 or later
- **Git**: 2.0 or later
- **Available Storage**: 2GB minimum

### Supported Hardware
- ✅ **Apple Silicon Macs** (M1, M2, M3, M4)
- ✅ **Intel Macs** (2017 or later recommended)

---

## Installation Instructions

### Option 1: Download Pre-built App (Recommended)

#### For Apple Silicon Macs (M1/M2/M3/M4)
1. **Download the latest release**:
   ```bash
   # Download ARM64 version
   curl -L -o TemplateManager.dmg "https://github.com/mrmoe28/templatemanager/releases/latest/download/TemplateManager-arm64.dmg"
   ```

2. **Install the app**:
   - Open `TemplateManager.dmg`
   - Drag `TemplateManager.app` to your `Applications` folder
   - Right-click the app and select "Open" (first time only)

#### For Intel Macs
1. **Download the Intel version**:
   ```bash
   # Download x86_64 version
   curl -L -o TemplateManager.dmg "https://github.com/mrmoe28/templatemanager/releases/latest/download/TemplateManager-x86_64.dmg"
   ```

2. **Install the app**:
   - Open `TemplateManager.dmg`
   - Drag `TemplateManager.app` to your `Applications` folder
   - Right-click the app and select "Open" (first time only)

### Option 2: Build from Source

#### Step 1: Install Prerequisites

**Install Xcode:**
1. Download from Mac App Store or Apple Developer Portal
2. Launch Xcode and accept license agreements
3. Install additional components when prompted

**Install Command Line Tools:**
```bash
xcode-select --install
```

**Verify Swift installation:**
```bash
swift --version
# Should show Swift 5.8 or later
```

#### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/mrmoe28/templatemanager.git
cd templatemanager
```

#### Step 3: Build for Your Architecture

**For Apple Silicon Macs (M1/M2/M3/M4):**
```bash
# Build ARM64 version
swift build -c release --arch arm64

# Alternative: Use build script
./build-arm64.sh
```

**For Intel Macs:**
```bash
# Build x86_64 version
swift build -c release --arch x86_64

# Alternative: Use build script
./build-intel.sh
```

**For Universal Binary (Both architectures):**
```bash
# Build universal binary
./build-universal.sh
```

#### Step 4: Install Built App

```bash
# Copy to Applications folder
cp -R .build/release/TemplateManager.app /Applications/

# Make executable
chmod +x /Applications/TemplateManager.app/Contents/MacOS/TemplateManager
```

---

## Post-Installation Setup

### 1. Grant Permissions

**Automation Permission (Required):**
1. Go to **System Settings** > **Privacy & Security** > **Automation**
2. Find **TemplateManager** in the list
3. Enable permissions for:
   - Terminal
   - Finder
   - Your preferred editor (VS Code, Cursor, etc.)

**Full Disk Access (Optional but recommended):**
1. Go to **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Add **TemplateManager** to the list

### 2. Install Optional Dependencies

**Install Node.js (for JavaScript/TypeScript templates):**
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

**Install Git (if not already installed):**
```bash
# Using Homebrew
brew install git

# Or download from git-scm.com
```

**Install Preferred Code Editor:**
- **VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com)
- **Cursor**: Download from [cursor.sh](https://cursor.sh)
- **Claude Code**: Install via npm: `npm install -g claude-code`

### 3. Configure TemplateManager

1. **Launch TemplateManager**
2. **Go to Settings** (⌘+,)
3. **Configure:**
   - Default project location
   - Preferred editor
   - GitHub integration (optional)
   - Package manager preferences

---

## Architecture-Specific Notes

### Apple Silicon Macs (M1/M2/M3/M4)
- **Native ARM64 performance** - fastest option
- **Rosetta compatibility** - can run Intel builds if needed
- **Recommended**: Use ARM64 native build

### Intel Macs
- **x86_64 architecture** - traditional Intel performance
- **Compatibility**: All features fully supported
- **Memory usage**: May be slightly higher than ARM64

---

## Troubleshooting

### Build Issues

**"No such module 'AppKit'" error:**
```bash
# Ensure building for macOS (not iOS)
xcodebuild -scheme TemplateManager -destination "platform=macOS" build
```

**Swift version mismatch:**
```bash
# Check Swift version
swift --version

# Update Xcode if needed
```

**Missing dependencies:**
```bash
# Clean and rebuild
swift package clean
swift build
```

### Runtime Issues

**App won't open (Security warning):**
1. Right-click app → "Open"
2. Or go to **System Settings** > **Privacy & Security**
3. Click "Open Anyway" next to the security warning

**Missing permissions:**
1. Check **System Settings** > **Privacy & Security**
2. Grant required permissions to TemplateManager

**Template creation fails:**
```bash
# Check if git is installed
git --version

# Check if target directory is writable
ls -la /path/to/target/directory
```

### Performance Issues

**Slow builds on Intel Macs:**
- Ensure you're using the x86_64 build
- Close unnecessary applications
- Check available disk space

**Memory issues:**
- Restart TemplateManager
- Check system memory usage
- Consider upgrading RAM if consistently low

---

## Verification

**Test the installation:**
1. Launch TemplateManager
2. Create a new project from a template
3. Verify the project opens in your preferred editor

**Check CLI access (optional):**
```bash
# If you built from source
/Applications/TemplateManager.app/Contents/MacOS/TemplateManager --help
```

---

## Uninstallation

**Remove the app:**
```bash
# Remove application
rm -rf /Applications/TemplateManager.app

# Remove user data (optional)
rm -rf ~/Library/Application\ Support/TemplateManager
rm -rf ~/Library/Preferences/com.templatemanager.TemplateManager.plist
```

---

## Support

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/mrmoe28/templatemanager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mrmoe28/templatemanager/discussions)
- **Documentation**: [Project Wiki](https://github.com/mrmoe28/templatemanager/wiki)

### Before Reporting Issues
1. Check this troubleshooting guide
2. Verify system requirements
3. Test with a fresh template
4. Include system information:
   ```bash
   # System info
   sw_vers
   uname -m
   swift --version
   xcodebuild -version
   ```

---

## Advanced Installation

### Building from Specific Branch
```bash
git clone https://github.com/mrmoe28/templatemanager.git
cd templatemanager
git checkout feature-branch
swift build -c release
```

### Custom Installation Location
```bash
# Install to custom location
cp -R .build/release/TemplateManager.app ~/Desktop/MyApps/
```

### Development Installation
```bash
# For developers
git clone https://github.com/mrmoe28/templatemanager.git
cd templatemanager
swift build
# App will be in .build/debug/
```