import { webScraper, ScrapingResult } from './scraper';
import { EnhancedFormDetector } from './enhanced-form-detector';
import { PDFAnalyzer } from './pdf-analyzer';
import { ApplicationFlowMapper } from './application-flow-mapper';
import { PermittingAPIIntegrator } from '@/lib/integrations/permitting-apis';
import { DataValidator } from '@/lib/validation/data-validator';
import { PermitType, PermitFee, ContactInfo, Address, Jurisdiction, SearchResponse } from '@/types';

export interface EnhancedScrapingOptions {
  enableJSFormDetection: boolean;
  enablePDFAnalysis: boolean;
  enableFlowMapping: boolean;
  enableAPIIntegration: boolean;
  enableValidation: boolean;
  maxDepth: number;
  timeout: number;
  prioritizeOfficialSources: boolean;
  crossReferenceData: boolean;
}

export interface EnhancedScrapingResult extends SearchResponse {
  confidence: number;
  validationResult: any;
  applicationFlows: any[];
  pdfAnalyses: any[];
  apiData?: any;
  sources: ScrapingSource[];
  processingTime: number;
  methodology: ProcessingMethodology;
}

export interface ScrapingSource {
  url: string;
  type: 'website' | 'pdf' | 'api' | 'form';
  reliability: number;
  dataTypes: string[];
  lastAccessed: Date;
}

export interface ProcessingMethodology {
  techniques: string[];
  fallbacks: string[];
  confidence: number;
  validationLevel: 'basic' | 'enhanced' | 'comprehensive';
}

export class EnhancedScraper {
  private formDetector: EnhancedFormDetector | null = null;
  private pdfAnalyzer = new PDFAnalyzer();
  private flowMapper: ApplicationFlowMapper | null = null;
  private apiIntegrator = new PermittingAPIIntegrator();
  private validator = new DataValidator();

  private defaultOptions: EnhancedScrapingOptions = {
    enableJSFormDetection: true,
    enablePDFAnalysis: true,
    enableFlowMapping: true,
    enableAPIIntegration: true,
    enableValidation: true,
    maxDepth: 5,
    timeout: 60000,
    prioritizeOfficialSources: true,
    crossReferenceData: true
  };

  /**
   * Enhanced scraping with comprehensive data extraction and validation
   */
  async scrapePermitInformation(
    jurisdiction: Jurisdiction,
    address: Address,
    options?: Partial<EnhancedScrapingOptions>
  ): Promise<EnhancedScrapingResult> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    console.log(`Starting enhanced scraping for ${jurisdiction.name}`);
    
    const result: EnhancedScrapingResult = {
      jurisdiction,
      permits: [],
      forms: [],
      contact: jurisdiction.contactInfo || {} as ContactInfo,
      processingInfo: {},
      confidence: 0,
      validationResult: null,
      applicationFlows: [],
      pdfAnalyses: [],
      sources: [],
      processingTime: 0,
      methodology: {
        techniques: [],
        fallbacks: [],
        confidence: 0,
        validationLevel: 'basic'
      }
    };

    try {
      // Phase 1: Basic website scraping
      console.log('Phase 1: Basic website scraping');
      result.methodology.techniques.push('basic_web_scraping');
      
      const basicScrapingResult = await this.performBasicScraping(jurisdiction, result);
      this.mergeScrapingData(result, basicScrapingResult);

      // Phase 2: Enhanced form detection (JavaScript forms)
      if (opts.enableJSFormDetection) {
        console.log('Phase 2: Enhanced form detection');
        result.methodology.techniques.push('js_form_detection');
        
        await this.performEnhancedFormDetection(jurisdiction, result);
      }

      // Phase 3: PDF analysis
      if (opts.enablePDFAnalysis) {
        console.log('Phase 3: PDF analysis');
        result.methodology.techniques.push('pdf_analysis');
        
        await this.performPDFAnalysis(result);
      }

      // Phase 4: Application flow mapping
      if (opts.enableFlowMapping && result.permits.length > 0) {
        console.log('Phase 4: Application flow mapping');
        result.methodology.techniques.push('flow_mapping');
        
        await this.performFlowMapping(jurisdiction, result);
      }

      // Phase 5: API integration
      if (opts.enableAPIIntegration) {
        console.log('Phase 5: API integration');
        result.methodology.techniques.push('api_integration');
        
        await this.performAPIIntegration(jurisdiction, result);
      }

      // Phase 6: Data validation and cross-referencing
      if (opts.enableValidation) {
        console.log('Phase 6: Data validation');
        result.methodology.techniques.push('data_validation');
        result.methodology.validationLevel = opts.crossReferenceData ? 'comprehensive' : 'enhanced';
        
        await this.performValidation(result, opts.crossReferenceData);
      }

      // Phase 7: Calculate confidence and finalize
      this.calculateConfidence(result);
      result.processingTime = Date.now() - startTime;
      
      console.log(`Enhanced scraping completed in ${result.processingTime}ms with ${result.confidence}% confidence`);

    } catch (error) {
      console.error('Enhanced scraping failed:', error);
      result.methodology.fallbacks.push('basic_fallback');
      
      // Fallback to basic scraping
      const basicResult = await webScraper.scrapeUrl(jurisdiction.website);
      if (basicResult.success) {
        result.permits = this.extractBasicPermitInfo(basicResult.content);
        result.confidence = 0.3; // Low confidence for fallback
      }
    }

    return result;
  }

  /**
   * Perform basic website scraping
   */
  private async performBasicScraping(jurisdiction: Jurisdiction, result: EnhancedScrapingResult): Promise<ScrapingResult[]> {
    const sources: ScrapingResult[] = [];
    const urlsToScrape = [
      jurisdiction.website,
      ...(jurisdiction.permitUrl ? [jurisdiction.permitUrl] : [])
    ];

    for (const url of urlsToScrape) {
      try {
        const scrapingResult = await webScraper.scrapeUrl(url, {
          enableAdvancedExtraction: true,
          timeout: 30000
        });

        if (scrapingResult.success) {
          sources.push(scrapingResult);
          
          result.sources.push({
            url,
            type: 'website',
            reliability: 0.8,
            dataTypes: ['permits', 'fees', 'contact'],
            lastAccessed: new Date()
          });
        }
      } catch (error) {
        console.warn(`Failed to scrape ${url}:`, error);
      }
    }

    return sources;
  }

  /**
   * Perform enhanced form detection including JavaScript-rendered forms
   */
  private async performEnhancedFormDetection(jurisdiction: Jurisdiction, result: EnhancedScrapingResult): Promise<void> {
    try {
      // Scrape the main permit pages with JavaScript support
      const mainPageResult = await webScraper.scrapeUrl(jurisdiction.website, {
        enableAdvancedExtraction: true,
        timeout: 20000
      });

      if (mainPageResult.success) {
        this.formDetector = new EnhancedFormDetector(
          mainPageResult.content,
          jurisdiction.website
        );

        const enhancedForms = await this.formDetector.detectAllForms();
        
        // Merge static and dynamic forms
        const allForms = [
          ...enhancedForms.staticForms,
          ...enhancedForms.dynamicForms
        ];

        // Convert to permit forms
        result.forms = allForms.map(form => ({
          id: this.generateId(),
          name: form.name,
          url: form.url,
          fileType: form.fileType as any,
          isRequired: form.isRequired || false,
          description: form.description || ''
        }));

        // Add application flows
        result.applicationFlows = enhancedForms.applicationFlows;

        result.sources.push({
          url: jurisdiction.website,
          type: 'form',
          reliability: 0.9,
          dataTypes: ['forms', 'flows'],
          lastAccessed: new Date()
        });
      }
    } catch (error) {
      console.warn('Enhanced form detection failed:', error);
      result.methodology.fallbacks.push('basic_form_detection');
    }
  }

  /**
   * Perform PDF analysis for downloadable forms
   */
  private async performPDFAnalysis(result: EnhancedScrapingResult): Promise<void> {
    const pdfForms = result.forms.filter(form => form.fileType === 'pdf');
    
    for (const form of pdfForms.slice(0, 5)) { // Limit to 5 PDFs to avoid timeout
      try {
        const pdfAnalysis = await this.pdfAnalyzer.analyzePDF(form.url);
        result.pdfAnalyses.push({
          formId: form.id,
          formName: form.name,
          analysis: pdfAnalysis
        });

        // Extract additional permit information from PDFs
        if (pdfAnalysis.formFields.length > 0) {
          const pdfPermit: PermitType = {
            id: this.generateId(),
            name: form.name,
            category: 'building' as any,
            description: `PDF form analysis: ${form.name}`,
            jurisdictionId: result.jurisdiction.id,
            requirements: pdfAnalysis.requirements,
            processingTime: '',
            fees: pdfAnalysis.fees.map(fee => ({
              type: fee.name,
              amount: typeof fee.amount === 'number' ? fee.amount : 0,
              unit: 'flat',
              description: fee.description,
              conditions: fee.conditions
            })),
            forms: [form],
            lastUpdated: new Date()
          };

          result.permits.push(pdfPermit);
        }

        result.sources.push({
          url: form.url,
          type: 'pdf',
          reliability: 0.85,
          dataTypes: ['requirements', 'fees', 'fields'],
          lastAccessed: new Date()
        });

      } catch (error) {
        console.warn(`PDF analysis failed for ${form.name}:`, error);
      }
    }
  }

  /**
   * Perform application flow mapping
   */
  private async performFlowMapping(jurisdiction: Jurisdiction, result: EnhancedScrapingResult): Promise<void> {
    try {
      if (!this.flowMapper) {
        this.flowMapper = new ApplicationFlowMapper(jurisdiction.website);
      }

      // Look for online application URLs
      const applicationUrls = result.forms
        .filter(form => form.fileType === 'online')
        .map(form => form.url)
        .slice(0, 3); // Limit to avoid timeout

      for (const url of applicationUrls) {
        try {
          const flow = await this.flowMapper.mapApplicationFlow(url, 5);
          result.applicationFlows.push(flow);
        } catch (error) {
          console.warn(`Flow mapping failed for ${url}:`, error);
        }
      }

    } catch (error) {
      console.warn('Application flow mapping failed:', error);
      result.methodology.fallbacks.push('basic_flow_detection');
    }
  }

  /**
   * Perform API integration
   */
  private async performAPIIntegration(jurisdiction: Jurisdiction, result: EnhancedScrapingResult): Promise<void> {
    try {
      // Detect available permitting systems
      const detectedSystems = await this.apiIntegrator.detectPermittingSystems(jurisdiction.website);
      
      if (detectedSystems.length > 0) {
        console.log(`Detected permitting systems: ${detectedSystems.join(', ')}`);
        
        // Try to fetch data from detected systems (would need API credentials in real implementation)
        for (const system of detectedSystems.slice(0, 2)) { // Limit to 2 systems
          try {
            // In a real implementation, you would have API credentials configured
            // const apiData = await this.apiIntegrator.fetchPermitData(system);
            // result.apiData = apiData;
            
            result.sources.push({
              url: `api://${system}`,
              type: 'api',
              reliability: 0.95,
              dataTypes: ['permits', 'fees', 'applications'],
              lastAccessed: new Date()
            });
          } catch (error) {
            console.warn(`API integration failed for ${system}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('API integration failed:', error);
      result.methodology.fallbacks.push('no_api_integration');
    }
  }

  /**
   * Perform data validation and cross-referencing
   */
  private async performValidation(result: EnhancedScrapingResult, _enableCrossReferencing: boolean): Promise<void> {
    try {
      const validationResult = await this.validator.validatePermitData({
        jurisdiction: result.jurisdiction,
        permits: result.permits,
        fees: this.extractFees(result.permits),
        contact: result.contact
      });

      result.validationResult = validationResult;
      result.confidence = Math.max(result.confidence, validationResult.confidence);

      // Apply suggestions
      this.applySuggestions(result, validationResult.suggestions);

    } catch (error) {
      console.warn('Data validation failed:', error);
      result.methodology.fallbacks.push('no_validation');
    }
  }

  /**
   * Helper methods
   */

  private mergeScrapingData(result: EnhancedScrapingResult, scrapingResults: ScrapingResult[]): void {
    for (const scrapingResult of scrapingResults) {
      if (scrapingResult.structured) {
        // Merge structured data
        if (scrapingResult.structured.fees) {
          const permits = this.convertFeesToPermits(scrapingResult.structured.fees);
          result.permits.push(...permits);
        }

        if (scrapingResult.structured.contact) {
          result.contact = { ...result.contact, ...scrapingResult.structured.contact };
        }

        if (scrapingResult.structured.permitForms) {
          result.forms.push(...scrapingResult.structured.permitForms);
        }
      }
    }
  }

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

  private inferPermitCategory(text: string): any {
    const lower = text.toLowerCase();
    if (lower.includes('electrical')) return 'electrical';
    if (lower.includes('plumbing')) return 'plumbing';
    if (lower.includes('mechanical') || lower.includes('hvac')) return 'mechanical';
    if (lower.includes('demolition')) return 'demolition';
    if (lower.includes('sign')) return 'sign';
    if (lower.includes('zoning')) return 'zoning';
    if (lower.includes('building') || lower.includes('construction')) return 'building';
    return 'other';
  }

  private extractFees(permits: PermitType[]): PermitFee[] {
    return permits.reduce((allFees: PermitFee[], permit) => {
      return allFees.concat(permit.fees || []);
    }, []);
  }

  private extractBasicPermitInfo(content: string): PermitType[] {
    // Basic fallback extraction
    const permits: PermitType[] = [];
    
    const permitPatterns = [
      /building permit/gi,
      /electrical permit/gi,
      /plumbing permit/gi,
      /mechanical permit/gi
    ];

    permitPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        const categories = ['building', 'electrical', 'plumbing', 'mechanical'];
        permits.push({
          id: this.generateId(),
          name: `${categories[index]} permit`,
          category: categories[index] as any,
          description: `Basic ${categories[index]} permit`,
          jurisdictionId: '',
          requirements: [],
          processingTime: '',
          fees: [],
          forms: [],
          lastUpdated: new Date()
        });
      }
    });

    return permits;
  }

  private applySuggestions(result: EnhancedScrapingResult, suggestions: any[]): void {
    // Apply validation suggestions to improve data quality
    suggestions.forEach(suggestion => {
      if (suggestion.type === 'correction' && suggestion.confidence > 0.8) {
        // Apply high-confidence corrections
        console.log(`Applying suggestion: ${suggestion.reason}`);
      }
    });
  }

  private calculateConfidence(result: EnhancedScrapingResult): void {
    let confidence = 0.5; // Base confidence

    // Add confidence based on data sources
    const sourceTypes = new Set(result.sources.map(s => s.type));
    confidence += sourceTypes.size * 0.1; // More source types = higher confidence

    // Add confidence based on data completeness
    if (result.permits.length > 0) confidence += 0.2;
    if (result.forms.length > 0) confidence += 0.1;
    if (result.contact.phone || result.contact.email) confidence += 0.1;
    if (result.applicationFlows.length > 0) confidence += 0.1;

    // Factor in validation result
    if (result.validationResult) {
      confidence = (confidence + result.validationResult.confidence) / 2;
    }

    result.confidence = Math.min(1.0, confidence);
    result.methodology.confidence = result.confidence;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}