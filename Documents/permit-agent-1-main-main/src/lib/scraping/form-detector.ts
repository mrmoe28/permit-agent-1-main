import * as cheerio from 'cheerio';
import { PermitForm } from '@/types';
import { governmentHttpClient } from '@/lib/network';

export interface DetectedForm {
  name: string;
  url: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'online';
  size?: string;
  description?: string;
  isRequired?: boolean;
  category?: string;
}

export class FormDetector {
  private $: cheerio.CheerioAPI;
  private baseUrl: string;
  private domain: string;

  constructor(html: string, baseUrl: string) {
    this.$ = cheerio.load(html);
    this.baseUrl = baseUrl;
    this.domain = new URL(baseUrl).hostname;
  }

  /**
   * Detect all downloadable forms on the page
   */
  detectForms(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    const seen = new Set<string>();

    // 1. Look for direct file links
    const fileLinks = this.findFileLinks();
    fileLinks.forEach(form => {
      if (!seen.has(form.url)) {
        forms.push(form);
        seen.add(form.url);
      }
    });

    // 2. Look for form sections and tables
    const sectionForms = this.findFormsInSections();
    sectionForms.forEach(form => {
      if (!seen.has(form.url)) {
        forms.push(form);
        seen.add(form.url);
      }
    });

    // 3. Look for forms in download areas
    const downloadForms = this.findFormsInDownloadAreas();
    downloadForms.forEach(form => {
      if (!seen.has(form.url)) {
        forms.push(form);
        seen.add(form.url);
      }
    });

    // 4. Look for forms in navigation menus
    const navigationForms = this.findFormsInNavigation();
    navigationForms.forEach(form => {
      if (!seen.has(form.url)) {
        forms.push(form);
        seen.add(form.url);
      }
    });

    // 5. Look for forms in content areas and paragraphs
    const contentForms = this.findFormsInContent();
    contentForms.forEach(form => {
      if (!seen.has(form.url)) {
        forms.push(form);
        seen.add(form.url);
      }
    });

    // 6. Look for forms in structured data and metadata
    const metadataForms = this.findFormsInMetadata();
    metadataForms.forEach(form => {
      if (!seen.has(form.url)) {
        forms.push(form);
        seen.add(form.url);
      }
    });

    return forms.filter(form => this.isPermitRelatedForm(form));
  }

  /**
   * Find direct file links (PDF, DOC, etc.)
   */
  private findFileLinks(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    const fileExtensions = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;

    this.$('a[href]').each((_, element) => {
      const link = this.$(element);
      const href = link.attr('href');
      const text = link.text().trim();
      
      if (!href || !fileExtensions.test(href)) return;

      const absoluteUrl = this.resolveUrl(href);
      if (!absoluteUrl || !this.isGovernmentUrl(absoluteUrl)) return;

      const fileType = this.getFileType(href);
      const form: DetectedForm = {
        name: text || this.extractFilename(href),
        url: absoluteUrl,
        fileType,
        description: this.extractDescription(link),
        isRequired: this.isRequiredForm(link, text),
        category: this.categorizeForm(text)
      };

      // Try to find file size
      const sizeMatch = link.parent().text().match(/\(([0-9.]+\s*(KB|MB|kb|mb))\)/i);
      if (sizeMatch) {
        form.size = sizeMatch[1];
      }

      forms.push(form);
    });

    return forms;
  }

  /**
   * Find forms organized in sections, tables, or lists
   */
  private findFormsInSections(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Enhanced form section selectors for various government website styles
    const sectionSelectors = [
      // Common government patterns
      '.forms', '.applications', '.downloads', '.documents',
      '.permits-forms', '.permit-applications', '.permit-documents',
      '.building-forms', '.planning-forms', '.zoning-forms',
      
      // Government-specific patterns
      '.gov-forms', '.city-forms', '.county-forms',
      '.online-services', '.e-services', '.digital-services',
      '.citizen-services', '.resident-services',
      '.permit-center', '.application-center', '.form-center',
      
      // Content management system patterns
      '.content-forms', '.page-forms', '.resource-forms',
      '.file-downloads', '.document-library', '.resource-library',
      '.forms-library', '.application-library',
      
      // Municipal website patterns
      '.municipality-forms', '.township-forms', '.village-forms',
      '.borough-forms', '.parish-forms',
      
      // Department-specific patterns
      '.building-dept', '.planning-dept', '.zoning-dept',
      '.code-enforcement', '.public-works', '.engineering-dept',
      
      // Modern government site patterns
      '.portal-forms', '.self-service', '.online-portal',
      '.digital-forms', '.electronic-forms', '.web-forms',
      
      // Generic patterns with wildcards
      '[class*="form"]', '[class*="application"]', '[class*="download"]',
      '[class*="permit"]', '[class*="document"]', '[class*="file"]',
      '[class*="resource"]', '[class*="service"]', '[class*="portal"]',
      
      // ID-based selectors
      '#forms', '#applications', '#downloads', '#documents',
      '#permits', '#permit-forms', '#online-forms',
      
      // Semantic HTML5 patterns
      'section[role="region"]', 'main section', 'article section',
      '[role="main"] section', '[role="complementary"]',
      
      // List-based patterns
      '.form-list', '.application-list', '.download-list',
      '.document-list', '.file-list', '.resource-list',
      'ul.forms', 'ol.forms', 'ul.applications', 'ol.applications'
    ];

    sectionSelectors.forEach(selector => {
      this.$(selector).each((_, section) => {
        const sectionTitle = this.$(section).find('h1, h2, h3, h4, h5, h6').first().text().trim();
        
        this.$(section).find('a[href]').each((_, link) => {
          const href = this.$(link).attr('href');
          const text = this.$(link).text().trim();
          
          if (!href) return;
          
          const fileType = this.getFileType(href);
          if (fileType === 'online' && !this.looksLikeFormUrl(href)) return;
          
          const absoluteUrl = this.resolveUrl(href);
          if (!absoluteUrl || !this.isGovernmentUrl(absoluteUrl)) return;

          forms.push({
            name: text || this.extractFilename(href),
            url: absoluteUrl,
            fileType,
            description: sectionTitle ? `From: ${sectionTitle}` : undefined,
            isRequired: this.isRequiredForm(this.$(link), text),
            category: this.categorizeForm(text) || this.categorizeForm(sectionTitle)
          });
        });
      });
    });

    return forms;
  }

  /**
   * Find forms in dedicated download areas
   */
  private findFormsInDownloadAreas(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Look for tables with form information
    this.$('table').each((_, table) => {
      const headers: string[] = [];
      this.$(table).find('thead th, tr:first-child th, tr:first-child td').each((_, th) => {
        headers.push(this.$(th).text().trim().toLowerCase());
      });

      // Check if this looks like a forms table
      if (!this.isFormsTable(headers)) return;

      const nameIndex = this.findColumnIndex(headers, ['form', 'application', 'document', 'name']);
      const linkIndex = this.findColumnIndex(headers, ['download', 'link', 'file', 'pdf']);
      const descIndex = this.findColumnIndex(headers, ['description', 'purpose', 'use']);

      this.$(table).find('tbody tr, tr:not(:first-child)').each((_, row) => {
        const cells: cheerio.Cheerio<any>[] = [];
        this.$(row).find('td, th').each((_, cell) => {
          cells.push(this.$(cell));
        });

        if (cells.length === 0) return;

        let name = '';
        let url = '';
        let description = '';

        // Extract name
        if (nameIndex >= 0 && nameIndex < cells.length) {
          name = cells[nameIndex].text().trim();
        }

        // Extract URL
        if (linkIndex >= 0 && linkIndex < cells.length) {
          const linkCell = cells[linkIndex];
          const link = linkCell.find('a').first();
          if (link.length) {
            url = link.attr('href') || '';
            if (!name) name = link.text().trim();
          }
        }

        // Fallback: find any link in the row
        if (!url) {
          const rowLink = this.$(row).find('a[href]').first();
          if (rowLink.length) {
            url = rowLink.attr('href') || '';
            if (!name) name = rowLink.text().trim();
          }
        }

        // Extract description
        if (descIndex >= 0 && descIndex < cells.length) {
          description = cells[descIndex].text().trim();
        }

        if (!url || !name) return;

        const absoluteUrl = this.resolveUrl(url);
        if (!absoluteUrl || !this.isGovernmentUrl(absoluteUrl)) return;

        const fileType = this.getFileType(url);
        if (fileType === 'online' && !this.looksLikeFormUrl(url)) return;

        forms.push({
          name,
          url: absoluteUrl,
          fileType,
          description,
          isRequired: this.isRequiredForm(this.$(row), name),
          category: this.categorizeForm(name)
        });
      });
    });

    return forms;
  }

  /**
   * Find forms in navigation menus and sidebars
   */
  private findFormsInNavigation(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Navigation selectors
    const navSelectors = [
      'nav', '.navigation', '.nav', '.menu', '.sidebar', '.side-nav',
      '.main-nav', '.primary-nav', '.secondary-nav', '.utility-nav',
      '.breadcrumbs', '.breadcrumb', '.page-nav', '.section-nav'
    ];
    
    navSelectors.forEach(selector => {
      this.$(selector).find('a[href]').each((_, link) => {
        const href = this.$(link).attr('href');
        const text = this.$(link).text().trim();
        
        if (!href || !this.looksLikeFormUrl(href)) return;
        
        const absoluteUrl = this.resolveUrl(href);
        if (!absoluteUrl || !this.isGovernmentUrl(absoluteUrl)) return;
        
        forms.push({
          name: text || this.extractFilename(href),
          url: absoluteUrl,
          fileType: this.getFileType(href),
          description: 'Found in navigation menu',
          isRequired: this.isRequiredForm(this.$(link), text),
          category: this.categorizeForm(text)
        });
      });
    });
    
    return forms;
  }

  /**
   * Find forms mentioned in content areas
   */
  private findFormsInContent(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Look for links in paragraphs and content areas that mention forms
    this.$('p, div, article, section').each((_, element) => {
      const text = this.$(element).text().toLowerCase();
      
      // Skip if doesn't contain form-related keywords
      if (!this.containsFormKeywords(text)) return;
      
      this.$(element).find('a[href]').each((_, link) => {
        const href = this.$(link).attr('href');
        const linkText = this.$(link).text().trim();
        
        if (!href) return;
        
        const fileType = this.getFileType(href);
        if (fileType === 'online' && !this.looksLikeFormUrl(href)) return;
        
        const absoluteUrl = this.resolveUrl(href);
        if (!absoluteUrl || !this.isGovernmentUrl(absoluteUrl)) return;
        
        // Extract context around the link
        const context = this.extractContextAroundLink(this.$(link));
        
        forms.push({
          name: linkText || this.extractFilename(href),
          url: absoluteUrl,
          fileType,
          description: context ? `Context: ${context}` : 'Found in content',
          isRequired: this.isRequiredForm(this.$(link), linkText),
          category: this.categorizeForm(linkText)
        });
      });
    });
    
    return forms;
  }

  /**
   * Find forms in structured data and metadata
   */
  private findFormsInMetadata(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Look for JSON-LD structured data
    this.$('script[type="application/ld+json"]').each((_, script) => {
      try {
        const data = JSON.parse(this.$(script).html() || '');
        const structuredForms = this.extractFormsFromStructuredData(data);
        forms.push(...structuredForms);
      } catch {
        // Ignore invalid JSON
      }
    });
    
    // Look for microdata
    this.$('[itemtype*="schema.org"]').each((_, element) => {
      const microdataForms = this.extractFormsFromMicrodata(this.$(element));
      forms.push(...microdataForms);
    });
    
    // Look for data attributes
    this.$('[data-form], [data-application], [data-document]').each((_, element) => {
      const link = this.$(element).is('a') ? this.$(element) : this.$(element).find('a').first();
      const href = link.attr('href');
      
      if (!href) return;
      
      const absoluteUrl = this.resolveUrl(href);
      if (!absoluteUrl || !this.isGovernmentUrl(absoluteUrl)) return;
      
      const name = link.text().trim() || 
                  this.$(element).attr('data-form') ||
                  this.$(element).attr('data-application') ||
                  this.$(element).attr('data-document') ||
                  this.extractFilename(href);
      
      forms.push({
        name,
        url: absoluteUrl,
        fileType: this.getFileType(href),
        description: 'Found in metadata',
        isRequired: this.isRequiredForm(link, name),
        category: this.categorizeForm(name)
      });
    });
    
    return forms;
  }

  /**
   * Check if text contains form-related keywords
   */
  private containsFormKeywords(text: string): boolean {
    const keywords = [
      'form', 'application', 'apply', 'permit', 'license', 'request',
      'submit', 'file', 'download', 'pdf', 'document', 'complete',
      'fill out', 'sign up', 'register', 'enroll', 'process'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract context around a link
   */
  private extractContextAroundLink(link: cheerio.Cheerio<any>): string | undefined {
    const parent = link.parent();
    const text = parent.text().replace(link.text(), '').trim();
    
    if (text.length > 10 && text.length < 150) {
      return text.substring(0, 147) + (text.length > 147 ? '...' : '');
    }
    
    return undefined;
  }

  /**
   * Extract forms from JSON-LD structured data
   */
  private extractFormsFromStructuredData(data: any): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    if (data && typeof data === 'object') {
      // Look for GovernmentService or WebPage types
      if (data['@type'] === 'GovernmentService' || data['@type'] === 'WebPage') {
        if (data.url && this.looksLikeFormUrl(data.url)) {
          forms.push({
            name: data.name || data.title || 'Government Service',
            url: data.url,
            fileType: 'online',
            description: data.description,
            category: 'government'
          });
        }
      }
      
      // Recursively search nested objects
      Object.values(data).forEach(value => {
        if (typeof value === 'object' && value !== null) {
          forms.push(...this.extractFormsFromStructuredData(value));
        }
      });
    }
    
    return forms;
  }

  /**
   * Extract forms from microdata
   */
  private extractFormsFromMicrodata(element: cheerio.Cheerio<any>): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Look for specific microdata patterns
    const url = element.find('[itemprop="url"]').attr('href') ||
                element.attr('href');
    const name = element.find('[itemprop="name"]').text() ||
                 element.find('[itemprop="title"]').text() ||
                 element.text().trim();
    const description = element.find('[itemprop="description"]').text();
    
    if (url && this.looksLikeFormUrl(url)) {
      const absoluteUrl = this.resolveUrl(url);
      if (absoluteUrl && this.isGovernmentUrl(absoluteUrl)) {
        forms.push({
          name: name || this.extractFilename(url),
          url: absoluteUrl,
          fileType: this.getFileType(url),
          description: description || 'Found in microdata',
          category: this.categorizeForm(name)
        });
      }
    }
    
    return forms;
  }

  /**
   * Check if this form is permit-related
   */
  private isPermitRelatedForm(form: DetectedForm): boolean {
    const permitKeywords = [
      'permit', 'application', 'building', 'construction', 'electrical', 
      'plumbing', 'mechanical', 'zoning', 'demolition', 'renovation',
      'inspection', 'license', 'approval', 'review', 'plan', 'blueprint',
      'certificate', 'compliance', 'safety', 'code', 'ordinance'
    ];

    const text = `${form.name} ${form.description || ''}`.toLowerCase();
    return permitKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Determine file type from URL
   */
  private getFileType(url: string): DetectedForm['fileType'] {
    if (url.match(/\.pdf(\?|#|$)/i)) return 'pdf';
    if (url.match(/\.docx?(\?|#|$)/i)) return 'doc';
    if (url.match(/\.xlsx?(\?|#|$)/i)) return 'xls';
    return 'online';
  }

  /**
   * Check if URL looks like a form submission page - Enhanced patterns
   */
  private looksLikeFormUrl(url: string): boolean {
    const formPatterns = [
      // Basic form patterns
      /form/i, /application/i, /apply/i, /submit/i, /permit/i, /license/i,
      
      // Government-specific patterns
      /e-permit/i, /epermit/i, /online-permit/i, /web-permit/i,
      /digital-permit/i, /electronic-permit/i, /permit-portal/i,
      
      // Action-based patterns
      /request/i, /register/i, /file/i, /process/i, /complete/i,
      /start/i, /begin/i, /initiate/i, /create/i, /new/i,
      
      // Service patterns
      /service/i, /portal/i, /center/i, /hub/i, /system/i,
      /platform/i, /gateway/i, /access/i, /self-service/i,
      
      // Building/Construction specific
      /building/i, /construction/i, /renovation/i, /demolition/i,
      /inspection/i, /plan-review/i, /code-enforcement/i,
      
      // Zoning/Planning specific
      /zoning/i, /planning/i, /variance/i, /subdivision/i,
      /site-plan/i, /land-use/i, /development/i,
      
      // Trade-specific
      /electrical/i, /plumbing/i, /mechanical/i, /hvac/i,
      /fire/i, /safety/i, /health/i, /environmental/i,
      
      // Modern web patterns
      /workflow/i, /wizard/i, /step/i, /process/i, /flow/i,
      /interactive/i, /dynamic/i, /ajax/i, /api/i
    ];
    return formPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(href: string): string | null {
    try {
      return new URL(href, this.baseUrl).href;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL belongs to government domain
   */
  private isGovernmentUrl(url: string): boolean {
    try {
      const urlDomain = new URL(url).hostname;
      return urlDomain === this.domain || 
             urlDomain.endsWith('.gov') || 
             urlDomain.endsWith('.org') ||
             urlDomain.includes('city') ||
             urlDomain.includes('county');
    } catch {
      return false;
    }
  }

  /**
   * Extract description from link context
   */
  private extractDescription(link: cheerio.Cheerio<any>): string | undefined {
    // Look for description in nearby text
    const parent = link.parent();
    const text = parent.text().replace(link.text(), '').trim();
    
    if (text && text.length > 10 && text.length < 200) {
      return text;
    }

    // Look in next sibling
    const nextSibling = parent.next();
    if (nextSibling.length) {
      const nextText = nextSibling.text().trim();
      if (nextText.length > 10 && nextText.length < 200) {
        return nextText;
      }
    }

    return undefined;
  }

  /**
   * Check if form is marked as required
   */
  private isRequiredForm(element: cheerio.Cheerio<any>, text: string): boolean {
    const requiredIndicators = ['required', 'mandatory', 'must', 'necessary', '*'];
    
    // Check in text
    const lowerText = text.toLowerCase();
    if (requiredIndicators.some(indicator => lowerText.includes(indicator))) {
      return true;
    }

    // Check in parent/surrounding elements
    const context = element.closest('tr, li, div').text().toLowerCase();
    return requiredIndicators.some(indicator => context.includes(indicator));
  }

  /**
   * Categorize form based on content
   */
  private categorizeForm(text: string): string | undefined {
    if (!text) return undefined;
    
    const lower = text.toLowerCase();
    
    if (lower.includes('building') || lower.includes('construction')) return 'building';
    if (lower.includes('electrical')) return 'electrical';
    if (lower.includes('plumbing')) return 'plumbing';
    if (lower.includes('mechanical') || lower.includes('hvac')) return 'mechanical';
    if (lower.includes('zoning') || lower.includes('variance')) return 'zoning';
    if (lower.includes('demolition') || lower.includes('demo')) return 'demolition';
    if (lower.includes('sign')) return 'sign';
    if (lower.includes('inspection')) return 'inspection';
    
    return 'general';
  }

  /**
   * Extract filename from URL
   */
  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split('/').pop() || '';
      return filename.split('.')[0].replace(/[-_]/g, ' ') || 'Unknown Form';
    } catch {
      return 'Unknown Form';
    }
  }

  /**
   * Check if table headers suggest this is a forms table
   */
  private isFormsTable(headers: string[]): boolean {
    const formTableKeywords = [
      'form', 'application', 'document', 'download', 'file', 'pdf', 'link'
    ];
    
    return headers.some(header => 
      formTableKeywords.some(keyword => header.includes(keyword))
    );
  }

  /**
   * Find column index for given keywords
   */
  private findColumnIndex(headers: string[], keywords: string[]): number {
    return headers.findIndex(header => 
      keywords.some(keyword => header.includes(keyword))
    );
  }
}

/**
 * Download form file and return metadata
 */
export async function downloadForm(form: DetectedForm): Promise<{
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  size?: number;
  error?: string;
}> {
  try {
    if (form.fileType === 'online') {
      return { success: false, error: 'Online forms cannot be downloaded' };
    }

    const response = await governmentHttpClient.fetch(form.url, {
      method: 'GET',
      timeout: 30000,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return {
      success: true,
      buffer,
      contentType,
      size: buffer.length
    };

  } catch (error) {
    return {
      success: false,
      error: `Download failed: ${(error as Error).message}`
    };
  }
}

/**
 * Convert DetectedForm to PermitForm type
 */
export function convertToPermitForm(detected: DetectedForm, jurisdictionId: string): PermitForm {
  return {
    id: `${jurisdictionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: detected.name,
    url: detected.url,
    fileType: detected.fileType === 'doc' || detected.fileType === 'docx' ? 'doc' : 
             detected.fileType === 'xls' || detected.fileType === 'xlsx' ? 'doc' : 
             detected.fileType,
    isRequired: detected.isRequired || false,
    description: detected.description
  };
}