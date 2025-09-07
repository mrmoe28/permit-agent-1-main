import { governmentHttpClient } from '@/lib/network';

export interface URLValidationResult {
  url: string;
  isValid: boolean;
  isAccessible: boolean;
  finalUrl?: string; // After redirects
  statusCode?: number;
  contentType?: string;
  isPermitRelated?: boolean;
  error?: string;
}

export interface PermitPortalInfo {
  type: 'online_portal' | 'application_page' | 'form_library' | 'document_center';
  name?: string;
  description?: string;
  requiresLogin?: boolean;
  hasForms?: boolean;
}

export class URLValidator {
  private readonly TIMEOUT = 15000;
  private readonly MAX_REDIRECTS = 5;

  /**
   * Validate and test URL accessibility
   */
  async validateURL(url: string): Promise<URLValidationResult> {
    try {
      const cleanUrl = this.cleanURL(url);
      
      if (!this.isValidURLFormat(cleanUrl)) {
        return {
          url: cleanUrl,
          isValid: false,
          isAccessible: false,
          error: 'Invalid URL format'
        };
      }

      const response = await governmentHttpClient.fetch(cleanUrl, {
        method: 'HEAD',
        timeout: this.TIMEOUT,
      });

      const isAccessible = response.ok;
      const finalUrl = response.url || cleanUrl;

      return {
        url: cleanUrl,
        isValid: true,
        isAccessible,
        finalUrl,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || undefined,
        isPermitRelated: this.isPermitRelatedURL(finalUrl)
      };

    } catch (error) {
      return {
        url,
        isValid: false,
        isAccessible: false,
        error: `Network error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Validate multiple URLs in parallel
   */
  async validateURLs(urls: string[]): Promise<URLValidationResult[]> {
    const validationPromises = urls.map(url => this.validateURL(url));
    return Promise.all(validationPromises);
  }

  /**
   * Find and validate permit portal URLs from a base website
   */
  async findPermitPortals(baseUrl: string): Promise<{ url: string; portal: PermitPortalInfo }[]> {
    const portals: { url: string; portal: PermitPortalInfo }[] = [];
    
    try {
      // Common permit portal paths
      const portalPaths = [
        '/permits/online',
        '/permits/apply',
        '/permits/application',
        '/online-services',
        '/e-permits',
        '/permit-portal',
        '/apply-online',
        '/applications/online',
        '/services/permits',
        '/departments/building/permits',
        '/building/permits/apply',
        '/permits-and-licenses',
        '/citizen-access',
        '/accela',
        '/energov',
        '/clariti',
        '/aca'
      ];

      // Test each portal path
      const validationResults = await Promise.all(
        portalPaths.map(path => {
          const testUrl = new URL(path, baseUrl).href;
          return this.validateURL(testUrl);
        })
      );

      // Filter valid portals and identify their types
      for (const result of validationResults) {
        if (result.isValid && result.isAccessible) {
          const portalInfo = await this.analyzePermitPortal(result.finalUrl || result.url);
          if (portalInfo) {
            portals.push({
              url: result.finalUrl || result.url,
              portal: portalInfo
            });
          }
        }
      }

      // Also scrape the main page for portal links
      const scrapedPortals = await this.findPortalLinksFromPage(baseUrl);
      portals.push(...scrapedPortals);

      return this.deduplicatePortals(portals);

    } catch (error) {
      console.warn(`Failed to find permit portals for ${baseUrl}:`, error);
      return [];
    }
  }

  /**
   * Analyze a URL to determine if it's a permit portal and what type
   */
  private async analyzePermitPortal(url: string): Promise<PermitPortalInfo | null> {
    try {
      const response = await governmentHttpClient.fetch(url, {
        method: 'GET',
        timeout: this.TIMEOUT,
      });

      if (!response.ok) {
        return null;
      }

      const html = (await response.text()).toLowerCase();
      
      // Check for common portal indicators
      const portalIndicators = {
        online_portal: [
          'citizen access', 'online permits', 'apply online', 'e-permits',
          'permit portal', 'online applications', 'digital permits'
        ],
        application_page: [
          'permit application', 'apply for permit', 'application form',
          'submit application', 'permit request'
        ],
        form_library: [
          'permit forms', 'application forms', 'download forms',
          'form library', 'documents and forms'
        ],
        document_center: [
          'document center', 'resource center', 'permit documents',
          'building documents', 'plan review'
        ]
      };

      // Determine portal type
      let portalType: PermitPortalInfo['type'] = 'application_page';
      let maxMatches = 0;

      for (const [type, indicators] of Object.entries(portalIndicators)) {
        const matches = indicators.filter(indicator => html.includes(indicator)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          portalType = type as PermitPortalInfo['type'];
        }
      }

      // Additional checks
      const requiresLogin = html.includes('login') || html.includes('sign in') || html.includes('account');
      const hasForms = html.includes('form') || html.includes('application') || html.includes('download');

      // Extract portal name from title or heading
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const headingMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      const nameMatch = titleMatch || headingMatch;
      const name = nameMatch ? nameMatch[1].trim() : undefined;

      return {
        type: portalType,
        name,
        requiresLogin,
        hasForms
      };

    } catch (error) {
      console.warn(`Failed to analyze portal ${url}:`, error);
      return null;
    }
  }

  /**
   * Scrape main page to find portal links
   */
  private async findPortalLinksFromPage(baseUrl: string): Promise<{ url: string; portal: PermitPortalInfo }[]> {
    const portals: { url: string; portal: PermitPortalInfo }[] = [];

    try {
      const response = await governmentHttpClient.fetch(baseUrl, {
        method: 'GET',
        timeout: this.TIMEOUT
      });

      if (!response.ok) {
        return portals;
      }

      const html = await response.text();
      const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
      const linkMatches = html.match(linkRegex) || [];

      for (const linkMatch of linkMatches) {
        const hrefMatch = linkMatch.match(/href="([^"]+)"/);
        const textMatch = linkMatch.match(/>([^<]+)</);
        
        if (hrefMatch && textMatch) {
          const href = hrefMatch[1];
          const text = textMatch[1].trim();
          
          if (this.isPermitPortalLink(text, href)) {
            const absoluteUrl = new URL(href, baseUrl).href;
            const portalInfo = this.inferPortalTypeFromText(text);
            
            portals.push({
              url: absoluteUrl,
              portal: portalInfo
            });
          }
        }
      }

    } catch (error) {
      console.warn(`Failed to scrape portal links from ${baseUrl}:`, error);
    }

    return portals;
  }

  /**
   * Check if link text/URL suggests it's a permit portal
   */
  private isPermitPortalLink(text: string, url: string): boolean {
    const portalKeywords = [
      'apply online', 'online permits', 'permit portal', 'citizen access',
      'e-permits', 'online applications', 'apply for permit', 'submit application',
      'permit forms', 'building permits', 'online services'
    ];

    const combined = `${text} ${url}`.toLowerCase();
    return portalKeywords.some(keyword => combined.includes(keyword));
  }

  /**
   * Infer portal type from link text
   */
  private inferPortalTypeFromText(text: string): PermitPortalInfo {
    const lower = text.toLowerCase();
    
    if (lower.includes('apply online') || lower.includes('online application')) {
      return { type: 'online_portal', name: text };
    }
    
    if (lower.includes('forms') || lower.includes('download')) {
      return { type: 'form_library', name: text };
    }
    
    if (lower.includes('documents') || lower.includes('resources')) {
      return { type: 'document_center', name: text };
    }
    
    return { type: 'application_page', name: text };
  }

  /**
   * Remove duplicate portals based on URL similarity
   */
  private deduplicatePortals(portals: { url: string; portal: PermitPortalInfo }[]): { url: string; portal: PermitPortalInfo }[] {
    const seen = new Set<string>();
    const unique: { url: string; portal: PermitPortalInfo }[] = [];

    for (const portal of portals) {
      const normalizedUrl = this.normalizeURL(portal.url);
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push(portal);
      }
    }

    return unique;
  }

  /**
   * Clean and normalize URL
   */
  private cleanURL(url: string): string {
    let clean = url.trim();
    
    // Add protocol if missing
    if (!clean.match(/^https?:\/\//)) {
      clean = `https://${clean}`;
    }
    
    // Remove trailing slash and fragments
    clean = clean.replace(/\/+$/, '').replace(/#.*$/, '');
    
    return clean;
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Check if URL format is valid
   */
  private isValidURLFormat(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is permit-related based on path and domain
   */
  private isPermitRelatedURL(url: string): boolean {
    const permitKeywords = [
      'permit', 'building', 'application', 'form', 'development',
      'planning', 'zoning', 'construction', 'inspection', 'license',
      'apply', 'online', 'citizen', 'services'
    ];

    const urlLower = url.toLowerCase();
    return permitKeywords.some(keyword => urlLower.includes(keyword));
  }
}

export const urlValidator = new URLValidator();