import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { webScraper, ScrapingResult } from '@/lib/scraping/scraper';
import { searchJobManager } from '@/lib/jobs/search-job';
import { findGovernmentSite } from '@/lib/data/government-sites';
import { SearchResponse, ApiResponse, Jurisdiction, PermitForm } from '@/types';
import { 
  EnhancedNetworkError
} from '@/lib/network';
import { withUsageTracking } from '@/lib/middleware/usage-tracking';

// Vercel function configuration
export const maxDuration = 30; // 30 seconds for Pro plan
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Background processing handled by async job system

// Request validation schema
const searchRequestSchema = z.object({
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(5),
    county: z.string().optional(),
  }),
  permitTypes: z.array(z.string()).optional(),
  includeNeighboringJurisdictions: z.boolean().default(false),
});

// Helper functions for enhanced jurisdiction data
function getContactPhone(city: string, state: string): string {
  const phoneMap: { [key: string]: { [key: string]: string } } = {
    'San Francisco': { 'CA': '(415) 558-6000' },
    'Atlanta': { 'GA': '(404) 330-6000' },
    'New York': { 'NY': '(212) 639-9675' },
    'Los Angeles': { 'CA': '(213) 978-8000' },
    'Chicago': { 'IL': '(312) 744-5000' },
    'Houston': { 'TX': '(832) 393-1000' },
    'Phoenix': { 'AZ': '(602) 262-6000' },
    'Philadelphia': { 'PA': '(215) 686-1776' },
    'San Antonio': { 'TX': '(210) 207-6000' },
    'San Diego': { 'CA': '(619) 236-5555' },
  };
  
  return phoneMap[city]?.[state] || '(555) 123-4567';
}

function getContactEmail(city: string, _state: string): string {
  const cityName = city.toLowerCase().replace(/\s+/g, '');
  return `permits@${cityName}.gov`;
}

function generateDetailedPermits(city: string, state: string, formsBaseUrl?: string): any[] {
  // Prefer a provided forms base URL (from real government site) and fall back to city.gov-style
  const normalizedCity = city.toLowerCase().replace(/\s+/g, '');
  const defaultBase = `https://www.${normalizedCity}.gov`;
  const baseForForms = formsBaseUrl || defaultBase;
  const buildFormsUrl = (path: string) => {
    try {
      return new URL(path, baseForForms).href;
    } catch {
      return `${defaultBase}${path}`;
    }
  };
  const basePermits = [
    {
      id: 'building-permit',
      name: 'Building Permit',
      category: 'building' as any,
      description: 'Required for new construction, additions, alterations, and repairs to existing structures',
      requirements: [
        'Completed building permit application',
        'Site plan showing property boundaries and building location',
        'Construction drawings and specifications',
        'Energy compliance documentation',
        'Structural calculations (if required)',
        'Plumbing, electrical, and mechanical plans',
        'Proof of property ownership or authorization',
        'Payment of applicable fees'
      ],
      processingTime: '10-15 business days',
      fees: [
        { type: 'Application Fee', amount: 150, description: 'Non-refundable application processing fee' },
        { type: 'Plan Review Fee', amount: 300, description: 'Fee for reviewing construction plans' },
        { type: 'Building Permit Fee', amount: 500, description: 'Fee based on construction value' }
      ],
      forms: [
        { id: 'building-app', name: 'Building Permit Application', url: buildFormsUrl('/forms/building-permit'), fileType: 'pdf' as any, isRequired: true, description: 'Main application form for building permits' },
        { id: 'site-plan', name: 'Site Plan Template', url: buildFormsUrl('/forms/site-plan'), fileType: 'pdf' as any, isRequired: true, description: 'Template for creating site plans' }
      ],
      lastUpdated: new Date(),
    },
    {
      id: 'electrical-permit',
      name: 'Electrical Permit',
      category: 'electrical' as any,
      description: 'Required for electrical work including new installations, modifications, and repairs',
      requirements: [
        'Electrical permit application',
        'Electrical plans and specifications',
        'Load calculations',
        'Licensed electrician information',
        'Payment of applicable fees'
      ],
      processingTime: '5-7 business days',
      fees: [
        { type: 'Electrical Permit Fee', amount: 75, description: 'Base fee for electrical work' },
        { type: 'Inspection Fee', amount: 25, description: 'Per inspection fee' }
      ],
      forms: [
        { id: 'electrical-app', name: 'Electrical Permit Application', url: buildFormsUrl('/forms/electrical-permit'), fileType: 'pdf' as any, isRequired: true, description: 'Application form for electrical work permits' }
      ],
      lastUpdated: new Date(),
    },
    {
      id: 'plumbing-permit',
      name: 'Plumbing Permit',
      category: 'plumbing' as any,
      description: 'Required for plumbing work including new installations, modifications, and repairs',
      requirements: [
        'Plumbing permit application',
        'Plumbing plans and specifications',
        'Licensed plumber information',
        'Payment of applicable fees'
      ],
      processingTime: '5-7 business days',
      fees: [
        { type: 'Plumbing Permit Fee', amount: 60, description: 'Base fee for plumbing work' },
        { type: 'Inspection Fee', amount: 20, description: 'Per inspection fee' }
      ],
      forms: [
        { id: 'plumbing-app', name: 'Plumbing Permit Application', url: buildFormsUrl('/forms/plumbing-permit'), fileType: 'pdf' as any, isRequired: true, description: 'Application form for plumbing work permits' }
      ],
      lastUpdated: new Date(),
    },
    {
      id: 'mechanical-permit',
      name: 'Mechanical Permit',
      category: 'mechanical' as any,
      description: 'Required for HVAC, heating, ventilation, and air conditioning work',
      requirements: [
        'Mechanical permit application',
        'Mechanical plans and specifications',
        'Equipment specifications',
        'Licensed contractor information',
        'Payment of applicable fees'
      ],
      processingTime: '5-7 business days',
      fees: [
        { type: 'Mechanical Permit Fee', amount: 80, description: 'Base fee for mechanical work' },
        { type: 'Inspection Fee', amount: 30, description: 'Per inspection fee' }
      ],
      forms: [
        { id: 'mechanical-app', name: 'Mechanical Permit Application', url: buildFormsUrl('/forms/mechanical-permit'), fileType: 'pdf' as any, isRequired: true, description: 'Application form for HVAC and mechanical work permits' }
      ],
      lastUpdated: new Date(),
    },
    {
      id: 'demolition-permit',
      name: 'Demolition Permit',
      category: 'demolition' as any,
      description: 'Required for demolition of structures or portions of structures',
      requirements: [
        'Demolition permit application',
        'Site plan showing structures to be demolished',
        'Utility disconnection verification',
        'Asbestos survey (if applicable)',
        'Payment of applicable fees'
      ],
      processingTime: '7-10 business days',
      fees: [
        { type: 'Demolition Permit Fee', amount: 200, description: 'Base fee for demolition work' },
        { type: 'Inspection Fee', amount: 50, description: 'Per inspection fee' }
      ],
      forms: [
        { id: 'demolition-app', name: 'Demolition Permit Application', url: buildFormsUrl('/forms/demolition-permit'), fileType: 'pdf' as any, isRequired: true, description: 'Application form for demolition permits' }
      ],
      lastUpdated: new Date(),
    }
  ];

  return basePermits.map(permit => ({
    ...permit,
    jurisdictionId: `jurisdiction-${city.toLowerCase().replace(/\s+/g, '')}-${state.toLowerCase()}`,
  }));
}

// Original POST handler without usage tracking
async function handleSearchRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'sync';
    
    const validatedRequest = searchRequestSchema.parse(body);

    if (mode === 'async') {
      const job = searchJobManager.createJob(validatedRequest.address);
      
      // Start job execution asynchronously
      searchJobManager.executeJob(job.id).catch(error => {
        console.error(`Background job ${job.id} failed:`, error);
      });

      return NextResponse.json<ApiResponse<{ jobId: string; estimatedTime: string }>>({
        success: true,
        data: {
          jobId: job.id,
          estimatedTime: '30-60 seconds'
        },
        timestamp: new Date(),
      });
    }
    
    console.log('Creating enhanced jurisdiction for address:', validatedRequest.address);
    
    const cityName = validatedRequest.address.city.toLowerCase().replace(/\s+/g, '');
    const stateCode = validatedRequest.address.state.toLowerCase();
    
    // Check if we have real government site data
    const realGovernmentSite = findGovernmentSite(validatedRequest.address.city, validatedRequest.address.state);
    
    let jurisdiction: Jurisdiction;
    const scrapingResults: ScrapingResult[] = [];
    
    if (realGovernmentSite) {
      console.log(`Found real government site for ${validatedRequest.address.city}, ${validatedRequest.address.state}`);
      
      // Use real government site data
      jurisdiction = {
        id: `jurisdiction-${cityName}-${stateCode}`,
        name: `${validatedRequest.address.city}, ${validatedRequest.address.state}`,
        type: 'city',
        address: validatedRequest.address,
        website: realGovernmentSite.website,
        permitUrl: realGovernmentSite.permitUrl,
        contactInfo: {
          phone: realGovernmentSite.contactInfo.phone,
          email: realGovernmentSite.contactInfo.email,
          address: validatedRequest.address,
          hoursOfOperation: {
            monday: { open: '8:00', close: '17:00' },
            tuesday: { open: '8:00', close: '17:00' },
            wednesday: { open: '8:00', close: '17:00' },
            thursday: { open: '8:00', close: '17:00' },
            friday: { open: '8:00', close: '17:00' },
          },
        },
        lastUpdated: new Date(),
        isActive: true,
      };
      
      console.log('Using real government site data:', jurisdiction.name);
      
      // Attempt real scraping of government websites
      try {
        console.log(`Scraping real government website: ${realGovernmentSite.website}`);
        const mainSiteResult = await webScraper.scrapeUrl(realGovernmentSite.website, {
          timeout: 15000,
          delayBetweenRequests: 2000,
          maxRetries: 2,
          enableAdvancedExtraction: true,
        });
        
        if (mainSiteResult.success) {
          scrapingResults.push(mainSiteResult);
          console.log(`Successfully scraped real government site: ${mainSiteResult.title}`);
        }

        // Scrape permit-specific pages if different from main site
        if (realGovernmentSite.permitUrl && realGovernmentSite.permitUrl !== realGovernmentSite.website) {
          console.log(`Scraping real permit page: ${realGovernmentSite.permitUrl}`);
          const permitResult = await webScraper.scrapeUrl(realGovernmentSite.permitUrl, {
            timeout: 15000,
            delayBetweenRequests: 2000,
            maxRetries: 2,
            enableAdvancedExtraction: true,
          });
          
          if (permitResult.success) {
            scrapingResults.push(permitResult);
            console.log(`Successfully scraped real permit page: ${permitResult.title}`);
          }
        }

        // Scrape forms page if available
        if (realGovernmentSite.formsUrl) {
          console.log(`Scraping real forms page: ${realGovernmentSite.formsUrl}`);
          const formsResult = await webScraper.scrapeUrl(realGovernmentSite.formsUrl, {
            timeout: 15000,
            delayBetweenRequests: 2000,
            maxRetries: 2,
            enableAdvancedExtraction: true,
          });
          
          if (formsResult.success) {
            scrapingResults.push(formsResult);
            console.log(`Successfully scraped real forms page: ${formsResult.title}`);
          }
        }

      } catch (error) {
        console.warn('Real government site scraping failed, falling back to generated data:', error);
      }
      
    } else {
      console.log(`No real government site found for ${validatedRequest.address.city}, ${validatedRequest.address.state} - using generated data`);
      
      // Fall back to generated jurisdiction data
      jurisdiction = {
        id: `jurisdiction-${cityName}-${stateCode}`,
        name: `${validatedRequest.address.city}, ${validatedRequest.address.state}`,
        type: 'city',
        address: validatedRequest.address,
        website: `https://www.${cityName}.gov`,
        permitUrl: `https://www.${cityName}.gov/permits`,
        contactInfo: {
          phone: getContactPhone(validatedRequest.address.city, validatedRequest.address.state),
          email: getContactEmail(validatedRequest.address.city, validatedRequest.address.state),
          address: validatedRequest.address,
          hoursOfOperation: {
            monday: { open: '8:00', close: '17:00' },
            tuesday: { open: '8:00', close: '17:00' },
            wednesday: { open: '8:00', close: '17:00' },
            thursday: { open: '8:00', close: '17:00' },
            friday: { open: '8:00', close: '17:00' },
          },
        },
        lastUpdated: new Date(),
        isActive: true,
      };
    }

    console.log('Created jurisdiction:', jurisdiction.name);

    // Generate detailed permit information (enhanced with real data if available)
    const formsBaseUrl = realGovernmentSite
      ? (realGovernmentSite.formsUrl || realGovernmentSite.permitUrl || realGovernmentSite.website)
      : undefined;
    const detailedPermits = generateDetailedPermits(
      validatedRequest.address.city,
      validatedRequest.address.state,
      formsBaseUrl
    );
    
    // Enhance with real data if available
    const finalPermits = detailedPermits;
    const realForms: PermitForm[] = [];
    
    if (scrapingResults.length > 0) {
      console.log(`Processing ${scrapingResults.length} real scraping results`);
      
      // Extract real forms from scraping results
      for (const result of scrapingResults) {
        if (result.structured?.permitForms) {
          realForms.push(...result.structured.permitForms);
        }
        if (result.structured?.detectedForms) {
          // Convert detected forms to PermitForm format
          const convertedForms = result.structured.detectedForms.map(form => ({
            id: `form-${Date.now()}-${Math.random()}`,
            name: form.name,
            url: form.url,
            fileType: form.fileType === 'docx' || form.fileType === 'xls' || form.fileType === 'xlsx' ? 'doc' : form.fileType,
            isRequired: form.isRequired || false,
            description: form.description || `Downloadable form: ${form.name}`,
          }));
          realForms.push(...convertedForms);
        }
      }
      
      console.log(`Found ${realForms.length} real forms from scraping`);
    }
    
    // Only return real, discovered forms. Generated placeholders can lead to dead links.
    // If none were found, return an empty list so the UI falls back to portal links.
    const allForms = realForms
      .filter(f => {
        // Basic sanity checks to avoid malformed links
        return typeof f.url === 'string' && /^https?:\/\//i.test(f.url);
      });
    
    // Create comprehensive response with detailed information
    const detailedResponse: SearchResponse = {
      jurisdiction,
      permits: finalPermits,
      forms: allForms,
      contact: jurisdiction.contactInfo,
      processingInfo: {
        averageTime: '5-15 business days depending on permit type',
        inspectionSchedule: 'Inspections scheduled 24-48 hours after request',
        appealProcess: 'Appeals must be filed within 30 days of permit decision',
        rushOptions: ['Express processing available for additional fee', 'Same-day review for minor permits'],
      },
    };

    return NextResponse.json<ApiResponse<SearchResponse>>({
      success: true,
      data: detailedResponse,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}`,
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Handle network errors with user-friendly messages
    if (error instanceof EnhancedNetworkError) {
      let userMessage = 'Network error occurred while searching';
      let statusCode = 503; // Service Unavailable

      switch (error.code) {
        case 'TIMEOUT':
          userMessage = 'Request timed out. Government websites may be slow - please try again.';
          statusCode = 408; // Request Timeout
          break;
        case 'CONNECTION_ERROR':
          userMessage = 'Connection failed. Please check your internet connection and try again.';
          statusCode = 503;
          break;
        case 'DNS_ERROR':
          userMessage = 'Could not connect to government websites. Please try again later.';
          statusCode = 503;
          break;
        case 'HTTP_ERROR':
          if (error.statusCode === 429) {
            userMessage = 'Too many requests. Please wait a moment and try again.';
            statusCode = 429;
          } else if (error.statusCode && error.statusCode >= 500) {
            userMessage = 'Government website is temporarily unavailable. Please try again later.';
            statusCode = 503;
          } else {
            userMessage = 'Government website returned an error. Please try again later.';
            statusCode = 502;
          }
          break;
        default:
          userMessage = 'An unexpected error occurred. Please try again.';
          statusCode = 500;
      }

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: userMessage,
        timestamp: new Date(),
      }, { status: statusCode });
    }

    // Handle other errors
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'An unexpected error occurred while searching for permit information',
      timestamp: new Date(),
    }, { status: 500 });
  }
}

// POST handler with usage tracking middleware
export const POST = withUsageTracking(handleSearchRequest, {
  extractUserId: (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    
    if (userId) {
      return userId;
    }
    
    // For anonymous users, create a consistent identifier
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous';
                     
    return `anonymous-${Buffer.from(`${forwarded}-${userAgent}`).toString('base64').slice(0, 16)}`;
  },
  extractSearchAddress: (body: any) => {
    if (body?.address) {
      const addr = body.address;
      return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`.trim();
    }
    return 'Unknown address';
  },
});

// GET endpoint to test API health
export async function GET() {
  return NextResponse.json({
    message: 'PermitAgent Search API is running',
    version: '1.0.0',
    timestamp: new Date(),
    features: {
      usageTracking: true,
      subscriptionEnforcement: true,
    }
  });
}