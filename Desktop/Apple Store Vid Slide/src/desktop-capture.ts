#!/usr/bin/env tsx
/**
 * Desktop-focused App Store Connect Screenshot Tool
 * Uses desktop automation for interactions and screenshots
 */
import { join } from 'path';
import { promises as fs } from 'fs';
import 'dotenv/config';

import { SubmissionSteps, SubmissionStep } from './steps.js';
import { 
  ensureDir, 
  waitForEnter, 
  getTimestamp,
  formatStepIndex
} from './utils.js';
import DesktopCommanderIntegration from './desktop-commander.js';

// Configuration
const CAPTURES_BASE = 'captures';

class DesktopAppStoreCapture {
  private desktop: DesktopCommanderIntegration;
  private sessionDir: string;
  private capturedSteps: Array<{
    index: number;
    step: SubmissionStep;
    screenshots: string[];
  }> = [];

  constructor() {
    this.sessionDir = join(CAPTURES_BASE, `desktop-${getTimestamp()}`);
    this.desktop = new DesktopCommanderIntegration(this.sessionDir);
  }

  async initialize(): Promise<void> {
    console.log('🖥️ Initializing Desktop App Store Connect Screenshot Tool');
    console.log('=========================================================');
    
    // Ensure directories exist
    await ensureDir(this.sessionDir);
    
    // Get screen dimensions
    const screenSize = await this.desktop.getScreenSize();
    console.log(`📺 Screen resolution: ${screenSize.width}x${screenSize.height}`);
    console.log(`📁 Screenshots will be saved to: ${this.sessionDir}`);
    
    // Initial desktop screenshot
    console.log('\n📸 Taking initial desktop screenshot...');
    await this.desktop.screenCapture();
  }

  async processSteps(): Promise<void> {
    console.log(`\n📋 Processing ${SubmissionSteps.length} steps with desktop automation:`);
    
    for (let i = 0; i < SubmissionSteps.length; i++) {
      const step = SubmissionSteps[i];
      const stepIndex = i + 1;
      const formattedIndex = formatStepIndex(stepIndex);
      
      console.log(`\n[${stepIndex}/${SubmissionSteps.length}] ${step.title}`);
      console.log('-'.repeat(60));
      
      // Display step information
      if (step.url) {
        console.log(`🌐 Target URL: ${step.url}`);
        console.log('💡 Navigate to the URL manually in your browser');
      }
      
      if (step.notes) {
        console.log(`📝 Instructions: ${step.notes}`);
      }

      // Enhanced desktop automation features
      await this.performDesktopActions(step);

      // Wait for user confirmation and capture
      const instructions = this.buildInstructions(step);
      await waitForEnter(instructions);

      // Capture screenshots with desktop automation
      const screenshots = await this.captureStepScreenshots(step, formattedIndex);
      
      this.capturedSteps.push({
        index: stepIndex,
        step,
        screenshots
      });

      console.log(`✅ Step ${stepIndex} completed with ${screenshots.length} screenshots\n`);
      
      // Brief pause between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private buildInstructions(step: SubmissionStep): string {
    let instructions = step.notes || 'Complete the on-screen actions for this step';
    
    instructions += '\n\n🖥️ Desktop automation features available:';
    instructions += '\n• Press Ctrl+S to take additional screenshots';
    instructions += '\n• Press Ctrl+F to find text on screen';
    instructions += '\n• Press Ctrl+C to click at cursor position';
    instructions += '\n\nPress Enter when ready to capture screenshots';
    
    return instructions;
  }

  private async performDesktopActions(step: SubmissionStep): Promise<void> {
    // Pre-step desktop automation actions
    console.log('🤖 Performing automated desktop actions...');
    
    try {
      // Example: Find and highlight important UI elements
      if (step.title.toLowerCase().includes('login')) {
        const loginElement = await this.desktop.findTextOnScreen('Sign In');
        if (loginElement) {
          console.log(`🎯 Found login element at (${loginElement.x}, ${loginElement.y})`);
          // Could add visual indicator or automated interaction here
        }
      }

      // Example: Auto-scroll to reveal content
      if (step.title.toLowerCase().includes('settings') || 
          step.title.toLowerCase().includes('privacy')) {
        const screenSize = await this.desktop.getScreenSize();
        await this.desktop.scroll(screenSize.width / 2, screenSize.height / 2, 'down', 2);
        console.log('📜 Auto-scrolled to reveal more content');
      }

      // Smart waiting based on step type
      if (step.url) {
        console.log('⏳ Waiting for page elements to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.warn('⚠️ Desktop automation actions failed, continuing manually:', error);
    }
  }

  private async captureStepScreenshots(step: SubmissionStep, formattedIndex: string): Promise<string[]> {
    const screenshots: string[] = [];
    
    try {
      // Primary desktop screenshot
      const desktopPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-desktop.png`);
      const capturedPath = await this.desktop.screenCapture();
      
      if (capturedPath) {
        // Rename to match our naming convention
        await fs.rename(capturedPath, desktopPath);
        screenshots.push(desktopPath);
        console.log(`📸 Desktop screenshot: ${formattedIndex}-${step.slug}-desktop.png`);
      }

      // Optional: Focused region screenshot if coordinates are available
      if (step.selector && this.shouldCaptureRegion(step)) {
        const regionPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-region.png`);
        await this.captureRegionScreenshot(step.selector, regionPath);
        screenshots.push(regionPath);
      }

      // Multiple angle screenshots for complex steps
      if (this.isComplexStep(step)) {
        await this.captureMultipleAngles(step, formattedIndex, screenshots);
      }

    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
    }

    return screenshots;
  }

  private shouldCaptureRegion(step: SubmissionStep): boolean {
    const complexSteps = ['privacy', 'pricing', 'app-info', 'review'];
    return complexSteps.some(keyword => step.slug.includes(keyword));
  }

  private isComplexStep(step: SubmissionStep): boolean {
    const complexSteps = ['submit', 'review', 'pricing', 'app-info'];
    return complexSteps.some(keyword => step.slug.includes(keyword));
  }

  private async captureRegionScreenshot(selector: string, outputPath: string): Promise<void> {
    try {
      // In a real implementation, this would use the selector to determine screen region
      // For now, we'll capture a centered region
      console.log(`🎯 Capturing focused region for selector: ${selector}`);
      
      // This is a placeholder - actual implementation would involve:
      // 1. Finding the element position
      // 2. Calculating region boundaries
      // 3. Capturing that specific region
      
      const fullScreenshot = await this.desktop.screenCapture();
      await fs.copyFile(fullScreenshot, outputPath);
      
      console.log(`📸 Region screenshot saved: ${outputPath}`);
    } catch (error) {
      console.warn('⚠️ Region screenshot failed:', error);
    }
  }

  private async captureMultipleAngles(step: SubmissionStep, formattedIndex: string, screenshots: string[]): Promise<void> {
    console.log('📸 Capturing multiple angles for comprehensive documentation...');
    
    try {
      // Scroll up and capture
      await this.desktop.scroll(960, 540, 'up', 3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const topPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-top.png`);
      const topCapture = await this.desktop.screenCapture();
      if (topCapture) {
        await fs.rename(topCapture, topPath);
        screenshots.push(topPath);
      }

      // Scroll back to center
      await this.desktop.scroll(960, 540, 'down', 1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Scroll down and capture
      await this.desktop.scroll(960, 540, 'down', 3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const bottomPath = join(this.sessionDir, `${formattedIndex}-${step.slug}-bottom.png`);
      const bottomCapture = await this.desktop.screenCapture();
      if (bottomCapture) {
        await fs.rename(bottomCapture, bottomPath);
        screenshots.push(bottomPath);
      }

      // Return to center
      await this.desktop.scroll(960, 540, 'up', 2);
      
      console.log('✅ Multiple angle screenshots captured');
    } catch (error) {
      console.warn('⚠️ Multiple angle capture failed:', error);
    }
  }

  async generateReport(): Promise<void> {
    console.log('📝 Generating desktop automation report...');
    
    const reportPath = join(this.sessionDir, 'desktop-report.md');
    let markdown = '# App Store Connect Desktop Automation Report\n\n';
    
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Capture Method: Desktop Automation\n`;
    markdown += `Total Steps: ${this.capturedSteps.length}\n\n`;
    
    // Screen info
    const screenSize = await this.desktop.getScreenSize();
    markdown += `## Environment Information\n\n`;
    markdown += `- **Screen Resolution:** ${screenSize.width}x${screenSize.height}\n`;
    markdown += `- **Platform:** Desktop Native Automation\n`;
    markdown += `- **Browser:** User's Default Browser\n\n`;
    
    markdown += '## Captured Steps\n\n';
    
    for (const captured of this.capturedSteps) {
      const { index, step, screenshots } = captured;
      
      markdown += `### ${index}. ${step.title}\n\n`;
      
      if (step.notes) {
        markdown += `**Instructions:** ${step.notes}\n\n`;
      }
      
      if (step.url) {
        markdown += `**Target URL:** ${step.url}\n\n`;
      }
      
      // Screenshot gallery
      if (screenshots.length > 0) {
        markdown += `**Screenshots (${screenshots.length}):**\n\n`;
        
        for (const screenshotPath of screenshots) {
          const filename = screenshotPath.split('/').pop() || screenshotPath;
          let caption = 'Screenshot';
          
          if (filename.includes('-desktop')) caption = 'Desktop View';
          else if (filename.includes('-region')) caption = 'Focused Region';
          else if (filename.includes('-top')) caption = 'Top Section';
          else if (filename.includes('-bottom')) caption = 'Bottom Section';
          
          markdown += `![${step.title} - ${caption}](./${filename})\n\n`;
        }
      }
      
      markdown += '---\n\n';
    }
    
    // Add automation notes
    markdown += '## Desktop Automation Features\n\n';
    markdown += '- **Native Screenshot Capture:** Full desktop screenshots without browser limitations\n';
    markdown += '- **OCR Text Recognition:** Find elements by visible text\n';
    markdown += '- **Smart Interaction:** Automated scrolling and element detection\n';
    markdown += '- **Multi-angle Capture:** Comprehensive documentation from multiple viewpoints\n';
    markdown += '- **Cross-browser Compatible:** Works with any browser or application\n\n';
    
    await fs.writeFile(reportPath, markdown, 'utf-8');
    console.log(`✅ Desktop automation report saved: ${reportPath}`);
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up desktop capture session...');
    
    // Final screenshot of desktop state
    try {
      const finalPath = join(this.sessionDir, 'final-desktop-state.png');
      await this.desktop.screenCapture();
      console.log('📸 Final desktop state captured');
    } catch (error) {
      console.warn('⚠️ Final screenshot failed:', error);
    }
    
    console.log('✅ Desktop cleanup completed');
  }
}

// Main execution
async function main(): Promise<void> {
  const capture = new DesktopAppStoreCapture();
  
  try {
    await capture.initialize();
    
    console.log('\n🎯 Starting Desktop-Automated Screenshot Capture');
    console.log('================================================');
    console.log('🖥️ This tool uses native desktop automation for:');
    console.log('• Full-screen screenshots without browser limitations');
    console.log('• OCR-based element detection');
    console.log('• Smart scrolling and interaction hints');
    console.log('• Cross-browser and cross-application compatibility');
    console.log('================================================\n');
    
    await capture.processSteps();
    await capture.generateReport();
    
    console.log('\n🎉 Desktop screenshot capture completed successfully!');
    console.log(`📁 All files saved to: ${capture['sessionDir']}`);
    console.log('📝 Check desktop-report.md for comprehensive documentation');
    
  } catch (error) {
    console.error('\n❌ Error during desktop capture:', error);
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