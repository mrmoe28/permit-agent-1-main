#!/bin/bash

# Template Manager Signed Build Script
# Builds a code-signed Universal Binary for macOS

set -e

echo "🔨 Building Template Manager with Code Signing..."

# Configuration
APP_NAME="TemplateManager"
BUILD_DIR="build-signed"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Code signing configuration
DEVELOPER_ID="Developer ID Application: Your Name (TEAM_ID)"
BUNDLE_ID="com.ekodevapps.TemplateManager"

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

# Create Info.plist with proper bundle identifier
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
    <string>$BUNDLE_ID</string>
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

# Code signing
echo "🔐 Code signing..."

# Check if we have a Developer ID certificate
if security find-identity -p codesigning -v | grep -q "Developer ID Application"; then
    echo "✅ Found Developer ID certificate"
    
    # Get the certificate name
    CERT_NAME=$(security find-identity -p codesigning -v | grep "Developer ID Application" | head -1 | cut -d'"' -f2)
    echo "📜 Using certificate: $CERT_NAME"
    
    # Sign the executable
    echo "🔏 Signing executable..."
    codesign --force --sign "$CERT_NAME" --options runtime --timestamp "$MACOS_DIR/TemplateManager"
    
    # Sign the app bundle
    echo "🔏 Signing app bundle..."
    codesign --force --sign "$CERT_NAME" --options runtime --timestamp "$APP_BUNDLE"
    
    # Verify signing
    echo "🔍 Verifying code signature..."
    codesign --verify --verbose "$APP_BUNDLE"
    spctl --assess --verbose "$APP_BUNDLE"
    
    echo "✅ Code signing complete!"
    
else
    echo "⚠️  No Developer ID certificate found"
    echo "   The app will still work but may show security warnings"
    echo "   To eliminate warnings:"
    echo "   1. Join Apple Developer Program (\$99/year)"
    echo "   2. Create Developer ID Application certificate"
    echo "   3. Run this script again"
fi

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
echo "✅ Signed Universal Binary build complete!"
echo "📍 App location: $APP_BUNDLE"
echo "🏗️  Architectures: Intel (x86_64) + Apple Silicon (arm64)"
echo ""
echo "This app will run natively on:"
echo "  ✓ Intel Macs"
echo "  ✓ Apple Silicon Macs (M1, M2, M3, etc.)"
echo ""
if security find-identity -p codesigning -v | grep -q "Developer ID Application"; then
    echo "🔐 Code signed with Developer ID - minimal security warnings"
else
    echo "⚠️  Not code signed - users may see security warnings"
fi
