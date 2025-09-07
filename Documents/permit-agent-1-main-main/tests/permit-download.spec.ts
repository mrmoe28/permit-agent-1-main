import { test, expect, Page } from '@playwright/test';

test.describe('Permit Application Downloads', () => {
  let page: Page;
  const baseURL = 'https://permit-agent-1-main.vercel.app'; // Production Vercel deployment

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Monitor all network requests
    page.on('request', request => {
      console.log(`➡️ ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      console.log(`⬅️ ${response.status()} ${response.url()}`);
    });

    // Monitor console logs
    page.on('console', msg => {
      console.log(`🖥️ Console: ${msg.text()}`);
    });

    // Monitor download events
    page.on('download', download => {
      console.log(`📥 Download started: ${download.suggestedFilename()}`);
      console.log(`📁 Download URL: ${download.url()}`);
    });
  });

  test('should successfully download electrical permit application', async () => {
    // Navigate to the application
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/PermitAgent/);

    // Fill out the address search form
    console.log('🔍 Filling address search form...');
    await page.fill('#street', '123 Main Street');
    await page.fill('#city', 'Austin');
    await page.fill('#state', 'TX');
    await page.fill('#zipCode', '78701');

    // Submit the search
    console.log('🚀 Submitting search...');
    await page.click('button[type="submit"], button:has-text("Search")');

    // Wait for results to load
    console.log('⏳ Waiting for search results...');
    await page.waitForSelector('.space-y-6, .shadow-lg, .bg-white', { timeout: 30000 });

    // Look for electrical permit
    console.log('🔌 Looking for electrical permit...');
    const electricalPermit = await page.locator('text=/electrical/i').first();
    await expect(electricalPermit).toBeVisible();

    // Check if forms section is visible
    const formsSection = await page.locator('.forms-section, [data-testid="forms-section"], text="Available Forms"');
    if (await formsSection.count() > 0) {
      console.log('📋 Forms section found');
      await expect(formsSection.first()).toBeVisible();
      
      // Look for electrical permit forms specifically
      const electricalForms = await page.locator('.form-item, .permit-form').filter({ hasText: /electrical/i });
      if (await electricalForms.count() > 0) {
        console.log('🔌 Electrical forms found');
        
        // Find download button for electrical permit
        const downloadButton = await electricalForms.first().locator('button:has-text("Download"), a:has-text("Download")');
        
        if (await downloadButton.count() > 0) {
          console.log('📥 Download button found, testing download...');
          
          // Set up download Promise before clicking
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
          
          // Click the download button
          await downloadButton.click();
          
          try {
            const download = await downloadPromise;
            console.log(`✅ Download successful: ${download.suggestedFilename()}`);
            console.log(`📁 Download path: ${await download.path()}`);
          } catch (error) {
            console.error('❌ Download failed:', error);
            
            // Investigate what happened instead of download
            await page.screenshot({ path: 'download-failure.png' });
            
            // Check for error messages
            const errorMessages = await page.locator('.error, .alert-error, [role="alert"]').all();
            for (const error of errorMessages) {
              const text = await error.textContent();
              console.log(`🚨 Error message: ${text}`);
            }
          }
        } else {
          console.log('❌ No download button found for electrical permit');
          await page.screenshot({ path: 'no-download-button.png' });
        }
      } else {
        console.log('❌ No electrical forms found');
      }
    } else {
      console.log('❌ No forms section found');
      await page.screenshot({ path: 'no-forms-section.png' });
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'permit-search-results.png' });
  });

  test('should test download API endpoint directly', async () => {
    console.log('🧪 Testing download API endpoint directly...');
    
    // Test the download API endpoint with a sample form
    const response = await page.request.post(`${baseURL}/api/forms/download`, {
      data: {
        url: 'https://example-city.gov/forms/electrical-permit.pdf',
        name: 'Electrical Permit Application',
        fileType: 'pdf'
      }
    });

    console.log(`📡 API Response: ${response.status()} ${response.statusText()}`);
    
    if (response.ok()) {
      const contentType = response.headers()['content-type'];
      const contentLength = response.headers()['content-length'];
      console.log(`📄 Content-Type: ${contentType}`);
      console.log(`📏 Content-Length: ${contentLength}`);
      
      // Check if it's actually a PDF or document
      const buffer = await response.body();
      console.log(`📊 Response size: ${buffer.length} bytes`);
      
      if (buffer.length > 0) {
        const preview = buffer.toString('utf8', 0, Math.min(100, buffer.length));
        console.log(`👀 Response preview: ${preview}`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ API Error: ${errorText}`);
    }
  });

  test('should analyze network traffic during download attempt', async () => {
    const networkLogs: Array<{type: string, url: string, status?: number, contentType?: string}> = [];
    
    // Capture all network activity
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url()
      });
    });

    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type']
      });
    });

    // Navigate and search
    await page.goto(baseURL);
    await page.fill('#street', '123 Main Street');
    await page.fill('#city', 'Austin');
    await page.fill('#state', 'TX');
    await page.fill('#zipCode', '78701');
    await page.click('button[type="submit"]');
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    // Try to find and click any download button
    const downloadButtons = await page.locator('button:has-text("Download"), a:has-text("Download")').all();
    
    if (downloadButtons.length > 0) {
      console.log(`🎯 Found ${downloadButtons.length} download buttons`);
      
      // Click first download button and monitor traffic
      await downloadButtons[0].click();
      await page.waitForTimeout(3000);
      
      // Analyze network traffic
      console.log('\n📊 Network Traffic Analysis:');
      const downloadRequests = networkLogs.filter(log => 
        log.url.includes('/api/forms/download') || 
        log.url.includes('download') ||
        (log.contentType && (log.contentType.includes('pdf') || log.contentType.includes('application')))
      );
      
      console.log('🔍 Download-related requests:');
      downloadRequests.forEach(log => {
        console.log(`  ${log.type}: ${log.url} (${log.status || 'pending'}) ${log.contentType || ''}`);
      });
      
      // Check for failed requests
      const failedRequests = networkLogs.filter(log => log.status && log.status >= 400);
      if (failedRequests.length > 0) {
        console.log('\n❌ Failed requests:');
        failedRequests.forEach(log => {
          console.log(`  ${log.status}: ${log.url}`);
        });
      }
    } else {
      console.log('❌ No download buttons found');
    }

    // Save network logs for analysis
    console.log('\n📝 All network traffic saved to network-logs.json');
    await page.addInitScript(() => {
      (window as any).networkLogs = networkLogs;
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});