import * as cheerio from 'cheerio';
import { governmentHttpClient } from '@/lib/network';

export interface FormField {
  id?: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  pattern?: string;
  description?: string;
  section?: string;
  category: FormFieldCategory;
}

export type FormFieldCategory = 
  | 'personal_info'
  | 'contact_info' 
  | 'property_info'
  | 'project_details'
  | 'permit_type'
  | 'documents'
  | 'fees'
  | 'other';

export interface FormAnalysis {
  url: string;
  title: string;
  fields: FormField[];
  sections: FormSection[];
  estimatedTime: string;
  hasFileUpload: boolean;
  hasPayment: boolean;
  multiStep: boolean;
  prefillable: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface FormSection {
  title: string;
  description?: string;
  fields: string[]; // Field names in this section
}

export class FormFieldDetector {
  private $: cheerio.CheerioAPI;
  private baseUrl: string;

  constructor(html: string, baseUrl: string) {
    this.$ = cheerio.load(html);
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze the form and detect all fillable fields
   */
  analyzeForm(): FormAnalysis {
    const fields = this.detectFormFields();
    const sections = this.detectFormSections(fields);
    const title = this.detectFormTitle();
    
    return {
      url: this.baseUrl,
      title,
      fields,
      sections,
      estimatedTime: this.estimateCompletionTime(fields),
      hasFileUpload: fields.some(f => f.type === 'file'),
      hasPayment: this.detectPaymentFields(),
      multiStep: this.detectMultiStep(),
      prefillable: this.assessPrefillability(fields),
      complexity: this.assessComplexity(fields)
    };
  }

  /**
   * Detect all form fields on the page
   */
  private detectFormFields(): FormField[] {
    const fields: FormField[] = [];
    const seen = new Set<string>();

    // Find all forms
    this.$('form').each((_, form) => {
      const formFields = this.extractFieldsFromForm(this.$(form));
      formFields.forEach(field => {
        const key = `${field.name}-${field.type}`;
        if (!seen.has(key)) {
          fields.push(field);
          seen.add(key);
        }
      });
    });

    // Also look for fields outside forms (common in SPAs)
    if (fields.length === 0) {
      const allFields = this.extractFieldsFromContainer(this.$('body'));
      allFields.forEach(field => {
        const key = `${field.name}-${field.type}`;
        if (!seen.has(key)) {
          fields.push(field);
          seen.add(key);
        }
      });
    }

    return fields;
  }

  /**
   * Extract fields from a form element
   */
  private extractFieldsFromForm(form: cheerio.Cheerio<any>): FormField[] {
    const fields: FormField[] = [];

    // Input fields
    form.find('input').each((_, input) => {
      const field = this.parseInputField(this.$(input));
      if (field) fields.push(field);
    });

    // Select fields
    form.find('select').each((_, select) => {
      const field = this.parseSelectField(this.$(select));
      if (field) fields.push(field);
    });

    // Textarea fields
    form.find('textarea').each((_, textarea) => {
      const field = this.parseTextareaField(this.$(textarea));
      if (field) fields.push(field);
    });

    return fields;
  }

  /**
   * Extract fields from any container (for SPA forms)
   */
  private extractFieldsFromContainer(container: cheerio.Cheerio<any>): FormField[] {
    const fields: FormField[] = [];

    container.find('input, select, textarea').each((_, element) => {
      const $element = this.$(element);
      let field: FormField | null = null;

      if (element.tagName === 'input') {
        field = this.parseInputField($element);
      } else if (element.tagName === 'select') {
        field = this.parseSelectField($element);
      } else if (element.tagName === 'textarea') {
        field = this.parseTextareaField($element);
      }

      if (field) fields.push(field);
    });

    return fields;
  }

  /**
   * Parse input field
   */
  private parseInputField(input: cheerio.Cheerio<any>): FormField | null {
    const type = input.attr('type')?.toLowerCase() || 'text';
    const name = input.attr('name') || input.attr('id') || '';
    const id = input.attr('id');

    // Skip hidden fields, buttons, and submit inputs
    if (['hidden', 'submit', 'button', 'reset'].includes(type)) {
      return null;
    }

    const label = this.findFieldLabel(input);
    const placeholder = input.attr('placeholder') || '';
    const required = input.attr('required') !== undefined || input.attr('aria-required') === 'true';
    const pattern = input.attr('pattern');

    // Handle radio and checkbox groups
    if (type === 'radio' || type === 'checkbox') {
      const options = this.getRadioCheckboxOptions(name);
      return {
        id,
        name,
        type: type as 'radio' | 'checkbox',
        label: label || name,
        placeholder,
        required,
        options,
        pattern,
        description: this.findFieldDescription(input),
        section: this.findFieldSection(input),
        category: this.categorizeField(name, label, type)
      };
    }

    return {
      id,
      name,
      type: this.normalizeInputType(type),
      label: label || placeholder || name,
      placeholder,
      required,
      pattern,
      description: this.findFieldDescription(input),
      section: this.findFieldSection(input),
      category: this.categorizeField(name, label, type)
    };
  }

  /**
   * Parse select field
   */
  private parseSelectField(select: cheerio.Cheerio<any>): FormField | null {
    const name = select.attr('name') || select.attr('id') || '';
    const id = select.attr('id');
    const label = this.findFieldLabel(select);
    const required = select.attr('required') !== undefined;

    const options: string[] = [];
    select.find('option').each((_, option) => {
      const text = this.$(option).text().trim();
      if (text && text.toLowerCase() !== 'select' && text !== '---') {
        options.push(text);
      }
    });

    return {
      id,
      name,
      type: 'select',
      label: label || name,
      required,
      options,
      description: this.findFieldDescription(select),
      section: this.findFieldSection(select),
      category: this.categorizeField(name, label, 'select')
    };
  }

  /**
   * Parse textarea field
   */
  private parseTextareaField(textarea: cheerio.Cheerio<any>): FormField | null {
    const name = textarea.attr('name') || textarea.attr('id') || '';
    const id = textarea.attr('id');
    const label = this.findFieldLabel(textarea);
    const placeholder = textarea.attr('placeholder') || '';
    const required = textarea.attr('required') !== undefined;

    return {
      id,
      name,
      type: 'textarea',
      label: label || placeholder || name,
      placeholder,
      required,
      description: this.findFieldDescription(textarea),
      section: this.findFieldSection(textarea),
      category: this.categorizeField(name, label, 'textarea')
    };
  }

  /**
   * Find label for a field
   */
  private findFieldLabel(field: cheerio.Cheerio<any>): string {
    const id = field.attr('id');
    
    // Look for explicit label
    if (id) {
      const label = this.$(`label[for="${id}"]`).text().trim();
      if (label) return label;
    }

    // Look for parent label
    const parentLabel = field.closest('label').text().trim();
    if (parentLabel) return parentLabel;

    // Look for sibling label
    const siblingLabel = field.siblings('label').first().text().trim();
    if (siblingLabel) return siblingLabel;

    // Look for nearby text
    const parent = field.parent();
    const text = parent.contents().filter((_, node) => node.nodeType === 3).text().trim();
    if (text && text.length < 50) return text;

    return '';
  }

  /**
   * Find description for a field
   */
  private findFieldDescription(field: cheerio.Cheerio<any>): string | undefined {
    // Look for aria-describedby
    const describedBy = field.attr('aria-describedby');
    if (describedBy) {
      const description = this.$(`#${describedBy}`).text().trim();
      if (description) return description;
    }

    // Look for nearby help text
    const parent = field.closest('div, fieldset');
    const helpText = parent.find('.help-text, .description, .hint, [class*="help"]').text().trim();
    if (helpText && helpText.length < 200) return helpText;

    return undefined;
  }

  /**
   * Find section for a field
   */
  private findFieldSection(field: cheerio.Cheerio<any>): string | undefined {
    const fieldset = field.closest('fieldset');
    if (fieldset.length) {
      const legend = fieldset.find('legend').text().trim();
      if (legend) return legend;
    }

    const section = field.closest('section');
    if (section.length) {
      const heading = section.find('h1, h2, h3, h4, h5, h6').first().text().trim();
      if (heading) return heading;
    }

    return undefined;
  }

  /**
   * Get options for radio/checkbox groups
   */
  private getRadioCheckboxOptions(name: string): string[] {
    const options: string[] = [];
    this.$(`input[name="${name}"]`).each((_, input) => {
      const label = this.findFieldLabel(this.$(input));
      const value = this.$(input).attr('value') || '';
      if (label || value) {
        options.push(label || value);
      }
    });
    return options;
  }

  /**
   * Normalize input type
   */
  private normalizeInputType(type: string): FormField['type'] {
    const typeMap: Record<string, FormField['type']> = {
      'text': 'text',
      'email': 'email',
      'tel': 'tel',
      'phone': 'tel',
      'number': 'number',
      'date': 'date',
      'datetime-local': 'date',
      'file': 'file',
      'checkbox': 'checkbox',
      'radio': 'radio'
    };
    
    return typeMap[type] || 'text';
  }

  /**
   * Categorize field based on name and label
   */
  private categorizeField(name: string, label: string, type: string): FormFieldCategory {
    const text = `${name} ${label}`.toLowerCase();
    
    // Personal info
    if (text.match(/\b(name|first|last|middle|suffix|title)\b/)) return 'personal_info';
    
    // Contact info
    if (text.match(/\b(email|phone|tel|address|city|state|zip|country)\b/)) return 'contact_info';
    
    // Property info
    if (text.match(/\b(property|parcel|lot|block|address|location|site)\b/)) return 'property_info';
    
    // Project details
    if (text.match(/\b(project|work|description|scope|details|construction|renovation)\b/)) return 'project_details';
    
    // Permit type
    if (text.match(/\b(permit|type|category|kind|license)\b/)) return 'permit_type';
    
    // Documents
    if (type === 'file' || text.match(/\b(document|file|upload|attach|plan|drawing)\b/)) return 'documents';
    
    // Fees
    if (text.match(/\b(fee|cost|payment|amount|price|total)\b/)) return 'fees';
    
    return 'other';
  }

  /**
   * Detect form sections
   */
  private detectFormSections(fields: FormField[]): FormSection[] {
    const sectionMap = new Map<string, string[]>();
    
    fields.forEach(field => {
      const section = field.section || 'General Information';
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section)!.push(field.name);
    });
    
    return Array.from(sectionMap.entries()).map(([title, fieldNames]) => ({
      title,
      fields: fieldNames,
      description: this.getSectionDescription(title)
    }));
  }

  /**
   * Get description for a section
   */
  private getSectionDescription(title: string): string | undefined {
    const descriptions: Record<string, string> = {
      'Personal Information': 'Your personal details and identification',
      'Contact Information': 'How we can reach you about your application',
      'Property Information': 'Details about the property where work will be performed',
      'Project Details': 'Description of the work you plan to do',
      'Documents': 'Required plans, drawings, and supporting documents',
      'Payment': 'Permit fees and payment information'
    };
    
    return descriptions[title];
  }

  /**
   * Detect form title
   */
  private detectFormTitle(): string {
    // Look for page title
    const pageTitle = this.$('title').text().trim();
    if (pageTitle && !pageTitle.toLowerCase().includes('home')) {
      return pageTitle;
    }
    
    // Look for main heading
    const h1 = this.$('h1').first().text().trim();
    if (h1) return h1;
    
    // Look for form-specific headings
    const formHeading = this.$('form').find('h1, h2, h3').first().text().trim();
    if (formHeading) return formHeading;
    
    return 'Online Application Form';
  }

  /**
   * Estimate completion time
   */
  private estimateCompletionTime(fields: FormField[]): string {
    const fieldCount = fields.length;
    const hasFileUpload = fields.some(f => f.type === 'file');
    const hasComplexFields = fields.some(f => f.type === 'textarea');
    
    let minutes = Math.max(5, Math.ceil(fieldCount * 0.5));
    
    if (hasFileUpload) minutes += 5;
    if (hasComplexFields) minutes += 3;
    
    if (minutes <= 10) return `${minutes} minutes`;
    if (minutes <= 60) return `${Math.ceil(minutes / 5) * 5} minutes`;
    return `${Math.ceil(minutes / 15) * 15} minutes`;
  }

  /**
   * Detect payment fields
   */
  private detectPaymentFields(): boolean {
    return this.$('input[type="text"], input[type="number"]').get().some(input => {
      const name = this.$(input).attr('name')?.toLowerCase() || '';
      const id = this.$(input).attr('id')?.toLowerCase() || '';
      const label = this.findFieldLabel(this.$(input)).toLowerCase();
      
      return [name, id, label].some(text => 
        text.includes('card') || text.includes('payment') || 
        text.includes('credit') || text.includes('fee') ||
        text.includes('amount') || text.includes('total')
      );
    });
  }

  /**
   * Detect multi-step forms
   */
  private detectMultiStep(): boolean {
    // Look for step indicators
    const stepIndicators = this.$('[class*="step"], [class*="wizard"], [class*="progress"]').length > 0;
    
    // Look for next/previous buttons
    const navButtons = this.$('button, input[type="button"]').get().some(button => {
      const text = this.$(button).text().toLowerCase();
      return text.includes('next') || text.includes('previous') || 
             text.includes('continue') || text.includes('back');
    });
    
    // Look for hidden form sections
    const hiddenSections = this.$('[style*="display: none"], [style*="display:none"], [hidden]').length > 2;
    
    return stepIndicators || navButtons || hiddenSections;
  }

  /**
   * Assess if form can be pre-filled
   */
  private assessPrefillability(fields: FormField[]): boolean {
    const prefillableTypes = ['text', 'email', 'tel', 'date', 'number'];
    const prefillableFields = fields.filter(f => prefillableTypes.includes(f.type)).length;
    const totalFields = fields.length;
    
    return totalFields > 0 && (prefillableFields / totalFields) > 0.3;
  }

  /**
   * Assess form complexity
   */
  private assessComplexity(fields: FormField[]): FormAnalysis['complexity'] {
    const fieldCount = fields.length;
    const requiredCount = fields.filter(f => f.required).length;
    const fileFields = fields.filter(f => f.type === 'file').length;
    const selectFields = fields.filter(f => f.type === 'select').length;
    
    let complexity = 0;
    complexity += fieldCount * 0.5;
    complexity += requiredCount * 1;
    complexity += fileFields * 3;
    complexity += selectFields * 0.5;
    
    if (complexity < 10) return 'simple';
    if (complexity < 25) return 'moderate';
    return 'complex';
  }
}

/**
 * Analyze online form at given URL
 */
export async function analyzeOnlineForm(url: string): Promise<FormAnalysis | null> {
  try {
    const response = await governmentHttpClient.fetch(url, {
      method: 'GET',
      timeout: 30000,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch form at ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const detector = new FormFieldDetector(html, url);
    return detector.analyzeForm();
    
  } catch (error) {
    console.error(`Error analyzing form at ${url}:`, error);
    return null;
  }
}