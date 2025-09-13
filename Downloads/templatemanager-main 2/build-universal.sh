#!/bin/bash

# Template Manager Universal Binary Build Script
# Builds a Universal Binary that runs on both Intel and Apple Silicon Macs

set -e

echo "🔨 Building Template Manager Universal Binary (Intel + Apple Silicon)..."

# Configuration
APP_NAME="TemplateManager"
BUILD_DIR="build-universal"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR"
rm -rf .build

# Build for both architectures
echo "🔧 Building for Intel (x86_64)..."
swift build -c release --arch x86_64

echo "🔧 Building for Apple Silicon (arm64)..."
swift build -c release --arch arm64

# Create app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create Universal Binary using lipo
echo "🔗 Creating Universal Binary..."
lipo -create \
    .build/x86_64-apple-macosx/release/TemplateManager \
    .build/arm64-apple-macosx/release/TemplateManager \
    -output "$MACOS_DIR/TemplateManager"

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
        <string>arm64</string>
        <string>x86_64</string>
    </array>
</dict>
</plist>
EOF

# Verify the Universal Binary
echo "🔍 Verifying Universal Binary..."
FILE_INFO=$(file "$MACOS_DIR/TemplateManager")
echo "Built binary: $FILE_INFO"

# Check for both architectures
if [[ ! "$FILE_INFO" == *"x86_64"* ]] || [[ ! "$FILE_INFO" == *"arm64"* ]]; then
    echo "❌ Error: Binary is not a proper Universal Binary"
    exit 1
fi

# Show detailed architecture info
echo ""
echo "📊 Architecture details:"
lipo -info "$MACOS_DIR/TemplateManager"

echo ""
echo "✅ Universal Binary build complete!"
echo "📍 App location: $APP_BUNDLE"
echo "🏗️  Architectures: Intel (x86_64) + Apple Silicon (arm64)"
echo ""
echo "This app will run natively on:"
echo "  ✓ Intel Macs"
echo "  ✓ Apple Silicon Macs (M1, M2, M3, etc.)"
echo ""
echo "File size will be larger due to containing both architectures."