import * as cheerio from 'cheerio';
import { governmentHttpClient } from '@/lib/network';
import { DetectedForm } from './form-detector';

export interface JavaScriptFormData {
  formElements: any[];
  apiEndpoints: string[];
  dynamicContent: any[];
  reactComponents: string[];
  vueComponents: string[];
  angularComponents: string[];
}

export interface ApplicationFlow {
  steps: ApplicationStep[];
  totalSteps: number;
  currentStep?: number;
  requirements: string[];
  estimatedTime: string;
  canSaveProgress: boolean;
}

export interface ApplicationStep {
  stepNumber: number;
  title: string;
  description: string;
  requiredFields: FormField[];
  optionalFields: FormField[];
  uploadRequirements: FileRequirement[];
  validationRules: ValidationRule[];
  nextStepConditions: string[];
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'radio' | 'checkbox' | 'file' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: ValidationRule[];
  help?: string;
  dependsOn?: string[];
}

export interface FileRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: string;
  examples: string[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  value?: any;
  pattern?: string;
}

export class EnhancedFormDetector {
  private $: cheerio.CheerioAPI;
  private baseUrl: string;
  private domain: string;
  private jsContent: string = '';

  constructor(html: string, baseUrl: string, jsContent?: string) {
    this.$ = cheerio.load(html);
    this.baseUrl = baseUrl;
    this.domain = new URL(baseUrl).hostname;
    this.jsContent = jsContent || '';
  }

  /**
   * Comprehensive form detection including JavaScript-rendered forms
   */
  async detectAllForms(): Promise<{
    staticForms: DetectedForm[];
    dynamicForms: DetectedForm[];
    applicationFlows: ApplicationFlow[];
    jsFormData: JavaScriptFormData;
  }> {
    const results = {
      staticForms: this.detectStaticForms(),
      dynamicForms: await this.detectDynamicForms(),
      applicationFlows: await this.detectApplicationFlows(),
      jsFormData: this.analyzeJavaScriptContent()
    };

    return results;
  }

  /**
   * Detect traditional HTML forms
   */
  private detectStaticForms(): DetectedForm[] {
    const forms: DetectedForm[] = [];
    const seen = new Set<string>();

    // Enhanced selectors for modern government sites
    const selectors = [
      // Traditional forms
      'form[action*="permit"], form[action*="application"], form[action*="license"]',
      'form[id*="permit"], form[id*="application"], form[id*="license"]',
      'form[class*="permit"], form[class*="application"], form[class*="license"]',
      
      // File download links with enhanced patterns
      'a[href$=".pdf"]:contains("permit"), a[href$=".pdf"]:contains("application")',
      'a[href$=".doc"]:contains("permit"), a[href$=".docx"]:contains("permit")',
      'a[href$=".xls"]:contains("permit"), a[href$=".xlsx"]:contains("permit")',
      
      // Modern download patterns
      '[data-file-type="application"], [data-download-type="form"]',
      '[data-form-id], [data-permit-type], [data-application-type]',
      
      // Button and link patterns for online applications
      'button:contains("Apply"), button:contains("Start Application")',
      'a:contains("Apply Online"), a:contains("Submit Application")',
      'a:contains("Online Permit"), a:contains("Electronic Application")',
      
      // Modern UI components
      '.form-download, .application-form, .permit-form',
      '.btn-download, .download-link, .form-link',
      '[role="button"][data-action*="download"]',
      '[role="button"][data-action*="apply"]'
    ];

    selectors.forEach(selector => {
      this.$(selector).each((_, element) => {
        const form = this.extractFormData(element);
        if (form && !seen.has(form.url)) {
          forms.push(form);
          seen.add(form.url);
        }
      });
    });

    return forms.filter(form => this.isPermitRelated(form));
  }

  /**
   * Detect JavaScript-rendered forms by analyzing dynamic content
   */
  private async detectDynamicForms(): Promise<DetectedForm[]> {
    const dynamicForms: DetectedForm[] = [];
    
    // Look for common JavaScript form frameworks
    this.detectJavaScriptFrameworks();
    
    // Check for AJAX endpoints that might serve forms
    const apiEndpoints = this.extractApiEndpoints();
    
    // Try to fetch dynamic content from known endpoints
    for (const endpoint of apiEndpoints) {
      try {
        const response = await governmentHttpClient.get(endpoint, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json, text/html',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (response.ok) {
          const dynamicContent = await response.text();
          const formsFromDynamic = this.parseJsonForForms(dynamicContent);
          dynamicForms.push(...formsFromDynamic);
        }
      } catch {
        // Silently continue - many endpoints may not be accessible
        console.debug(`Could not fetch dynamic content from ${endpoint}`);
      }
    }

    return dynamicForms;
  }

  /**
   * Detect multi-step application flows
   */
  private async detectApplicationFlows(): Promise<ApplicationFlow[]> {
    const flows: ApplicationFlow[] = [];
    
    // Look for step indicators
    const stepIndicators = this.$('[class*="step"], [id*="step"], [data-step]');
    const progressBars = this.$('.progress, .stepper, .wizard, [role="progressbar"]');
    const breadcrumbs = this.$('.breadcrumb, .steps, .wizard-steps');
    
    if (stepIndicators.length > 0 || progressBars.length > 0 || breadcrumbs.length > 0) {
      const flow = await this.buildApplicationFlow();
      if (flow.steps.length > 1) {
        flows.push(flow);
      }
    }

    // Check for common permit application patterns in text
    const pageText = this.$('body').text().toLowerCase();
    const hasMultiStepIndicators = [
      'step 1', 'step 2', 'step 3',
      'phase 1', 'phase 2', 'phase 3',
      'part 1', 'part 2', 'part 3',
      'section 1', 'section 2', 'section 3',
      'next step', 'previous step',
      'continue application', 'save and continue'
    ].some(indicator => pageText.includes(indicator));

    if (hasMultiStepIndicators && flows.length === 0) {
      // Create a basic flow based on text analysis
      const basicFlow = this.createBasicFlowFromText(pageText);
      if (basicFlow) {
        flows.push(basicFlow);
      }
    }

    return flows;
  }

  /**
   * Analyze JavaScript content for form-related patterns
   */
  private analyzeJavaScriptContent(): JavaScriptFormData {
    const jsData: JavaScriptFormData = {
      formElements: [],
      apiEndpoints: [],
      dynamicContent: [],
      reactComponents: [],
      vueComponents: [],
      angularComponents: []
    };

    if (!this.jsContent) {
      // Extract inline JavaScript
      this.$('script').each((_, element) => {
        const scriptContent = this.$(element).html() || '';
        this.jsContent += scriptContent + '\n';
      });
    }

    // Detect React components
    const reactPatterns = [
      /React\.createElement\(['"`](\w+)['"`]/g,
      /function\s+(\w+Component)/g,
      /const\s+(\w+)\s*=\s*\(\s*\)\s*=>/g,
      /class\s+(\w+)\s+extends\s+React\.Component/g
    ];
    reactPatterns.forEach(pattern => {
      const matches = this.jsContent.match(pattern);
      if (matches) {
        jsData.reactComponents.push(...matches);
      }
    });

    // Detect Vue components
    const vuePatterns = [
      /Vue\.component\(['"`](\w+)['"`]/g,
      /new Vue\(/g,
      /\$mount\(/g
    ];
    vuePatterns.forEach(pattern => {
      const matches = this.jsContent.match(pattern);
      if (matches) {
        jsData.vueComponents.push(...matches);
      }
    });

    // Detect Angular components
    const angularPatterns = [
      /@Component\s*\(/g,
      /angular\.module\(/g,
      /ng-controller=['"`](\w+)['"`]/g
    ];
    angularPatterns.forEach(pattern => {
      const matches = this.jsContent.match(pattern);
      if (matches) {
        jsData.angularComponents.push(...matches);
      }
    });

    // Extract API endpoints
    jsData.apiEndpoints = this.extractApiEndpoints();

    return jsData;
  }

  /**
   * Extract form data from an element
   */
  private extractFormData(element: any): DetectedForm | null {
    const el = this.$(element);
    const tagName = element.tagName?.toLowerCase();

    if (tagName === 'form') {
      const action = el.attr('action');
      const name = el.attr('name') || el.attr('id') || 'Application Form';
      
      return {
        name,
        url: action ? this.resolveUrl(action) : this.baseUrl,
        fileType: 'online',
        description: this.extractDescription(el),
        isRequired: this.isRequired(el),
        category: this.categorizeForm(name)
      };
    } else if (tagName === 'a') {
      const href = el.attr('href');
      if (!href) return null;

      const name = el.text().trim() || el.attr('title') || 'Download Form';
      const url = this.resolveUrl(href);
      const fileType = this.getFileType(href);

      return {
        name,
        url,
        fileType,
        description: this.extractDescription(el),
        isRequired: this.isRequired(el),
        category: this.categorizeForm(name)
      };
    } else if (tagName === 'button') {
      const onClick = el.attr('onclick') || el.attr('data-action');
      if (!onClick) return null;

      const name = el.text().trim() || 'Start Application';
      
      return {
        name,
        url: this.baseUrl, // Will need to be enhanced with actual action URL
        fileType: 'online',
        description: this.extractDescription(el),
        isRequired: this.isRequired(el),
        category: this.categorizeForm(name)
      };
    }

    return null;
  }

  /**
   * Build comprehensive application flow
   */
  private async buildApplicationFlow(): Promise<ApplicationFlow> {
    const flow: ApplicationFlow = {
      steps: [],
      totalSteps: 0,
      requirements: [],
      estimatedTime: '',
      canSaveProgress: false
    };

    // Detect total steps
    const stepIndicators = this.$('[data-step], [class*="step-"]');
    const maxStep = Math.max(
      ...stepIndicators.toArray().map(el => {
        const stepAttr = this.$(el).attr('data-step');
        const stepClass = this.$(el).attr('class');
        const stepMatch = stepClass?.match(/step-(\d+)/) || stepAttr?.match(/(\d+)/);
        return stepMatch ? parseInt(stepMatch[1], 10) : 1;
      })
    );

    flow.totalSteps = maxStep || 1;

    // Build steps
    for (let i = 1; i <= flow.totalSteps; i++) {
      const step = this.buildApplicationStep(i);
      if (step) {
        flow.steps.push(step);
      }
    }

    // Extract overall requirements
    flow.requirements = this.extractRequirements();
    
    // Estimate time
    flow.estimatedTime = this.estimateApplicationTime();
    
    // Check for save progress functionality
    flow.canSaveProgress = this.canSaveProgress();

    return flow;
  }

  /**
   * Build individual application step
   */
  private buildApplicationStep(stepNumber: number): ApplicationStep | null {
    const stepSelectors = [
      `[data-step="${stepNumber}"]`,
      `[class*="step-${stepNumber}"]`,
      `#step-${stepNumber}`,
      `#step${stepNumber}`
    ];

    let stepElement: cheerio.Cheerio<any> | null = null;
    
    for (const selector of stepSelectors) {
      const elements = this.$(selector);
      if (elements.length > 0) {
        stepElement = elements.first();
        break;
      }
    }

    if (!stepElement) return null;

    const step: ApplicationStep = {
      stepNumber,
      title: this.extractStepTitle(stepElement, stepNumber),
      description: this.extractStepDescription(stepElement),
      requiredFields: this.extractFormFields(stepElement, true),
      optionalFields: this.extractFormFields(stepElement, false),
      uploadRequirements: this.extractFileRequirements(stepElement),
      validationRules: this.extractValidationRules(stepElement),
      nextStepConditions: this.extractNextStepConditions(stepElement)
    };

    return step;
  }

  /**
   * Helper methods
   */
  
  private detectJavaScriptFrameworks(): string[] {
    const frameworks: string[] = [];
    const pageContent = this.$('html').html() || '';
    
    if (pageContent.includes('React') || pageContent.includes('react')) frameworks.push('React');
    if (pageContent.includes('Vue') || pageContent.includes('vue')) frameworks.push('Vue');
    if (pageContent.includes('Angular') || pageContent.includes('angular')) frameworks.push('Angular');
    if (pageContent.includes('jQuery') || pageContent.includes('jquery')) frameworks.push('jQuery');
    
    return frameworks;
  }

  private extractApiEndpoints(): string[] {
    const endpoints: string[] = [];
    const patterns = [
      /['"`](\/api\/[^'"`\s]+)['"`]/g,
      /['"`](\/ajax\/[^'"`\s]+)['"`]/g,
      /fetch\(['"`]([^'"`\s]+)['"`]\)/g,
      /\$\.ajax\(.*url:\s*['"`]([^'"`\s]+)['"`]/g,
      /axios\.(get|post|put|delete)\(['"`]([^'"`\s]+)['"`]\)/g
    ];

    patterns.forEach(pattern => {
      const matches = this.jsContent.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[2];
        if (url && (url.includes('permit') || url.includes('application') || url.includes('form'))) {
          endpoints.push(this.resolveUrl(url));
        }
      }
    });

    return endpoints;
  }

  private parseJsonForForms(content: string): DetectedForm[] {
    const forms: DetectedForm[] = [];
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.type === 'form' || item.formId || item.applicationId) {
            forms.push(this.convertJsonToForm(item));
          }
        });
      } else if (typeof data === 'object') {
        if (data.forms || data.applications) {
          const formData = data.forms || data.applications;
          if (Array.isArray(formData)) {
            formData.forEach(item => forms.push(this.convertJsonToForm(item)));
          }
        }
      }
    } catch {
      // Try to extract forms from HTML content
      cheerio.load(content);
      const htmlForms = this.detectStaticForms();
      forms.push(...htmlForms);
    }
    
    return forms;
  }

  private convertJsonToForm(data: any): DetectedForm {
    return {
      name: data.name || data.title || 'Application Form',
      url: data.url || data.link || this.baseUrl,
      fileType: data.type || 'online',
      description: data.description || '',
      isRequired: data.required || false,
      category: data.category || 'general'
    };
  }

  private createBasicFlowFromText(pageText: string): ApplicationFlow | null {
    // Implement basic flow detection from text analysis
    const stepMatches = pageText.match(/step\s*(\d+)/gi) || [];
    const uniqueSteps = [...new Set(stepMatches.map(match => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0], 10) : 0;
    }))].filter(num => num > 0).sort((a, b) => a - b);

    if (uniqueSteps.length < 2) return null;

    return {
      steps: uniqueSteps.map(num => ({
        stepNumber: num,
        title: `Step ${num}`,
        description: `Application step ${num}`,
        requiredFields: [],
        optionalFields: [],
        uploadRequirements: [],
        validationRules: [],
        nextStepConditions: []
      })),
      totalSteps: uniqueSteps.length,
      requirements: [],
      estimatedTime: '15-30 minutes',
      canSaveProgress: pageText.includes('save') && pageText.includes('progress')
    };
  }

  private extractStepTitle(element: cheerio.Cheerio<any>, stepNumber: number): string {
    const titleSelectors = ['h1', 'h2', 'h3', '.title', '.step-title', '[data-title]'];
    
    for (const selector of titleSelectors) {
      const title = element.find(selector).first().text().trim();
      if (title) return title;
    }
    
    return `Step ${stepNumber}`;
  }

  private extractStepDescription(element: cheerio.Cheerio<any>): string {
    const descSelectors = ['.description', '.step-description', 'p', '.help-text'];
    
    for (const selector of descSelectors) {
      const desc = element.find(selector).first().text().trim();
      if (desc && desc.length > 10) return desc;
    }
    
    return '';
  }

  private extractFormFields(element: cheerio.Cheerio<any>, required: boolean): FormField[] {
    const fields: FormField[] = [];
    const selector = required ? 'input[required], select[required], textarea[required]' : 'input:not([required]), select:not([required]), textarea:not([required])';
    
    element.find(selector).each((_, fieldElement) => {
      const field = this.$(fieldElement);
      const fieldData: FormField = {
        id: field.attr('id') || '',
        name: field.attr('name') || '',
        label: this.findLabel(field),
        type: this.getFieldType(field),
        required: field.attr('required') !== undefined,
        placeholder: field.attr('placeholder'),
        validation: this.extractFieldValidation(field)
      };
      
      fields.push(fieldData);
    });
    
    return fields;
  }

  private extractFileRequirements(element: cheerio.Cheerio<any>): FileRequirement[] {
    const requirements: FileRequirement[] = [];
    
    element.find('input[type="file"]').each((_, fileInput) => {
      const input = this.$(fileInput);
      const requirement: FileRequirement = {
        id: input.attr('id') || '',
        name: input.attr('name') || '',
        description: this.findLabel(input),
        required: input.attr('required') !== undefined,
        acceptedFormats: (input.attr('accept') || '').split(',').map(f => f.trim()),
        maxSize: input.attr('data-max-size') || '10MB',
        examples: []
      };
      
      requirements.push(requirement);
    });
    
    return requirements;
  }

  private extractValidationRules(_element: cheerio.Cheerio<any>): ValidationRule[] {
    const rules: ValidationRule[] = [];
    // Implementation for extracting validation rules from form elements
    return rules;
  }

  private extractNextStepConditions(_element: cheerio.Cheerio<any>): string[] {
    const conditions: string[] = [];
    // Implementation for extracting conditions to proceed to next step
    return conditions;
  }

  private extractRequirements(): string[] {
    const requirements: string[] = [];
    const reqSelectors = [
      '.requirements li',
      '.checklist li',
      '[class*="requirement"]',
      'ul:contains("required") li',
      'ol:contains("must") li'
    ];
    
    reqSelectors.forEach(selector => {
      this.$(selector).each((_, element) => {
        const req = this.$(element).text().trim();
        if (req && req.length > 5) {
          requirements.push(req);
        }
      });
    });
    
    return [...new Set(requirements)]; // Remove duplicates
  }

  private estimateApplicationTime(): string {
    const pageText = this.$('body').text();
    const timeMatches = pageText.match(/(\d+)\s*(minute|hour)s?/gi);
    
    if (timeMatches && timeMatches.length > 0) {
      return timeMatches[0];
    }
    
    // Default estimation based on complexity
    // Count forms for metrics
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.$('form').length;
    const inputCount = this.$('input, select, textarea').length;
    
    if (inputCount < 10) return '5-10 minutes';
    if (inputCount < 25) return '15-20 minutes';
    return '30-45 minutes';
  }

  private canSaveProgress(): boolean {
    const pageText = this.$('body').text().toLowerCase();
    return pageText.includes('save progress') || 
           pageText.includes('save and continue') ||
           pageText.includes('resume application') ||
           this.$('[data-action*="save"]').length > 0;
  }

  private findLabel(field: cheerio.Cheerio<any>): string {
    const id = field.attr('id');
    if (id) {
      const label = this.$(`label[for="${id}"]`).text().trim();
      if (label) return label;
    }
    
    const parentLabel = field.parent('label').text().trim();
    if (parentLabel) return parentLabel;
    
    const placeholder = field.attr('placeholder');
    if (placeholder) return placeholder;
    
    return field.attr('name') || '';
  }

  private getFieldType(field: cheerio.Cheerio<any>): FormField['type'] {
    const type = field.attr('type');
    const tagName = field.get(0)?.tagName?.toLowerCase();
    
    if (tagName === 'select') return 'select';
    if (tagName === 'textarea') return 'textarea';
    
    switch (type) {
      case 'email': return 'email';
      case 'tel': return 'phone';
      case 'date': return 'date';
      case 'number': return 'number';
      case 'radio': return 'radio';
      case 'checkbox': return 'checkbox';
      case 'file': return 'file';
      default: return 'text';
    }
  }

  private extractFieldValidation(field: cheerio.Cheerio<any>): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    if (field.attr('required')) {
      rules.push({ type: 'required', message: 'This field is required' });
    }
    
    const minLength = field.attr('minlength');
    if (minLength) {
      rules.push({ 
        type: 'minLength', 
        message: `Minimum length is ${minLength} characters`,
        value: parseInt(minLength, 10)
      });
    }
    
    const pattern = field.attr('pattern');
    if (pattern) {
      rules.push({
        type: 'pattern',
        message: 'Please enter a valid format',
        pattern
      });
    }
    
    return rules;
  }

  private isPermitRelated(form: DetectedForm): boolean {
    const text = (form.name + ' ' + form.description).toLowerCase();
    const permitKeywords = [
      'permit', 'license', 'application', 'building', 'construction',
      'zoning', 'planning', 'electrical', 'plumbing', 'mechanical',
      'demolition', 'renovation', 'inspection', 'approval', 'code',
      'residential', 'commercial', 'contractor', 'homeowner'
    ];
    
    return permitKeywords.some(keyword => text.includes(keyword));
  }

  private isRequired(element: cheerio.Cheerio<any>): boolean {
    const text = element.text().toLowerCase();
    return text.includes('required') || 
           text.includes('mandatory') || 
           element.attr('required') !== undefined ||
           element.hasClass('required');
  }

  private categorizeForm(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('building')) return 'building';
    if (lower.includes('electrical')) return 'electrical';
    if (lower.includes('plumbing')) return 'plumbing';
    if (lower.includes('mechanical')) return 'mechanical';
    if (lower.includes('zoning')) return 'zoning';
    if (lower.includes('demolition')) return 'demolition';
    return 'general';
  }

  private extractDescription(element: cheerio.Cheerio<any>): string {
    return element.attr('title') || 
           element.attr('aria-label') || 
           element.find('.description').text().trim() ||
           '';
  }

  private getFileType(href: string): DetectedForm['fileType'] {
    if (href.endsWith('.pdf')) return 'pdf';
    if (href.endsWith('.doc') || href.endsWith('.docx')) return 'doc';
    if (href.endsWith('.xls') || href.endsWith('.xlsx')) return 'xls';
    return 'online';
  }

  private resolveUrl(url: string): string {
    try {
      return new URL(url, this.baseUrl).href;
    } catch {
      return url;
    }
  }
}