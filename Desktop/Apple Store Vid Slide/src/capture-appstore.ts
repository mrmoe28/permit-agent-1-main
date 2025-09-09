#!/usr/bin/env tsx
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
import DesktopCommanderIntegration from './desktop-commander.js';

// Configuration
const BASE_URL = process.env.ASC_BASE || 'https://appstoreconnect.apple.com';
const AUTH_STATE_PATH = '.auth/state.json';
const CAPTURES_BASE = 'captures';

class AppStoreScreenshotCapture {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private desktop: DesktopCommanderIntegration | null = null;
  private sessionDir: string;
  private capturedSteps: Array<{
    index: number;
    step: SubmissionStep;
    screenshots: string[];
  }> = [];
  private useDesktopEnhancements: boolean;

  constructor(enableDesktop: boolean = false) {
    this.sessionDir = join(CAPTURES_BASE, getTimestamp());
    this.useDesktopEnhancements = enableDesktop;
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing App Store Connect Screenshot Tool');
    console.log('====================================================');
    
    // Ensure directories exist
    await ensureDir(dirname(AUTH_STATE_PATH));
    await ensureDir(this.sessionDir);
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
      args: ['--start-maximized'],
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
    
    // Initialize desktop commander if enabled
    if (this.useDesktopEnhancements && this.page) {
      this.desktop = new DesktopCommanderIntegration(this.sessionDir, this.page);
      console.log('🖥️ Desktop enhancements: Enabled');
    }
    
    console.log(`📁 Screenshots will be saved to: ${this.sessionDir}`);
    console.log(`🔐 Session state: ${storageStateExists ? 'Existing session found' : 'New session'}`);
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
    console.log(`\n📋 Processing ${SubmissionSteps.length} steps:`);
    
    for (let i = 0; i < SubmissionSteps.length; i++) {
      const step = SubmissionSteps[i];
      const stepIndex = i + 1;
      const formattedIndex = formatStepIndex(stepIndex);
      
      console.log(`\n[${ stepIndex }/${ SubmissionSteps.length }] ${ step.title }`);
      console.log('-'.repeat(50));
      
      // Navigate if URL is provided
      if (step.url) {
        console.log(`🌐 Navigating to: ${step.url}`);
        try {
          if (this.page) {
            await this.page.goto(step.url, { 
              waitUntil: 'domcontentloaded',
              timeout: 30000 
            });
            await waitForPageStable(this.page);
          }
        } catch (error) {
          console.warn(`⚠️  Navigation failed, proceeding with manual navigation: ${error}`);
        }
      } else {
        console.log('📍 Manual navigation required for this step');
      }

      // Enhanced desktop interactions if enabled
      if (this.useDesktopEnhancements && this.desktop) {
        await this.performDesktopEnhancements(step);
      }

      // Display instructions and wait for user
      const instructions = this.buildInstructions(step);
      await waitForEnter(instructions);

      // Capture screenshots
      const screenshots = await this.captureStepScreenshots(step, formattedIndex);
      
      this.capturedSteps.push({
        index: stepIndex,
        step,
        screenshots
      });

      console.log(`✅ Step ${stepIndex} completed\n`);
    }
  }

  private buildInstructions(step: SubmissionStep): string {
    let instructions = step.notes || 'Complete the on-screen actions for this step';
    
    if (this.useDesktopEnhancements) {
      instructions += '\n\n🖥️ Desktop enhancements active:';
      instructions += '\n• OCR text detection available';
      instructions += '\n• Desktop screenshot backup enabled';
      instructions += '\n• Smart element highlighting';
    }
    
    return instructions;
  }

  private async performDesktopEnhancements(step: SubmissionStep): Promise<void> {
    if (!this.desktop) return;
    
    try {
      console.log('🤖 Performing desktop enhancements...');
      
      // Smart text detection for key elements
      if (step.title.toLowerCase().includes('login')) {
        const signInElement = await this.desktop.findTextOnScreen('Sign In');
        if (signInElement) {
          console.log(`🎯 Located Sign In button at (${signInElement.x}, ${signInElement.y})`);
        }
      }
      
      if (step.title.toLowerCase().includes('app') || step.title.toLowerCase().includes('info')) {
        const appElements = await this.desktop.findTextOnScreen('App Information');
        if (appElements) {
          console.log('🎯 Located App Information section');
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Desktop enhancements failed:', error);
    }
  }

  private async captureStepScreenshots(step: SubmissionStep, formattedIndex: string): Promise<string[]> {
    const screenshots: string[] = [];
    
    if (!this.page) {
      console.error('❌ No page available for screenshots');
      return screenshots;
    }

    // Full page screenshot
    const fullPagePath = join(this.sessionDir, `${formattedIndex}-${step.slug}.png`);
    const fullPageSuccess = await safeScreenshot(this.page, fullPagePath, true);
    if (fullPageSuccess) {
      screenshots.push(fullPagePath);
    }

    // Element screenshot if selector provided
    if (step.selector) {
      const elementPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-focus.png`);
      const elementSuccess = await elementScreenshot(this.page, step.selector, elementPath);
      if (elementSuccess) {
        screenshots.push(elementPath);
      }
    }

    // Desktop screenshot backup if enhancements enabled
    if (this.useDesktopEnhancements && this.desktop) {
      try {
        const desktopPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-desktop.png`);
        const desktopCapture = await this.desktop.screenCapture();
        if (desktopCapture) {
          await fs.rename(desktopCapture, desktopPath);
          screenshots.push(desktopPath);
          console.log('📸 Desktop backup screenshot captured');
        }
      } catch (error) {
        console.warn('⚠️ Desktop backup screenshot failed:', error);
      }
    }

    return screenshots;
  }

  async generateReport(): Promise<void> {
    console.log('📝 Generating markdown report...');
    
    const reportPath = join(this.sessionDir, 'report.md');
    let markdown = '# App Store Connect Submission Screenshots\n\n';
    
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Total Steps: ${this.capturedSteps.length}\n\n`;
    
    markdown += '## Steps Overview\n\n';
    
    for (const captured of this.capturedSteps) {
      const { index, step, screenshots } = captured;
      
      markdown += `### ${index}. ${step.title}\n\n`;
      
      if (step.notes) {
        markdown += `**Instructions:** ${step.notes}\n\n`;
      }
      
      if (step.url) {
        markdown += `**URL:** ${step.url}\n\n`;
      }
      
      // Add screenshot references
      for (const screenshotPath of screenshots) {
        const filename = screenshotPath.split('/').pop() || screenshotPath;
        const isElementShot = filename.includes('-focus');
        const caption = isElementShot ? 'Element Focus' : 'Full Page';
        
        markdown += `**${caption}:**\n\n`;
        markdown += `![${step.title} - ${caption}](./${filename})\n\n`;
      }
      
      markdown += '---\n\n';
    }
    
    await fs.writeFile(reportPath, markdown, 'utf-8');
    console.log(`✅ Report saved: ${reportPath}`);
  }

  async saveSession(): Promise<void> {
    if (this.context) {
      console.log('💾 Saving session state...');
      await this.context.storageState({ path: AUTH_STATE_PATH });
      console.log(`✅ Session saved to: ${AUTH_STATE_PATH}`);
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Main execution
async function main(): Promise<void> {
  // Check for desktop enhancement flag
  const enableDesktop = process.argv.includes('--desktop') || process.env.ENABLE_DESKTOP === 'true';
  const capture = new AppStoreScreenshotCapture(enableDesktop);
  
  try {
    await capture.initialize();
    
    console.log('\n🎯 Starting guided screenshot capture');
    console.log('====================================');
    console.log('You will be prompted at each step to:');
    console.log('1. Navigate to the required page (if not automatic)');
    console.log('2. Perform the described actions');
    console.log('3. Press Enter to capture screenshots');
    console.log('====================================\n');
    
    await capture.processSteps();
    await capture.generateReport();
    await capture.saveSession();
    
    console.log('\n🎉 Screenshot capture completed successfully!');
    console.log(`📁 All files saved to: ${capture['sessionDir']}`);
    console.log('📝 Check report.md for a complete summary with image links');
    
  } catch (error) {
    console.error('\n❌ Error during capture:', error);
    process.exit(1);
  } finally {
    await capture.cleanup();
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received interrupt signal, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received terminate signal, cleaning up...');
  process.exit(0);
});

// Run the main function
main().catch(console.error);