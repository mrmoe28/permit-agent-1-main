import Stripe from 'stripe';

// Validate required environment variables
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

// Check for missing environment variables (only in runtime, not during build)
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn('Missing required Stripe environment variables:', missingVars.join(', '));
  // Only throw error in production runtime, not during build or static generation
  if (process.env.NODE_ENV === 'production' && 
      typeof window === 'undefined' && 
      process.env.VERCEL_ENV !== 'preview' &&
      !process.env.NEXT_PHASE?.includes('phase-production-build')) {
    throw new Error(`Missing required Stripe environment variables: ${missingVars.join(', ')}`);
  }
}

// Initialize Stripe with proper configuration (only if key is available)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil', // Use latest stable API version
      typescript: true,
      appInfo: {
        name: 'PermitAgent',
        version: '1.0.0',
        url: 'https://permitagent.com',
      },
    })
  : null;

// Stripe configuration constants
export const STRIPE_CONFIG = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  currency: 'usd',
  
  // Price IDs for subscription plans (set these in your environment)
  prices: {
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
    business: process.env.STRIPE_BUSINESS_PRICE_ID || '',
  },
  
  // Checkout session configuration
  checkout: {
    mode: 'subscription' as Stripe.Checkout.SessionCreateParams.Mode,
    paymentMethodTypes: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    billingAddressCollection: 'auto' as Stripe.Checkout.SessionCreateParams.BillingAddressCollection,
    customerUpdate: {
      address: 'auto' as Stripe.Checkout.SessionCreateParams.CustomerUpdate.Address,
      name: 'auto' as Stripe.Checkout.SessionCreateParams.CustomerUpdate.Name,
    },
  },
} as const;

// Helper function to get success and cancel URLs
export function getCheckoutUrls() {
  const baseUrl = STRIPE_CONFIG.appUrl;
  return {
    successUrl: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/pricing?canceled=true`,
  };
}

// Helper function to validate webhook signature
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe not initialized - missing API key');
  }
  
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Helper function to format price for display
export function formatPrice(amountInCents: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export default stripe;