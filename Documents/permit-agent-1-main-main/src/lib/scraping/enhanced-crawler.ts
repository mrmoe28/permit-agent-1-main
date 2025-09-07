import { delay, cleanUrl, extractDomain } from '@/lib/utils';
import { webScraper, ScrapingResult } from './scraper';

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  followPatterns?: string[];
  excludePatterns?: string[];
  delayBetweenPages?: number;
  enableDeepAnalysis?: boolean;
}

export interface CrawlResult {
  baseUrl: string;
  pagesVisited: number;
  totalContent: string;
  allLinks: string[];
  allForms: any[];
  allFees: any[];
  allContacts: any[];
  allRequirements: string[];
  processingTimes: { [key: string]: string };
  permitPortals: string[];
  timestamp: Date;
}

export class EnhancedCrawler {
  private visitedUrls: Set<string> = new Set();
  private results: Map<string, ScrapingResult> = new Map();
  
  private readonly defaultOptions: CrawlOptions = {
    maxDepth: 3,
    maxPages: 25, // Increased from default
    followPatterns: [
      'permit', 'building', 'planning', 'zoning', 'application',
      'form', 'fee', 'inspection', 'electrical', 'plumbing',
      'mechanical', 'construction', 'development', 'license',
      'submit', 'apply', 'download', 'requirement', 'checklist',
      'residential', 'commercial', 'contractor', 'homeowner'
    ],
    excludePatterns: [
      'news', 'blog', 'archive', 'calendar', 'meeting', 'minutes',
      'agenda', 'facebook', 'twitter', 'linkedin', 'youtube'
    ],
    delayBetweenPages: 1500,
    enableDeepAnalysis: true,
  };

  async crawlSite(baseUrl: string, options?: CrawlOptions): Promise<CrawlResult> {
    const opts = { ...this.defaultOptions, ...options };
    this.visitedUrls.clear();
    this.results.clear();

    console.log(`Starting enhanced crawl of ${baseUrl} with options:`, opts);

    // Start crawling from base URL
    await this.crawlPage(baseUrl, 0, opts, extractDomain(baseUrl));

    // Aggregate results
    const aggregatedResult = this.aggregateResults(baseUrl);
    
    console.log(`Crawl completed: ${this.visitedUrls.size} pages visited`);
    return aggregatedResult;
  }

  private async crawlPage(
    url: string, 
    depth: number, 
    options: CrawlOptions,
    baseDomain: string
  ): Promise<void> {
    // Check limits
    if (depth > options.maxDepth! || this.visitedUrls.size >= options.maxPages!) {
      return;
    }

    // Skip if already visited
    const cleanedUrl = cleanUrl(url);
    if (this.visitedUrls.has(cleanedUrl)) {
      return;
    }

    // Mark as visited
    this.visitedUrls.add(cleanedUrl);

    try {
      console.log(`Crawling page ${this.visitedUrls.size}/${options.maxPages}: ${cleanedUrl} (depth: ${depth})`);
      
      // Scrape the page
      const result = await webScraper.scrapeUrl(cleanedUrl, {
        enableAdvancedExtraction: options.enableDeepAnalysis,
        timeout: 30000,
      });

      if (result.success) {
        this.results.set(cleanedUrl, result);

        // Extract and queue child URLs
        if (depth < options.maxDepth!) {
          const childUrls = this.extractRelevantUrls(result, baseDomain, options);
          
          // Process child URLs
          for (const childUrl of childUrls) {
            if (this.visitedUrls.size >= options.maxPages!) break;
            
            await delay(options.delayBetweenPages!);
            await this.crawlPage(childUrl, depth + 1, options, baseDomain);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to crawl ${cleanedUrl}:`, error);
    }
  }

  private extractRelevantUrls(
    result: ScrapingResult, 
    baseDomain: string,
    options: CrawlOptions
  ): string[] {
    const relevantUrls: string[] = [];
    
    // Filter links based on patterns
    for (const link of result.links) {
      // Check if link is from same domain
      if (extractDomain(link) !== baseDomain) continue;
      
      // Check if already visited
      if (this.visitedUrls.has(cleanUrl(link))) continue;
      
      // Check exclude patterns
      const shouldExclude = options.excludePatterns!.some(pattern => 
        link.toLowerCase().includes(pattern)
      );
      if (shouldExclude) continue;
      
      // Check follow patterns - prioritize permit-related links
      const relevanceScore = this.calculateRelevance(link);
      if (relevanceScore > 0) {
        relevantUrls.push(link);
      }
    }

    // Sort by relevance and return top candidates
    return relevantUrls
      .sort((a, b) => this.calculateRelevance(b) - this.calculateRelevance(a))
      .slice(0, 10); // Limit to top 10 most relevant links per page
  }

  private calculateRelevance(url: string): number {
    const urlLower = url.toLowerCase();
    let score = 0;

    // High priority keywords
    const highPriority = [
      'permit-application', 'apply-online', 'permit-center', 'building-permit',
      'permit-portal', 'e-permit', 'online-permit', 'submit-application'
    ];
    
    // Medium priority keywords  
    const mediumPriority = [
      'permit', 'building', 'application', 'form', 'fee', 'requirement',
      'electrical', 'plumbing', 'mechanical', 'residential', 'commercial'
    ];
    
    // Low priority keywords
    const lowPriority = [
      'planning', 'zoning', 'development', 'construction', 'inspection',
      'contractor', 'homeowner', 'project'
    ];

    // Calculate scores
    highPriority.forEach(keyword => {
      if (urlLower.includes(keyword)) score += 10;
    });
    
    mediumPriority.forEach(keyword => {
      if (urlLower.includes(keyword)) score += 5;
    });
    
    lowPriority.forEach(keyword => {
      if (urlLower.includes(keyword)) score += 2;
    });

    // Bonus for certain URL patterns
    if (urlLower.includes('/permits/') || urlLower.includes('/building/')) score += 8;
    if (urlLower.includes('/apply') || urlLower.includes('/submit')) score += 7;
    if (urlLower.includes('/forms') || urlLower.includes('/applications')) score += 6;
    if (urlLower.includes('/fees') || urlLower.includes('/costs')) score += 5;

    return score;
  }

  private aggregateResults(baseUrl: string): CrawlResult {
    const allContent: string[] = [];
    const allLinks: Set<string> = new Set();
    const allForms: any[] = [];
    const allFees: any[] = [];
    const allContacts: any[] = [];
    const allRequirements: Set<string> = new Set();
    const processingTimes: { [key: string]: string } = {};
    const permitPortals: Set<string> = new Set();

    // Aggregate data from all crawled pages
    for (const [url, result] of this.results) {
      // Add content
      if (result.content) {
        allContent.push(`\n\n=== Page: ${url} ===\n${result.content}`);
      }

      // Add links
      result.links.forEach(link => allLinks.add(link));

      // Add structured data if available
      if (result.structured) {
        // Forms
        if (result.structured.permitForms) {
          allForms.push(...result.structured.permitForms);
        }
        if (result.structured.detectedForms) {
          allForms.push(...result.structured.detectedForms);
        }

        // Fees
        if (result.structured.fees) {
          allFees.push(...result.structured.fees);
        }

        // Contacts
        if (result.structured.contact) {
          allContacts.push(result.structured.contact);
        }

        // Requirements
        if (result.structured.requirements) {
          result.structured.requirements.forEach(req => allRequirements.add(req));
        }

        // Processing times
        if (result.structured.processingTimes) {
          Object.assign(processingTimes, result.structured.processingTimes);
        }

        // Permit portals
        if (result.structured.permitPortalUrl) {
          permitPortals.add(result.structured.permitPortalUrl);
        }
      }
    }

    // Deduplicate forms by URL
    const uniqueForms = this.deduplicateForms(allForms);
    
    // Deduplicate fees by description
    const uniqueFees = this.deduplicateFees(allFees);

    // Merge contacts
    const mergedContacts = this.mergeContacts(allContacts);

    return {
      baseUrl,
      pagesVisited: this.visitedUrls.size,
      totalContent: allContent.join('\n'),
      allLinks: Array.from(allLinks),
      allForms: uniqueForms,
      allFees: uniqueFees,
      allContacts: mergedContacts,
      allRequirements: Array.from(allRequirements),
      processingTimes,
      permitPortals: Array.from(permitPortals),
      timestamp: new Date(),
    };
  }

  private deduplicateForms(forms: any[]): any[] {
    const uniqueMap = new Map<string, any>();
    
    for (const form of forms) {
      const key = form.url || form.name;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, form);
      }
    }
    
    return Array.from(uniqueMap.values());
  }

  private deduplicateFees(fees: any[]): any[] {
    const uniqueMap = new Map<string, any>();
    
    for (const fee of fees) {
      const key = `${fee.permitType}-${fee.amount}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, fee);
      }
    }
    
    return Array.from(uniqueMap.values());
  }

  private mergeContacts(contacts: any[]): any[] {
    // Group contacts by department/type
    const groupedContacts = new Map<string, any>();
    
    for (const contact of contacts) {
      const key = contact.department || 'General';
      if (!groupedContacts.has(key)) {
        groupedContacts.set(key, contact);
      } else {
        // Merge contact information
        const existing = groupedContacts.get(key);
        groupedContacts.set(key, {
          ...existing,
          ...contact,
          phone: contact.phone || existing.phone,
          email: contact.email || existing.email,
          address: contact.address || existing.address,
        });
      }
    }
    
    return Array.from(groupedContacts.values());
  }

  async findPermitPortals(baseUrl: string): Promise<string[]> {
    console.log(`Searching for permit portals from ${baseUrl}`);
    
    // Common permit portal URL patterns
    const portalPatterns = [
      '/permits/apply',
      '/permit-center',
      '/online-permits',
      '/e-permits',
      '/building/permits',
      '/permitting',
      '/citizen-access',
      '/energov',
      '/portal',
      '/apply-online',
      '/submit-application'
    ];

    const potentialPortals: string[] = [];

    try {
      // First, scrape the base page to find portal links
      const result = await webScraper.scrapeUrl(baseUrl);
      
      if (result.success) {
        // Check all links for portal patterns
        for (const link of result.links) {
          const linkLower = link.toLowerCase();
          
          // Check if link matches portal patterns
          if (portalPatterns.some(pattern => linkLower.includes(pattern))) {
            potentialPortals.push(link);
          }
          
          // Also check for external permit systems
          if (linkLower.includes('citizenaccess') || 
              linkLower.includes('energov') ||
              linkLower.includes('permittrax') ||
              linkLower.includes('accela') ||
              linkLower.includes('viewpoint')) {
            potentialPortals.push(link);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to find permit portals for ${baseUrl}:`, error);
    }

    return [...new Set(potentialPortals)]; // Remove duplicates
  }
}

export const enhancedCrawler = new EnhancedCrawler();