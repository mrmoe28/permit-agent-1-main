# App Store Connect Screenshot Tool

A guided Playwright + TypeScript tool that walks you step-by-step through the App Store Connect submission flow, capturing named PNG screenshots for documentation or tutorials.

## Features

- 🎯 **Guided Navigation** - Step-by-step instructions for 15 key App Store Connect screens
- 📸 **Smart Screenshots** - Full-page and optional element-focused captures  
- 🔄 **Session Persistence** - Login once, reuse sessions for multiple runs
- 📝 **Auto Documentation** - Generates markdown reports with image links
- ⚡ **Zero Automation** - Manual control, screenshots only (no form submission)
- 🖥️ **Desktop Commander** - Native desktop automation with OCR text recognition
- 🔀 **Hybrid Capture** - Intelligent browser + desktop automation with smart fallback
- 🎨 **Multiple Capture Modes** - Choose from standard, enhanced, desktop, or hybrid approaches

## Quick Start

```bash
# Install all dependencies (including Playwright browser)
pnpm run install:deps

# Standard capture mode (Playwright only)
pnpm capture

# Enhanced mode (Playwright + desktop backup)
pnpm capture:enhanced

# Pure desktop automation mode
pnpm capture:desktop

# Hybrid mode (intelligent browser + desktop automation)
pnpm capture:hybrid
```

## How It Works

1. **Opens Browser** - Launches Chromium in headful mode (1440x900 viewport)
2. **Session Management** - Reuses login sessions via `.auth/state.json`  
3. **Step-by-Step Guide** - For each of 15 submission steps:
   - Navigates to the URL (if provided) 
   - Shows detailed instructions in terminal
   - Waits for you to complete manual actions
   - Press Enter to capture screenshots
   - Saves full-page PNG (e.g., `01-login.png`)
   - Optionally captures element focus shots (`01-login-focus.png`)

## Submission Steps Covered

1. **Login** - App Store Connect authentication
2. **Apps Dashboard** - Main apps listing page
3. **New App Modal** - App creation form
4. **App Info — Main** - Basic app information
5. **App Info — URLs & Age Rating** - Compliance details
6. **App Privacy** - Data collection settings
7. **Features — In-App Purchases** - IAP management
8. **Prepare for Submission** - Version details
9. **Encryption** - Export compliance
10. **Upload via Xcode (Info)** - Build upload guidance
11. **Activity — Build Processing** - Build status
12. **Select Build** - Build selection
13. **Attach IAP to Version** - IAP association
14. **Review Notes (Demo Login)** - Demo credentials
15. **Submit for Review** - Final submission button

## Output Structure

Screenshots are saved to timestamped directories:

```
captures/
├── 2024-01-15_14-30/
│   ├── 01-login.png
│   ├── 02-apps-dashboard.png
│   ├── 03-new-app-modal.png
│   ├── ...
│   └── report.md          # Generated summary
└── 2024-01-15_16-45/
    └── ...
```

## Capture Modes

### Standard Mode (`pnpm capture`)
- Original Playwright browser automation
- Precise element targeting and interaction
- Session persistence with cookies/storage
- Best for standard web-based workflows

### Enhanced Mode (`pnpm capture:enhanced`)  
- Playwright automation with desktop backup screenshots
- OCR text recognition for element guidance
- Smart fallback when browser automation fails
- Recommended for most users

### Desktop Mode (`pnpm capture:desktop`)
- Pure native desktop automation
- Works with any browser or application
- OCR-based element detection
- Multiple angle screenshot capture
- Cross-browser/application compatibility

### Hybrid Mode (`pnpm capture:hybrid`)
- Intelligent combination of browser + desktop automation
- Automatic method switching based on success rates
- Performance tracking and detailed analytics
- Maximum reliability with comprehensive fallback

## Scripts

- `pnpm capture` - Standard Playwright capture
- `pnpm capture:enhanced` - Playwright with desktop backup
- `pnpm capture:desktop` - Pure desktop automation
- `pnpm capture:hybrid` - Intelligent hybrid capture
- `pnpm codegen` - Generate Playwright selectors
- `pnpm typecheck` - TypeScript validation
- `pnpm dev` - Open Playwright test UI
- `pnpm install:deps` - Install all dependencies

## Configuration

Optional environment variables in `.env`:

```bash
# App Store Connect base URL (default: https://appstoreconnect.apple.com)
ASC_BASE=https://appstoreconnect.apple.com

# Enable desktop enhancements for standard capture mode
ENABLE_DESKTOP=true
```

### Desktop Commander Requirements

The desktop automation features require:
- Claude Code MCP desktop automation server (for full functionality)
- Screen recording permissions (macOS: System Preferences > Security & Privacy > Privacy > Screen Recording)
- Accessibility permissions (for automated interactions)

Desktop automation gracefully falls back to browser-only mode when MCP server is unavailable.

## Safety Features

- **No Automation** - Screenshots only, no form submission
- **Session Reuse** - Login state persisted between runs
- **Manual Control** - You drive all interactions
- **Error Recovery** - Continues if element screenshots fail
- **Clean Naming** - Zero-padded indices (01, 02, 03...)

## Usage Tips

1. **First Run** - You'll need to login manually (including 2FA)
2. **Subsequent Runs** - Sessions are reused automatically
3. **Navigation** - Some steps auto-navigate, others require manual navigation
4. **Element Screenshots** - Will be added to steps.ts as selectors are identified
5. **Report Generation** - `report.md` includes all images with captions

## Requirements

- Node.js 18+
- pnpm 8+
- App Store Connect access with valid credentials

## Output Examples

### Standard/Enhanced Mode
```
captures/2025-01-15_14-30/
├── 01-login.png                  # Playwright screenshot
├── 01-login-focus.png            # Element focus (if available)
├── 01-login-desktop.png          # Desktop backup (enhanced mode)
├── 02-apps-dashboard.png
└── report.md                     # Standard report
```

### Desktop Mode  
```
captures/desktop-2025-01-15_14-30/
├── 01-login-desktop.png          # Native desktop capture
├── 01-login-top.png              # Multiple viewing angles
├── 01-login-bottom.png
├── final-desktop-state.png       # Final state capture
└── desktop-report.md             # Desktop-focused report
```

### Hybrid Mode
```
captures/hybrid-2025-01-15_14-30/
├── 01-login-browser.png          # Playwright capture
├── 01-login-desktop.png          # Desktop capture
├── 01-login-element.png          # Element focus
├── 01-login-comparison.md        # Method comparison
├── final-browser-state.png
├── final-desktop-state.png
└── hybrid-report.md              # Performance analytics
```

## File Structure

```
src/
├── capture-appstore.ts     # Main capture script (enhanced with desktop support)
├── desktop-capture.ts      # Pure desktop automation capture
├── hybrid-capture.ts       # Intelligent hybrid capture
├── desktop-commander.ts    # Desktop automation integration
├── steps.ts               # 15 submission steps configuration  
└── utils.ts               # Helper functions

.auth/                     # Session storage (auto-created)
captures/                  # Screenshot output (gitignored)
DESKTOP_COMMANDER_INTEGRATION.md  # Detailed desktop commander docs
```

## Advanced Usage

### Method Selection Guide

**Use Standard Mode when:**
- Working with standard web applications
- Need precise browser element interaction
- Want fastest capture speed

**Use Enhanced Mode when:**
- Need backup screenshots for reliability
- Want OCR element guidance
- Occasional browser automation failures

**Use Desktop Mode when:**  
- Working across multiple applications
- Browser automation is unreliable
- Need cross-browser compatibility
- Want comprehensive multi-angle documentation

**Use Hybrid Mode when:**
- Maximum reliability is required
- Need performance analytics
- Want best of both automation methods
- Working in complex/changing environments

Perfect for creating App Store submission tutorials, documentation, or training materials with multiple automation approaches!
