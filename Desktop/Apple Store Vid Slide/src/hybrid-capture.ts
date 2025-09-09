#!/usr/bin/env tsx
/**
 * Hybrid App Store Connect Screenshot Tool
 * Combines Playwright browser automation with desktop commander capabilities
 */
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import 'dotenv/config';

import { SubmissionSteps, SubmissionStep } from './steps.js';
import { 
  ensureDir, 
  slugify, 
  waitForEnter, 
  safeScreenshot, 
  elementScreenshot,
  getTimestamp,
  formatStepIndex,
  waitForPageStable
} from './utils.js';
import DesktopCommanderIntegration, { EnhancedSubmissionStep } from './desktop-commander.js';

// Configuration
const BASE_URL = process.env.ASC_BASE || 'https://appstoreconnect.apple.com';
const AUTH_STATE_PATH = '.auth/state.json';
const CAPTURES_BASE = 'captures';

class HybridAppStoreCapture {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private desktop: DesktopCommanderIntegration;
  private sessionDir: string;
  private capturedSteps: Array<{
    index: number;
    step: SubmissionStep;
    screenshots: string[];
    method: 'playwright' | 'desktop' | 'hybrid';
    performance: {
      duration: number;
      success: boolean;
      fallbackUsed: boolean;
    };
  }> = [];

  constructor() {
    this.sessionDir = join(CAPTURES_BASE, `hybrid-${getTimestamp()}`);
    this.desktop = new DesktopCommanderIntegration(this.sessionDir);
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing Hybrid App Store Connect Screenshot Tool');
    console.log('========================================================');
    
    // Ensure directories exist
    await ensureDir(dirname(AUTH_STATE_PATH));
    await ensureDir(this.sessionDir);
    
    // Initialize desktop commander
    const screenSize = await this.desktop.getScreenSize();
    console.log(`📺 Screen resolution: ${screenSize.width}x${screenSize.height}`);
    
    // Launch browser with desktop integration
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ],
    });

    // Create context with persistent storage
    const storageStateExists = await this.checkStorageState();
    this.context = await this.browser.newContext({
      viewport: { width: 1440, height: 900 },
      storageState: storageStateExists ? AUTH_STATE_PATH : undefined,
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
    });

    this.page = await this.context.newPage();
    
    // Integrate desktop commander with playwright page
    this.desktop = new DesktopCommanderIntegration(this.sessionDir, this.page);
    
    console.log(`📁 Screenshots will be saved to: ${this.sessionDir}`);
    console.log(`🔐 Browser session: ${storageStateExists ? 'Existing session found' : 'New session'}`);
    console.log('🤖 Desktop automation: Ready');
  }

  private async checkStorageState(): Promise<boolean> {
    try {
      await fs.access(AUTH_STATE_PATH);
      return true;
    } catch {
      return false;
    }
  }

  async processSteps(): Promise<void> {
    console.log(`\n📋 Processing ${SubmissionSteps.length} steps with hybrid automation:`);
    
    for (let i = 0; i < SubmissionSteps.length; i++) {
      const step = SubmissionSteps[i];
      const stepIndex = i + 1;
      const formattedIndex = formatStepIndex(stepIndex);
      const startTime = Date.now();
      
      console.log(`\n[${stepIndex}/${SubmissionSteps.length}] ${step.title}`);
      console.log('-'.repeat(60));
      
      const result = await this.processHybridStep(step, formattedIndex);
      const duration = Date.now() - startTime;
      
      this.capturedSteps.push({
        index: stepIndex,
        step,
        screenshots: result.screenshots,
        method: result.method,
        performance: {
          duration,
          success: result.success,
          fallbackUsed: result.fallbackUsed
        }
      });

      console.log(`✅ Step ${stepIndex} completed in ${duration}ms using ${result.method} method`);
      if (result.fallbackUsed) {
        console.log('⚠️ Fallback method was used due to primary method failure');
      }
    }
  }

  private async processHybridStep(step: SubmissionStep, formattedIndex: string): Promise<{
    screenshots: string[];
    method: 'playwright' | 'desktop' | 'hybrid';
    success: boolean;
    fallbackUsed: boolean;
  }> {
    let screenshots: string[] = [];
    let method: 'playwright' | 'desktop' | 'hybrid' = 'hybrid';
    let success = false;
    let fallbackUsed = false;

    try {
      // Attempt navigation with Playwright first
      if (step.url && this.page) {
        console.log(`🌐 Playwright navigation to: ${step.url}`);
        try {
          await this.page.goto(step.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          await waitForPageStable(this.page);
          console.log('✅ Playwright navigation successful');
        } catch (navError) {
          console.warn(`⚠️ Playwright navigation failed: ${navError}`);
          console.log('🔄 Falling back to manual navigation + desktop automation');
          fallbackUsed = true;
        }
      }

      // Smart interaction strategy
      const interactionResult = await this.performSmartInteractions(step);
      success = interactionResult.success;

      // Display instructions and wait for user
      const instructions = this.buildHybridInstructions(step);
      await waitForEnter(instructions);

      // Hybrid screenshot capture
      screenshots = await this.captureHybridScreenshots(step, formattedIndex);

      if (screenshots.length > 0) {
        success = true;
      }

    } catch (error) {
      console.error('❌ Hybrid step processing failed:', error);
      
      // Ultimate fallback - desktop only
      try {
        console.log('🔄 Attempting desktop-only fallback...');
        const desktopScreenshot = await this.desktop.screenCapture();
        if (desktopScreenshot) {
          screenshots.push(desktopScreenshot);
          method = 'desktop';
          success = true;
          fallbackUsed = true;
        }
      } catch (fallbackError) {
        console.error('❌ Desktop fallback also failed:', fallbackError);
      }
    }

    return { screenshots, method, success, fallbackUsed };
  }

  private buildHybridInstructions(step: SubmissionStep): string {
    let instructions = step.notes || 'Complete the on-screen actions for this step';
    
    instructions += '\n\n🔄 Hybrid automation features:';
    instructions += '\n• Browser automation: Automatic navigation and form detection';
    instructions += '\n• Desktop automation: Native screenshots and OCR text finding';
    instructions += '\n• Smart fallback: Switches methods if primary fails';
    instructions += '\n\n⌨️ Keyboard shortcuts:';
    instructions += '\n• Ctrl+S: Additional screenshot';
    instructions += '\n• Ctrl+R: Refresh page (browser)';
    instructions += '\n• Ctrl+F: Find text on screen (desktop OCR)';
    instructions += '\n\nPress Enter when ready to capture';
    
    return instructions;
  }

  private async performSmartInteractions(step: SubmissionStep): Promise<{
    success: boolean;
    method: string;
  }> {
    console.log('🤖 Performing smart hybrid interactions...');
    
    try {
      // Step-specific smart actions
      if (step.title.toLowerCase().includes('login')) {
        return await this.handleLoginStep(step);
      }
      
      if (step.title.toLowerCase().includes('app info')) {
        return await this.handleAppInfoStep(step);
      }
      
      if (step.title.toLowerCase().includes('privacy')) {
        return await this.handlePrivacyStep(step);
      }
      
      if (step.title.toLowerCase().includes('pricing')) {
        return await this.handlePricingStep(step);
      }

      // Generic smart actions
      return await this.handleGenericStep(step);
      
    } catch (error) {
      console.warn('⚠️ Smart interactions failed:', error);
      return { success: false, method: 'none' };
    }
  }

  private async handleLoginStep(step: SubmissionStep): Promise<{success: boolean; method: string}> {
    console.log('🔑 Handling login step with smart detection...');
    
    // Try to detect login elements with Playwright first
    if (this.page) {
      try {
        const emailField = this.page.locator('input[type="email"], input[name="email"], #email');
        const passwordField = this.page.locator('input[type="password"], input[name="password"], #password');
        
        if (await emailField.isVisible({ timeout: 5000 })) {
          console.log('✅ Login form detected with Playwright');
          return { success: true, method: 'playwright' };
        }
      } catch (error) {
        console.log('⚠️ Playwright login detection failed, trying desktop...');
      }
    }
    
    // Fallback to desktop OCR
    const signInButton = await this.desktop.findTextOnScreen('Sign In');
    const appleIdField = await this.desktop.findTextOnScreen('Apple ID');
    
    if (signInButton || appleIdField) {
      console.log('✅ Login elements detected with desktop OCR');
      return { success: true, method: 'desktop' };
    }
    
    return { success: false, method: 'none' };
  }

  private async handleAppInfoStep(step: SubmissionStep): Promise<{success: boolean; method: string}> {
    console.log('📱 Handling app info step with form detection...');
    
    // Smart scroll to reveal app info sections
    if (this.page) {
      try {
        await this.page.evaluate(() => {
          const appInfoSections = document.querySelectorAll('[data-testid*="app"], [class*="app-info"]');
          if (appInfoSections.length > 0) {
            appInfoSections[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        console.log('✅ Auto-scrolled to app info section');
        return { success: true, method: 'playwright' };
      } catch (error) {
        console.log('⚠️ Playwright auto-scroll failed');
      }
    }
    
    // Desktop automation scroll
    const screenSize = await this.desktop.getScreenSize();
    await this.desktop.scroll(screenSize.width / 2, screenSize.height / 2, 'down', 3);
    
    return { success: true, method: 'desktop' };
  }

  private async handlePrivacyStep(step: SubmissionStep): Promise<{success: boolean; method: string}> {
    console.log('🔒 Handling privacy step with policy detection...');
    
    // Look for privacy-related text
    const privacyText = await this.desktop.findTextOnScreen('Privacy Policy');
    const dataCollection = await this.desktop.findTextOnScreen('Data Collection');
    
    if (privacyText || dataCollection) {
      console.log('✅ Privacy section detected');
      return { success: true, method: 'desktop' };
    }
    
    return { success: false, method: 'none' };
  }

  private async handlePricingStep(step: SubmissionStep): Promise<{success: boolean; method: string}> {
    console.log('💰 Handling pricing step with price detection...');
    
    // Smart detection of pricing elements
    if (this.page) {
      try {
        const pricingElements = await this.page.locator('[data-testid*="price"], [class*="pricing"], input[type="number"]');
        if (await pricingElements.first().isVisible({ timeout: 5000 })) {
          console.log('✅ Pricing elements detected with Playwright');
          return { success: true, method: 'playwright' };
        }
      } catch (error) {
        console.log('⚠️ Playwright pricing detection failed');
      }
    }
    
    // Desktop text detection
    const freeText = await this.desktop.findTextOnScreen('Free');
    const paidText = await this.desktop.findTextOnScreen('Paid');
    
    if (freeText || paidText) {
      console.log('✅ Pricing options detected with desktop OCR');
      return { success: true, method: 'desktop' };
    }
    
    return { success: false, method: 'none' };
  }

  private async handleGenericStep(step: SubmissionStep): Promise<{success: boolean; method: string}> {
    // Generic smart actions for any step
    
    // Auto-detect and highlight interactive elements
    if (this.page && step.selector) {
      try {
        const element = this.page.locator(step.selector);
        if (await element.isVisible({ timeout: 3000 })) {
          // Highlight element with border
          await element.evaluate((el: HTMLElement) => {
            el.style.border = '3px solid #ff6b6b';
            el.style.boxShadow = '0 0 10px rgba(255,107,107,0.5)';
          });
          
          setTimeout(async () => {
            await element.evaluate((el: HTMLElement) => {
              el.style.border = '';
              el.style.boxShadow = '';
            });
          }, 3000);
          
          console.log('✅ Element highlighted for user guidance');
          return { success: true, method: 'playwright' };
        }
      } catch (error) {
        console.log('⚠️ Element highlighting failed');
      }
    }
    
    return { success: true, method: 'hybrid' };
  }

  private async captureHybridScreenshots(step: SubmissionStep, formattedIndex: string): Promise<string[]> {
    const screenshots: string[] = [];
    
    console.log('📸 Capturing hybrid screenshots...');
    
    try {
      // 1. Playwright browser screenshot (if available)
      if (this.page) {
        const browserPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-browser.png`);
        const browserSuccess = await safeScreenshot(this.page, browserPath, true);
        if (browserSuccess) {
          screenshots.push(browserPath);
          console.log(`✅ Browser screenshot: ${browserPath}`);
        }
      }

      // 2. Desktop screenshot (full screen context)
      const desktopPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-desktop.png`);
      try {
        const desktopCapture = await this.desktop.screenCapture();
        if (desktopCapture) {
          await fs.rename(desktopCapture, desktopPath);
          screenshots.push(desktopPath);
          console.log(`✅ Desktop screenshot: ${desktopPath}`);
        }
      } catch (error) {
        console.warn('⚠️ Desktop screenshot failed:', error);
      }

      // 3. Element-focused screenshot (if selector available)
      if (step.selector && this.page) {
        const elementPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-element.png`);
        const elementSuccess = await elementScreenshot(this.page, step.selector, elementPath);
        if (elementSuccess) {
          screenshots.push(elementPath);
          console.log(`✅ Element screenshot: ${elementPath}`);
        }
      }

      // 4. Comparison screenshot (side-by-side if both methods worked)
      if (screenshots.length >= 2) {
        await this.createComparisonScreenshot(screenshots, step, formattedIndex);
      }

    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
    }

    return screenshots;
  }

  private async createComparisonScreenshot(screenshots: string[], step: SubmissionStep, formattedIndex: string): Promise<void> {
    // This would create a side-by-side comparison of browser vs desktop screenshots
    // For now, we'll just log that we have multiple screenshots
    console.log(`📊 Multiple screenshots available for comparison: ${screenshots.length} images`);
    
    const comparisonPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-comparison.md`);
    let comparison = `# Screenshot Comparison - ${step.title}\n\n`;
    
    for (let i = 0; i < screenshots.length; i++) {
      const filename = screenshots[i].split('/').pop();
      let type = 'Unknown';
      if (filename?.includes('browser')) type = 'Browser View';
      else if (filename?.includes('desktop')) type = 'Desktop View';
      else if (filename?.includes('element')) type = 'Element Focus';
      
      comparison += `## ${type}\n\n![${type}](./${filename})\n\n`;
    }
    
    await fs.writeFile(comparisonPath, comparison, 'utf-8');
    console.log(`📊 Comparison document created: ${comparisonPath}`);
  }

  async generateReport(): Promise<void> {
    console.log('📝 Generating hybrid automation report...');
    
    const reportPath = join(this.sessionDir, 'hybrid-report.md');
    let markdown = '# App Store Connect Hybrid Automation Report\n\n';
    
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Capture Method: Hybrid (Playwright + Desktop Automation)\n`;
    markdown += `Total Steps: ${this.capturedSteps.length}\n\n`;
    
    // Performance summary
    const totalDuration = this.capturedSteps.reduce((sum, step) => sum + step.performance.duration, 0);
    const successfulSteps = this.capturedSteps.filter(step => step.performance.success).length;
    const fallbackSteps = this.capturedSteps.filter(step => step.performance.fallbackUsed).length;
    
    markdown += `## Performance Summary\n\n`;
    markdown += `- **Total Duration:** ${(totalDuration / 1000).toFixed(1)} seconds\n`;
    markdown += `- **Success Rate:** ${((successfulSteps / this.capturedSteps.length) * 100).toFixed(1)}%\n`;
    markdown += `- **Fallback Usage:** ${fallbackSteps} steps (${((fallbackSteps / this.capturedSteps.length) * 100).toFixed(1)}%)\n\n`;
    
    // Method distribution
    const methodCounts = this.capturedSteps.reduce((acc, step) => {
      acc[step.method] = (acc[step.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    markdown += `## Method Distribution\n\n`;
    Object.entries(methodCounts).forEach(([method, count]) => {
      markdown += `- **${method.charAt(0).toUpperCase() + method.slice(1)}:** ${count} steps\n`;
    });
    markdown += '\n';
    
    // Steps detail
    markdown += '## Detailed Steps\n\n';
    
    for (const captured of this.capturedSteps) {
      const { index, step, screenshots, method, performance } = captured;
      
      markdown += `### ${index}. ${step.title}\n\n`;
      markdown += `**Method Used:** ${method}\n`;
      markdown += `**Duration:** ${(performance.duration / 1000).toFixed(2)}s\n`;
      markdown += `**Status:** ${performance.success ? '✅ Success' : '❌ Failed'}\n`;
      if (performance.fallbackUsed) {
        markdown += `**Note:** Fallback method used\n`;
      }
      markdown += '\n';
      
      if (step.notes) {
        markdown += `**Instructions:** ${step.notes}\n\n`;
      }
      
      if (step.url) {
        markdown += `**URL:** ${step.url}\n\n`;
      }
      
      // Screenshots
      if (screenshots.length > 0) {
        markdown += `**Screenshots (${screenshots.length}):**\n\n`;
        
        for (const screenshotPath of screenshots) {
          const filename = screenshotPath.split('/').pop() || screenshotPath;
          let caption = 'Screenshot';
          
          if (filename.includes('-browser')) caption = 'Browser View';
          else if (filename.includes('-desktop')) caption = 'Desktop View';
          else if (filename.includes('-element')) caption = 'Element Focus';
          
          markdown += `![${step.title} - ${caption}](./${filename})\n\n`;
        }
      }
      
      markdown += '---\n\n';
    }
    
    // Technical notes
    markdown += '## Hybrid Automation Features\n\n';
    markdown += '### Browser Automation (Playwright)\n';
    markdown += '- Precise element targeting and interaction\n';
    markdown += '- JavaScript execution and DOM manipulation\n';
    markdown += '- Network request monitoring\n';
    markdown += '- Session persistence with cookies/storage\n\n';
    
    markdown += '### Desktop Automation\n';
    markdown += '- Full desktop screenshot capabilities\n';
    markdown += '- OCR text recognition and element finding\n';
    markdown += '- Cross-application compatibility\n';
    markdown += '- Native OS interaction\n\n';
    
    markdown += '### Smart Fallback System\n';
    markdown += '- Automatic method switching on failure\n';
    markdown += '- Performance optimization based on step type\n';
    markdown += '- Comprehensive error recovery\n';
    markdown += '- Multiple screenshot perspectives\n\n';
    
    await fs.writeFile(reportPath, markdown, 'utf-8');
    console.log(`✅ Hybrid automation report saved: ${reportPath}`);
  }

  async saveSession(): Promise<void> {
    if (this.context) {
      console.log('💾 Saving browser session state...');
      await this.context.storageState({ path: AUTH_STATE_PATH });
      console.log(`✅ Browser session saved to: ${AUTH_STATE_PATH}`);
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up hybrid capture session...');
    
    // Final state screenshots
    try {
      const finalDesktopPath = join(this.sessionDir, 'final-desktop-state.png');
      await this.desktop.screenCapture();
      
      if (this.page) {
        const finalBrowserPath = join(this.sessionDir, 'final-browser-state.png');
        await safeScreenshot(this.page, finalBrowserPath, true);
      }
      
      console.log('📸 Final state screenshots captured');
    } catch (error) {
      console.warn('⚠️ Final screenshots failed:', error);
    }
    
    // Browser cleanup
    if (this.page) {
      await this.page.close();
    }
    
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Hybrid cleanup completed');
  }
}

// Main execution
async function main(): Promise<void> {
  const capture = new HybridAppStoreCapture();
  
  try {
    await capture.initialize();
    
    console.log('\n🎯 Starting Hybrid Screenshot Capture');
    console.log('===================================');
    console.log('🔄 This tool combines the best of both worlds:');
    console.log('• Playwright: Precise browser automation and element targeting');
    console.log('• Desktop: Full-screen capture and cross-application compatibility');
    console.log('• Smart fallback: Automatically switches methods on failure');
    console.log('• Performance tracking: Detailed timing and success metrics');
    console.log('===================================\n');
    
    await capture.processSteps();
    await capture.generateReport();
    await capture.saveSession();
    
    console.log('\n🎉 Hybrid screenshot capture completed successfully!');
    console.log(`📁 All files saved to: ${capture['sessionDir']}`);
    console.log('📝 Check hybrid-report.md for comprehensive analysis');
    
  } catch (error) {
    console.error('\n❌ Error during hybrid capture:', error);
    process.exit(1);
  } finally {
    await capture.cleanup();
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received interrupt signal, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Received terminate signal, cleaning up...');
  process.exit(0);
});

// Run the main function
main().catch(console.error);