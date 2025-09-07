import * as cheerio from 'cheerio';
import { delay, cleanUrl, extractDomain } from '@/lib/utils';
import {
  governmentHttpClient,
  webScrapingCircuitBreaker,
  governmentSiteRateLimiter,
  permitDataCache,
  isValidHttpUrl,
  getTimeoutForUrlType,
  EnhancedNetworkError
} from '@/lib/network';
import { ContentExtractor, ExtractedTable, ExtractedForm } from './extractors';
import { FormDetector, DetectedForm, convertToPermitForm } from './form-detector';
import { urlValidator } from './url-validator';
import { PermitFee, ContactInfo, PermitForm } from '@/types';
import { AIContentParser, ParsedGovernmentContent } from './ai-parser';
import { ModernPortalDetector } from './modern-portal-detector';
import { dataCache } from './data-cache';

export interface ScrapingOptions {
  maxRetries?: number;
  delayBetweenRequests?: number;
  timeout?: number;
  respectRobots?: boolean;
  enableAdvancedExtraction?: boolean;
}

export interface ScrapingResult {
  url: string;
  title: string;
  content: string;
  links: string[];
  success: boolean;
  error?: string;
  timestamp: Date;
  
  // Enhanced extraction results
  structured?: {
    tables: ExtractedTable[];
    forms: ExtractedForm[];
    fees: PermitFee[];
    contact: ContactInfo;
    requirements: string[];
    processingTimes: { [key: string]: string };
    permitForms: PermitForm[];
    detectedForms: DetectedForm[];
    permitPortalUrl?: string;
    aiParsed?: ParsedGovernmentContent;
    dataQuality?: number;
  };
}

export class WebScraper {
  private readonly defaultOptions: ScrapingOptions = {
    maxRetries: 3,
    delayBetweenRequests: 2000,
    timeout: 30000,
    respectRobots: true,
    enableAdvancedExtraction: true,
  };

  private aiParser = new AIContentParser();
  private modernPortalDetector = new ModernPortalDetector();

  async scrapeUrl(url: string, options?: ScrapingOptions): Promise<ScrapingResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Check enhanced cache first
    const cachedResult = dataCache.getCachedScrapingResult(url);
    if (cachedResult) {
      console.log(`Returning enhanced cached scraping result for: ${url}`);
      return cachedResult;
    }
    
    // Check legacy cache as fallback
    const cacheKey = `scrape-${url}`;
    const legacyCachedResult = permitDataCache.get(cacheKey);
    if (legacyCachedResult) {
      console.log(`Returning legacy cached scraping result for: ${url}`);
      return {
        ...legacyCachedResult,
        timestamp: new Date(), // Update timestamp to show when retrieved
      };
    }

    const cleanedUrl = cleanUrl(url);

    if (!isValidHttpUrl(cleanedUrl)) {
      return this.createErrorResult(url, 'Invalid URL provided');
    }

    try {
      // Use circuit breaker for scraping operations
      const result = await webScrapingCircuitBreaker.execute(async () => {
        return await this.performScrapeWithRetry(cleanedUrl, opts);
      });

      // Cache successful results
      if (result.success) {
        permitDataCache.set(cacheKey, result, 1800000); // 30 minutes
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof EnhancedNetworkError 
        ? `Network error: ${error.message} (${error.code})`
        : `Scraping failed: ${(error as Error).message}`;
        
      return this.createErrorResult(url, errorMessage);
    }
  }

  private async performScrapeWithRetry(url: string, options: ScrapingOptions): Promise<ScrapingResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries!; attempt++) {
      try {
        if (attempt > 1) {
          await delay(options.delayBetweenRequests!);
        }

        // Rate limit requests to be respectful
        await governmentSiteRateLimiter.waitForSlot();

        const result = await this.performScrape(url, options);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Scraping attempt ${attempt} failed for ${url}:`, error);
        
        // Don't retry on certain types of errors
        if (error instanceof EnhancedNetworkError && !error.isRetryable) {
          break;
        }
      }
    }

    throw lastError || new Error('Scraping failed for unknown reason');
  }

  private async performScrape(url: string, options: ScrapingOptions): Promise<ScrapingResult> {
    const timeout = getTimeoutForUrlType(url);
    const response = await governmentHttpClient.fetch(url, { 
      method: 'GET',
      timeout 
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title';

    // Remove script and style elements
    $('script, style, nav, header, footer').remove();

    // Extract text content
    const content = this.extractTextContent($);

    // Extract relevant links
    const links = this.extractLinks($, url);

    const result: ScrapingResult = {
      url,
      title,
      content,
      links,
      success: true,
      timestamp: new Date(),
    };

    // Perform advanced extraction if enabled
    if (options.enableAdvancedExtraction) {
      try {
        console.log(`Starting enhanced extraction for ${url}`);
        
        // AI-powered content parsing (primary method)
        let aiParsed: ParsedGovernmentContent | undefined;
        let dataQuality = 0;
        
        if (process.env.OPENAI_API_KEY) {
          try {
            aiParsed = await this.aiParser.parseGovernmentContent(html, url, content);
            dataQuality = aiParsed.dataQuality;
            console.log(`AI parsing completed with quality score: ${dataQuality.toFixed(2)}`);
          } catch (error) {
            console.warn(`AI parsing failed for ${url}:`, error);
          }
        } else {
          console.log('OpenAI API key not configured, skipping AI parsing');
        }
        
        // Traditional extraction methods (fallback and supplement)
        const extractor = new ContentExtractor(html, url);
        const formDetector = new FormDetector(html, url);
        
        // Extract basic content using traditional methods
        const tables = extractor.extractTables();
        const forms = extractor.extractForms();
        const fees = extractor.extractFeeSchedule();
        const contact = extractor.extractContactInfo();
        const requirements = extractor.extractRequirements();
        const processingTimes = extractor.extractProcessingTimes();
        
        // Enhanced form detection using multiple methods
        let detectedForms = formDetector.detectForms();
        
        // Add modern portal form detection
        const modernPortalForms = await this.modernPortalDetector.detectPortalForms(url, html);
        detectedForms = [...detectedForms, ...modernPortalForms];
        
        console.log(`Enhanced form detection found ${detectedForms.length} forms on ${url}`);

        // Convert detected forms to PermitForm format
        let permitForms = detectedForms.map(form => convertToPermitForm(form, url));
        
        // Merge with AI-detected forms if available
        if (aiParsed?.forms && aiParsed.forms.length > 0) {
          permitForms = [...permitForms, ...aiParsed.forms];
          console.log(`AI found ${aiParsed.forms.length} additional forms`);
        }

        // Find permit portals if this is a main government site
        let permitPortalUrl: string | undefined;
        try {
          const portals = await urlValidator.findPermitPortals(url);
          if (portals.length > 0) {
            const onlinePortal = portals.find(p => p.portal.type === 'online_portal');
            permitPortalUrl = onlinePortal?.url || portals[0].url;
            console.log(`Found permit portal: ${permitPortalUrl}`);
          }
        } catch (error) {
          console.warn(`Portal discovery failed for ${url}:`, error);
        }
        
        // Merge AI data with traditional extraction
        const mergedFees = this.mergeFeeData(fees, aiParsed?.fees || []);
        const mergedContact = this.mergeContactData(contact, aiParsed?.contact);
        const mergedRequirements = this.mergeRequirements(requirements, aiParsed?.requirements || []);
        const mergedProcessingTimes = { ...processingTimes, ...aiParsed?.processingTimes };
        
        result.structured = {
          tables,
          forms,
          fees: mergedFees,
          contact: mergedContact,
          requirements: mergedRequirements,
          processingTimes: mergedProcessingTimes,
          permitForms,
          detectedForms,
          permitPortalUrl,
          aiParsed,
          dataQuality
        };

        console.log(`Enhanced extraction completed for ${url}:`, {
          tables: tables.length,
          forms: forms.length,
          fees: mergedFees.length,
          requirements: mergedRequirements.length,
          permitForms: permitForms.length,
          detectedForms: detectedForms.length,
          hasPortalUrl: !!permitPortalUrl,
          dataQuality: dataQuality.toFixed(2),
          aiParsed: !!aiParsed
        });
      } catch (error) {
        console.warn(`Enhanced extraction failed for ${url}:`, error);
        // Don't fail the entire scrape if advanced extraction fails
      }
    }

    // Cache the result with quality-based expiration
    const qualityScore = result.structured?.dataQuality || 0.5;
    dataCache.cacheScrapingResult(url, result, qualityScore);

    // Legacy cache for backwards compatibility
    permitDataCache.set(`scrape-${url}`, result);

    return result;
  }

  private mergeFeeData(traditionalFees: PermitFee[], aiFees: PermitFee[]): PermitFee[] {
    const merged = [...traditionalFees];
    
    // Add AI fees that don't duplicate traditional ones
    for (const aiFee of aiFees) {
      const isDuplicate = traditionalFees.some(fee => 
        fee.type.toLowerCase() === aiFee.type.toLowerCase() && 
        Math.abs(fee.amount - aiFee.amount) < 0.01
      );
      
      if (!isDuplicate) {
        merged.push(aiFee);
      }
    }
    
    return merged;
  }

  private mergeContactData(traditionalContact: ContactInfo, aiContact?: ContactInfo): ContactInfo {
    if (!aiContact) return traditionalContact;
    
    return {
      phone: aiContact.phone || traditionalContact.phone,
      email: aiContact.email || traditionalContact.email,
      address: aiContact.address || traditionalContact.address,
      hoursOfOperation: aiContact.hoursOfOperation || traditionalContact.hoursOfOperation
    };
  }

  private mergeRequirements(traditionalReqs: string[], aiReqs: string[]): string[] {
    const merged = [...traditionalReqs];
    
    // Add AI requirements that aren't already present
    for (const aiReq of aiReqs) {
      const isDuplicate = traditionalReqs.some(req => 
        req.toLowerCase().includes(aiReq.toLowerCase()) || 
        aiReq.toLowerCase().includes(req.toLowerCase())
      );
      
      if (!isDuplicate) {
        merged.push(aiReq);
      }
    }
    
    return merged;
  }


  private extractTextContent($: cheerio.CheerioAPI): string {
    // Focus on main content areas
    const contentSelectors = [
      'main',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.permit',
      '.building',
      '.application',
      'article',
      '.page-content'
    ];

    let content = '';

    // Try specific content selectors first
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) {
          break;
        }
      }
    }

    // Fallback to body content if specific selectors don't yield enough content
    if (content.length < 200) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
      .substring(0, 10000); // Limit content length
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = [];
    const baseDomain = extractDomain(baseUrl);

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkDomain = extractDomain(absoluteUrl);

        // Only include links from same domain that might be permit-related
        if (linkDomain === baseDomain && this.isPermitRelatedLink(href, $(element).text())) {
          links.push(absoluteUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  private isPermitRelatedLink(href: string, linkText: string): boolean {
    const permitKeywords = [
      'permit', 'building', 'application', 'form', 'fee', 'inspection',
      'zoning', 'electrical', 'plumbing', 'mechanical', 'construction',
      'planning', 'development', 'license'
    ];

    const combinedText = (href + ' ' + linkText).toLowerCase();
    return permitKeywords.some(keyword => combinedText.includes(keyword));
  }

  private createErrorResult(url: string, error: string): ScrapingResult {
    return {
      url,
      title: '',
      content: '',
      links: [],
      success: false,
      error,
      timestamp: new Date(),
    };
  }

  async scrapeMultipleUrls(urls: string[], options?: ScrapingOptions): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const opts = { ...this.defaultOptions, ...options };

    console.log(`Starting batch scraping of ${urls.length} URLs`);

    for (let i = 0; i < urls.length; i++) {
      try {
        // Rate limiting is handled internally by scrapeUrl
        const result = await this.scrapeUrl(urls[i], options);
        results.push(result);
        
        // Log progress for large batches
        if (urls.length > 5 && (i + 1) % 5 === 0) {
          console.log(`Batch scraping progress: ${i + 1}/${urls.length} completed`);
        }

        // Additional delay between URLs to be extra respectful
        if (i < urls.length - 1) {
          await delay(Math.max(opts.delayBetweenRequests!, 1000));
        }
      } catch (error) {
        console.error(`Batch scraping failed for URL ${urls[i]}:`, error);
        // Add error result to maintain array consistency
        results.push(this.createErrorResult(urls[i], `Batch scraping error: ${(error as Error).message}`));
      }
    }

    console.log(`Batch scraping completed: ${results.filter(r => r.success).length}/${urls.length} successful`);
    return results;
  }
}

export const webScraper = new WebScraper();