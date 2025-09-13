#!/bin/bash

# Build script for Template Manager Installer
# Creates a standalone installer app that handles automatic installation

set -e

echo "🔨 Building Template Manager Installer..."

# Configuration
INSTALLER_NAME="Install Template Manager"
BUILD_DIR="build-installer"
INSTALLER_BUNDLE="$BUILD_DIR/${INSTALLER_NAME}.app"
CONTENTS_DIR="$INSTALLER_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Clean previous builds
echo "🧹 Cleaning previous installer builds..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Create app bundle structure
echo "📁 Creating installer app bundle..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Compile the installer
echo "🔧 Compiling installer..."
swiftc installer/TemplateManagerInstaller.swift \
    -o "$MACOS_DIR/TemplateManagerInstaller" \
    -framework AppKit \
    -framework SwiftUI \
    -target x86_64-apple-macos13.0 \
    -target arm64-apple-macos13.0

# Create Info.plist for installer
echo "📝 Creating installer Info.plist..."
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>TemplateManagerInstaller</string>
    <key>CFBundleIdentifier</key>
    <string>com.ekodevapps.TemplateManagerInstaller</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Install Template Manager</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundleIconFile</key>
    <string>InstallerIcon</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create a simple installer icon (if ImageMagick is available)
if command -v convert &> /dev/null; then
    echo "🎨 Creating installer icon..."
    convert -size 512x512 xc:none \
        -fill "rgb(52,120,246)" \
        -draw "roundrectangle 50,50 462,462 50,50" \
        -fill white \
        -font Arial-Bold -pointsize 200 \
        -gravity center -annotate +0+0 "↓" \
        "$RESOURCES_DIR/InstallerIcon.png"

    # Convert to icns if iconutil is available
    if command -v iconutil &> /dev/null; then
        mkdir -p "$RESOURCES_DIR/InstallerIcon.iconset"
        for size in 16 32 64 128 256 512; do
            convert "$RESOURCES_DIR/InstallerIcon.png" \
                -resize ${size}x${size} \
                "$RESOURCES_DIR/InstallerIcon.iconset/icon_${size}x${size}.png"

            if [ $size -le 256 ]; then
                convert "$RESOURCES_DIR/InstallerIcon.png" \
                    -resize $((size*2))x$((size*2)) \
                    "$RESOURCES_DIR/InstallerIcon.iconset/icon_${size}x${size}@2x.png"
            fi
        done
        iconutil -c icns "$RESOURCES_DIR/InstallerIcon.iconset" -o "$RESOURCES_DIR/InstallerIcon.icns"
        rm -rf "$RESOURCES_DIR/InstallerIcon.iconset"
        rm "$RESOURCES_DIR/InstallerIcon.png"
    fi
fi

echo "✅ Installer app built successfully!"
echo "📍 Location: $INSTALLER_BUNDLE"