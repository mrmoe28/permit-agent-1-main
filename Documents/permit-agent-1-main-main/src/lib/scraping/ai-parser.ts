import OpenAI from 'openai';
import { PermitType, PermitForm, PermitFee, ContactInfo } from '@/types';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not configured - AI parsing will be limited');
      return null;
    }
    try {
      openai = new OpenAI({
        apiKey
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      return null;
    }
  }
  return openai;
}

export interface ParsedGovernmentContent {
  permits: PermitType[];
  forms: PermitForm[];
  fees: PermitFee[];
  contact: ContactInfo;
  requirements: string[];
  processingTimes: { [key: string]: string };
  dataQuality: number; // 0-1 score
}

export class AIContentParser {
  
  /**
   * Parse government website content using AI to extract permit information
   */
  async parseGovernmentContent(
    html: string, 
    url: string, 
    textContent: string
  ): Promise<ParsedGovernmentContent> {
    try {
      // Clean and prepare content for AI processing
      const cleanContent = this.prepareContentForAI(textContent);
      
      // Use AI to extract structured permit information
      const aiResponse = await this.callOpenAI(cleanContent, url);
      
      // Parse and validate the AI response
      const parsed = this.parseAIResponse(aiResponse);
      
      // Calculate data quality score
      const dataQuality = this.calculateDataQuality(parsed);
      
      return {
        ...parsed,
        dataQuality
      };
      
    } catch (error) {
      console.warn('AI parsing failed, using fallback extraction:', error);
      return this.fallbackParsing(textContent);
    }
  }
  
  private prepareContentForAI(textContent: string): string {
    // Remove excessive whitespace and clean up content
    let cleaned = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    // Limit content size to avoid token limits (roughly 12,000 tokens = 48,000 chars)
    if (cleaned.length > 45000) {
      // Prioritize permit-related sections
      const sections = this.extractPermitSections(cleaned);
      cleaned = sections.join('\n\n').substring(0, 45000);
    }
    
    return cleaned;
  }
  
  private extractPermitSections(content: string): string[] {
    const permitKeywords = [
      'permit', 'license', 'application', 'form', 'fee', 'requirement',
      'building', 'zoning', 'planning', 'construction', 'electrical',
      'plumbing', 'mechanical', 'demolition', 'sign', 'business'
    ];
    
    const lines = content.split('\n');
    const sections: string[] = [];
    let currentSection = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const hasPermitKeyword = permitKeywords.some(keyword => 
        lowerLine.includes(keyword)
      );
      
      if (hasPermitKeyword || currentSection) {
        currentSection += line + '\n';
        
        // End section if we hit a new major section
        if (line.match(/^[A-Z][^.]*:$/) && currentSection.length > 100) {
          sections.push(currentSection.trim());
          currentSection = hasPermitKeyword ? line + '\n' : '';
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection.trim());
    }
    
    return sections.length > 0 ? sections : [content.substring(0, 45000)];
  }
  
  private async callOpenAI(content: string, url: string): Promise<string> {
    const openaiClient = getOpenAI();
    if (!openaiClient) {
      console.warn('OpenAI client not available, skipping AI parsing');
      throw new Error('OpenAI client not available');
    }

    const prompt = `You are an expert at extracting permit and licensing information from government websites. 

Analyze the following government website content and extract structured permit information.

Website URL: ${url}
Website Content: ${content}

Please extract and return a JSON object with the following structure:
{
  "permits": [
    {
      "name": "Permit Name",
      "category": "building|electrical|plumbing|mechanical|zoning|demolition|sign|business|other",
      "description": "What this permit is for",
      "requirements": ["requirement 1", "requirement 2", ...],
      "processingTime": "estimated processing time",
      "fees": [
        {
          "type": "Fee Type",
          "amount": 0,
          "description": "Fee description"
        }
      ]
    }
  ],
  "forms": [
    {
      "name": "Form Name", 
      "url": "direct link to form/document",
      "fileType": "pdf|doc|online",
      "isRequired": true|false,
      "description": "Form description"
    }
  ],
  "contact": {
    "phone": "phone number",
    "email": "email address", 
    "address": {
      "street": "street address",
      "city": "city",
      "state": "state", 
      "zipCode": "zip"
    },
    "hoursOfOperation": {
      "monday": {"open": "HH:MM", "close": "HH:MM"},
      "tuesday": {"open": "HH:MM", "close": "HH:MM"},
      // ... other days
    }
  },
  "requirements": ["general requirement 1", "general requirement 2", ...],
  "processingTimes": {
    "standard": "time estimate",
    "expedited": "time estimate if available"
  }
}

Focus on extracting real, specific information from the content. If information is not clearly stated, omit it rather than guessing. Extract actual fee amounts, real contact information, and specific requirements as stated on the website.

Return only the JSON object, no additional text.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction assistant. Return only valid JSON with no additional text.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });
    
    return response.choices[0]?.message?.content || '{}';
  }
  
  private parseAIResponse(aiResponse: string): Omit<ParsedGovernmentContent, 'dataQuality'> {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanResponse = aiResponse
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      return {
        permits: this.validatePermits(parsed.permits || []),
        forms: this.validateForms(parsed.forms || []),
        fees: parsed.fees || [],
        contact: this.validateContact(parsed.contact || {}),
        requirements: parsed.requirements || [],
        processingTimes: parsed.processingTimes || {}
      };
      
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
      return {
        permits: [],
        forms: [],
        fees: [],
        contact: {} as ContactInfo,
        requirements: [],
        processingTimes: {}
      };
    }
  }
  
  private validatePermits(permits: any[]): PermitType[] {
    return permits.filter(permit => 
      permit.name && typeof permit.name === 'string'
    ).map(permit => ({
      id: `permit-${Date.now()}-${Math.random()}`,
      name: permit.name,
      category: this.validateCategory(permit.category),
      description: permit.description || '',
      jurisdictionId: '',
      requirements: Array.isArray(permit.requirements) ? permit.requirements : [],
      processingTime: permit.processingTime || 'Contact office for details',
      fees: this.validateFees(permit.fees || []),
      forms: [],
      lastUpdated: new Date()
    }));
  }
  
  private validateForms(forms: any[]): PermitForm[] {
    return forms.filter(form => 
      form.name && form.url && typeof form.name === 'string' && typeof form.url === 'string'
    ).map(form => ({
      id: `form-${Date.now()}-${Math.random()}`,
      name: form.name,
      url: form.url,
      fileType: this.validateFileType(form.fileType),
      isRequired: Boolean(form.isRequired),
      description: form.description || ''
    }));
  }
  
  private validateFees(fees: any[]): PermitFee[] {
    return fees.filter(fee => 
      fee.type && typeof fee.amount === 'number' && fee.amount >= 0
    ).map(fee => ({
      type: fee.type,
      amount: fee.amount,
      unit: fee.unit || 'flat fee',
      description: fee.description || '',
      conditions: fee.conditions || []
    }));
  }
  
  private validateContact(contact: any): ContactInfo {
    return {
      phone: contact.phone || undefined,
      email: contact.email || undefined,
      address: contact.address || undefined,
      hoursOfOperation: contact.hoursOfOperation || undefined
    };
  }
  
  private validateCategory(category: string): any {
    const validCategories = [
      'building', 'electrical', 'plumbing', 'mechanical', 
      'zoning', 'demolition', 'sign', 'business', 'other'
    ];
    return validCategories.includes(category) ? category : 'other';
  }
  
  private validateFileType(fileType: string): 'pdf' | 'doc' | 'online' {
    const validTypes = ['pdf', 'doc', 'online'];
    return validTypes.includes(fileType) ? fileType as any : 'online';
  }
  
  private calculateDataQuality(parsed: Omit<ParsedGovernmentContent, 'dataQuality'>): number {
    let score = 0;
    let maxScore = 0;
    
    // Score based on data completeness and specificity
    maxScore += 30; // permits
    if (parsed.permits.length > 0) {
      score += Math.min(parsed.permits.length * 5, 30);
    }
    
    maxScore += 20; // forms  
    if (parsed.forms.length > 0) {
      score += Math.min(parsed.forms.length * 5, 20);
    }
    
    maxScore += 20; // contact
    if (parsed.contact.phone) score += 7;
    if (parsed.contact.email) score += 7; 
    if (parsed.contact.address) score += 6;
    
    maxScore += 15; // requirements
    if (parsed.requirements.length > 0) {
      score += Math.min(parsed.requirements.length * 3, 15);
    }
    
    maxScore += 15; // processing times
    if (Object.keys(parsed.processingTimes).length > 0) {
      score += Math.min(Object.keys(parsed.processingTimes).length * 7.5, 15);
    }
    
    return Math.min(score / maxScore, 1);
  }
  
  private fallbackParsing(textContent: string): ParsedGovernmentContent {
    // Basic fallback extraction without AI
    const phoneMatch = textContent.match(/\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
    const emailMatch = textContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    
    return {
      permits: [],
      forms: [],
      fees: [],
      contact: {
        phone: phoneMatch ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}` : undefined,
        email: emailMatch ? emailMatch[1] : undefined
      },
      requirements: [],
      processingTimes: {},
      dataQuality: 0.1
    };
  }
}