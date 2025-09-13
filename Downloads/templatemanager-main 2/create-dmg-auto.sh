#!/bin/bash

# Enhanced Template Manager DMG Creation Script
# Creates a user-friendly DMG with automatic installer

set -e

# Configuration
APP_NAME="Template Manager"
VERSION=${1:-"1.0.0"}
DMG_NAME="TemplateManager-${VERSION}.dmg"
VOLUME_NAME="Template Manager Installer"
SOURCE_APP="build-universal/TemplateManager.app"
INSTALLER_APP="build-installer/Install Template Manager.app"
DMG_DIR="dmg-temp"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Template Manager DMG Creator v${VERSION}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Build the universal binary
echo -e "${YELLOW}Step 1: Building Universal Binary...${NC}"
if [ ! -d "$SOURCE_APP" ]; then
    ./build-universal.sh
else
    echo "✓ Universal binary already built"
fi

# Step 2: Build the installer app
echo -e "${YELLOW}Step 2: Building Installer App...${NC}"
chmod +x build-installer.sh
./build-installer.sh

# Step 3: Clean up any existing DMG
echo -e "${YELLOW}Step 3: Preparing DMG structure...${NC}"
rm -f "$DMG_NAME"
rm -rf "$DMG_DIR"
mkdir -p "$DMG_DIR"

# Copy both apps to DMG directory
echo "• Copying Template Manager app..."
cp -R "$SOURCE_APP" "$DMG_DIR/"

echo "• Copying Installer app..."
cp -R "$INSTALLER_APP" "$DMG_DIR/"

# Create a README file
echo "• Creating README..."
cat > "$DMG_DIR/README.txt" << 'EOF'
Template Manager - Installation Guide
=====================================

AUTOMATIC INSTALLATION (Recommended):
------------------------------------
1. Double-click "Install Template Manager"
2. Click "Install" button
3. The app will be automatically installed to your Applications folder
4. Template Manager will launch automatically when installation is complete

MANUAL INSTALLATION:
-------------------
1. Drag "TemplateManager" to your Applications folder
2. Double-click to launch from Applications

WHAT THE INSTALLER DOES:
------------------------
• Copies Template Manager to /Applications
• Sets up necessary permissions
• Creates support directories
• Configures auto-update checking
• Removes macOS quarantine attributes

SYSTEM REQUIREMENTS:
-------------------
• macOS 13.0 (Ventura) or later
• Works on both Intel and Apple Silicon Macs

SUPPORT:
--------
For help and updates, visit:
https://github.com/ekodevapps/templatemanager

© 2025 Template Manager
EOF

# Create an alias to Applications folder
ln -s /Applications "$DMG_DIR/Applications"

# Step 4: Create the DMG
echo -e "${YELLOW}Step 4: Creating DMG...${NC}"

# Calculate DMG size
APP_SIZE=$(du -sm "$DMG_DIR" | cut -f1)
DMG_SIZE=$((APP_SIZE + 50))

# Create temporary DMG
hdiutil create -srcfolder "$DMG_DIR" -volname "$VOLUME_NAME" -fs HFS+ \
    -fsargs "-c c=64,a=16,e=16" -format UDRW -size ${DMG_SIZE}m temp.dmg

# Mount the DMG
echo "• Mounting temporary DMG..."
DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen temp.dmg | \
         egrep '^/dev/' | sed 1q | awk '{print $1}')

sleep 2

# Set custom icon positions and window properties
echo "• Configuring DMG appearance..."
osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {200, 120, 900, 520}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 100
        set background color of viewOptions to {65535, 65535, 65535}

        -- Position items
        set position of item "Install Template Manager.app" of container window to {175, 150}
        set position of item "TemplateManager.app" of container window to {350, 150}
        set position of item "Applications" of container window to {525, 150}
        set position of item "README.txt" of container window to {350, 300}

        -- Add labels (if supported)
        try
            set label index of item "Install Template Manager.app" of container window to 2
        end try

        close
        open
        update without registering applications
        delay 3
    end tell
end tell
EOF

# Create a background image with instructions
if command -v convert &> /dev/null; then
    echo "• Creating background image..."
    convert -size 700x400 xc:white \
        -fill '#f0f0f0' -draw 'rectangle 0,0 700,50' \
        -fill black -font Arial-Bold -pointsize 24 \
        -gravity north -annotate +0+15 'Template Manager Installation' \
        -fill '#666666' -font Arial -pointsize 14 \
        -gravity center -annotate +0-80 'Double-click "Install Template Manager" for automatic installation' \
        -gravity center -annotate +0-60 'OR' \
        -gravity center -annotate +0-40 'Drag TemplateManager to Applications for manual installation' \
        -stroke '#3478f6' -strokewidth 2 -fill none \
        -draw 'roundrectangle 50,100 250,200 10,10' \
        -stroke '#28a745' -strokewidth 2 \
        -draw 'roundrectangle 425,100 625,200 10,10' \
        "/Volumes/${VOLUME_NAME}/.background.png"

    # Update Finder to use background
    osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        set background picture of container window to file ".background.png"
    end tell
end tell
EOF
fi

# Unmount and finalize
echo "• Finalizing DMG..."
sync
hdiutil detach "$DEVICE" -quiet

# Convert to compressed DMG
hdiutil convert temp.dmg -format UDZO -imagekey zlib-level=9 -o "$DMG_NAME"
rm -f temp.dmg

# Clean up
rm -rf "$DMG_DIR"

# Step 5: Sign the DMG (if certificates available)
echo -e "${YELLOW}Step 5: Code signing...${NC}"
if security find-identity -p codesigning -v | grep -q "Developer ID"; then
    echo "• Signing DMG with Developer ID..."
    codesign --sign "Developer ID Application" --deep "$DMG_NAME" || true

    # Verify signature
    codesign --verify --verbose "$DMG_NAME" || true
else
    echo "• No Developer ID certificate found (signing skipped)"
fi

# Step 6: Final verification
echo -e "${YELLOW}Step 6: Verification...${NC}"
if [ -f "$DMG_NAME" ]; then
    DMG_SIZE=$(du -h "$DMG_NAME" | cut -f1)
    echo -e "${GREEN}✅ DMG created successfully!${NC}"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "  📦 File: ${BLUE}$DMG_NAME${NC}"
    echo -e "  📊 Size: ${BLUE}$DMG_SIZE${NC}"
    echo -e "  🏗️  Architectures: Intel + Apple Silicon"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Installation Instructions for End Users:"
    echo "----------------------------------------"
    echo "1. Open the DMG file"
    echo "2. Double-click 'Install Template Manager'"
    echo "3. Click 'Install' and the app will be automatically installed"
    echo ""
    echo "The installer handles everything automatically:"
    echo "  • No terminal commands required"
    echo "  • Automatic permission configuration"
    echo "  • Creates all necessary directories"
    echo "  • Launches app when complete"
    echo ""
    echo "Distribution Checklist:"
    echo "  ☐ Test installation on a clean Mac"
    echo "  ☐ Upload to GitHub Releases"
    echo "  ☐ Update download links in README"
    echo "  ☐ Notify users of new release"
else
    echo "❌ Error: DMG creation failed"
    exit 1
fi