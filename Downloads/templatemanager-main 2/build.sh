#!/bin/bash

# Template Manager Build Script
# This script compiles the Swift app without requiring Xcode

set -e

echo "🔨 Building Template Manager..."

# Configuration
APP_NAME="TemplateManager"
BUILD_DIR="build"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Clean previous build
rm -rf "$BUILD_DIR"

# Create app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Find all Swift files
SWIFT_FILES=$(find TemplateManager -name "*.swift" -type f | grep -v ".build" | sort)

# Compile Swift files
echo "🔧 Compiling Swift files..."
swiftc \
    $SWIFT_FILES \
    -o "$MACOS_DIR/$APP_NAME" \
    -target x86_64-apple-macosx13.0 \
    -sdk $(xcrun --show-sdk-path) \
    -framework SwiftUI \
    -framework AppKit \
    -parse-as-library \
    -O

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
</dict>
</plist>
EOF

# Copy resources
echo "📦 Copying resources..."
cp -r TemplateManager/Resources/* "$RESOURCES_DIR/" 2>/dev/null || true

# Copy app icon if it exists
if [ -f "TemplateManager/Resources/AppIcon.icns" ]; then
    echo "🎨 Copying app icon..."
    cp "TemplateManager/Resources/AppIcon.icns" "$RESOURCES_DIR/"
fi

# Copy template-config.json to a location the app can find it
cp template-config.json "$RESOURCES_DIR/"

# Copy entitlements (for reference, won't be signed)
cp TemplateManager/TemplateManager.entitlements "$CONTENTS_DIR/" 2>/dev/null || true

# Create a simple run script
echo "🚀 Creating run script..."
cat > "run.sh" << 'EOF'
#!/bin/bash
./build/TemplateManager.app/Contents/MacOS/TemplateManager
EOF
chmod +x run.sh

echo "✅ Build complete!"
echo ""
echo "To run the app:"
echo "  1. Double-click: build/TemplateManager.app"
echo "  2. Or from terminal: ./run.sh"
echo ""
echo "Note: The app is not code-signed. You may need to:"
echo "  - Right-click and select 'Open' the first time"
echo "  - Or go to System Settings > Privacy & Security to allow it"