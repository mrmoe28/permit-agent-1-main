#!/bin/bash

# Template Manager Intel Build Script
# Builds an Intel (x86_64) version of the app

set -e

echo "🔨 Building Template Manager for Intel (x86_64)..."

# Configuration
APP_NAME="TemplateManager"
BUILD_DIR="build-intel"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Clean previous build
echo "🧹 Cleaning previous Intel build..."
rm -rf "$BUILD_DIR"
rm -rf .build

# Build for Intel using Swift Package Manager
echo "🔧 Building for Intel architecture..."
swift build -c release --arch x86_64

# Create app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy executable
echo "📦 Copying Intel executable..."
cp .build/x86_64-apple-macosx/release/TemplateManager "$MACOS_DIR/"

# Copy resources
echo "📦 Copying resources..."
cp -r TemplateManager/Resources/* "$RESOURCES_DIR/"
cp template-config.json "$RESOURCES_DIR/"

# Copy entitlements
cp TemplateManager/TemplateManager.entitlements "$CONTENTS_DIR/" 2>/dev/null || true

# Create Info.plist
echo "📝 Creating Info.plist..."
cat > "$CONTENTS_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>TemplateManager</string>
    <key>CFBundleIdentifier</key>
    <string>com.ekodevapps.TemplateManager</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Template Manager</string>
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
    <key>NSSupportsAutomaticTermination</key>
    <true/>
    <key>NSSupportsSuddenTermination</key>
    <true/>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSArchitecturePriority</key>
    <array>
        <string>x86_64</string>
    </array>
</dict>
</plist>
EOF

# Verify the architecture
echo "🔍 Verifying architecture..."
FILE_INFO=$(file "$MACOS_DIR/TemplateManager")
echo "Built binary: $FILE_INFO"

if [[ ! "$FILE_INFO" == *"x86_64"* ]]; then
    echo "❌ Error: Binary is not built for Intel architecture"
    exit 1
fi

echo "✅ Intel build complete!"
echo "📍 App location: $APP_BUNDLE"
echo "🏗️  Architecture: Intel (x86_64)"
echo ""
echo "Note: This Intel app will run on:"
echo "  - Intel Macs: Native performance"
echo "  - Apple Silicon Macs: Via Rosetta 2 translation"