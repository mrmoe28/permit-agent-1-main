# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an App Store Connect Screenshot Tool - a guided Playwright + TypeScript application that walks users through the complete App Store Connect submission flow while capturing named PNG screenshots for documentation or tutorials. The tool provides manual control with screenshot-only automation (no form submission).

## Common Commands

### Development Commands
- `pnpm install` - Install all dependencies
- `pnpm run install:playwright` - Install Playwright Chromium browser
- `pnpm capture` - Run the main guided screenshot capture tool
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm dev` - Open Playwright test UI for debugging
- `pnpm codegen` - Generate Playwright selectors for App Store Connect

### Environment Setup
1. Install dependencies: `pnpm install`
2. Install Playwright browser: `pnpm run install:playwright`
3. Optionally create `.env` file with `ASC_BASE=https://appstoreconnect.apple.com`

## Architecture

### Core Components

**Main Execution Flow (`src/capture-appstore.ts`)**
- `AppStoreScreenshotCapture` class orchestrates the entire capture process
- Uses persistent browser sessions via `.auth/state.json` for login reuse
- Processes 15 predefined submission steps sequentially
- Generates timestamped output directories and markdown reports

**Submission Steps Configuration (`src/steps.ts`)**
- `SubmissionStep` interface defines each step structure (title, slug, url, selector, notes)
- `SubmissionSteps` array contains all 15 App Store Connect submission steps
- Steps include login, app creation, app info, privacy settings, IAP, submission preparation

**Utility Functions (`src/utils.ts`)**
- File system operations (`ensureDir`, `slugify`)
- Screenshot capture with error handling (`safeScreenshot`, `elementScreenshot`)
- User interaction (`waitForEnter`)
- Timestamp and formatting utilities

### Browser Configuration (`playwright.config.ts`)
- Configured for App Store Connect base URL
- Uses Desktop Chrome device simulation
- 1440x900 viewport, headless: false for manual interaction
- Single worker, no parallel execution
- Session persistence and error recovery

## Key Technical Details

### Session Management
- Browser sessions stored in `.auth/state.json` to avoid repeated logins
- Supports 2FA authentication on first run
- Context reuse across multiple capture sessions

### Screenshot Strategy
- Full-page screenshots for every step (`{index}-{slug}.png`)
- Optional element-focused screenshots when selectors are available (`{index}-{slug}-focus.png`)
- Zero-padded indices (01, 02, 03...) for proper file ordering
- Graceful error handling if element screenshots fail

### Output Structure
```
captures/
└── YYYY-MM-DD_HH-MM/
    ├── 01-login.png
    ├── 02-apps-dashboard.png
    ├── ...
    └── report.md
```

### Step Processing Flow
1. Navigate to URL (if provided) or prompt for manual navigation
2. Display step instructions to user
3. Wait for user to press Enter
4. Capture full-page screenshot
5. Capture element screenshot (if selector defined)
6. Continue to next step

### Safety Features
- No automated form submission or data modification
- Manual user control at every step
- Graceful error recovery for navigation failures
- Session cleanup on process termination (SIGINT/SIGTERM)

## Development Notes

- Uses ES modules (`"type": "module"` in package.json)
- TypeScript with strict settings
- File extension `.js` imports required for ES modules
- All async operations with proper error handling
- Console output with emoji indicators for user guidance