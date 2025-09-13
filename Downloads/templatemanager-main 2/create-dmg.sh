#!/bin/bash

# Template Manager DMG Creation Script
# Creates a distributable DMG installer for Template Manager

set -e

# Configuration
APP_NAME="Template Manager"
BUNDLE_NAME="TemplateManager"
VERSION=${1:-"1.0.0"}
DMG_NAME="TemplateManager-${VERSION}.dmg"
VOLUME_NAME="Template Manager"
SOURCE_APP="build-universal/TemplateManager.app"
DMG_DIR="dmg"
DMG_BACKGROUND="dmg-background.png"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Creating DMG for Template Manager v${VERSION}${NC}"

# Check if app exists
if [ ! -d "$SOURCE_APP" ]; then
    echo "Error: App not found at $SOURCE_APP"
    echo "Please build the app first using ./build.sh"
    exit 1
fi

# Clean up any existing DMG
rm -f "$DMG_NAME"
rm -rf "$DMG_DIR"

# Create DMG directory structure
echo "Creating DMG structure..."
mkdir -p "$DMG_DIR"
cp -R "$SOURCE_APP" "$DMG_DIR/"

# Create a symbolic link to Applications
ln -s /Applications "$DMG_DIR/Applications"

# Create DMG background (if not exists)
if [ ! -f "$DMG_BACKGROUND" ]; then
    echo "Creating DMG background..."
    # Create a simple background using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 600x400 xc:white \
            -font Arial -pointsize 24 -fill black \
            -gravity center -annotate +0-100 "Drag Template Manager to Applications" \
            -font Arial -pointsize 14 -fill gray \
            -gravity center -annotate +0+100 "Template Manager v${VERSION}" \
            "$DMG_BACKGROUND"
    fi
fi

# Method 1: Using create-dmg (if available)
if command -v create-dmg &> /dev/null; then
    echo "Creating DMG using create-dmg..."
    
    create-dmg \
        --volname "$VOLUME_NAME" \
        --volicon "TemplateManager/Resources/AppIcon.icns" \
        --window-pos 200 120 \
        --window-size 600 400 \
        --icon-size 100 \
        --icon "$BUNDLE_NAME.app" 150 185 \
        --hide-extension "$BUNDLE_NAME.app" \
        --app-drop-link 450 185 \
        --no-internet-enable \
        "$DMG_NAME" \
        "$DMG_DIR"
        
else
    # Method 2: Manual DMG creation
    echo "Creating DMG manually..."
    
    # Calculate DMG size (app size + 50MB buffer)
    APP_SIZE=$(du -sm "$SOURCE_APP" | cut -f1)
    DMG_SIZE=$((APP_SIZE + 50))
    
    # Create temporary DMG
    hdiutil create -srcfolder "$DMG_DIR" -volname "$VOLUME_NAME" -fs HFS+ \
        -fsargs "-c c=64,a=16,e=16" -format UDRW -size ${DMG_SIZE}m temp.dmg
    
    # Mount the DMG
    echo "Mounting temporary DMG..."
    DEVICE=$(hdiutil attach -readwrite -noverify -noautoopen temp.dmg | \
             egrep '^/dev/' | sed 1q | awk '{print $1}')
    
    # Wait for mount
    sleep 2
    
    # Set custom icon positions and window properties using AppleScript
    echo "Setting DMG window properties..."
    osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {200, 120, 800, 520}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 100
        set position of item "$BUNDLE_NAME.app" of container window to {150, 185}
        set position of item "Applications" of container window to {450, 185}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
EOF
    
    # Unmount the DMG
    echo "Finalizing DMG..."
    sync
    hdiutil detach "$DEVICE" -quiet
    
    # Convert to compressed DMG
    hdiutil convert temp.dmg -format UDZO -imagekey zlib-level=9 -o "$DMG_NAME"
    rm -f temp.dmg
fi

# Clean up
rm -rf "$DMG_DIR"

# Verify the DMG
if [ -f "$DMG_NAME" ]; then
    DMG_SIZE=$(du -h "$DMG_NAME" | cut -f1)
    echo -e "${GREEN}✓ DMG created successfully: $DMG_NAME ($DMG_SIZE)${NC}"
    
    # Optional: Sign the DMG if certificates are available
    if security find-identity -p codesigning -v | grep -q "Developer ID"; then
        echo "Signing DMG..."
        codesign --sign "Developer ID Application" "$DMG_NAME" || true
    fi
    
    # Optional: Notarize the DMG
    # This requires Apple Developer account and credentials
    # xcrun altool --notarize-app --primary-bundle-id "com.templatemanager.dmg" \
    #     --username "your-apple-id@example.com" --password "@keychain:AC_PASSWORD" \
    #     --file "$DMG_NAME"
else
    echo "Error: DMG creation failed"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Test the DMG by double-clicking it"
echo "2. Upload to GitHub Releases or distribution platform"
echo "3. Update download links in README and website"