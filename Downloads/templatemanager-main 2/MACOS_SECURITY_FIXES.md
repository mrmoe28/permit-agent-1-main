# macOS Security Issues and Fixes

## Problem: "App Not Opened" Security Dialog

**Symptoms:**
- macOS shows dialog: "TemplateManager.app Not Opened"
- Message: "Apple could not verify 'TemplateManager.app' is free of malware"
- Only options are "Done" and "Move to Trash"

**Root Cause:**
- macOS Gatekeeper blocks unsigned applications
- Apps downloaded from internet get quarantined with `com.apple.quarantine` attribute

## Solutions

### Solution 1: Remove Quarantine Attribute (Terminal)
```bash
# Navigate to app directory
cd "/path/to/templatemanager-main 2"

# Remove quarantine attribute
xattr -d com.apple.quarantine "build-universal/TemplateManager.app"
```

### Solution 2: Right-Click and Open
1. Right-click on TemplateManager.app
2. Select "Open" from context menu
3. Click "Open" in the security dialog

### Solution 3: System Preferences Override
1. System Preferences → Security & Privacy → General
2. Look for blocked app message
3. Click "Open Anyway"

### Solution 4: Use DMG Installer
1. Double-click TemplateManager-1.0.0.dmg
2. Drag app to Applications folder
3. Launch from Applications

## Prevention
- Sign the app with Apple Developer certificate
- Notarize the app through Apple
- Distribute through Mac App Store

## Files Affected
- `build-universal/TemplateManager.app` - Main application
- `TemplateManager-1.0.0.dmg` - Disk image installer

## Last Updated
September 13, 2024
