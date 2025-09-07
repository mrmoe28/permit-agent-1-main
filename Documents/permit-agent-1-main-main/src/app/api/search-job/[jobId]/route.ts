import { NextRequest, NextResponse } from 'next/server';
import { searchJobManager } from '@/lib/jobs/search-job';
import { ApiResponse } from '@/types';

// Vercel function configuration
export const maxDuration = 5; // Quick response for status check
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Job ID is required',
        timestamp: new Date(),
      }, { status: 400 });
    }

    const job = searchJobManager.getJob(jobId);
    
    if (!job) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Job not found. Jobs expire after 30 minutes.',
        timestamp: new Date(),
      }, { status: 404 });
    }

    // Calculate elapsed time
    const elapsedTime = Date.now() - job.startTime;
    const elapsedSeconds = Math.floor(elapsedTime / 1000);

    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      elapsedTime: elapsedSeconds,
      result: job.result,
      error: job.error,
    };

    return NextResponse.json<ApiResponse<typeof response>>({
      success: true,
      data: response,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Get job status API error:', error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to get job status',
      timestamp: new Date(),
    }, { status: 500 });
  }
}