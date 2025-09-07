import * as cheerio from 'cheerio';
import { PermitFee, ContactInfo, Address } from '@/types';

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  type: 'fees' | 'requirements' | 'schedule' | 'unknown';
}

export interface ExtractedForm {
  formName: string;
  fields: FormField[];
  submitUrl?: string;
  method?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
  } | null;
}

export class ContentExtractor {
  private $: cheerio.CheerioAPI;
  private baseUrl: string;

  constructor(html: string, baseUrl: string) {
    this.$ = cheerio.load(html);
    this.baseUrl = baseUrl;
  }

  /**
   * Extract all tables from the page and classify them
   */
  extractTables(): ExtractedTable[] {
    const tables: ExtractedTable[] = [];
    
    this.$('table').each((_, element) => {
      const table = this.$(element);
      const headers: string[] = [];
      const rows: string[][] = [];
      
      // Extract headers
      table.find('thead th, thead td, tr:first-child th, tr:first-child td').each((_, cell) => {
        headers.push(this.$(cell).text().trim());
      });
      
      // Extract rows
      const dataRows = headers.length > 0 
        ? table.find('tbody tr, tr:not(:first-child)')
        : table.find('tr');
        
      dataRows.each((_, row) => {
        const cells: string[] = [];
        this.$(row).find('td, th').each((_, cell) => {
          cells.push(this.$(cell).text().trim());
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
      if (rows.length > 0) {
        tables.push({
          headers,
          rows,
          type: this.classifyTable(headers, rows)
        });
      }
    });
    
    return tables;
  }

  /**
   * Classify table based on content
   */
  private classifyTable(headers: string[], rows: string[][]): ExtractedTable['type'] {
    const headerText = headers.join(' ').toLowerCase();
    const firstRowText = rows[0]?.join(' ').toLowerCase() || '';
    const allText = (headerText + ' ' + firstRowText).toLowerCase();
    
    // Enhanced classification patterns
    if (allText.match(/fee|cost|price|amount|charge|dollar|\$|payment/)) {
      return 'fees';
    }
    if (allText.match(/requirement|document|checklist|needed|required|must|shall|attach|submit|provide/)) {
      return 'requirements';
    }
    if (allText.match(/schedule|time|day|hour|when|deadline|processing|review|turnaround|business.hours/)) {
      return 'schedule';
    }
    
    return 'unknown';
  }

  /**
   * Extract detailed permit information from various page elements
   */
  extractDetailedPermitInfo(): {
    permitTypes: string[];
    applicationProcess: string[];
    inspectionTypes: string[];
    businessHours: BusinessHours;
    onlineServices: string[];
    departments: string[];
    documentUploadInfo: string[];
  } {
    // Extract permit types from various selectors
    const permitTypes = this.extractPermitTypes();
    
    // Extract application process steps
    const applicationProcess = this.extractApplicationProcess();
    
    // Extract inspection types
    const inspectionTypes = this.extractInspectionTypes();
    
    // Extract business hours
    const businessHours = this.extractBusinessHours();
    
    // Extract online services
    const onlineServices = this.extractOnlineServices();
    
    // Extract departments
    const departments = this.extractDepartments();
    
    // Extract document upload information
    const documentUploadInfo = this.extractDocumentUploadInfo();

    return {
      permitTypes,
      applicationProcess,
      inspectionTypes,
      businessHours,
      onlineServices,
      departments,
      documentUploadInfo,
    };
  }

  private extractPermitTypes(): string[] {
    const types = new Set<string>();
    
    // Look for permit type lists, menus, or sections
    const selectors = [
      '.permit-type', '.permit-types li', '.building-permits li',
      'select[name*="permit"] option', '.permit-category',
      'h3:contains("Permit"), h4:contains("Permit")', 
      '.dropdown-menu li', 'ul.permit-list li'
    ];
    
    for (const selector of selectors) {
      this.$(selector).each((_, element) => {
        const text = this.$(element).text().trim();
        if (text && text.length > 3 && text.length < 100) {
          // Filter out obvious non-permit types
          if (!text.toLowerCase().match(/select|choose|click|more|info|contact|apply/)) {
            types.add(text);
          }
        }
      });
    }
    
    // Look for permit types in content text
    const content = this.$('body').text();
    const permitPatterns = [
      /building permit/gi,
      /electrical permit/gi,
      /plumbing permit/gi,
      /mechanical permit/gi,
      /residential permit/gi,
      /commercial permit/gi,
      /demolition permit/gi,
      /renovation permit/gi,
      /addition permit/gi,
      /fence permit/gi,
      /deck permit/gi,
      /pool permit/gi,
      /sign permit/gi,
      /zoning permit/gi,
    ];
    
    for (const pattern of permitPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => types.add(match));
      }
    }
    
    return Array.from(types);
  }

  private extractApplicationProcess(): string[] {
    const steps = new Set<string>();
    
    // Look for numbered lists, steps, or process descriptions
    const selectors = [
      '.steps li', '.process li', '.procedure li',
      'ol li', '.numbered-list li', '.application-process li',
      '.how-to li', '.instructions li'
    ];
    
    for (const selector of selectors) {
      this.$(selector).each((_, element) => {
        const text = this.$(element).text().trim();
        if (text && text.length > 10 && text.length < 500) {
          steps.add(text);
        }
      });
    }
    
    return Array.from(steps);
  }

  private extractInspectionTypes(): string[] {
    const inspections = new Set<string>();
    
    // Look for inspection-related content
    const inspectionKeywords = [
      'foundation inspection', 'framing inspection', 'electrical inspection',
      'plumbing inspection', 'mechanical inspection', 'final inspection',
      'rough inspection', 'insulation inspection', 'drywall inspection'
    ];
    
    const content = this.$('body').text().toLowerCase();
    for (const keyword of inspectionKeywords) {
      if (content.includes(keyword)) {
        inspections.add(keyword);
      }
    }
    
    // Look for inspection lists
    this.$('.inspection, .inspections li, .inspection-types li').each((_, element) => {
      const text = this.$(element).text().trim();
      if (text && text.length > 5 && text.length < 100) {
        inspections.add(text);
      }
    });
    
    return Array.from(inspections);
  }

  private extractBusinessHours(): BusinessHours {
    const hours: BusinessHours = {};
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Look for hours in various formats
    const hoursSelectors = [
      '.hours', '.business-hours', '.office-hours', 
      '.contact-hours', '.schedule', '.open-hours'
    ];
    
    for (const selector of hoursSelectors) {
      const hoursText = this.$(selector).text().toLowerCase();
      
      for (const day of daysOfWeek) {
        // Match patterns like "Monday: 8:00 AM - 5:00 PM"
        const pattern = new RegExp(`${day}[:\\s-]*([0-9]{1,2}:[0-9]{2}\\s*[ap]m?)\\s*[-to]*\\s*([0-9]{1,2}:[0-9]{2}\\s*[ap]m?)`, 'i');
        const match = hoursText.match(pattern);
        
        if (match) {
          hours[day] = {
            open: match[1],
            close: match[2]
          };
        } else if (hoursText.includes(`${day}`) && hoursText.includes('closed')) {
          hours[day] = null;
        }
      }
    }
    
    return hours;
  }

  private extractOnlineServices(): string[] {
    const services = new Set<string>();
    
    // Look for online service indicators
    const onlineKeywords = [
      'apply online', 'submit online', 'pay online', 'schedule online',
      'track application', 'permit portal', 'e-permit', 'online portal',
      'digital submission', 'electronic filing'
    ];
    
    const content = this.$('body').text().toLowerCase();
    for (const keyword of onlineKeywords) {
      if (content.includes(keyword)) {
        services.add(keyword);
      }
    }
    
    // Look for online service links or buttons
    this.$('a[href*="online"], a[href*="portal"], a[href*="apply"], button:contains("Online")').each((_, element) => {
      const text = this.$(element).text().trim();
      if (text && text.length > 3) {
        services.add(text);
      }
    });
    
    return Array.from(services);
  }

  private extractDepartments(): string[] {
    const departments = new Set<string>();
    
    // Common department patterns
    const deptPatterns = [
      /building.{0,10}department/gi,
      /planning.{0,10}department/gi,
      /development.{0,10}services/gi,
      /code.{0,10}enforcement/gi,
      /permits?.{0,10}office/gi,
      /community.{0,10}development/gi,
      /public.{0,10}works/gi
    ];
    
    const content = this.$('body').text();
    for (const pattern of deptPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => departments.add(match.trim()));
      }
    }
    
    return Array.from(departments);
  }

  private extractDocumentUploadInfo(): string[] {
    const uploadInfo = new Set<string>();
    
    // Look for document requirements or upload instructions
    const uploadKeywords = [
      'upload documents', 'attach files', 'document requirements',
      'required documents', 'supporting documents', 'file formats',
      'pdf only', 'maximum file size', 'document checklist'
    ];
    
    const content = this.$('body').text().toLowerCase();
    for (const keyword of uploadKeywords) {
      if (content.includes(keyword)) {
        // Extract the sentence containing this keyword
        const sentences = content.split(/[.!?]/);
        const relevantSentence = sentences.find(s => s.includes(keyword));
        if (relevantSentence) {
          uploadInfo.add(relevantSentence.trim());
        }
      }
    }
    
    return Array.from(uploadInfo);
  }

  /**
   * Extract fee information from tables
   */
  extractFeeSchedule(): PermitFee[] {
    const fees: PermitFee[] = [];
    const tables = this.extractTables();
    
    tables.filter(t => t.type === 'fees').forEach(table => {
      table.rows.forEach(row => {
        const fee = this.parseFeeRow(row, table.headers);
        if (fee) {
          fees.push(fee);
        }
      });
    });
    
    // Also look for fees in definition lists and other structures
    this.$('dl, .fee-schedule, .permit-fees').each((_, element) => {
      const dlFees = this.extractFeesFromDefinitionList(element);
      fees.push(...dlFees);
    });
    
    return fees;
  }

  /**
   * Parse a table row into a fee object
   */
  private parseFeeRow(row: string[], headers: string[]): PermitFee | null {
    // Find columns that likely contain fee type and amount
    const typeIndex = headers.findIndex(h => 
      h.toLowerCase().match(/type|permit|description|service/)
    );
    const amountIndex = headers.findIndex(h => 
      h.toLowerCase().match(/fee|cost|amount|price/)
    );
    
    if (typeIndex === -1 || amountIndex === -1) return null;
    
    const type = row[typeIndex];
    const amountStr = row[amountIndex];
    const amount = this.parseAmount(amountStr);
    
    if (!type || amount === null) return null;
    
    return {
      type,
      amount,
      unit: this.detectFeeUnit(amountStr),
      description: row.filter((_, i) => i !== typeIndex && i !== amountIndex).join(' '),
      conditions: []
    };
  }

  /**
   * Parse amount from string
   */
  private parseAmount(str: string): number | null {
    const match = str.match(/\$?([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Detect fee unit from amount string
   */
  private detectFeeUnit(str: string): string {
    const lower = str.toLowerCase();
    if (lower.includes('sq') || lower.includes('square')) return 'per_sqft';
    if (lower.includes('hour') || lower.includes('hr')) return 'per_hour';
    if (lower.includes('unit')) return 'per_unit';
    if (lower.includes('%') || lower.includes('percent')) return 'percentage';
    return 'flat';
  }

  /**
   * Extract fees from definition lists
   */
  private extractFeesFromDefinitionList(element: any): PermitFee[] {
    const fees: PermitFee[] = [];
    
    this.$(element).find('dt').each((_, dt) => {
      const dd = this.$(dt).next('dd');
      const type = this.$(dt).text().trim();
      const amountText = dd.text().trim();
      const amount = this.parseAmount(amountText);
      
      if (amount !== null) {
        fees.push({
          type,
          amount,
          unit: this.detectFeeUnit(amountText),
          description: amountText.replace(/\$?[\d,]+\.?\d*/, '').trim(),
          conditions: []
        });
      }
    });
    
    return fees;
  }

  /**
   * Extract contact information using patterns
   */
  extractContactInfo(): ContactInfo {
    const contact: ContactInfo = {};
    
    // Phone patterns
    const phonePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = this.$.html().match(phonePattern);
    if (phones && phones.length > 0) {
      // Filter and clean phone numbers
      const validPhones = phones
        .map(p => p.replace(/\D/g, ''))
        .filter(p => p.length >= 10)
        .map(p => {
          if (p.length === 10) return `(${p.slice(0,3)}) ${p.slice(3,6)}-${p.slice(6)}`;
          if (p.length === 11 && p[0] === '1') return `(${p.slice(1,4)}) ${p.slice(4,7)}-${p.slice(7)}`;
          return p;
        });
      
      if (validPhones.length > 0) {
        contact.phone = validPhones[0];
      }
    }
    
    // Email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = this.$.html().match(emailPattern);
    if (emails && emails.length > 0) {
      // Filter out common non-contact emails
      const validEmails = emails.filter(e => 
        !e.includes('example') && 
        !e.includes('noreply') &&
        !e.includes('donotreply')
      );
      if (validEmails.length > 0) {
        contact.email = validEmails[0];
      }
    }
    
    // Address extraction
    const address = this.extractAddress();
    if (address) {
      contact.address = address;
    }
    
    // Business hours
    const hours = this.extractBusinessHours();
    if (hours && Object.keys(hours).length > 0) {
      contact.hoursOfOperation = hours;
    }
    
    return contact;
  }

  /**
   * Extract address information
   */
  private extractAddress(): Address | undefined {
    // Look for address in common containers
    const addressSelectors = [
      'address',
      '.address',
      '.location',
      '.contact-address',
      '[itemprop="address"]'
    ];
    
    for (const selector of addressSelectors) {
      const element = this.$(selector).first();
      if (element.length > 0) {
        const text = element.text();
        const parsed = this.parseAddressText(text);
        if (parsed) return parsed;
      }
    }
    
    // Look for address pattern in text
    const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)[\s,]+[\w\s]+,?\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi;
    const matches = this.$.html().match(addressPattern);
    if (matches && matches.length > 0) {
      return this.parseAddressText(matches[0]);
    }
    
    return undefined;
  }

  /**
   * Parse address text into structured format
   */
  private parseAddressText(text: string): Address | undefined {
    const lines = text.trim().split(/[\n,]/);
    if (lines.length < 2) return undefined;
    
    // Try to parse US address format
    const stateZipPattern = /([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/;
    const lastLine = lines[lines.length - 1];
    const stateZipMatch = lastLine.match(stateZipPattern);
    
    if (stateZipMatch) {
      const cityLine = lines[lines.length - 2] || '';
      const streetLines = lines.slice(0, -2).join(' ').trim();
      
      return {
        street: streetLines || cityLine,
        city: cityLine.replace(stateZipPattern, '').trim(),
        state: stateZipMatch[1],
        zipCode: stateZipMatch[2]
      };
    }
    
    return undefined;
  }


  /**
   * Parse schedule table into business hours
   */
  private parseScheduleTable(table: ExtractedTable): BusinessHours {
    const hours: BusinessHours = {};
    const dayIndex = table.headers.findIndex(h => 
      h.toLowerCase().match(/day|weekday/)
    );
    const hoursIndex = table.headers.findIndex(h => 
      h.toLowerCase().match(/hour|time|open/)
    );
    
    if (dayIndex === -1 || hoursIndex === -1) return hours;
    
    table.rows.forEach(row => {
      const day = row[dayIndex]?.toLowerCase();
      const timeStr = row[hoursIndex];
      if (day && timeStr) {
        const times = this.parseTimeRange(timeStr);
        if (times) {
          hours[day] = times;
        }
      }
    });
    
    return hours;
  }

  /**
   * Parse hours text
   */
  private parseHoursText(text: string): BusinessHours | undefined {
    const hours: BusinessHours = {};
    const lines = text.split(/[\n;]/);
    
    lines.forEach(line => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        if (line.toLowerCase().includes(day)) {
          const times = this.parseTimeRange(line);
          if (times) {
            hours[day] = times;
          }
        }
      }
    });
    
    return Object.keys(hours).length > 0 ? hours : undefined;
  }

  /**
   * Parse time range string
   */
  private parseTimeRange(timeStr: string): { open: string; close: string } | null {
    if (!timeStr || timeStr.toLowerCase().includes('closed')) {
      return null;
    }
    
    const timePattern = /(\d{1,2}):?(\d{2})?\s*([ap]\.?m\.?)?/gi;
    const times = [];
    let match;
    
    while ((match = timePattern.exec(timeStr)) !== null) {
      const hour = parseInt(match[1]);
      const minute = match[2] || '00';
      const meridiem = match[3]?.toLowerCase().replace(/\./g, '') || '';
      
      let hour24 = hour;
      if (meridiem === 'pm' && hour !== 12) {
        hour24 += 12;
      } else if (meridiem === 'am' && hour === 12) {
        hour24 = 0;
      }
      
      times.push(`${hour24.toString().padStart(2, '0')}:${minute}`);
    }
    
    if (times.length >= 2) {
      return {
        open: times[0],
        close: times[1]
      };
    }
    
    return null;
  }

  /**
   * Extract forms and their fields
   */
  extractForms(): ExtractedForm[] {
    const forms: ExtractedForm[] = [];
    
    this.$('form').each((_, element) => {
      const form = this.$(element);
      const formName = form.attr('name') || form.attr('id') || 
                      form.find('h1, h2, h3, legend').first().text().trim() || 
                      'Unknown Form';
      
      const fields: FormField[] = [];
      
      // Extract input fields
      form.find('input, select, textarea').each((_, field) => {
        const $field = this.$(field);
        const name = $field.attr('name') || $field.attr('id') || '';
        const type = $field.attr('type') || $field.prop('tagName')?.toLowerCase() || 'text';
        
        if (type === 'hidden' || type === 'submit' || type === 'button') return;
        
        // Find associated label
        const labelFor = name || $field.attr('id');
        let label = '';
        if (labelFor) {
          label = form.find(`label[for="${labelFor}"]`).text().trim();
        }
        if (!label) {
          label = $field.closest('label').text().trim();
        }
        if (!label) {
          label = $field.attr('placeholder') || name;
        }
        
        const required = $field.attr('required') !== undefined || 
                        $field.attr('aria-required') === 'true' ||
                        label.includes('*') ||
                        label.toLowerCase().includes('required');
        
        // Get options for select fields
        let options: string[] | undefined;
        if ($field.is('select')) {
          options = [];
          $field.find('option').each((_, option) => {
            const value = this.$(option).text().trim();
            if (value) options!.push(value);
          });
        }
        
        fields.push({
          name,
          label: label.replace('*', '').trim(),
          type,
          required,
          options
        });
      });
      
      const action = form.attr('action');
      const submitUrl = action ? new URL(action, this.baseUrl).href : undefined;
      
      forms.push({
        formName,
        fields,
        submitUrl,
        method: form.attr('method') || 'GET'
      });
    });
    
    return forms;
  }

  /**
   * Extract permit requirements from lists and text
   */
  extractRequirements(): string[] {
    const requirements: Set<string> = new Set();
    
    // Look for requirement lists
    const requirementSelectors = [
      '.requirements',
      '.checklist',
      '.required-documents',
      '.permit-requirements',
      '#requirements'
    ];
    
    requirementSelectors.forEach(selector => {
      this.$(selector).find('li, p').each((_, element) => {
        const text = this.$(element).text().trim();
        if (text.length > 10 && text.length < 500) {
          requirements.add(text);
        }
      });
    });
    
    // Look for lists following requirement headers
    const requirementHeaders = [
      'required documents',
      'requirements',
      'checklist',
      'what you need',
      'necessary documents',
      'submit the following'
    ];
    
    requirementHeaders.forEach(header => {
      const headerRegex = new RegExp(header, 'i');
      this.$('h1, h2, h3, h4, h5, strong, b').each((_, element) => {
        if (headerRegex.test(this.$(element).text())) {
          const list = this.$(element).nextAll('ul, ol').first();
          list.find('li').each((_, li) => {
            const text = this.$(li).text().trim();
            if (text.length > 10 && text.length < 500) {
              requirements.add(text);
            }
          });
        }
      });
    });
    
    return Array.from(requirements);
  }

  /**
   * Extract processing times from content
   */
  extractProcessingTimes(): { [key: string]: string } {
    const processingTimes: { [key: string]: string } = {};
    
    // Pattern for time periods
    const timePattern = /(\d+[-–]\d+|\d+)\s*(business\s+)?(days?|weeks?|months?|hours?)/gi;
    
    // Look for processing time sections
    const timeSelectors = [
      '.processing-time',
      '.turnaround',
      '.review-time',
      '#processing'
    ];
    
    timeSelectors.forEach(selector => {
      this.$(selector).each((_, element) => {
        const text = this.$(element).text();
        const permitType = this.$(element).prev('h1, h2, h3, h4').text().trim() || 'General';
        const matches = text.match(timePattern);
        if (matches) {
          processingTimes[permitType] = matches[0];
        }
      });
    });
    
    // Search for time patterns near permit types
    const permitTypes = ['building', 'electrical', 'plumbing', 'mechanical', 'demolition'];
    permitTypes.forEach(type => {
      const pattern = new RegExp(`${type}[^.]*?(${timePattern.source})`, 'gi');
      const match = this.$.text().match(pattern);
      if (match) {
        const timeMatch = match[0].match(timePattern);
        if (timeMatch) {
          processingTimes[type] = timeMatch[0];
        }
      }
    });
    
    return processingTimes;
  }
}