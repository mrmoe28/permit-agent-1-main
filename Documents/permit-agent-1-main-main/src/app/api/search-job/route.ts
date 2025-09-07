import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchJobManager } from '@/lib/jobs/search-job';
import { ApiResponse } from '@/types';

// Vercel function configuration
export const maxDuration = 5; // Quick response for job creation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request validation schema
const startJobSchema = z.object({
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(5),
    county: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = startJobSchema.parse(body);
    
    // Create job
    const job = searchJobManager.createJob(validatedRequest.address);
    
    // Start job execution asynchronously (don't await)
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

  } catch (error) {
    console.error('Start job API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}`,
        timestamp: new Date(),
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to start search job. Please try again.',
      timestamp: new Date(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = searchJobManager.getJobStats();
    
    return NextResponse.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Job stats API error:', error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to get job statistics',
      timestamp: new Date(),
    }, { status: 500 });
  }
}