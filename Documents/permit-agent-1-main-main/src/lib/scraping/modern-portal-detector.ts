import * as cheerio from 'cheerio';
import { governmentHttpClient } from '@/lib/network';
import { DetectedForm } from './form-detector';

export interface PortalConfig {
  name: string;
  basePattern: string;
  formSelectors: string[];
  loginRequired: boolean;
  apiEndpoints?: string[];
  customExtraction?: (html: string, baseUrl: string) => DetectedForm[];
}

export class ModernPortalDetector {
  private readonly portalConfigs: PortalConfig[] = [
    {
      name: 'Accela',
      basePattern: '*.accela.com',
      formSelectors: [
        '.aca-page-content a[href*=".pdf"]',
        '.attachment-download',
        '.form-download-link',
        '[data-attachment-url]'
      ],
      loginRequired: false,
      customExtraction: this.extractAccelaForms
    },
    {
      name: 'Tyler Technologies (Eden)',
      basePattern: '*.tylertech.com',
      formSelectors: [
        '.document-link',
        '.form-attachment',
        'a[href*="GetDocument"]',
        'a[href*="download"]'
      ],
      loginRequired: false
    },
    {
      name: 'CityGrows',
      basePattern: '*.citygrows.com',
      formSelectors: [
        '.workflow-form',
        '.document-download',
        'a[href*="forms"]'
      ],
      loginRequired: true
    },
    {
      name: 'ViewPoint',
      basePattern: '*.viewpermit.com',
      formSelectors: [
        '.permit-form',
        '.application-form',
        '.document-link'
      ],
      loginRequired: false
    },
    {
      name: 'ETrakit',
      basePattern: '*.etrakit.com',
      formSelectors: [
        '.form-download',
        '.attachment-link',
        'a[href*="forms"]'
      ],
      loginRequired: false
    },
    {
      name: 'Amanda (CityView)',
      basePattern: '*.amanda.com',
      formSelectors: [
        '.form-link',
        '.document-attachment',
        'a[href*="GetFile"]'
      ],
      loginRequired: false
    },
    {
      name: 'PermitTrax',
      basePattern: '*.permittrax.com',
      formSelectors: [
        '.form-download-btn',
        '.permit-form-link',
        'a[href*="download"]'
      ],
      loginRequired: false
    },
    {
      name: 'GovPilot',
      basePattern: '*.govpilot.com',
      formSelectors: [
        '.service-form',
        '.form-attachment',
        '.download-link'
      ],
      loginRequired: true
    }
  ];

  async detectPortalForms(url: string, html: string): Promise<DetectedForm[]> {
    const forms: DetectedForm[] = [];
    const $ = cheerio.load(html);
    
    // Detect portal type
    const portalType = this.detectPortalType(url, html);
    
    if (portalType) {
      console.log(`Detected ${portalType.name} portal at ${url}`);
      
      // Use custom extraction if available
      if (portalType.customExtraction) {
        const customForms = portalType.customExtraction(html, url);
        forms.push(...customForms);
      } else {
        // Use generic selector-based extraction
        for (const selector of portalType.formSelectors) {
          $(selector).each((_, element) => {
            const form = this.extractFormFromElement($, element, url);
            if (form) {
              forms.push(form);
            }
          });
        }
      }
      
      // Try to find additional forms through AJAX endpoints
      if (portalType.apiEndpoints) {
        const ajaxForms = await this.extractFromAPIEndpoints(portalType.apiEndpoints, url);
        forms.push(...ajaxForms);
      }
    }
    
    // Generic modern portal detection
    const genericForms = await this.detectGenericModernForms($, url);
    forms.push(...genericForms);
    
    // Remove duplicates
    return this.deduplicateForms(forms);
  }
  
  private detectPortalType(url: string, html: string): PortalConfig | null {
    const domain = new URL(url).hostname;
    
    // Check domain patterns
    for (const config of this.portalConfigs) {
      const pattern = config.basePattern.replace('*', '');
      if (domain.includes(pattern)) {
        return config;
      }
    }
    
    // Check HTML content for portal signatures
    const lowerHtml = html.toLowerCase();
    
    if (lowerHtml.includes('accela') || lowerHtml.includes('civic platform')) {
      return this.portalConfigs.find(c => c.name === 'Accela') || null;
    }
    
    if (lowerHtml.includes('tyler') || lowerHtml.includes('infor')) {
      return this.portalConfigs.find(c => c.name === 'Tyler Technologies (Eden)') || null;
    }
    
    if (lowerHtml.includes('citygrows')) {
      return this.portalConfigs.find(c => c.name === 'CityGrows') || null;
    }
    
    return null;
  }
  
  private extractFormFromElement($: cheerio.CheerioAPI, element: any, baseUrl: string): DetectedForm | null {
    const $element = $(element);
    const href = $element.attr('href');
    
    if (!href) return null;
    
    const absoluteUrl = this.resolveUrl(href, baseUrl);
    if (!absoluteUrl) return null;
    
    const name = $element.text().trim() || 
                 $element.attr('title') || 
                 $element.attr('data-title') ||
                 this.extractFilenameFromUrl(absoluteUrl);
    
    const fileType = this.detectFileType(absoluteUrl);
    
    return {
      name,
      url: absoluteUrl,
      fileType,
      description: this.extractDescription($element),
      isRequired: this.detectIfRequired($element),
      category: this.categorizeForm(name)
    };
  }
  
  private async detectGenericModernForms($: cheerio.CheerioAPI, baseUrl: string): Promise<DetectedForm[]> {
    const forms: DetectedForm[] = [];
    
    // Modern selectors for forms and documents
    const modernSelectors = [
      // React/Angular component patterns
      '[data-testid*="form"]',
      '[data-testid*="document"]',
      '[data-testid*="download"]',
      
      // Common CSS classes
      '.form-download',
      '.document-download',
      '.permit-form',
      '.application-form',
      '.form-attachment',
      '.doc-link',
      '.file-download',
      
      // Button patterns
      'button[onclick*="download"]',
      'button[data-url]',
      'a.btn[href*=".pdf"]',
      'a.button[href*=".doc"]',
      
      // Table-based layouts
      'table.forms-table a',
      'table.documents-table a',
      'tr.form-row a',
      
      // List patterns
      'ul.forms-list a',
      'ol.documents-list a',
      'li.form-item a',
      
      // Card-based layouts
      '.card a[href*=".pdf"]',
      '.form-card a',
      '.document-card a'
    ];
    
    for (const selector of modernSelectors) {
      $(selector).each((_, element) => {
        const form = this.extractFormFromElement($, element, baseUrl);
        if (form && this.isValidForm(form)) {
          forms.push(form);
        }
      });
    }
    
    return forms;
  }
  
  private async extractFromAPIEndpoints(apiEndpoints: string[], baseUrl: string): Promise<DetectedForm[]> {
    const forms: DetectedForm[] = [];
    
    for (const endpoint of apiEndpoints) {
      try {
        const fullUrl = new URL(endpoint, baseUrl).href;
        const response = await governmentHttpClient.get(fullUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.status === 200) {
          const data = await response.json();
          const extractedForms = this.parseAPIResponse(data, baseUrl);
          forms.push(...extractedForms);
        }
      } catch (error) {
        console.warn(`Failed to fetch from API endpoint ${endpoint}:`, error);
      }
    }
    
    return forms;
  }
  
  private parseAPIResponse(data: any, baseUrl: string): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    // Handle different API response formats
    if (Array.isArray(data)) {
      for (const item of data) {
        const form = this.parseAPIItem(item, baseUrl);
        if (form) forms.push(form);
      }
    } else if (data.documents || data.forms) {
      const items = data.documents || data.forms;
      if (Array.isArray(items)) {
        for (const item of items) {
          const form = this.parseAPIItem(item, baseUrl);
          if (form) forms.push(form);
        }
      }
    }
    
    return forms;
  }
  
  private parseAPIItem(item: any, baseUrl: string): DetectedForm | null {
    if (!item.url && !item.downloadUrl && !item.fileUrl) return null;
    
    const url = item.url || item.downloadUrl || item.fileUrl;
    const absoluteUrl = this.resolveUrl(url, baseUrl);
    
    if (!absoluteUrl) return null;
    
    return {
      name: item.name || item.title || item.filename || this.extractFilenameFromUrl(absoluteUrl),
      url: absoluteUrl,
      fileType: this.detectFileType(absoluteUrl),
      description: item.description || undefined,
      isRequired: Boolean(item.required || item.mandatory),
      category: this.categorizeForm(item.name || item.title || '')
    };
  }
  
  private extractAccelaForms(html: string, baseUrl: string): DetectedForm[] {
    const $ = cheerio.load(html);
    const forms: DetectedForm[] = [];
    
    // Accela-specific extraction logic
    $('.aca-page-content .attachment-item, .form-item, .document-item').each((_, element) => {
      const $element = $(element);
      const link = $element.find('a[href]').first();
      
      if (link.length) {
        const href = link.attr('href');
        const name = link.text().trim() || $element.find('.attachment-name, .form-title').text().trim();
        
        if (href && name) {
          const absoluteUrl = this.resolveUrl(href, baseUrl);
          if (absoluteUrl) {
            forms.push({
              name,
              url: absoluteUrl,
              fileType: this.detectFileType(absoluteUrl),
              description: $element.find('.attachment-description, .form-description').text().trim() || undefined,
              isRequired: $element.hasClass('required') || $element.find('.required').length > 0,
              category: this.categorizeForm(name)
            });
          }
        }
      }
    });
    
    return forms;
  }
  
  private resolveUrl(url: string, baseUrl: string): string | null {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return null;
    }
  }
  
  private detectFileType(url: string): 'pdf' | 'doc' | 'online' {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) return 'pdf';
    if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx') || 
        lowerUrl.includes('.xls') || lowerUrl.includes('.xlsx')) return 'doc';
    
    return 'online';
  }
  
  private extractFilenameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split('/').pop() || '';
      return filename.replace(/\.[^.]*$/, '').replace(/[-_]/g, ' ');
    } catch {
      return 'Document';
    }
  }
  
  private extractDescription($element: cheerio.Cheerio<any>): string | undefined {
    const description = $element.attr('title') || 
                       $element.attr('data-description') ||
                       $element.siblings('.description').text().trim() ||
                       $element.parent().find('.description').text().trim();
    
    return description || undefined;
  }
  
  private detectIfRequired($element: cheerio.Cheerio<any>): boolean {
    return $element.hasClass('required') ||
           $element.find('.required').length > 0 ||
           $element.attr('data-required') === 'true' ||
           $element.text().toLowerCase().includes('required');
  }
  
  private categorizeForm(name: string): string | undefined {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('building') || lowerName.includes('construction')) return 'building';
    if (lowerName.includes('electrical')) return 'electrical';
    if (lowerName.includes('plumbing')) return 'plumbing';
    if (lowerName.includes('mechanical') || lowerName.includes('hvac')) return 'mechanical';
    if (lowerName.includes('zoning') || lowerName.includes('planning')) return 'zoning';
    if (lowerName.includes('demolition') || lowerName.includes('demo')) return 'demolition';
    if (lowerName.includes('sign')) return 'sign';
    if (lowerName.includes('business') || lowerName.includes('license')) return 'business';
    
    return undefined;
  }
  
  private isValidForm(form: DetectedForm): boolean {
    return form.name.length > 0 && 
           form.url.length > 0 && 
           form.name !== 'Document' &&
           !form.url.includes('javascript:');
  }
  
  private deduplicateForms(forms: DetectedForm[]): DetectedForm[] {
    const seen = new Set<string>();
    return forms.filter(form => {
      const key = `${form.name}-${form.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}