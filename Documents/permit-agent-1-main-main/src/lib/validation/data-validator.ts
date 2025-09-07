import { PermitType, PermitFee, ContactInfo, Address, Jurisdiction } from '@/types';
import { webScraper } from '@/lib/scraping/scraper';
import { governmentHttpClient } from '@/lib/network';

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1 scale
  issues: ValidationIssue[];
  suggestions: ValidationSuggestion[];
  crossReferences: CrossReference[];
  lastValidated: Date;
  sources: ValidationSource[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  code: string;
  details?: any;
  suggestedFix?: string;
}

export interface ValidationSuggestion {
  type: 'correction' | 'enhancement' | 'alternative';
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  confidence: number;
  source: string;
}

export interface CrossReference {
  source: string;
  url: string;
  matchType: 'exact' | 'partial' | 'similar' | 'contradictory';
  confidence: number;
  relevantFields: string[];
  data: any;
  lastChecked: Date;
}

export interface ValidationSource {
  name: string;
  url: string;
  type: 'official' | 'api' | 'scraping' | 'database' | 'manual';
  reliability: number; // 0-1 scale
  lastAccessed: Date;
}

export interface ValidationConfig {
  enableCrossReferencing: boolean;
  maxCrossReferenceSources: number;
  acceptableConfidenceThreshold: number;
  enableRealTimeValidation: boolean;
  cacheValidationResults: boolean;
  validationTimeout: number;
}

export class DataValidator {
  private config: ValidationConfig;
  private validationCache = new Map<string, ValidationResult>();
  private crossReferenceCache = new Map<string, CrossReference[]>();

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      enableCrossReferencing: true,
      maxCrossReferenceSources: 5,
      acceptableConfidenceThreshold: 0.7,
      enableRealTimeValidation: true,
      cacheValidationResults: true,
      validationTimeout: 30000,
      ...config
    };
  }

  /**
   * Comprehensive validation of permit data
   */
  async validatePermitData(data: {
    jurisdiction?: Jurisdiction;
    permits?: PermitType[];
    fees?: PermitFee[];
    contact?: ContactInfo;
  }): Promise<ValidationResult> {
    const cacheKey = this.generateCacheKey(data);
    
    // Check cache first
    if (this.config.cacheValidationResults && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      // Return cached result if less than 1 hour old
      if (Date.now() - cached.lastValidated.getTime() < 3600000) {
        return cached;
      }
    }

    const result: ValidationResult = {
      isValid: true,
      confidence: 1.0,
      issues: [],
      suggestions: [],
      crossReferences: [],
      lastValidated: new Date(),
      sources: []
    };

    try {
      // Validate each component
      if (data.jurisdiction) {
        await this.validateJurisdiction(data.jurisdiction, result);
      }

      if (data.permits) {
        await this.validatePermits(data.permits, result);
      }

      if (data.fees) {
        await this.validateFees(data.fees, result);
      }

      if (data.contact) {
        await this.validateContact(data.contact, result);
      }

      // Perform cross-referencing if enabled
      if (this.config.enableCrossReferencing) {
        await this.performCrossReferencing(data, result);
      }

      // Calculate overall confidence and validity
      this.calculateOverallResult(result);

      // Cache the result
      if (this.config.cacheValidationResults) {
        this.validationCache.set(cacheKey, result);
      }

    } catch {
      result.issues.push({
        type: 'error',
        field: 'general',
        message: 'Validation failed: Unknown error',
        severity: 'high',
        code: 'VALIDATION_ERROR'
      });
      result.isValid = false;
      result.confidence = 0.0;
    }

    return result;
  }

  /**
   * Validate jurisdiction information
   */
  private async validateJurisdiction(jurisdiction: Jurisdiction, result: ValidationResult): Promise<void> {
    const source: ValidationSource = {
      name: 'Jurisdiction Validation',
      url: jurisdiction.website,
      type: 'scraping',
      reliability: 0.8,
      lastAccessed: new Date()
    };
    result.sources.push(source);

    // Validate website accessibility
    try {
      const response = await governmentHttpClient.head(jurisdiction.website, { 
        timeout: this.config.validationTimeout 
      });
      
      if (response.status >= 400) {
        result.issues.push({
          type: 'warning',
          field: 'jurisdiction.website',
          message: `Website returned status ${response.status}`,
          severity: 'medium',
          code: 'WEBSITE_UNAVAILABLE'
        });
      }
    } catch {
      result.issues.push({
        type: 'error',
        field: 'jurisdiction.website',
        message: 'Website is not accessible',
        severity: 'high',
        code: 'WEBSITE_DOWN',
        suggestedFix: 'Verify the website URL is correct and the site is operational'
      });
    }

    // Validate contact information
    if (jurisdiction.contactInfo) {
      if (jurisdiction.contactInfo.phone) {
        const phoneIssues = this.validatePhoneNumber(jurisdiction.contactInfo.phone);
        result.issues.push(...phoneIssues.map(issue => ({
          ...issue,
          field: 'jurisdiction.contactInfo.phone'
        })));
      }

      if (jurisdiction.contactInfo.email) {
        const emailIssues = this.validateEmail(jurisdiction.contactInfo.email);
        result.issues.push(...emailIssues.map(issue => ({
          ...issue,
          field: 'jurisdiction.contactInfo.email'
        })));
      }
    }

    // Validate permit URL if provided
    if (jurisdiction.permitUrl) {
      try {
        const scrapingResult = await webScraper.scrapeUrl(jurisdiction.permitUrl, {
          timeout: 10000,
          enableAdvancedExtraction: false
        });

        if (!scrapingResult.success) {
          result.issues.push({
            type: 'warning',
            field: 'jurisdiction.permitUrl',
            message: 'Permit URL could not be scraped successfully',
            severity: 'medium',
            code: 'PERMIT_URL_INACCESSIBLE'
          });
        } else if (scrapingResult.content.length < 500) {
          result.issues.push({
            type: 'warning',
            field: 'jurisdiction.permitUrl',
            message: 'Permit page has very little content',
            severity: 'low',
            code: 'MINIMAL_CONTENT'
          });
        }
      } catch {
        result.issues.push({
          type: 'error',
          field: 'jurisdiction.permitUrl',
          message: 'Failed to validate permit URL',
          severity: 'medium',
          code: 'PERMIT_URL_ERROR'
        });
      }
    }
  }

  /**
   * Validate permit types
   */
  private async validatePermits(permits: PermitType[], result: ValidationResult): Promise<void> {
    const source: ValidationSource = {
      name: 'Permit Validation',
      url: 'internal',
      type: 'database',
      reliability: 0.9,
      lastAccessed: new Date()
    };
    result.sources.push(source);

    if (permits.length === 0) {
      result.issues.push({
        type: 'warning',
        field: 'permits',
        message: 'No permits found',
        severity: 'medium',
        code: 'NO_PERMITS_FOUND',
        suggestedFix: 'Verify the jurisdiction has permit information available'
      });
      return;
    }

    for (let i = 0; i < permits.length; i++) {
      const permit = permits[i];
      const fieldPrefix = `permits[${i}]`;

      // Validate required fields
      if (!permit.name || permit.name.trim().length === 0) {
        result.issues.push({
          type: 'error',
          field: `${fieldPrefix}.name`,
          message: 'Permit name is required',
          severity: 'critical',
          code: 'REQUIRED_FIELD_MISSING'
        });
      }

      if (!permit.category) {
        result.issues.push({
          type: 'error',
          field: `${fieldPrefix}.category`,
          message: 'Permit category is required',
          severity: 'high',
          code: 'REQUIRED_FIELD_MISSING'
        });
      }

      // Validate permit name patterns
      if (permit.name) {
        const nameValidation = this.validatePermitName(permit.name);
        result.issues.push(...nameValidation.map(issue => ({
          ...issue,
          field: `${fieldPrefix}.name`
        })));
      }

      // Validate fees
      if (permit.fees && permit.fees.length > 0) {
        for (let j = 0; j < permit.fees.length; j++) {
          const fee = permit.fees[j];
          const feeValidation = this.validateFee(fee);
          result.issues.push(...feeValidation.map(issue => ({
            ...issue,
            field: `${fieldPrefix}.fees[${j}].${issue.field}`
          })));
        }
      }

      // Validate requirements
      if (permit.requirements && permit.requirements.length > 0) {
        for (let j = 0; j < permit.requirements.length; j++) {
          const requirement = permit.requirements[j];
          if (!requirement || requirement.trim().length < 5) {
            result.issues.push({
              type: 'warning',
              field: `${fieldPrefix}.requirements[${j}]`,
              message: 'Requirement description is too short or empty',
              severity: 'low',
              code: 'INSUFFICIENT_DESCRIPTION'
            });
          }
        }
      }

      // Check for duplicates
      const duplicatePermits = permits.filter((p, idx) => 
        idx !== i && p.name.toLowerCase() === permit.name.toLowerCase()
      );
      if (duplicatePermits.length > 0) {
        result.issues.push({
          type: 'warning',
          field: `${fieldPrefix}.name`,
          message: 'Duplicate permit name found',
          severity: 'medium',
          code: 'DUPLICATE_PERMIT',
          suggestedFix: 'Consider consolidating or distinguishing duplicate permits'
        });
      }
    }
  }

  /**
   * Validate fee information
   */
  private async validateFees(fees: PermitFee[], result: ValidationResult): Promise<void> {
    for (let i = 0; i < fees.length; i++) {
      const fee = fees[i];
      const fieldPrefix = `fees[${i}]`;
      const feeValidation = this.validateFee(fee);
      
      result.issues.push(...feeValidation.map(issue => ({
        ...issue,
        field: `${fieldPrefix}.${issue.field}`
      })));
    }
  }

  /**
   * Validate contact information
   */
  private async validateContact(contact: ContactInfo, result: ValidationResult): Promise<void> {
    if (contact.phone) {
      const phoneIssues = this.validatePhoneNumber(contact.phone);
      result.issues.push(...phoneIssues.map(issue => ({
        ...issue,
        field: 'contact.phone'
      })));
    }

    if (contact.email) {
      const emailIssues = this.validateEmail(contact.email);
      result.issues.push(...emailIssues.map(issue => ({
        ...issue,
        field: 'contact.email'
      })));
    }

    if (contact.address) {
      const addressIssues = this.validateAddress(contact.address);
      result.issues.push(...addressIssues.map(issue => ({
        ...issue,
        field: `contact.address.${issue.field}`
      })));
    }
  }

  /**
   * Perform cross-referencing with external sources
   */
  private async performCrossReferencing(data: any, result: ValidationResult): Promise<void> {
    const cacheKey = `crossref-${this.generateCacheKey(data)}`;
    
    // Check cache first
    if (this.crossReferenceCache.has(cacheKey)) {
      const cached = this.crossReferenceCache.get(cacheKey)!;
      // Use cached data if less than 4 hours old
      if (cached.length > 0 && Date.now() - cached[0].lastChecked.getTime() < 14400000) {
        result.crossReferences = cached;
        return;
      }
    }

    const crossReferences: CrossReference[] = [];

    try {
      // Cross-reference with official sources
      if (data.jurisdiction) {
        const officialRefs = await this.crossReferenceWithOfficialSources(data.jurisdiction);
        crossReferences.push(...officialRefs);
      }

      // Cross-reference fees with regional standards
      if (data.fees && data.fees.length > 0) {
        const feeRefs = await this.crossReferenceFees(data.fees, data.jurisdiction);
        crossReferences.push(...feeRefs);
      }

      // Cross-reference permit types
      if (data.permits && data.permits.length > 0) {
        const permitRefs = await this.crossReferencePermits(data.permits, data.jurisdiction);
        crossReferences.push(...permitRefs);
      }

      // Limit to max configured sources
      result.crossReferences = crossReferences
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.config.maxCrossReferenceSources);

      // Cache the results
      this.crossReferenceCache.set(cacheKey, result.crossReferences);

    } catch {
      console.warn('Cross-referencing failed');
      result.issues.push({
        type: 'warning',
        field: 'crossReference',
        message: 'Cross-referencing with external sources failed',
        severity: 'low',
        code: 'CROSS_REFERENCE_FAILED'
      });
    }
  }

  /**
   * Helper validation methods
   */

  private validateFee(fee: PermitFee): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!fee.type || fee.type.trim().length === 0) {
      issues.push({
        type: 'error',
        field: 'type',
        message: 'Fee type is required',
        severity: 'critical',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (fee.amount === undefined || fee.amount === null) {
      issues.push({
        type: 'error',
        field: 'amount',
        message: 'Fee amount is required',
        severity: 'critical',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else if (fee.amount < 0) {
      issues.push({
        type: 'error',
        field: 'amount',
        message: 'Fee amount cannot be negative',
        severity: 'high',
        code: 'INVALID_VALUE'
      });
    } else if (fee.amount > 100000) {
      issues.push({
        type: 'warning',
        field: 'amount',
        message: 'Fee amount seems unusually high',
        severity: 'medium',
        code: 'SUSPICIOUS_VALUE',
        suggestedFix: 'Verify this fee amount is correct'
      });
    }

    return issues;
  }

  private validatePhoneNumber(phone: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Remove all non-digit characters for validation
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length !== 10 && digits.length !== 11) {
      issues.push({
        type: 'error',
        field: 'phone',
        message: 'Phone number must have 10 or 11 digits',
        severity: 'high',
        code: 'INVALID_PHONE_FORMAT',
        suggestedFix: 'Use format: (XXX) XXX-XXXX or XXX-XXX-XXXX'
      });
    }

    // Check for obviously fake numbers
    const commonFakeNumbers = ['5555555555', '1234567890', '0000000000'];
    if (commonFakeNumbers.includes(digits.slice(-10))) {
      issues.push({
        type: 'warning',
        field: 'phone',
        message: 'Phone number appears to be a placeholder',
        severity: 'medium',
        code: 'SUSPICIOUS_PHONE'
      });
    }

    return issues;
  }

  private validateEmail(email: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      issues.push({
        type: 'error',
        field: 'email',
        message: 'Invalid email format',
        severity: 'high',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Check for government domain consistency
    if (!email.includes('.gov') && !email.includes('.us')) {
      issues.push({
        type: 'warning',
        field: 'email',
        message: 'Email domain is not a government domain',
        severity: 'low',
        code: 'NON_GOVERNMENT_EMAIL'
      });
    }

    return issues;
  }

  private validateAddress(address: Address): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!address.street || address.street.trim().length === 0) {
      issues.push({
        type: 'error',
        field: 'street',
        message: 'Street address is required',
        severity: 'critical',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (!address.city || address.city.trim().length === 0) {
      issues.push({
        type: 'error',
        field: 'city',
        message: 'City is required',
        severity: 'critical',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (!address.state || address.state.length !== 2) {
      issues.push({
        type: 'error',
        field: 'state',
        message: 'State must be 2-letter abbreviation',
        severity: 'high',
        code: 'INVALID_STATE_FORMAT'
      });
    }

    if (!address.zipCode || !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      issues.push({
        type: 'error',
        field: 'zipCode',
        message: 'ZIP code must be in format XXXXX or XXXXX-XXXX',
        severity: 'high',
        code: 'INVALID_ZIP_FORMAT'
      });
    }

    return issues;
  }

  private validatePermitName(name: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (name.length < 3) {
      issues.push({
        type: 'warning',
        field: 'name',
        message: 'Permit name is very short',
        severity: 'low',
        code: 'SHORT_NAME'
      });
    }

    if (name.length > 100) {
      issues.push({
        type: 'warning',
        field: 'name',
        message: 'Permit name is unusually long',
        severity: 'low',
        code: 'LONG_NAME'
      });
    }

    // Check for common typos or formatting issues
    if (name.includes('  ')) {
      issues.push({
        type: 'warning',
        field: 'name',
        message: 'Permit name contains multiple consecutive spaces',
        severity: 'low',
        code: 'FORMATTING_ISSUE',
        suggestedFix: 'Remove extra spaces'
      });
    }

    return issues;
  }

  /**
   * Cross-referencing methods
   */

  private async crossReferenceWithOfficialSources(jurisdiction: Jurisdiction): Promise<CrossReference[]> {
    const references: CrossReference[] = [];

    try {
      // Check state-level resources
      const stateLevelSources = await this.findStateLevelSources(jurisdiction);
      references.push(...stateLevelSources);

      // Check neighboring jurisdictions
      const neighboringSources = await this.findNeighboringJurisdictions(jurisdiction);
      references.push(...neighboringSources);

    } catch {
      console.warn('Official source cross-referencing failed');
    }

    return references;
  }

  private async crossReferenceFees(_fees: PermitFee[], _jurisdiction?: Jurisdiction): Promise<CrossReference[]> {
    const references: CrossReference[] = [];

    // This would implement fee comparison with regional data
    // Placeholder implementation
    references.push({
      source: 'Regional Fee Database',
      url: 'https://example.com/regional-fees',
      matchType: 'similar',
      confidence: 0.7,
      relevantFields: ['fees'],
      data: { averageRegionalFee: 150 },
      lastChecked: new Date()
    });

    return references;
  }

  private async crossReferencePermits(_permits: PermitType[], _jurisdiction?: Jurisdiction): Promise<CrossReference[]> {
    const references: CrossReference[] = [];

    // This would implement permit type comparison with standard classifications
    // Placeholder implementation
    references.push({
      source: 'Standard Permit Classifications',
      url: 'https://example.com/permit-standards',
      matchType: 'exact',
      confidence: 0.9,
      relevantFields: ['permits'],
      data: { standardCategories: ['building', 'electrical', 'plumbing'] },
      lastChecked: new Date()
    });

    return references;
  }

  private async findStateLevelSources(_jurisdiction: Jurisdiction): Promise<CrossReference[]> {
    const references: CrossReference[] = [];
    
    // Implement state-level source discovery
    // Placeholder implementation
    
    return references;
  }

  private async findNeighboringJurisdictions(_jurisdiction: Jurisdiction): Promise<CrossReference[]> {
    const references: CrossReference[] = [];
    
    // Implement neighboring jurisdiction discovery
    // Placeholder implementation
    
    return references;
  }

  /**
   * Utility methods
   */

  private calculateOverallResult(result: ValidationResult): void {
    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    const highIssues = result.issues.filter(i => i.severity === 'high');
    const mediumIssues = result.issues.filter(i => i.severity === 'medium');
    const lowIssues = result.issues.filter(i => i.severity === 'low');

    // Determine validity
    result.isValid = criticalIssues.length === 0 && highIssues.length === 0;

    // Calculate confidence
    let confidence = 1.0;
    confidence -= criticalIssues.length * 0.3;
    confidence -= highIssues.length * 0.2;
    confidence -= mediumIssues.length * 0.1;
    confidence -= lowIssues.length * 0.05;

    // Factor in cross-reference confidence
    if (result.crossReferences.length > 0) {
      const avgCrossRefConfidence = result.crossReferences.reduce((sum, ref) => sum + ref.confidence, 0) / result.crossReferences.length;
      confidence = (confidence + avgCrossRefConfidence) / 2;
    }

    result.confidence = Math.max(0, Math.min(1, confidence));
  }

  private generateCacheKey(data: any): string {
    const keyData = {
      jurisdiction: data.jurisdiction?.id || data.jurisdiction?.name,
      permitCount: data.permits?.length || 0,
      feeCount: data.fees?.length || 0,
      hasContact: !!data.contact
    };
    
    return JSON.stringify(keyData);
  }
}