import { governmentHttpClient } from '@/lib/network';
import { ContactInfo, Address } from '@/types';

export interface APICredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
}

export interface APIConfig {
  name: string;
  type: 'accela' | 'tyler' | 'energov' | 'cityworks' | 'amanda' | 'viewpoint' | 'generic';
  baseUrl: string;
  version: string;
  authentication: 'api_key' | 'oauth2' | 'basic' | 'token';
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  endpoints: APIEndpoints;
  dataMapping: DataMapping;
}

export interface APIEndpoints {
  permits: string;
  applications: string;
  fees: string;
  inspections: string;
  departments: string;
  jurisdictions: string;
  forms: string;
  documents: string;
  status: string;
  search: string;
}

export interface DataMapping {
  permit: FieldMapping;
  fee: FieldMapping;
  contact: FieldMapping;
  application: FieldMapping;
}

export interface FieldMapping {
  [localField: string]: string | FieldTransform;
}

export interface FieldTransform {
  apiField: string;
  transform?: (value: any) => any;
  default?: any;
}

export interface APIPermitData {
  permits: APIPermit[];
  fees: APIFee[];
  applications: APIApplication[];
  inspections: APIInspection[];
  departments: APIDepartment[];
  metadata: APIMetadata;
}

export interface APIPermit {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'suspended';
  requirements: string[];
  forms: APIForm[];
  fees: APIFee[];
  processingTime: string;
  jurisdiction: string;
  lastUpdated: string;
  validFrom?: string;
  validTo?: string;
}

export interface APIFee {
  id: string;
  name: string;
  amount: number;
  type: 'flat' | 'calculated' | 'percentage';
  category: string;
  description: string;
  conditions: string[];
  effectiveDate: string;
  expiryDate?: string;
}

export interface APIApplication {
  id: string;
  permitType: string;
  applicant: APIApplicant;
  property: APIProperty;
  status: string;
  submissionDate: string;
  reviewStatus: string;
  documents: APIDocument[];
  payments: APIPayment[];
  inspections: APIInspection[];
  conditions: string[];
}

export interface APIApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  type: 'individual' | 'business' | 'contractor';
  licenseNumber?: string;
}

export interface APIProperty {
  id: string;
  address: Address;
  parcelNumber: string;
  zoning: string;
  landUse: string;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
}

export interface APIForm {
  id: string;
  name: string;
  version: string;
  type: 'pdf' | 'online' | 'word' | 'excel';
  url: string;
  required: boolean;
  category: string;
  description: string;
  lastModified: string;
}

export interface APIDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface APIPayment {
  id: string;
  amount: number;
  method: 'credit_card' | 'check' | 'cash' | 'ach';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: string;
  transactionId: string;
}

export interface APIInspection {
  id: string;
  type: string;
  status: 'scheduled' | 'completed' | 'failed' | 'cancelled';
  scheduledDate?: string;
  completedDate?: string;
  inspector: string;
  result?: string;
  notes?: string;
}

export interface APIDepartment {
  id: string;
  name: string;
  type: string;
  contact: ContactInfo;
  services: string[];
  jurisdictions: string[];
}

export interface APIMetadata {
  totalRecords: number;
  page: number;
  pageSize: number;
  lastUpdated: string;
  version: string;
  source: string;
}

export class PermittingAPIIntegrator {
  private configs: Map<string, APIConfig> = new Map();
  private credentials: Map<string, APICredentials> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default API configurations for major permitting systems
   */
  private initializeDefaultConfigs(): void {
    // Accela Configuration
    this.configs.set('accela', {
      name: 'Accela',
      type: 'accela',
      baseUrl: 'https://apis.accela.com',
      version: 'v4',
      authentication: 'oauth2',
      rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
      endpoints: {
        permits: '/records',
        applications: '/records',
        fees: '/settings/fees',
        inspections: '/inspections',
        departments: '/departments',
        jurisdictions: '/agencies',
        forms: '/documents/types',
        documents: '/documents',
        status: '/records/{recordId}',
        search: '/records/search'
      },
      dataMapping: this.getAccelaMapping()
    });

    // Tyler Technologies (Eden/EnerGov) Configuration
    this.configs.set('tyler', {
      name: 'Tyler Technologies',
      type: 'tyler',
      baseUrl: 'https://webapi.tylertech.com',
      version: 'v1',
      authentication: 'api_key',
      rateLimit: { requestsPerMinute: 100, requestsPerHour: 2000 },
      endpoints: {
        permits: '/permits',
        applications: '/applications',
        fees: '/fees',
        inspections: '/inspections',
        departments: '/departments',
        jurisdictions: '/jurisdictions',
        forms: '/forms',
        documents: '/documents',
        status: '/applications/{id}/status',
        search: '/search'
      },
      dataMapping: this.getTylerMapping()
    });

    // EnerGov Configuration
    this.configs.set('energov', {
      name: 'EnerGov',
      type: 'energov',
      baseUrl: 'https://webservices.energov.com',
      version: 'v2',
      authentication: 'token',
      rateLimit: { requestsPerMinute: 120, requestsPerHour: 3000 },
      endpoints: {
        permits: '/PermitTypes',
        applications: '/Applications',
        fees: '/Fees',
        inspections: '/Inspections',
        departments: '/Departments',
        jurisdictions: '/Jurisdictions',
        forms: '/Forms',
        documents: '/Documents',
        status: '/Applications/{id}',
        search: '/Search'
      },
      dataMapping: this.getEnerGovMapping()
    });

    // Add more configurations as needed
  }

  /**
   * Register API credentials for a specific system
   */
  registerCredentials(systemName: string, credentials: APICredentials): void {
    this.credentials.set(systemName, credentials);
    
    // Initialize rate limiter
    const config = this.configs.get(systemName);
    if (config) {
      this.rateLimiters.set(systemName, new RateLimiter(
        config.rateLimit.requestsPerMinute,
        config.rateLimit.requestsPerHour
      ));
    }
  }

  /**
   * Detect available permitting systems for a jurisdiction
   */
  async detectPermittingSystems(jurisdictionUrl: string): Promise<string[]> {
    const detectedSystems: string[] = [];
    
    try {
      // Check for common API endpoints and system signatures
      const response = await governmentHttpClient.get(jurisdictionUrl, { timeout: 10000 });
      const content = (await response.text()).toLowerCase();
      
      // Look for system indicators
      const systemIndicators = {
        'accela': ['accela', 'civic-platform', 'aa.api'],
        'tyler': ['tyler', 'eden', 'infor'],
        'energov': ['energov', 'harris', 'cgi'],
        'cityworks': ['cityworks', 'azteca'],
        'amanda': ['amanda', 'permittrax'],
        'viewpoint': ['viewpoint', 'spectrum']
      };

      Object.entries(systemIndicators).forEach(([system, indicators]) => {
        if (indicators.some(indicator => content.includes(indicator))) {
          detectedSystems.push(system);
        }
      });

      // Check for API endpoints
      for (const [systemName, config] of this.configs) {
        try {
          const baseUrl = config.baseUrl;
          const healthUrl = `${baseUrl}/health` || `${baseUrl}/status` || `${baseUrl}/ping`;
          
          const healthResponse = await governmentHttpClient.get(healthUrl, { 
            timeout: 5000
          });
          
          if (healthResponse.status < 500) {
            detectedSystems.push(systemName);
          }
        } catch {
          // System not accessible via standard endpoints
        }
      }

    } catch (error) {
      console.warn('Error detecting permitting systems:', error);
    }

    return [...new Set(detectedSystems)]; // Remove duplicates
  }

  /**
   * Fetch permit data from a specific API
   */
  async fetchPermitData(systemName: string, filters?: any): Promise<APIPermitData> {
    const config = this.configs.get(systemName);
    const credentials = this.credentials.get(systemName);
    
    if (!config || !credentials) {
      throw new Error(`System ${systemName} not configured or credentials missing`);
    }

    const rateLimiter = this.rateLimiters.get(systemName);
    if (rateLimiter) {
      await rateLimiter.waitForAvailability();
    }

    try {
      const apiData: APIPermitData = {
        permits: await this.fetchPermits(config, credentials, filters),
        fees: await this.fetchFees(config, credentials, filters),
        applications: await this.fetchApplications(config, credentials, filters),
        inspections: await this.fetchInspections(config, credentials, filters),
        departments: await this.fetchDepartments(config, credentials, filters),
        metadata: {
          totalRecords: 0,
          page: 1,
          pageSize: 100,
          lastUpdated: new Date().toISOString(),
          version: config.version,
          source: config.name
        }
      };

      return apiData;

    } catch (error) {
      console.error(`Error fetching data from ${systemName}:`, error);
      throw error;
    }
  }

  /**
   * Search for specific permits or applications
   */
  async searchPermits(systemName: string, query: {
    permitType?: string;
    address?: string;
    applicant?: string;
    dateRange?: { start: string; end: string };
    status?: string;
  }): Promise<APIPermit[]> {
    const config = this.configs.get(systemName);
    const credentials = this.credentials.get(systemName);
    
    if (!config || !credentials) {
      throw new Error(`System ${systemName} not configured`);
    }

    const searchUrl = this.buildApiUrl(config, 'search');
    const headers = await this.buildHeaders(config, credentials);
    const params = this.mapSearchQuery(config, query);

    // Build URL with query parameters
    const urlWithParams = new URL(searchUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlWithParams.searchParams.append(key, String(value));
      }
    });

    const response = await governmentHttpClient.get(urlWithParams.toString(), {
      headers,
      timeout: 30000
    });

    return this.mapAPIResponse(config, await response.json(), 'permits');
  }

  /**
   * Get real-time application status
   */
  async getApplicationStatus(systemName: string, applicationId: string): Promise<{
    id: string;
    status: string;
    statusDate: string;
    nextStep?: string;
    estimatedCompletion?: string;
    assignedTo?: string;
    notes?: string;
  }> {
    const config = this.configs.get(systemName);
    const credentials = this.credentials.get(systemName);
    
    if (!config || !credentials) {
      throw new Error(`System ${systemName} not configured`);
    }

    const statusUrl = config.endpoints.status.replace('{id}', applicationId).replace('{recordId}', applicationId);
    const fullUrl = this.buildApiUrl(config, statusUrl);
    const headers = await this.buildHeaders(config, credentials);

    const response = await governmentHttpClient.get(fullUrl, {
      headers,
      timeout: 15000
    });

    return this.mapStatusResponse(config, await response.json());
  }

  /**
   * Private helper methods
   */

  private async fetchPermits(config: APIConfig, credentials: APICredentials, filters?: any): Promise<APIPermit[]> {
    const url = this.buildApiUrl(config, 'permits');
    const headers = await this.buildHeaders(config, credentials);
    const params = this.mapFilters(config, filters);

    // Build URL with query parameters if any
    const urlObj = new URL(url);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          urlObj.searchParams.append(key, String(value));
        }
      });
    }

    const response = await governmentHttpClient.get(urlObj.toString(), { headers, timeout: 30000 });
    return this.mapAPIResponse(config, await response.json(), 'permits');
  }

  private async fetchFees(config: APIConfig, credentials: APICredentials, _filters?: any): Promise<APIFee[]> {
    const url = this.buildApiUrl(config, 'fees');
    const headers = await this.buildHeaders(config, credentials);

    const response = await governmentHttpClient.get(url, { headers, timeout: 30000 });
    return this.mapAPIResponse(config, await response.json(), 'fees');
  }

  private async fetchApplications(config: APIConfig, credentials: APICredentials, _filters?: any): Promise<APIApplication[]> {
    const url = this.buildApiUrl(config, 'applications');
    const headers = await this.buildHeaders(config, credentials);

    const response = await governmentHttpClient.get(url, { headers, timeout: 30000 });
    return this.mapAPIResponse(config, await response.json(), 'applications');
  }

  private async fetchInspections(config: APIConfig, credentials: APICredentials, _filters?: any): Promise<APIInspection[]> {
    const url = this.buildApiUrl(config, 'inspections');
    const headers = await this.buildHeaders(config, credentials);

    const response = await governmentHttpClient.get(url, { headers, timeout: 30000 });
    return this.mapAPIResponse(config, await response.json(), 'inspections');
  }

  private async fetchDepartments(config: APIConfig, credentials: APICredentials, _filters?: any): Promise<APIDepartment[]> {
    const url = this.buildApiUrl(config, 'departments');
    const headers = await this.buildHeaders(config, credentials);

    const response = await governmentHttpClient.get(url, { headers, timeout: 30000 });
    return this.mapAPIResponse(config, await response.json(), 'departments');
  }

  private buildApiUrl(config: APIConfig, endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return `${config.baseUrl}/${config.version}${cleanEndpoint}`;
  }

  private async buildHeaders(config: APIConfig, credentials: APICredentials): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    switch (config.authentication) {
      case 'api_key':
        if (credentials.apiKey) {
          headers['X-API-Key'] = credentials.apiKey;
        }
        break;
        
      case 'oauth2':
        if (credentials.accessToken) {
          headers['Authorization'] = `Bearer ${credentials.accessToken}`;
        }
        break;
        
      case 'token':
        if (credentials.accessToken) {
          headers['Authorization'] = `Token ${credentials.accessToken}`;
        }
        break;
        
      case 'basic':
        if (credentials.username && credentials.password) {
          const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
    }

    return headers;
  }

  private mapFilters(config: APIConfig, filters?: any): Record<string, any> {
    if (!filters) return {};
    
    // Map common filters to API-specific parameters
    const mapped: Record<string, any> = {};
    
    if (filters.permitType) mapped.type = filters.permitType;
    if (filters.status) mapped.status = filters.status;
    if (filters.jurisdiction) mapped.agency = filters.jurisdiction;
    
    return mapped;
  }

  private mapSearchQuery(config: APIConfig, query: any): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (query.permitType) params.recordType = query.permitType;
    if (query.address) params.address = query.address;
    if (query.applicant) params.applicant = query.applicant;
    if (query.status) params.status = query.status;
    
    if (query.dateRange) {
      params.dateFrom = query.dateRange.start;
      params.dateTo = query.dateRange.end;
    }
    
    return params;
  }

  private mapAPIResponse(config: APIConfig, data: any, type: string): any[] {
    if (!data) return [];
    
    const items = Array.isArray(data) ? data : (data.result || data.data || data.items || []);
    const mapping = (config.dataMapping as any)[type];
    
    if (!mapping) return items;
    
    return items.map((item: any) => this.mapItem(item, mapping));
  }

  private mapItem(item: any, mapping: FieldMapping): any {
    const mapped: any = {};
    
    Object.entries(mapping).forEach(([localField, mapConfig]) => {
      if (typeof mapConfig === 'string') {
        mapped[localField] = item[mapConfig];
      } else {
        const transform = mapConfig as FieldTransform;
        const value = item[transform.apiField];
        mapped[localField] = transform.transform ? transform.transform(value) : value;
        
        if (mapped[localField] === undefined && transform.default !== undefined) {
          mapped[localField] = transform.default;
        }
      }
    });
    
    return mapped;
  }

  private mapStatusResponse(config: APIConfig, data: any): any {
    return {
      id: data.id || data.recordId || data.applicationId,
      status: data.status || data.statusType || 'unknown',
      statusDate: data.statusDate || data.lastModified || new Date().toISOString(),
      nextStep: data.nextAction || data.nextStep,
      estimatedCompletion: data.estimatedCompletion || data.expectedDate,
      assignedTo: data.assignedTo || data.reviewer,
      notes: data.comments || data.notes || data.description
    };
  }

  /**
   * Data mapping configurations for different systems
   */
  private getAccelaMapping(): DataMapping {
    return {
      permit: {
        id: 'id',
        type: 'type.text',
        name: 'type.text',
        description: 'description',
        category: 'module',
        status: 'status.value',
        requirements: { apiField: 'conditions', transform: (v: any[]) => v?.map(c => c.text) || [] },
        processingTime: 'estimatedDueDate',
        lastUpdated: 'auditDate'
      },
      fee: {
        id: 'id',
        name: 'code',
        amount: 'amount',
        type: 'formula',
        description: 'description'
      },
      contact: {
        phone: 'phone1',
        email: 'email'
      },
      application: {
        id: 'id',
        status: 'status.value',
        submissionDate: 'fileDate'
      }
    };
  }

  private getTylerMapping(): DataMapping {
    return {
      permit: {
        id: 'PermitId',
        type: 'PermitType',
        name: 'PermitTypeName',
        description: 'Description',
        status: 'Status'
      },
      fee: {
        id: 'FeeId',
        name: 'FeeName',
        amount: 'Amount',
        description: 'Description'
      },
      contact: {
        phone: 'PhoneNumber',
        email: 'EmailAddress'
      },
      application: {
        id: 'ApplicationId',
        status: 'ApplicationStatus',
        submissionDate: 'SubmittedDate'
      }
    };
  }

  private getEnerGovMapping(): DataMapping {
    return {
      permit: {
        id: 'ID',
        type: 'TypeName',
        name: 'DisplayName',
        description: 'Description',
        status: 'StatusName'
      },
      fee: {
        id: 'FeeScheduleID',
        name: 'Name',
        amount: 'Amount',
        description: 'Description'
      },
      contact: {
        phone: 'Phone',
        email: 'Email'
      },
      application: {
        id: 'ApplicationNumber',
        status: 'StatusName',
        submissionDate: 'DateCreated'
      }
    };
  }
}

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
  private requestsThisMinute = 0;
  private requestsThisHour = 0;
  private minuteReset = Date.now() + 60000;
  private hourReset = Date.now() + 3600000;

  constructor(
    private maxRequestsPerMinute: number,
    private maxRequestsPerHour: number
  ) {}

  async waitForAvailability(): Promise<void> {
    const now = Date.now();

    // Reset counters if needed
    if (now >= this.minuteReset) {
      this.requestsThisMinute = 0;
      this.minuteReset = now + 60000;
    }
    if (now >= this.hourReset) {
      this.requestsThisHour = 0;
      this.hourReset = now + 3600000;
    }

    // Check if we need to wait
    if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
      const waitTime = this.minuteReset - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForAvailability();
    }

    if (this.requestsThisHour >= this.maxRequestsPerHour) {
      const waitTime = this.hourReset - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForAvailability();
    }

    // Increment counters
    this.requestsThisMinute++;
    this.requestsThisHour++;
  }
}

