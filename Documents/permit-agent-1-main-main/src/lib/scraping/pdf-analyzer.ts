import { governmentHttpClient } from '@/lib/network';
import { FormField, ApplicationStep } from './enhanced-form-detector';

export interface PDFAnalysisResult {
  extractedText: string;
  formFields: FormField[];
  requirements: string[];
  steps: ApplicationStep[];
  fees: PDFExtractedFee[];
  contacts: PDFExtractedContact[];
  metadata: PDFMetadata;
  fillableFields: FillableField[];
  checkboxes: CheckboxField[];
  signatures: SignatureField[];
}

export interface PDFExtractedFee {
  name: string;
  amount: number | string;
  description: string;
  conditions: string[];
  category: string;
}

export interface PDFExtractedContact {
  type: 'phone' | 'email' | 'address' | 'office';
  value: string;
  department?: string;
  hours?: string;
}

export interface PDFMetadata {
  title: string;
  subject: string;
  author: string;
  creator: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  fileSize: number;
  version: string;
  isInteractive: boolean;
  hasDigitalSignature: boolean;
}

export interface FillableField {
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: string;
  coordinates: { x: number; y: number; width: number; height: number };
  page: number;
}

export interface CheckboxField {
  name: string;
  label: string;
  groupName?: string;
  required: boolean;
  defaultChecked: boolean;
  page: number;
  coordinates: { x: number; y: number };
}

export interface SignatureField {
  name: string;
  required: boolean;
  type: 'digital' | 'drawn' | 'typed';
  page: number;
  coordinates: { x: number; y: number; width: number; height: number };
}

export class PDFAnalyzer {
  /**
   * Comprehensive PDF analysis for permit forms
   */
  async analyzePDF(pdfUrl: string): Promise<PDFAnalysisResult> {
    try {
      console.log(`Starting PDF analysis for: ${pdfUrl}`);
      
      // Download PDF
      const pdfBuffer = await this.downloadPDF(pdfUrl);
      
      // Extract text content
      const extractedText = await this.extractTextContent(pdfBuffer);
      
      // Analyze form structure
      const formAnalysis = await this.analyzeFormStructure(extractedText);
      
      // Extract fillable fields (if PDF has interactive forms)
      const fillableFields = await this.extractFillableFields(pdfBuffer);
      
      // Extract metadata
      const metadata = await this.extractMetadata(pdfBuffer);
      
      const result: PDFAnalysisResult = {
        extractedText,
        formFields: formAnalysis.formFields,
        requirements: formAnalysis.requirements,
        steps: formAnalysis.steps,
        fees: formAnalysis.fees,
        contacts: formAnalysis.contacts,
        metadata,
        fillableFields: fillableFields.fillable,
        checkboxes: fillableFields.checkboxes,
        signatures: fillableFields.signatures
      };
      
      console.log(`PDF analysis completed: ${result.formFields.length} fields, ${result.requirements.length} requirements`);
      return result;
      
    } catch (error) {
      console.error('PDF analysis failed:', error);
      throw new Error(`Failed to analyze PDF: ${error}`);
    }
  }

  /**
   * Download PDF content
   */
  private async downloadPDF(url: string): Promise<Buffer> {
    const response = await governmentHttpClient.get(url, {
      timeout: 30000,
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Extract text content from PDF using various methods
   */
  private async extractTextContent(pdfBuffer: Buffer): Promise<string> {
    // Since we don't have pdf-parse or similar installed, we'll simulate text extraction
    // In a real implementation, you'd use libraries like pdf-parse, pdf2pic with Tesseract OCR
    
    // Simulate text extraction for demonstration
    return this.simulateTextExtraction(pdfBuffer);
  }

  /**
   * Simulate PDF text extraction (replace with real PDF parsing library)
   */
  private simulateTextExtraction(_pdfBuffer: Buffer): string {
    // This is a placeholder - in reality you'd use pdf-parse or similar
    // For now, return sample extracted text that represents common permit form content
    return `
    BUILDING PERMIT APPLICATION
    
    APPLICANT INFORMATION
    Name: ____________________________
    Address: _________________________
    Phone: ___________________________
    Email: ___________________________
    
    PROJECT INFORMATION
    Property Address: _________________
    Parcel Number: ___________________
    Project Description: ______________
    Construction Value: $______________
    
    PERMIT TYPE
    [ ] New Construction
    [ ] Addition
    [ ] Alteration
    [ ] Demolition
    [ ] Repair
    
    REQUIRED DOCUMENTS
    • Site plan showing property boundaries
    • Construction drawings and specifications
    • Structural calculations (if required)
    • Energy compliance documentation
    • Plumbing, electrical, mechanical plans
    
    FEES
    Base Application Fee: $150.00
    Plan Review Fee: $300.00
    Building Permit Fee: Based on construction value
    
    CONTACT INFORMATION
    Building Department
    Phone: (555) 123-4567
    Email: building@city.gov
    Hours: Monday-Friday 8:00 AM - 5:00 PM
    
    SIGNATURE
    Applicant Signature: _________________ Date: _______
    
    FOR OFFICE USE ONLY
    Application Number: _______________
    Date Received: __________________
    Reviewer: _____________________
    `;
  }

  /**
   * Analyze form structure from extracted text
   */
  private async analyzeFormStructure(text: string): Promise<{
    formFields: FormField[];
    requirements: string[];
    steps: ApplicationStep[];
    fees: PDFExtractedFee[];
    contacts: PDFExtractedContact[];
  }> {
    const analysis = {
      formFields: this.extractFormFields(text),
      requirements: this.extractRequirements(text),
      steps: this.extractSteps(text),
      fees: this.extractFees(text),
      contacts: this.extractContacts(text)
    };

    return analysis;
  }

  /**
   * Extract form fields from text
   */
  private extractFormFields(text: string): FormField[] {
    const fields: FormField[] = [];
    
    // Patterns to identify form fields
    const fieldPatterns = [
      // Standard form field patterns
      /([A-Z][a-zA-Z\s]+):\s*_{3,}/g,  // Name: ___________
      /([A-Z][a-zA-Z\s]+)\s*_{3,}/g,   // Name ___________
      /\[\s*\]\s*([A-Za-z\s]+)/g,      // [ ] Option
      /([A-Z][a-zA-Z\s]+):\s*\$?_+/g,  // Amount: $______
    ];

    fieldPatterns.forEach((pattern, _patternIndex) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const label = match[1]?.trim();
        if (label && label.length > 2) {
          const field: FormField = {
            id: this.generateFieldId(label),
            name: this.generateFieldName(label),
            label,
            type: this.determineFieldType(label, match[0]),
            required: this.isFieldRequired(text, label),
            validation: []
          };
          
          fields.push(field);
        }
      }
    });

    // Remove duplicates
    const uniqueFields = fields.filter((field, index, self) => 
      index === self.findIndex(f => f.name === field.name)
    );

    return uniqueFields;
  }

  /**
   * Extract requirements from text
   */
  private extractRequirements(text: string): string[] {
    const requirements: string[] = [];
    
    // Look for requirement sections
    const requirementSections = [
      /REQUIRED DOCUMENTS?:?\s*([\s\S]*?)(?=\n[A-Z]{2,}|\n\n|$)/i,
      /REQUIREMENTS?:?\s*([\s\S]*?)(?=\n[A-Z]{2,}|\n\n|$)/i,
      /MUST SUBMIT:?\s*([\s\S]*?)(?=\n[A-Z]{2,}|\n\n|$)/i,
      /CHECKLIST:?\s*([\s\S]*?)(?=\n[A-Z]{2,}|\n\n|$)/i
    ];

    requirementSections.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const section = match[1];
        
        // Extract bullet points or numbered items
        const items = section.match(/[•\-\*]\s*([^\n]+)/g) ||
                     section.match(/\d+\.\s*([^\n]+)/g) ||
                     section.split('\n').filter(line => line.trim().length > 5);
        
        if (items) {
          items.forEach(item => {
            const cleaned = item.replace(/^[•\-\*\d\.\s]+/, '').trim();
            if (cleaned && cleaned.length > 10) {
              requirements.push(cleaned);
            }
          });
        }
      }
    });

    return [...new Set(requirements)]; // Remove duplicates
  }

  /**
   * Extract application steps
   */
  private extractSteps(text: string): ApplicationStep[] {
    const steps: ApplicationStep[] = [];
    
    // Look for step patterns
    const stepPatterns = [
      /STEP\s+(\d+):?\s*([^\n]+)/gi,
      /(\d+)\.\s*([A-Z][^\n]+)/g,
      /PHASE\s+(\d+):?\s*([^\n]+)/gi
    ];

    stepPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const stepNumber = parseInt(match[1], 10);
        const title = match[2]?.trim();
        
        if (!isNaN(stepNumber) && title) {
          const step: ApplicationStep = {
            stepNumber,
            title,
            description: title,
            requiredFields: [],
            optionalFields: [],
            uploadRequirements: [],
            validationRules: [],
            nextStepConditions: []
          };
          
          steps.push(step);
        }
      }
    });

    return steps.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Extract fee information
   */
  private extractFees(text: string): PDFExtractedFee[] {
    const fees: PDFExtractedFee[] = [];
    
    // Fee extraction patterns
    const feePatterns = [
      /([A-Z][a-zA-Z\s]+(?:Fee|Cost|Charge)):\s*\$?(\d+(?:\.\d{2})?)/gi,
      /\$(\d+(?:\.\d{2})?)\s*([A-Z][a-zA-Z\s]+(?:fee|cost|charge))/gi,
      /([A-Z][a-zA-Z\s]+)\s*\$(\d+(?:\.\d{2})?)/g
    ];

    feePatterns.forEach((pattern, patternIndex) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let name, amount;
        
        if (patternIndex === 0) {
          name = match[1].trim();
          amount = parseFloat(match[2]);
        } else if (patternIndex === 1) {
          amount = parseFloat(match[1]);
          name = match[2].trim();
        } else {
          name = match[1].trim();
          amount = parseFloat(match[2]);
        }

        if (name && !isNaN(amount)) {
          const fee: PDFExtractedFee = {
            name,
            amount,
            description: name,
            conditions: [],
            category: this.categorizeFee(name)
          };
          
          fees.push(fee);
        }
      }
    });

    return fees;
  }

  /**
   * Extract contact information
   */
  private extractContacts(text: string): PDFExtractedContact[] {
    const contacts: PDFExtractedContact[] = [];
    
    // Phone number patterns
    const phonePattern = /(?:Phone|Tel|Call):?\s*([\(\d\)\s\-\.]+)/gi;
    const phoneMatches = text.matchAll(phonePattern);
    for (const match of phoneMatches) {
      const phone = match[1].trim();
      if (phone.match(/\d/)) {
        contacts.push({
          type: 'phone',
          value: phone,
          department: this.extractDepartment(text, match.index || 0)
        });
      }
    }

    // Email patterns
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatches = text.matchAll(emailPattern);
    for (const match of emailMatches) {
      contacts.push({
        type: 'email',
        value: match[1],
        department: this.extractDepartment(text, match.index || 0)
      });
    }

    // Hours patterns
    const hoursPattern = /Hours?:?\s*([^\n]+)/gi;
    const hoursMatches = text.matchAll(hoursPattern);
    for (const match of hoursMatches) {
      contacts.push({
        type: 'office',
        value: match[1].trim(),
        department: 'Office Hours'
      });
    }

    return contacts;
  }

  /**
   * Extract fillable fields from PDF (placeholder for PDF form field extraction)
   */
  private async extractFillableFields(_pdfBuffer: Buffer): Promise<{
    fillable: FillableField[];
    checkboxes: CheckboxField[];
    signatures: SignatureField[];
  }> {
    // This would require a PDF parsing library like pdf-lib or pdf2json
    // For now, return empty arrays as placeholders
    return {
      fillable: [],
      checkboxes: [],
      signatures: []
    };
  }

  /**
   * Extract PDF metadata
   */
  private async extractMetadata(pdfBuffer: Buffer): Promise<PDFMetadata> {
    // This would require a PDF parsing library
    // For now, return placeholder metadata
    return {
      title: 'Building Permit Application',
      subject: 'Permit Application Form',
      author: 'City Building Department',
      creator: 'Government Forms System',
      creationDate: new Date().toISOString(),
      modificationDate: new Date().toISOString(),
      pageCount: 1,
      fileSize: pdfBuffer.length,
      version: '1.0',
      isInteractive: false,
      hasDigitalSignature: false
    };
  }

  /**
   * Helper methods
   */

  private generateFieldId(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  private generateFieldName(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  private determineFieldType(label: string, context: string): FormField['type'] {
    const lower = label.toLowerCase();
    
    if (context.includes('[ ]')) return 'checkbox';
    if (lower.includes('email')) return 'email';
    if (lower.includes('phone') || lower.includes('tel')) return 'phone';
    if (lower.includes('date')) return 'date';
    if (lower.includes('amount') || lower.includes('value') || lower.includes('$')) return 'number';
    if (lower.includes('description') || lower.includes('details')) return 'textarea';
    
    return 'text';
  }

  private isFieldRequired(text: string, fieldName: string): boolean {
    const fieldContext = this.getFieldContext(text, fieldName);
    const requiredIndicators = ['*', 'required', 'mandatory', 'must'];
    
    return requiredIndicators.some(indicator => 
      fieldContext.toLowerCase().includes(indicator)
    );
  }

  private getFieldContext(text: string, fieldName: string): string {
    const fieldIndex = text.toLowerCase().indexOf(fieldName.toLowerCase());
    if (fieldIndex === -1) return '';
    
    const start = Math.max(0, fieldIndex - 100);
    const end = Math.min(text.length, fieldIndex + fieldName.length + 100);
    
    return text.substring(start, end);
  }

  private categorizeFee(feeName: string): string {
    const lower = feeName.toLowerCase();
    
    if (lower.includes('application')) return 'application';
    if (lower.includes('plan') || lower.includes('review')) return 'review';
    if (lower.includes('inspection')) return 'inspection';
    if (lower.includes('permit')) return 'permit';
    if (lower.includes('processing')) return 'processing';
    
    return 'general';
  }

  private extractDepartment(text: string, position: number): string {
    // Look for department names near the contact information
    const departments = [
      'Building Department',
      'Planning Department',
      'Public Works',
      'Code Enforcement',
      'Engineering',
      'Fire Department',
      'Health Department'
    ];

    const contextStart = Math.max(0, position - 200);
    const contextEnd = Math.min(text.length, position + 200);
    const context = text.substring(contextStart, contextEnd);

    for (const dept of departments) {
      if (context.includes(dept)) {
        return dept;
      }
    }

    return 'City Office';
  }
}