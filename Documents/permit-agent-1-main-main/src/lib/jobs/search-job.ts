import { Address, SearchResponse } from '@/types';
import { jurisdictionDiscovery } from '@/lib/scraping/discovery';
import { webScraper } from '@/lib/scraping/scraper';
import { permitDataProcessor } from '@/lib/ai/processor';
import { 
  aiProcessingCircuitBreaker,
  CircuitState 
} from '@/lib/network';

export interface SearchJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  address: Address;
  result?: SearchResponse;
  error?: string;
  startTime: number;
  endTime?: number;
}

class SearchJobManager {
  private jobs = new Map<string, SearchJob>();
  private maxJobs = 100; // Limit memory usage

  generateJobId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  createJob(address: Address): SearchJob {
    const jobId = this.generateJobId();
    
    // Clean old jobs if we're at the limit
    if (this.jobs.size >= this.maxJobs) {
      this.cleanOldJobs();
    }

    const job: SearchJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      address,
      startTime: Date.now(),
    };

    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId: string): SearchJob | null {
    return this.jobs.get(jobId) || null;
  }

  async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    try {
      job.status = 'running';
      job.progress = 10;

      // Step 1: Discover jurisdiction (30% of progress)
      console.log(`[Job ${jobId}] Starting jurisdiction discovery`);
      const jurisdiction = await jurisdictionDiscovery.discoverJurisdiction(job.address);
      
      if (!jurisdiction) {
        throw new Error('Could not find jurisdiction information for this address');
      }

      job.progress = 40;
      console.log(`[Job ${jobId}] Found jurisdiction: ${jurisdiction.name}`);

      // Step 2: Scrape permit information (30% of progress)
      const scrapingResults = [];
      const urlsToScrape = [
        jurisdiction.website,
        ...(jurisdiction.permitUrl ? [jurisdiction.permitUrl] : [])
      ];

      console.log(`[Job ${jobId}] Scraping ${urlsToScrape.length} URLs`);
      
      for (const url of urlsToScrape) {
        try {
          const result = await webScraper.scrapeUrl(url, {
            timeout: 15000, // Shorter timeout for Vercel
            delayBetweenRequests: 1000,
            maxRetries: 2, // Fewer retries
          });
          
          if (result.success && result.content.length > 100) {
            scrapingResults.push(result);
          }
        } catch (error) {
          console.warn(`[Job ${jobId}] Failed to scrape ${url}:`, error);
        }
      }

      job.progress = 70;

      // Step 3: Process with AI or provide basic info (30% of progress)
      let extractedData;
      
      if (scrapingResults.length === 0) {
        console.warn(`[Job ${jobId}] No scraping results, providing basic info`);
        extractedData = this.createBasicExtractedData(jurisdiction);
      } else {
        try {
          console.log(`[Job ${jobId}] Processing scraped content with AI`);
          
          if (aiProcessingCircuitBreaker.getState() === CircuitState.OPEN) {
            console.warn(`[Job ${jobId}] AI circuit breaker open, skipping AI`);
            throw new Error('AI processing temporarily unavailable');
          }
          
          const combinedContent = scrapingResults
            .map(result => result.content)
            .join('\n\n--- Next Page ---\n\n');

          extractedData = await aiProcessingCircuitBreaker.execute(async () => {
            return await permitDataProcessor.extractPermitInfo(
              combinedContent,
              jurisdiction.website
            );
          });
          
          console.log(`[Job ${jobId}] AI processing completed`);
        } catch (error) {
          console.warn(`[Job ${jobId}] AI processing failed:`, error);
          extractedData = this.createBasicExtractedData(jurisdiction);
        }
      }

      // Step 4: Build final response
      if (extractedData.contact) {
        jurisdiction.contactInfo = {
          ...jurisdiction.contactInfo,
          ...extractedData.contact,
        };
      }

      const response: SearchResponse = {
        jurisdiction,
        permits: extractedData.permits.map(permit => ({
          ...permit,
          jurisdictionId: jurisdiction.id,
        })),
        forms: [],
        contact: jurisdiction.contactInfo,
        processingInfo: extractedData.processing,
      };

      job.result = response;
      job.status = 'completed';
      job.progress = 100;
      job.endTime = Date.now();

      console.log(`[Job ${jobId}] Completed successfully in ${job.endTime - job.startTime}ms`);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = Date.now();
      
      console.error(`[Job ${jobId}] Failed:`, error);
    }
  }

  private createBasicExtractedData(jurisdiction: any) {
    return {
      permits: [{
        id: 'basic-permit-info',
        name: 'Contact jurisdiction for permit types',
        category: 'building' as any,
        jurisdictionId: jurisdiction.id,
        requirements: ['Contact local building department for specific requirements'],
        fees: [],
        forms: [],
        lastUpdated: new Date(),
      }],
      fees: [],
      contact: {},
      processing: {
        averageTime: 'Contact jurisdiction for processing times',
        inspectionSchedule: 'Contact jurisdiction for inspection scheduling',
      },
    };
  }

  private cleanOldJobs(): void {
    const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes
    const jobsToDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.startTime < cutoffTime && (job.status === 'completed' || job.status === 'failed')) {
        jobsToDelete.push(jobId);
      }
    }

    jobsToDelete.forEach(jobId => this.jobs.delete(jobId));
    console.log(`Cleaned ${jobsToDelete.length} old jobs`);
  }

  getJobStats(): { total: number; pending: number; running: number; completed: number; failed: number } {
    const stats = { total: 0, pending: 0, running: 0, completed: 0, failed: 0 };
    
    for (const job of this.jobs.values()) {
      stats.total++;
      stats[job.status]++;
    }

    return stats;
  }
}

export const searchJobManager = new SearchJobManager();