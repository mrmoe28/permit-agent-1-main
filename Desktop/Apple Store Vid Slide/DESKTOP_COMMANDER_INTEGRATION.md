# Desktop Commander Integration

This document outlines the desktop commander functionality added to the App Store Connect Screenshot Tool.

## Overview

The desktop commander integration provides three distinct capture methods:

1. **Enhanced Mode** (`pnpm capture:enhanced`) - Original Playwright with desktop backup
2. **Desktop Mode** (`pnpm capture:desktop`) - Pure desktop automation
3. **Hybrid Mode** (`pnpm capture:hybrid`) - Intelligent combination of both methods

## Features Added

### Desktop Automation Capabilities

- **Native Screen Capture**: Full desktop screenshots without browser limitations
- **OCR Text Recognition**: Find UI elements by visible text content
- **Smart Interaction**: Automated mouse clicks, keyboard input, and scrolling
- **Cross-Application**: Works with any browser or desktop application
- **Intelligent Fallback**: Automatically switches methods when primary fails

### New Commands

```bash
# Original capture with optional desktop enhancements
pnpm capture:enhanced

# Pure desktop automation capture
pnpm capture:desktop

# Hybrid capture with intelligent method switching
pnpm capture:hybrid

# Install all dependencies including desktop automation
pnpm install:deps
```

## Architecture

### Core Components

#### `DesktopCommanderIntegration` (`src/desktop-commander.ts`)
- Main desktop automation interface
- Provides screen capture, OCR, mouse/keyboard control
- Integrates with Claude Code MCP desktop automation server
- Smart fallback to Playwright when available

#### `DesktopAppStoreCapture` (`src/desktop-capture.ts`)
- Pure desktop automation implementation
- Uses native OS capabilities for all interactions
- Generates desktop-focused documentation
- Multiple angle screenshot capture

#### `HybridAppStoreCapture` (`src/hybrid-capture.ts`)
- Intelligent method switching
- Performance tracking and optimization
- Comprehensive fallback system
- Detailed success/failure analytics

#### Enhanced `AppStoreScreenshotCapture` (`src/capture-appstore.ts`)
- Optional desktop enhancements via `--desktop` flag
- Desktop screenshot backup
- OCR element detection
- Maintains full backward compatibility

## Usage Examples

### Enhanced Mode (Recommended for Most Users)
```bash
pnpm capture:enhanced
```
- Uses proven Playwright automation
- Adds desktop screenshot backups
- OCR element detection for guidance
- Falls back gracefully on failures

### Desktop Mode (Cross-Browser/Application)
```bash
pnpm capture:desktop
```
- Works with any browser or application
- Native desktop interactions
- Multiple angle documentation
- OCR-based element finding

### Hybrid Mode (Maximum Reliability)
```bash
pnpm capture:hybrid
```
- Combines both methods intelligently
- Tracks performance metrics
- Automatic fallback on failures
- Comprehensive reporting

## Desktop Commander Interface

### Screen Capture
- `screenCapture()`: Native desktop screenshot
- `getScreenSize()`: Desktop resolution detection

### Mouse/Keyboard Control
- `mouseClick(x, y, button)`: Precise clicking
- `mouseMove(x, y)`: Cursor positioning
- `keyboardType(text)`: Text input
- `keyboardPress(key, modifiers)`: Key combinations

### Smart Detection
- `findTextOnScreen(text)`: OCR-based element finding
- `smartClick(selector, coords)`: Multi-method element interaction
- `smartType(selector, text)`: Intelligent text input

### Advanced Features
- `scroll(x, y, direction, clicks)`: Controlled scrolling
- `dragAndDrop(fromX, fromY, toX, toY)`: Drag operations
- `waitForColorChange(x, y, timeout)`: Visual state monitoring

## Output Structure

### Enhanced Mode
```
captures/YYYY-MM-DD_HH-MM/
├── 01-login.png                    # Playwright screenshot
├── 01-login-focus.png              # Element focus (if selector)
├── 01-login-desktop.png            # Desktop backup
├── 02-apps-dashboard.png
├── 02-apps-dashboard-desktop.png
└── report.md                       # Standard report
```

### Desktop Mode
```
captures/desktop-YYYY-MM-DD_HH-MM/
├── 01-login-desktop.png            # Native desktop capture
├── 01-login-top.png                # Multiple angles
├── 01-login-bottom.png
├── 02-apps-dashboard-desktop.png
├── final-desktop-state.png         # Final state
└── desktop-report.md               # Desktop-focused report
```

### Hybrid Mode
```
captures/hybrid-YYYY-MM-DD_HH-MM/
├── 01-login-browser.png            # Playwright capture
├── 01-login-desktop.png            # Desktop capture  
├── 01-login-element.png            # Element focus
├── 01-login-comparison.md          # Side-by-side comparison
├── final-browser-state.png
├── final-desktop-state.png
└── hybrid-report.md                # Performance analytics
```

## Configuration

### Environment Variables
```bash
# Enable desktop enhancements for standard capture
ENABLE_DESKTOP=true

# App Store Connect base URL
ASC_BASE=https://appstoreconnect.apple.com
```

### Command Line Arguments
```bash
# Enable desktop enhancements
tsx src/capture-appstore.ts --desktop
```

## Performance Characteristics

| Method | Browser Control | Cross-App | OCR | Speed | Reliability |
|--------|----------------|-----------|-----|--------|-------------|
| Enhanced | ✅ | ❌ | ✅ | Fast | High |
| Desktop | ❌ | ✅ | ✅ | Medium | Medium |
| Hybrid | ✅ | ✅ | ✅ | Variable | Highest |

## Troubleshooting

### Desktop Capture Issues
1. Ensure screen permissions are granted
2. Check MCP server connectivity
3. Verify desktop automation dependencies

### OCR Text Detection Fails
1. Increase screen resolution for better text clarity
2. Ensure sufficient contrast between text and background
3. Allow extra time for page loading

### Hybrid Method Switching
1. Check console logs for method selection reasoning
2. Review hybrid-report.md for performance analytics
3. Adjust timeout values for slow-loading pages

## Dependencies

### Added Packages
- `robotjs`: Native desktop automation
- `sharp`: Image processing
- `node-screenshots`: Cross-platform screen capture

### MCP Server Integration
- Requires Claude Code MCP desktop automation server
- Falls back gracefully when MCP unavailable
- Uses placeholder implementation for development

## Future Enhancements

1. **AI-Powered Element Detection**: Use computer vision for smarter element finding
2. **Automated Form Filling**: Pre-populate known form fields
3. **Multi-Monitor Support**: Full multi-display capture capabilities
4. **Video Recording**: Capture entire workflow as video
5. **Template Matching**: Visual element recognition beyond OCR

## Migration Guide

### From Standard to Enhanced
1. Add `--desktop` flag to existing commands
2. Update scripts in package.json
3. Install new dependencies with `pnpm install:deps`

### From Enhanced to Hybrid
1. Replace `capture:enhanced` with `capture:hybrid`
2. Review hybrid-report.md for performance insights
3. Adjust workflow based on method switching patterns

## Support

For issues specific to desktop commander integration:
1. Check console output for detailed error messages
2. Review generated reports for failure analysis
3. Test with different capture methods to isolate issues
4. Ensure all permissions are granted for desktop automation

## Security Considerations

- Desktop automation requires screen recording permissions
- OCR processing happens locally (no external services)
- Screenshots may contain sensitive information
- Consider using incognito/private browsing modes
- Review captured content before sharing