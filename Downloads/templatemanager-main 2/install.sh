#!/bin/bash

# Template Manager Installer Script
# This script downloads and installs Template Manager on macOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Template Manager"
BUNDLE_NAME="TemplateManager"
GITHUB_REPO="mrmoe28/templatemanager"
INSTALL_DIR="/Applications"
DOWNLOAD_URL=""

# Functions
print_header() {
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Template Manager Installer        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This installer is for macOS only."
        exit 1
    fi
    
    # Check macOS version (13.0 or later required)
    os_version=$(sw_vers -productVersion)
    major_version=$(echo "$os_version" | cut -d. -f1)
    
    if [ "$major_version" -lt 13 ]; then
        print_error "macOS 13.0 or later is required. You have $os_version"
        exit 1
    fi
    
    print_success "macOS $os_version detected"
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check for jq
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed"
        
        if command -v brew &> /dev/null; then
            print_info "Installing jq via Homebrew..."
            brew install jq
            print_success "jq installed"
        else
            print_warning "Please install jq manually: brew install jq"
            print_info "Or download from: https://stedolan.github.io/jq/download/"
        fi
    else
        print_success "jq is installed"
    fi
    
    # Check for Git (optional but recommended)
    if command -v git &> /dev/null; then
        print_success "Git is installed"
    else
        print_warning "Git is not installed (optional)"
    fi
}

get_latest_release() {
    print_info "Fetching latest release information..."
    
    # Try to get the latest release from GitHub API
    if command -v curl &> /dev/null && command -v jq &> /dev/null; then
        release_info=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" 2>/dev/null || true)
        
        if [ -n "$release_info" ] && [ "$release_info" != "null" ]; then
            # Look for .dmg or .zip asset
            dmg_url=$(echo "$release_info" | jq -r '.assets[] | select(.name | endswith(".dmg")) | .browser_download_url' 2>/dev/null || true)
            zip_url=$(echo "$release_info" | jq -r '.assets[] | select(.name | endswith(".zip")) | .browser_download_url' 2>/dev/null || true)
            
            if [ -n "$dmg_url" ] && [ "$dmg_url" != "null" ]; then
                DOWNLOAD_URL="$dmg_url"
                print_success "Found DMG release"
            elif [ -n "$zip_url" ] && [ "$zip_url" != "null" ]; then
                DOWNLOAD_URL="$zip_url"
                print_success "Found ZIP release"
            fi
        fi
    fi
    
    # Fallback to direct download from repository
    if [ -z "$DOWNLOAD_URL" ]; then
        print_warning "No pre-built release found. Will build from source."
        return 1
    fi
    
    return 0
}

download_release() {
    local url="$1"
    local filename=$(basename "$url")
    local temp_dir=$(mktemp -d)
    local download_path="$temp_dir/$filename"
    
    print_info "Downloading $filename..."
    
    if curl -L -# -o "$download_path" "$url"; then
        print_success "Download complete"
        echo "$download_path"
    else
        print_error "Download failed"
        return 1
    fi
}

install_from_dmg() {
    local dmg_path="$1"
    
    print_info "Mounting DMG..."
    hdiutil attach "$dmg_path" -nobrowse -quiet
    
    # Find the mounted volume
    volume=$(ls /Volumes | grep -i "template.*manager" | head -n1)
    if [ -z "$volume" ]; then
        volume="Template Manager"
    fi
    
    print_info "Installing from /Volumes/$volume..."
    
    # Copy the app to Applications
    if [ -e "/Volumes/$volume/$BUNDLE_NAME.app" ]; then
        rm -rf "$INSTALL_DIR/$BUNDLE_NAME.app" 2>/dev/null || true
        cp -R "/Volumes/$volume/$BUNDLE_NAME.app" "$INSTALL_DIR/"
        print_success "App installed to $INSTALL_DIR"
    else
        print_error "App not found in DMG"
        hdiutil detach "/Volumes/$volume" -quiet
        return 1
    fi
    
    # Unmount the DMG
    hdiutil detach "/Volumes/$volume" -quiet
}

install_from_zip() {
    local zip_path="$1"
    local temp_dir=$(mktemp -d)
    
    print_info "Extracting ZIP..."
    unzip -q "$zip_path" -d "$temp_dir"
    
    # Find the app bundle
    app_path=$(find "$temp_dir" -name "$BUNDLE_NAME.app" -type d | head -n1)
    
    if [ -n "$app_path" ]; then
        print_info "Installing app..."
        rm -rf "$INSTALL_DIR/$BUNDLE_NAME.app" 2>/dev/null || true
        cp -R "$app_path" "$INSTALL_DIR/"
        print_success "App installed to $INSTALL_DIR"
    else
        print_error "App bundle not found in ZIP"
        return 1
    fi
    
    rm -rf "$temp_dir"
}

build_from_source() {
    print_info "Building from source..."
    
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Clone the repository
    print_info "Cloning repository..."
    if ! git clone "https://github.com/$GITHUB_REPO.git" .; then
        print_error "Failed to clone repository"
        return 1
    fi
    
    # Check if we have Xcode command line tools
    if ! xcode-select -p &> /dev/null; then
        print_error "Xcode Command Line Tools are not installed"
        print_info "Please install them with: xcode-select --install"
        return 1
    fi
    
    # Build the app
    if [ -f "build.sh" ]; then
        print_info "Running build script..."
        chmod +x build.sh
        ./build.sh
    elif [ -f "Package.swift" ]; then
        print_info "Building with Swift Package Manager..."
        swift build -c release
        # TODO: Package the built executable into an app bundle
    else
        print_error "No build script found"
        return 1
    fi
    
    # Install the built app
    if [ -d "build/$BUNDLE_NAME.app" ]; then
        print_info "Installing app..."
        rm -rf "$INSTALL_DIR/$BUNDLE_NAME.app" 2>/dev/null || true
        cp -R "build/$BUNDLE_NAME.app" "$INSTALL_DIR/"
        print_success "App installed to $INSTALL_DIR"
    else
        print_error "Build failed - app bundle not found"
        return 1
    fi
    
    cd - > /dev/null
    rm -rf "$temp_dir"
}

handle_gatekeeper() {
    print_info "Removing quarantine attributes..."
    xattr -dr com.apple.quarantine "$INSTALL_DIR/$BUNDLE_NAME.app" 2>/dev/null || true
    
    print_warning "macOS Gatekeeper may block the app on first launch."
    print_info "To open the app:"
    print_info "  1. Right-click on $APP_NAME in Applications"
    print_info "  2. Select 'Open' from the context menu"
    print_info "  3. Click 'Open' in the dialog that appears"
    print_info ""
    print_info "Or go to System Settings > Privacy & Security"
    print_info "and click 'Open Anyway' after trying to launch the app"
}

create_uninstaller() {
    print_info "Creating uninstaller..."
    
    cat > "/tmp/uninstall-template-manager.sh" << 'EOF'
#!/bin/bash

APP_NAME="Template Manager"
BUNDLE_NAME="TemplateManager"

echo "Uninstalling $APP_NAME..."

# Remove app from Applications
if [ -d "/Applications/$BUNDLE_NAME.app" ]; then
    rm -rf "/Applications/$BUNDLE_NAME.app"
    echo "✓ Removed app from Applications"
fi

# Remove app support files
if [ -d "$HOME/Library/Application Support/$BUNDLE_NAME" ]; then
    rm -rf "$HOME/Library/Application Support/$BUNDLE_NAME"
    echo "✓ Removed application support files"
fi

# Remove preferences
defaults delete com.ekodevapps.TemplateManager 2>/dev/null || true

# Remove saved application state
rm -rf "$HOME/Library/Saved Application State/com.ekodevapps.TemplateManager.savedState" 2>/dev/null || true

echo "✓ $APP_NAME has been uninstalled"
echo ""
echo "Note: Your project history and settings have been preserved in:"
echo "  ~/Library/Preferences/com.ekodevapps.TemplateManager.plist"
echo "Delete this file if you want to remove all app data."
EOF

    chmod +x "/tmp/uninstall-template-manager.sh"
    
    if [ -w "$INSTALL_DIR" ]; then
        cp "/tmp/uninstall-template-manager.sh" "$INSTALL_DIR/$BUNDLE_NAME.app/Contents/Resources/uninstall.sh" 2>/dev/null || true
    fi
    
    print_success "Uninstaller created at: /tmp/uninstall-template-manager.sh"
}

# Main installation flow
main() {
    print_header
    
    # Check system requirements
    check_macos
    check_dependencies
    
    # Try to download pre-built release
    if get_latest_release && [ -n "$DOWNLOAD_URL" ]; then
        download_path=$(download_release "$DOWNLOAD_URL")
        
        if [ $? -eq 0 ]; then
            case "$download_path" in
                *.dmg)
                    install_from_dmg "$download_path"
                    ;;
                *.zip)
                    install_from_zip "$download_path"
                    ;;
                *)
                    print_error "Unknown file type"
                    exit 1
                    ;;
            esac
            
            # Cleanup
            rm -f "$download_path"
            rm -rf "$(dirname "$download_path")"
        else
            print_error "Installation from release failed"
            exit 1
        fi
    else
        # Build from source as fallback
        print_info "No pre-built release available"
        read -p "Build from source? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            build_from_source
        else
            print_info "Installation cancelled"
            exit 0
        fi
    fi
    
    # Post-installation steps
    if [ -d "$INSTALL_DIR/$BUNDLE_NAME.app" ]; then
        handle_gatekeeper
        create_uninstaller
        
        echo ""
        print_success "Installation complete! 🎉"
        print_info "$APP_NAME has been installed to $INSTALL_DIR"
        echo ""
        print_info "To launch the app:"
        print_info "  • Open Finder and go to Applications"
        print_info "  • Double-click on $APP_NAME"
        print_info "  • Or use Spotlight: Press ⌘+Space and type '$APP_NAME'"
        echo ""
        
        # Ask if user wants to open the app now
        read -p "Open $APP_NAME now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$INSTALL_DIR/$BUNDLE_NAME.app"
        fi
    else
        print_error "Installation failed"
        exit 1
    fi
}

# Run main function
main "$@"