import { test, expect, Page } from '@playwright/test';

test.describe('Download Button Debug', () => {
  let page: Page;
  const baseURL = 'https://permit-agent-1-main.vercel.app';

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Monitor downloads
    page.on('download', download => {
      console.log(`📥 Download started: ${download.suggestedFilename()}`);
      console.log(`📁 Download URL: ${download.url()}`);
    });

    // Monitor network
    page.on('request', request => {
      if (request.url().includes('download') || request.url().includes('forms')) {
        console.log(`➡️ ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('download') || response.url().includes('forms')) {
        console.log(`⬅️ ${response.status()} ${response.url()}`);
      }
    });
  });

  test('debug download buttons after search', async () => {
    console.log('🚀 Starting download debug test...');
    
    // Navigate and fill form
    await page.goto(baseURL);
    await page.fill('#street', '123 Main Street');
    await page.fill('#city', 'Austin');
    await page.fill('#state', 'TX');
    await page.fill('#zipCode', '78701');
    
    // Submit and wait longer for results
    await page.click('button[type="submit"]');
    console.log('⏳ Waiting for search to complete...');
    
    // Wait for the network request to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/search') && response.status() === 200
    );
    
    console.log('✅ Search API completed');
    
    // Take a screenshot to see what we have
    await page.screenshot({ path: 'debug-after-search.png' });
    
    // Wait a bit more for React to render everything
    await page.waitForTimeout(3000);
    
    // Look for ANY buttons with "Download" text
    const downloadButtons = await page.locator('button:has-text("Download"), a:has-text("Download")').all();
    console.log(`🔍 Found ${downloadButtons.length} download buttons`);
    
    // Look for specific elements in the forms section
    const formsSection = await page.locator('h2:has-text("Application Forms")').first();
    if (await formsSection.isVisible()) {
      console.log('📋 Forms section is visible');
      
      // Look within the forms section
      const formsContainer = page.locator('h2:has-text("Application Forms")').locator('..').locator('..');
      const formButtons = await formsContainer.locator('button:has-text("Download"), a:has-text("Download")').all();
      console.log(`📄 Found ${formButtons.length} form download buttons`);
      
      // Try to click the first one if available
      if (formButtons.length > 0) {
        console.log('🎯 Clicking first form download button...');
        await formButtons[0].click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('❌ Forms section not found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'debug-final.png' });
  });

  test.afterEach(async () => {
    await page.close();
  });
});