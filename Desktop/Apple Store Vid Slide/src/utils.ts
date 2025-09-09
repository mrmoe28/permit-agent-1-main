import { promises as fs } from 'fs';
import { dirname } from 'path';
import { createInterface } from 'readline';
import { Page, Locator } from 'playwright';

/**
 * Ensure a directory exists, creating it recursively if needed
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Convert a string to a filename-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Wait for user to press Enter with an interactive prompt
 */
export function waitForEnter(prompt: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📸 ${prompt}`);
    console.log(`${'='.repeat(80)}\n`);

    rl.question('Press Enter to capture screenshot and continue... ', () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Take a full-page screenshot with error handling
 */
export async function safeScreenshot(
  page: Page, 
  path: string, 
  fullPage: boolean = true
): Promise<boolean> {
  try {
    await ensureDir(dirname(path));
    await page.screenshot({ path, fullPage });
    console.log(`✅ Screenshot saved: ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save screenshot ${path}:`, error);
    return false;
  }
}

/**
 * Take a screenshot of a specific element
 */
export async function elementScreenshot(
  page: Page, 
  selector: string, 
  path: string
): Promise<boolean> {
  try {
    await ensureDir(dirname(path));
    const locator = page.locator(selector);
    
    // Wait for element to be visible with timeout
    await locator.waitFor({ state: 'visible', timeout: 5000 });
    await locator.screenshot({ path });
    
    console.log(`✅ Element screenshot saved: ${path}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not capture element screenshot for selector "${selector}": ${error}`);
    return false;
  }
}

/**
 * Format current timestamp for directory naming
 */
export function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hour}-${minute}`;
}

/**
 * Format step index with zero padding
 */
export function formatStepIndex(index: number): string {
  return String(index).padStart(2, '0');
}

/**
 * Wait for page to be in a stable state
 */
export async function waitForPageStable(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // Fallback to domcontentloaded if networkidle times out
    await page.waitForLoadState('domcontentloaded');
  }
}