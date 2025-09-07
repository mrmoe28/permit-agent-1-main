import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { getSubscriptionByUserId } from '@/lib/database/subscriptions';
import { ApiResponse } from '@/types';

// Vercel function configuration
export const maxDuration = 30;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request validation schema
const customerPortalSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  returnUrl: z.string().url().optional(),
});

/**
 * Create Stripe customer portal session for billing management
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      console.error('Stripe not initialized - missing API key');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Payment system not configured',
        timestamp: new Date(),
      }, { status: 503 });
    }

    const body = await request.json();
    const validatedRequest = customerPortalSchema.parse(body);

    const { userId, returnUrl } = validatedRequest;

    // Get user's subscription
    const subscription = await getSubscriptionByUserId(userId);
    
    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'No subscription found for user',
        timestamp: new Date(),
      }, { status: 404 });
    }

    // Verify the customer exists in Stripe
    let customer;
    try {
      customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Customer not found in payment system',
        timestamp: new Date(),
      }, { status: 404 });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl || `${STRIPE_CONFIG.appUrl}/dashboard`,
      configuration: undefined, // Use default configuration
    });

    console.log(`Created customer portal session for user ${userId}: ${session.id}`);

    return NextResponse.json<ApiResponse<{ portalUrl: string }>>({
      success: true,
      data: {
        portalUrl: session.url,
      },
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Customer portal error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}`,
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Handle Stripe errors
    if (error instanceof Error && 'type' in error) {
      const stripeError = error as any;
      console.error('Stripe error:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
      });

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Unable to access billing portal at this time',
        timestamp: new Date(),
      }, { status: 500 });
    }

    // Handle other errors
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'An unexpected error occurred while creating portal session',
      timestamp: new Date(),
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Stripe Customer Portal API is running',
    version: '1.0.0',
    timestamp: new Date(),
  });
}