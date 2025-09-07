import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, incrementUsage, logUsage, getSubscriptionByUserId } from '@/lib/database/subscriptions';
import { ApiResponse } from '@/types';

/**
 * Usage tracking middleware configuration
 */
export interface UsageTrackingConfig {
  extractUserId: (request: NextRequest) => string | Promise<string>;
  extractSearchAddress?: (requestBody: any) => string;
  bypassRoles?: string[];
  rateLimitWindow?: number; // milliseconds
  maxRequestsPerWindow?: number;
}

/**
 * Default user ID extractor (looks for userId in query params or body)
 */
const defaultUserIdExtractor = (request: NextRequest): string => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || searchParams.get('user_id');
  
  if (userId) {
    return userId;
  }
  
  // For anonymous users, use a consistent identifier
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
                   
  return `anonymous-${Buffer.from(`${forwarded}-${userAgent}`).toString('base64').slice(0, 16)}`;
};

/**
 * Default search address extractor
 */
const defaultAddressExtractor = (body: any): string => {
  if (body?.address) {
    const addr = body.address;
    return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`.trim();
  }
  return 'Unknown address';
};

/**
 * Create usage tracking middleware
 */
export function createUsageTrackingMiddleware(config: Partial<UsageTrackingConfig> = {}) {
  const {
    extractUserId = defaultUserIdExtractor,
    extractSearchAddress = defaultAddressExtractor,
    bypassRoles: _bypassRoles = [],
    rateLimitWindow = 60000, // 1 minute
    maxRequestsPerWindow = 10,
  } = config;

  // Simple in-memory rate limiting (for production, use Redis)
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  return async function usageTrackingMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Extract user ID
      const userId = await extractUserId(request);
      
      if (!userId) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'User identification required',
          timestamp: new Date(),
        }, { status: 401 });
      }

      // Check rate limits (basic protection)
      const now = Date.now();
      const rateLimitKey = userId;
      const rateLimitData = rateLimitMap.get(rateLimitKey);

      if (rateLimitData) {
        if (now < rateLimitData.resetTime) {
          if (rateLimitData.count >= maxRequestsPerWindow) {
            console.warn(`Rate limit exceeded for user ${userId}`);
            return NextResponse.json<ApiResponse<null>>({
              success: false,
              error: 'Too many requests. Please slow down.',
              timestamp: new Date(),
            }, { status: 429 });
          }
          rateLimitData.count++;
        } else {
          // Reset window
          rateLimitData.count = 1;
          rateLimitData.resetTime = now + rateLimitWindow;
        }
      } else {
        rateLimitMap.set(rateLimitKey, {
          count: 1,
          resetTime: now + rateLimitWindow,
        });
      }

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      
      if (!usageCheck.canUse) {
        console.log(`Usage limit exceeded for user ${userId}: ${usageCheck.remaining}/${usageCheck.limit}`);
        
        // Get subscription info for better error message
        const subscription = await getSubscriptionByUserId(userId);
        const planType = subscription?.planType || 'free';
        const isExpiredPlan = subscription?.status === 'past_due' || subscription?.status === 'canceled';
        
        let errorMessage = `Usage limit reached. You've used ${usageCheck.limit} searches this month.`;
        let upgradeMessage = '';
        
        if (planType === 'free') {
          upgradeMessage = ' Upgrade to Pro for 50 searches/month or Business for unlimited searches.';
        } else if (planType === 'pro') {
          upgradeMessage = ' Upgrade to Business for unlimited searches.';
        } else if (isExpiredPlan) {
          errorMessage = 'Your subscription has expired. Please update your payment method to continue using PermitAgent.';
        }

        return NextResponse.json<ApiResponse<{
          usageLimit: number;
          usageCount: number;
          planType: string;
          upgradeRequired: boolean;
        }>>({
          success: false,
          error: errorMessage + upgradeMessage,
          data: {
            usageLimit: usageCheck.limit,
            usageCount: usageCheck.limit - (usageCheck.remaining > 0 ? usageCheck.remaining : 0),
            planType,
            upgradeRequired: true,
          },
          timestamp: new Date(),
        }, { status: 402 }); // Payment Required
      }

      // Process the request
      let searchAddress = 'Unknown';
      let requestSuccess = true;
      
      try {
        // Extract search address from request body if possible
        if (request.method === 'POST') {
          const body = await request.json();
          searchAddress = extractSearchAddress(body);
          
          // Recreate the request with the consumed body
          const newRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body),
          });
          
          const response = await handler(newRequest);
          
          // Check if the response indicates success
          if (response.ok) {
            const responseData = await response.json();
            requestSuccess = responseData.success !== false;
          } else {
            requestSuccess = false;
          }
          
          return response;
        } else {
          return await handler(request);
        }
      } catch (handlerError) {
        console.error('Handler error in usage tracking:', handlerError);
        requestSuccess = false;
        throw handlerError;
      } finally {
        // Only increment usage and log for successful requests
        if (requestSuccess) {
          try {
            // Increment usage count
            await incrementUsage(userId);
            
            // Log the usage
            const subscription = await getSubscriptionByUserId(userId);
            await logUsage(
              userId,
              searchAddress,
              subscription?.planType || 'free',
              requestSuccess,
              {
                userAgent: request.headers.get('user-agent'),
                referer: request.headers.get('referer'),
                timestamp: new Date().toISOString(),
              }
            );
            
            console.log(`Usage logged for user ${userId}: ${searchAddress}`);
          } catch (loggingError) {
            console.error('Error logging usage:', loggingError);
            // Don't fail the request due to logging errors
          }
        }
      }
    } catch (error) {
      console.error('Usage tracking middleware error:', error);
      
      // Don't block requests due to usage tracking errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Bypassing usage tracking in development due to error');
        return await handler(request);
      }
      
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Service temporarily unavailable',
        timestamp: new Date(),
      }, { status: 503 });
    }
  };
}

/**
 * Wrapper for API routes to include usage tracking
 */
export function withUsageTracking(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: UsageTrackingConfig
) {
  const middleware = createUsageTrackingMiddleware(config);
  
  return async function wrappedHandler(request: NextRequest): Promise<NextResponse> {
    return await middleware(request, handler);
  };
}