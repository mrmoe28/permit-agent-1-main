import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, validateWebhookSignature } from '@/lib/stripe/config';
import { 
  getSubscriptionByStripeCustomerId,
  upsertSubscription,
  resetUsage,
  isEventProcessed,
  markEventAsProcessed,
  PLAN_CONFIGS 
} from '@/lib/database/subscriptions';

// Vercel function configuration
export const maxDuration = 30;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handle incoming Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      console.error('Stripe not initialized - missing API key');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Validate webhook signature
    let event: Stripe.Event;
    try {
      event = validateWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature validation failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(`Processing webhook event: ${event.type} (${event.id})`);

    // Check if event has already been processed (idempotency)
    if (await isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true });
    }

    // Process different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markEventAsProcessed(event.id, event.type, event.data.object);

    console.log(`Successfully processed webhook event: ${event.type} (${event.id})`);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!stripe) {
    console.error('Stripe not initialized - cannot process checkout session');
    return;
  }

  const { customer: customerId, subscription: subscriptionId, metadata } = session;
  
  if (!customerId || !subscriptionId || !metadata?.userId) {
    console.error('Missing required data in checkout session:', { customerId, subscriptionId, metadata });
    return;
  }

  const userId = metadata.userId;
  const planType = metadata.planType as 'pro' | 'business';

  console.log(`Checkout completed for user ${userId}, plan ${planType}`);

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

  // Update subscription in database
  await upsertSubscription({
    userId,
    stripeCustomerId: customerId as string,
    stripeSubscriptionId: subscriptionId as string,
    planType,
    status: subscription.status as any,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    usageCount: 0,
    usageLimit: PLAN_CONFIGS[planType].usageLimit,
  });

  console.log(`Updated subscription for user ${userId}: ${subscription.status}`);
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { customer: customerId, metadata } = subscription;
  
  if (!metadata?.userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const userId = metadata.userId;
  const planType = metadata.planType as 'pro' | 'business';

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId as string,
    stripeSubscriptionId: subscription.id,
    planType,
    status: subscription.status as any,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    usageCount: 0,
    usageLimit: PLAN_CONFIGS[planType].usageLimit,
  });

  console.log(`Subscription created for user ${userId}: ${subscription.status}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existingSubscription = await getSubscriptionByStripeCustomerId(subscription.customer as string);
  
  if (!existingSubscription) {
    console.error('Subscription not found for customer:', subscription.customer);
    return;
  }

  const planType = subscription.metadata?.planType as 'pro' | 'business' || existingSubscription.planType;

  await upsertSubscription({
    userId: existingSubscription.userId,
    stripeCustomerId: existingSubscription.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    planType,
    status: subscription.status as any,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    usageLimit: PLAN_CONFIGS[planType].usageLimit,
  });

  console.log(`Subscription updated for user ${existingSubscription.userId}: ${subscription.status}`);
}

/**
 * Handle subscription cancellation/deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existingSubscription = await getSubscriptionByStripeCustomerId(subscription.customer as string);
  
  if (!existingSubscription) {
    console.error('Subscription not found for customer:', subscription.customer);
    return;
  }

  // Downgrade to free plan
  await upsertSubscription({
    userId: existingSubscription.userId,
    stripeCustomerId: existingSubscription.stripeCustomerId,
    stripeSubscriptionId: undefined,
    planType: 'free',
    status: 'canceled',
    currentPeriodStart: undefined,
    currentPeriodEnd: undefined,
    usageCount: 0,
    usageLimit: PLAN_CONFIGS.free.usageLimit,
  });

  console.log(`Subscription canceled for user ${existingSubscription.userId}, downgraded to free plan`);
}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!stripe) {
    console.error('Stripe not initialized - cannot process payment');
    return;
  }

  if (!(invoice as any).subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const existingSubscription = await getSubscriptionByStripeCustomerId(subscription.customer as string);
  
  if (!existingSubscription) {
    console.error('Subscription not found for customer:', subscription.customer);
    return;
  }

  // Reset usage count on successful renewal
  await resetUsage(existingSubscription.userId);

  // Update subscription period
  await upsertSubscription({
    userId: existingSubscription.userId,
    stripeCustomerId: existingSubscription.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    planType: existingSubscription.planType,
    status: 'active',
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    usageCount: 0, // Reset usage on renewal
    usageLimit: existingSubscription.usageLimit,
  });

  console.log(`Payment succeeded for user ${existingSubscription.userId}, usage reset`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!stripe) {
    console.error('Stripe not initialized - cannot process payment failure');
    return;
  }

  if (!(invoice as any).subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const existingSubscription = await getSubscriptionByStripeCustomerId(subscription.customer as string);
  
  if (!existingSubscription) {
    console.error('Subscription not found for customer:', subscription.customer);
    return;
  }

  // Update subscription status to past_due
  await upsertSubscription({
    userId: existingSubscription.userId,
    stripeCustomerId: existingSubscription.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    planType: existingSubscription.planType,
    status: 'past_due',
    currentPeriodStart: existingSubscription.currentPeriodStart,
    currentPeriodEnd: existingSubscription.currentPeriodEnd,
    usageLimit: existingSubscription.usageLimit,
  });

  console.log(`Payment failed for user ${existingSubscription.userId}, status set to past_due`);
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'Stripe Webhooks endpoint is running',
    version: '1.0.0',
    timestamp: new Date(),
  });
}