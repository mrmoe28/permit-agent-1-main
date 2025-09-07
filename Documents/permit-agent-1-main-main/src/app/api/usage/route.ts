import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserUsageStats, checkUsageLimit, PLAN_CONFIGS } from '@/lib/database/subscriptions';
import { ApiResponse } from '@/types';

// Vercel function configuration
export const maxDuration = 30;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request validation schema
const usageStatsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  days: z.number().min(1).max(365).optional().default(30),
});

export interface UsageStatsResponse {
  subscription: {
    planType: string;
    status: string;
    usageCount: number;
    usageLimit: number;
    remaining: number;
    isUnlimited: boolean;
    currentPeriodEnd?: string;
  };
  usage: {
    totalSearches: number;
    successfulSearches: number;
    currentMonthUsage: number;
    canUse: boolean;
  };
  planInfo: {
    name: string;
    features: string[];
    upgradeAvailable: boolean;
  };
}

/**
 * Get user usage statistics and subscription info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = searchParams.get('days');

    const validatedParams = usageStatsSchema.parse({
      userId,
      days: days ? parseInt(days) : undefined,
    });

    // Get usage statistics and current limits
    const [usageStats, usageLimit] = await Promise.all([
      getUserUsageStats(validatedParams.userId, validatedParams.days),
      checkUsageLimit(validatedParams.userId),
    ]);

    const subscription = usageStats.subscription;
    const planType = subscription?.planType || 'free';
    const planConfig = PLAN_CONFIGS[planType];

    // Determine if user can upgrade
    const upgradeAvailable = planType === 'free' || planType === 'pro';
    
    // Calculate remaining usage
    const isUnlimited = subscription?.usageLimit === -1;
    const remaining = isUnlimited ? -1 : Math.max(0, (subscription?.usageLimit || 0) - (subscription?.usageCount || 0));

    const response: UsageStatsResponse = {
      subscription: {
        planType,
        status: subscription?.status || 'active',
        usageCount: subscription?.usageCount || 0,
        usageLimit: subscription?.usageLimit || 3,
        remaining,
        isUnlimited,
        currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
      },
      usage: {
        totalSearches: usageStats.totalSearches,
        successfulSearches: usageStats.successfulSearches,
        currentMonthUsage: usageStats.currentMonthUsage,
        canUse: usageLimit.canUse,
      },
      planInfo: {
        name: planConfig?.name || 'Free',
        features: planConfig?.features || [],
        upgradeAvailable,
      },
    };

    return NextResponse.json<ApiResponse<UsageStatsResponse>>({
      success: true,
      data: response,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Usage stats error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}`,
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'An unexpected error occurred while fetching usage statistics',
      timestamp: new Date(),
    }, { status: 500 });
  }
}

// POST endpoint to get usage stats with body parameters (alternative)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedRequest = usageStatsSchema.parse(body);

    // Get usage statistics and current limits
    const [usageStats, usageLimit] = await Promise.all([
      getUserUsageStats(validatedRequest.userId, validatedRequest.days),
      checkUsageLimit(validatedRequest.userId),
    ]);

    const subscription = usageStats.subscription;
    const planType = subscription?.planType || 'free';
    const planConfig = PLAN_CONFIGS[planType];

    // Determine if user can upgrade
    const upgradeAvailable = planType === 'free' || planType === 'pro';
    
    // Calculate remaining usage
    const isUnlimited = subscription?.usageLimit === -1;
    const remaining = isUnlimited ? -1 : Math.max(0, (subscription?.usageLimit || 0) - (subscription?.usageCount || 0));

    const response: UsageStatsResponse = {
      subscription: {
        planType,
        status: subscription?.status || 'active',
        usageCount: subscription?.usageCount || 0,
        usageLimit: subscription?.usageLimit || 3,
        remaining,
        isUnlimited,
        currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
      },
      usage: {
        totalSearches: usageStats.totalSearches,
        successfulSearches: usageStats.successfulSearches,
        currentMonthUsage: usageStats.currentMonthUsage,
        canUse: usageLimit.canUse,
      },
      planInfo: {
        name: planConfig?.name || 'Free',
        features: planConfig?.features || [],
        upgradeAvailable,
      },
    };

    return NextResponse.json<ApiResponse<UsageStatsResponse>>({
      success: true,
      data: response,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Usage stats error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}`,
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'An unexpected error occurred while fetching usage statistics',
      timestamp: new Date(),
    }, { status: 500 });
  }
}