import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, STRIPE_CONFIG, getCheckoutUrls } from '@/lib/stripe/config';
import { getSubscriptionByUserId, upsertSubscription, PLAN_CONFIGS } from '@/lib/database/subscriptions';
import { ApiResponse } from '@/types';

// Vercel function configuration
export const maxDuration = 30;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request validation schema
const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  planType: z.enum(['pro', 'business'], { 
    errorMap: () => ({ message: 'Plan type must be pro or business' }) 
  }),
  customerEmail: z.string().email().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Create Stripe checkout session for subscription
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
    const validatedRequest = createCheckoutSchema.parse(body);

    const { priceId, userId, planType, customerEmail, successUrl, cancelUrl } = validatedRequest;

    // Check if user already has an active subscription
    const existingSubscription = await getSubscriptionByUserId(userId);
    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'User already has an active subscription. Use customer portal to manage subscription.',
        timestamp: new Date(),
      }, { status: 409 });
    }

    // Validate the price ID matches the plan type
    const expectedPriceId = STRIPE_CONFIG.prices[planType];
    if (priceId !== expectedPriceId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid price ID for selected plan',
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = existingSubscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId,
          planType,
        },
      });
      customerId = customer.id;
    }

    // Get checkout URLs
    const urls = getCheckoutUrls();
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: STRIPE_CONFIG.checkout.paymentMethodTypes,
      billing_address_collection: STRIPE_CONFIG.checkout.billingAddressCollection,
      customer_update: STRIPE_CONFIG.checkout.customerUpdate,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: STRIPE_CONFIG.checkout.mode,
      success_url: successUrl || urls.successUrl,
      cancel_url: cancelUrl || urls.cancelUrl,
      metadata: {
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId,
          planType,
        },
      },
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true,
      },
    });

    // Create/update subscription record with pending status
    await upsertSubscription({
      userId,
      stripeCustomerId: customerId,
      planType,
      status: 'incomplete',
      usageCount: 0,
      usageLimit: PLAN_CONFIGS[planType].usageLimit,
    });

    console.log(`Created checkout session for user ${userId}, plan ${planType}: ${session.id}`);

    return NextResponse.json<ApiResponse<{ sessionId: string; checkoutUrl: string }>>({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url || '',
      },
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Create checkout session error:', error);

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
        error: 'Payment processing error occurred',
        timestamp: new Date(),
      }, { status: 500 });
    }

    // Handle other errors
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'An unexpected error occurred while creating checkout session',
      timestamp: new Date(),
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Stripe Checkout API is running',
    version: '1.0.0',
    timestamp: new Date(),
  });
}