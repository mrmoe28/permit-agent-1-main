import OpenAI from 'openai';
import { PermitType, PermitFee, ContactInfo, ProcessingInfo, PermitCategory, PermitForm } from '@/types';
import { ScrapingResult } from '@/lib/scraping/scraper';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not configured - AI features will be limited');
      return null;
    }
    try {
      openaiClient = new OpenAI({
        apiKey,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      return null;
    }
  }
  return openaiClient;
}

export interface ExtractedPermitData {
  permits: PermitType[];
  fees: PermitFee[];
  contact: ContactInfo;
  processing: ProcessingInfo;
  permitForms?: PermitForm[];
  permitPortalUrl?: string;
}

export class PermitDataProcessor {
  async extractPermitInfo(htmlContent: string, url: string, scrapingResult?: ScrapingResult): Promise<ExtractedPermitData> {
    try {
      console.log('AI processing permit data from:', url);
      console.log('Content length:', htmlContent.length);

      // Check if we have structured data from advanced extraction
      if (scrapingResult?.structured) {
        console.log('Using structured data from advanced extraction');
        return this.processStructuredData(scrapingResult.structured, htmlContent, url);
      }

      // If content is too short or missing, generate realistic demo data
      if (!htmlContent || htmlContent.length < 100) {
        console.log('Insufficient content, generating demo permit data');
        return this.generateDemoPermitData();
      }

      // Check if OpenAI API is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not configured, using demo data');
        return this.generateDemoPermitData();
      }

      const prompt = this.createExtractionPrompt(htmlContent, url);
      
      const openai = getOpenAIClient();
      if (!openai) {
        console.log('OpenAI client not available, using demo data');
        return this.generateDemoPermitData();
      }
      const isVercel = process.env.VERCEL === '1';
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting permit information from government websites. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: isVercel ? 2000 : 4000, // Smaller token limit on Vercel
      }, {
        timeout: isVercel ? 15000 : 30000, // Shorter timeout on Vercel
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log('No AI response, falling back to demo data');
        return this.generateDemoPermitData();
      }

      console.log('AI processing successful');
      return this.parseAIResponse(content);
    } catch (error) {
      console.error('AI processing error:', error);
      console.log('Falling back to demo permit data');
      return this.generateDemoPermitData();
    }
  }

  private createExtractionPrompt(htmlContent: string, url: string): string {
    return `
Please extract permit information from the following government website content.

Website URL: ${url}

Content to analyze:
${htmlContent.substring(0, 8000)} // Limit content for token constraints

Extract the following information and return as JSON:

{
  "permits": [
    {
      "name": "string",
      "category": "building|electrical|plumbing|mechanical|zoning|demolition|sign|other",
      "description": "string",
      "requirements": ["array of requirements"],
      "processingTime": "string (e.g., '5-10 business days')"
    }
  ],
  "fees": [
    {
      "type": "string (e.g., 'Building Permit')",
      "amount": number,
      "unit": "string (e.g., 'flat', 'per_sqft')",
      "description": "string",
      "conditions": ["array of conditions"]
    }
  ],
  "contact": {
    "phone": "string",
    "email": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    },
    "hoursOfOperation": {
      "monday": {"open": "HH:mm", "close": "HH:mm"} or null,
      "tuesday": {"open": "HH:mm", "close": "HH:mm"} or null,
      // ... other days
    }
  },
  "processing": {
    "averageTime": "string",
    "rushOptions": ["array of expedited options"],
    "inspectionSchedule": "string",
    "appealProcess": "string"
  }
}

Focus on:
- Permit types and their categories
- Fee structures and amounts
- Contact information (phone, email, address)
- Business hours
- Processing times and procedures
- Required documents or forms
- Any special requirements or conditions

If information is not found, omit the field or use null/empty array as appropriate.
Return only the JSON object, no additional text.
    `;
  }

  private parseAIResponse(content: string): ExtractedPermitData {
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and transform the data
      return {
        permits: this.validatePermits(parsed.permits || []),
        fees: this.validateFees(parsed.fees || []),
        contact: this.validateContact(parsed.contact || {}),
        processing: this.validateProcessing(parsed.processing || {}),
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private validatePermits(permits: unknown[]): PermitType[] {
    const validCategories = Object.values(PermitCategory);
    
    return permits.map(permitData => {
      const permit = permitData as Record<string, unknown>;
      const category = permit.category as string;
      return {
        id: this.generateId(),
        name: (permit.name as string) || 'Unknown Permit',
        category: validCategories.includes(category as PermitCategory) ? (category as PermitCategory) : PermitCategory.OTHER,
        description: (permit.description as string) || '',
        jurisdictionId: '', // Will be set by caller
        requirements: Array.isArray(permit.requirements) ? permit.requirements : [],
        processingTime: (permit.processingTime as string) || '',
        fees: [],
        forms: [],
        lastUpdated: new Date(),
      };
    });
  }

  private validateFees(fees: unknown[]): PermitFee[] {
    return fees.map(feeData => {
      const fee = feeData as Record<string, unknown>;
      return {
        type: (fee.type as string) || 'Unknown Fee',
        amount: typeof fee.amount === 'number' ? fee.amount : 0,
        unit: (fee.unit as string) || 'flat',
        description: (fee.description as string) || '',
        conditions: Array.isArray(fee.conditions) ? fee.conditions : [],
      };
    });
  }

  private validateContact(contact: unknown): ContactInfo {
    const contactData = contact as Record<string, unknown>;
    return {
      phone: (contactData.phone as string) || undefined,
      email: (contactData.email as string) || undefined,
      address: contactData.address ? {
        street: ((contactData.address as Record<string, unknown>).street as string) || '',
        city: ((contactData.address as Record<string, unknown>).city as string) || '',
        state: ((contactData.address as Record<string, unknown>).state as string) || '',
        zipCode: ((contactData.address as Record<string, unknown>).zipCode as string) || '',
      } : undefined,
      hoursOfOperation: contactData.hoursOfOperation || undefined,
    };
  }

  private validateProcessing(processing: unknown): ProcessingInfo {
    const processingData = processing as Record<string, unknown>;
    return {
      averageTime: (processingData.averageTime as string) || undefined,
      rushOptions: Array.isArray(processingData.rushOptions) ? processingData.rushOptions : [],
      inspectionSchedule: (processingData.inspectionSchedule as string) || undefined,
      appealProcess: (processingData.appealProcess as string) || undefined,
    };
  }

  /**
   * Process structured data from advanced extraction
   */
  private async processStructuredData(structured: NonNullable<ScrapingResult['structured']>, htmlContent: string, url: string): Promise<ExtractedPermitData> {
    // Start with extracted structured data
    let permits = this.convertFeesToPermits(structured.fees);
    let fees = structured.fees;
    let contact = structured.contact;
    let processing: ProcessingInfo = {
      averageTime: Object.values(structured.processingTimes).join(', ') || undefined,
      rushOptions: [],
      inspectionSchedule: undefined,
      appealProcess: undefined,
    };

    // If we have forms, convert them to permits with requirements
    if (structured.forms.length > 0) {
      const formPermits = this.convertFormsToPermits(structured.forms);
      permits = [...permits, ...formPermits];
    }

    // Add requirements from extracted data
    if (structured.requirements.length > 0 && permits.length > 0) {
      permits[0].requirements = structured.requirements;
    }

    // If we have very little structured data, supplement with AI processing
    const shouldUseAI = permits.length === 0 || 
                       (fees.length === 0 && structured.tables.length > 0) ||
                       !contact.phone && !contact.email;

    if (shouldUseAI && process.env.OPENAI_API_KEY) {
      console.log('Supplementing structured data with AI processing...');
      try {
        const aiResult = await this.processWithAI(htmlContent, url, structured);
        
        // Merge AI results with structured data
        if (permits.length === 0) permits = aiResult.permits;
        if (fees.length === 0) fees = aiResult.fees;
        if (!contact.phone && !contact.email) contact = { ...contact, ...aiResult.contact };
        processing = { ...processing, ...aiResult.processing };
        
      } catch (error) {
        console.warn('AI supplementation failed, using structured data only:', error);
      }
    }

    // Fallback to demo data if we still have nothing useful
    if (permits.length === 0 && fees.length === 0) {
      console.log('Structured data insufficient, falling back to demo data');
      return this.generateDemoPermitData();
    }

    return {
      permits: permits.length > 0 ? permits : this.generateBasicPermits(),
      fees,
      contact,
      processing,
      permitForms: structured.permitForms || [],
      permitPortalUrl: structured.permitPortalUrl,
    };
  }

  /**
   * Convert fee data to basic permits
   */
  private convertFeesToPermits(fees: PermitFee[]): PermitType[] {
    const permitMap = new Map<string, PermitType>();

    fees.forEach(fee => {
      const category = this.inferPermitCategory(fee.type);
      const permitName = fee.type.replace(/fee|cost|charge/gi, '').trim() || fee.type;
      
      if (!permitMap.has(permitName)) {
        permitMap.set(permitName, {
          id: this.generateId(),
          name: permitName,
          category,
          description: fee.description || `${permitName} permit`,
          jurisdictionId: '',
          requirements: [],
          processingTime: '',
          fees: [],
          forms: [],
          lastUpdated: new Date(),
        });
      }

      permitMap.get(permitName)!.fees.push(fee);
    });

    return Array.from(permitMap.values());
  }

  /**
   * Convert forms to permits
   */
  private convertFormsToPermits(forms: any[]): PermitType[] {
    return forms.map(form => ({
      id: this.generateId(),
      name: form.formName,
      category: this.inferPermitCategory(form.formName),
      description: `Application form: ${form.formName}`,
      jurisdictionId: '',
      requirements: form.fields.filter((f: any) => f.required).map((f: any) => f.label),
      processingTime: '',
      fees: [],
      forms: [],
      lastUpdated: new Date(),
    }));
  }

  /**
   * Infer permit category from text
   */
  private inferPermitCategory(text: string): PermitCategory {
    const lower = text.toLowerCase();
    if (lower.includes('electrical')) return PermitCategory.ELECTRICAL;
    if (lower.includes('plumbing')) return PermitCategory.PLUMBING;
    if (lower.includes('mechanical') || lower.includes('hvac')) return PermitCategory.MECHANICAL;
    if (lower.includes('demolition')) return PermitCategory.DEMOLITION;
    if (lower.includes('sign')) return PermitCategory.SIGN;
    if (lower.includes('zoning')) return PermitCategory.ZONING;
    if (lower.includes('building') || lower.includes('construction')) return PermitCategory.BUILDING;
    return PermitCategory.OTHER;
  }

  /**
   * Process with AI using structured context
   */
  private async processWithAI(htmlContent: string, url: string, structured: NonNullable<ScrapingResult['structured']>): Promise<ExtractedPermitData> {
    const contextualPrompt = this.createContextualPrompt(htmlContent, url, structured);
    
    const openai = getOpenAIClient();
    if (!openai) {
      throw new Error('OpenAI client not available');
    }
    const isVercel = process.env.VERCEL === '1';
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting permit information from government websites. Use the provided structured data as context and supplement it with additional information from the HTML content. Return only valid JSON."
        },
        {
          role: "user",
          content: contextualPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: isVercel ? 2000 : 4000,
    }, {
      timeout: isVercel ? 15000 : 30000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No AI response received');
    }

    return this.parseAIResponse(content);
  }

  /**
   * Create contextual prompt using structured data
   */
  private createContextualPrompt(htmlContent: string, url: string, structured: NonNullable<ScrapingResult['structured']>): string {
    return `
I have already extracted some structured data from this government website, but need you to supplement it with additional permit information.

Website URL: ${url}

EXTRACTED STRUCTURED DATA:
- Found ${structured.tables.length} tables
- Found ${structured.forms.length} forms  
- Found ${structured.fees.length} fees
- Found ${structured.requirements.length} requirements
- Contact info: ${JSON.stringify(structured.contact)}
- Processing times: ${JSON.stringify(structured.processingTimes)}

RAW HTML CONTENT (first 6000 chars):
${htmlContent.substring(0, 6000)}

Please supplement the structured data above with any additional permit information you can extract from the HTML content. Focus on:

1. Additional permit types not captured in the structured extraction
2. Missing contact information (phone, email, address, hours)
3. Processing information (average times, rush options, inspection schedules)
4. Additional fees or fee conditions not captured in tables

Return as JSON with the same format as before:
{
  "permits": [...],
  "fees": [...], 
  "contact": {...},
  "processing": {...}
}

Only include NEW information that supplements what was already extracted. Return only the JSON object.
    `;
  }

  /**
   * Generate basic permits when we have some data but no specific permits
   */
  private generateBasicPermits(): PermitType[] {
    return [{
      id: this.generateId(),
      name: 'General Permit Information Available',
      category: PermitCategory.BUILDING,
      description: 'Contact jurisdiction for specific permit types and requirements',
      jurisdictionId: '',
      requirements: ['Contact local building department'],
      processingTime: 'Contact for processing times',
      fees: [],
      forms: [],
      lastUpdated: new Date(),
    }];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateDemoPermitData(): ExtractedPermitData {
    console.log('Generating realistic demo permit data for demonstration');
    
    return {
      permits: [
        {
          id: this.generateId(),
          name: 'Residential Building Permit',
          category: PermitCategory.BUILDING,
          description: 'Required for new construction, additions, and major renovations to residential structures',
          jurisdictionId: '',
          requirements: [
            'Completed application form',
            'Site plan showing property boundaries',
            'Construction plans and specifications',
            'Structural engineer certification (if required)',
            'Proof of property ownership',
            'Environmental impact assessment (if applicable)'
          ],
          processingTime: '2-4 weeks',
          fees: [
            {
              type: 'Base permit fee',
              amount: 125.00,
              unit: 'flat',
              description: 'Initial application processing fee',
              conditions: []
            },
            {
              type: 'Square footage fee',
              amount: 0.15,
              unit: 'per_sqft',
              description: 'Additional fee based on construction area',
              conditions: ['Applies to areas over 1,000 sq ft']
            }
          ],
          forms: [],
          lastUpdated: new Date(),
        },
        {
          id: this.generateId(),
          name: 'Electrical Permit',
          category: PermitCategory.ELECTRICAL,
          description: 'Required for electrical work including new installations, upgrades, and repairs',
          jurisdictionId: '',
          requirements: [
            'Licensed electrician application',
            'Electrical plans and load calculations',
            'Equipment specifications',
            'Inspection schedule request'
          ],
          processingTime: '1-2 weeks',
          fees: [
            {
              type: 'Electrical permit fee',
              amount: 75.00,
              unit: 'flat',
              description: 'Standard electrical work permit',
              conditions: []
            }
          ],
          forms: [],
          lastUpdated: new Date(),
        },
        {
          id: this.generateId(),
          name: 'Plumbing Permit',
          category: PermitCategory.PLUMBING,
          description: 'Required for plumbing installations, modifications, and major repairs',
          jurisdictionId: '',
          requirements: [
            'Licensed plumber application',
            'Plumbing plans and specifications',
            'Fixture schedule',
            'Water pressure test documentation'
          ],
          processingTime: '1-2 weeks',
          fees: [
            {
              type: 'Plumbing permit fee',
              amount: 65.00,
              unit: 'flat',
              description: 'Standard plumbing work permit',
              conditions: []
            }
          ],
          forms: [],
          lastUpdated: new Date(),
        }
      ],
      fees: [
        {
          type: 'Plan review fee',
          amount: 50.00,
          unit: 'flat',
          description: 'Required for all permit applications requiring plan review',
          conditions: ['Refundable if permit is denied']
        },
        {
          type: 'Re-inspection fee',
          amount: 35.00,
          unit: 'per_inspection',
          description: 'Additional fee for failed inspections requiring re-inspection',
          conditions: ['Applies after first failed inspection']
        }
      ],
      contact: {
        phone: '(555) 123-4567',
        email: 'permits@cityname.gov',
        hoursOfOperation: {
          monday: { open: '08:00', close: '17:00' },
          tuesday: { open: '08:00', close: '17:00' },
          wednesday: { open: '08:00', close: '17:00' },
          thursday: { open: '08:00', close: '17:00' },
          friday: { open: '08:00', close: '16:00' },
          saturday: undefined,
          sunday: undefined,
        }
      },
      processing: {
        averageTime: '2-3 weeks for standard permits',
        rushOptions: [
          'Expedited review available for additional 50% fee',
          'Same-day permits for minor work under $1,000'
        ],
        inspectionSchedule: 'Inspections scheduled 24-48 hours in advance',
        appealProcess: 'Appeals must be filed within 30 days of permit decision'
      },
      permitForms: [
        {
          id: 'demo-building-app',
          name: 'Building Permit Application',
          url: '#demo-building-application.pdf',
          fileType: 'pdf',
          isRequired: true,
          description: 'Standard building permit application form'
        },
        {
          id: 'demo-site-plan',
          name: 'Site Plan Template',
          url: '#demo-site-plan.pdf',
          fileType: 'pdf',
          isRequired: true,
          description: 'Template for required site plan drawings'
        },
        {
          id: 'demo-electrical-app',
          name: 'Electrical Permit Application',
          url: '#demo-electrical-application.pdf',
          fileType: 'pdf',
          isRequired: false,
          description: 'Application form for electrical work permits'
        }
      ],
      permitPortalUrl: undefined
    };
  }
}

export const permitDataProcessor = new PermitDataProcessor();