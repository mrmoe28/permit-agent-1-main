import { PoolClient } from 'pg';
import { withDatabase } from './db';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  planType: 'free' | 'pro' | 'business';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  usageCount: number;
  usageLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageLog {
  id: string;
  userId: string;
  searchAddress: string;
  timestamp: Date;
  planType: string;
  success: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface PlanConfig {
  name: string;
  type: 'free' | 'pro' | 'business';
  usageLimit: number;
  stripePriceId: string;
  features: string[];
}

// Subscription plan configurations
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    type: 'free',
    usageLimit: 3,
    stripePriceId: '', // No Stripe price for free plan
    features: ['3 permit searches per month', 'Basic permit information', 'Email support']
  },
  pro: {
    name: 'Pro',
    type: 'pro',
    usageLimit: 50,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: ['50 searches per month', 'Priority support', 'Advanced filtering', 'Export to PDF']
  },
  business: {
    name: 'Business',
    type: 'business',
    usageLimit: -1, // Unlimited
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    features: ['Unlimited searches', 'API access', 'Team features', 'Priority phone support', 'Custom integrations']
  }
};

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  return withDatabase(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT * FROM subscriptions WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      planType: row.plan_type,
      status: row.status,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      usageCount: row.usage_count,
      usageLimit: row.usage_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
  return withDatabase(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT * FROM subscriptions WHERE stripe_customer_id = $1`,
      [stripeCustomerId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      planType: row.plan_type,
      status: row.status,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      usageCount: row.usage_count,
      usageLimit: row.usage_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(subscription: Partial<Subscription> & { userId: string }): Promise<Subscription> {
  return withDatabase(async (client: PoolClient) => {
    const result = await client.query(
      `INSERT INTO subscriptions (
        user_id, stripe_customer_id, stripe_subscription_id, plan_type, status,
        current_period_start, current_period_end, usage_count, usage_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        plan_type = EXCLUDED.plan_type,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        usage_limit = EXCLUDED.usage_limit,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        subscription.userId,
        subscription.stripeCustomerId || '',
        subscription.stripeSubscriptionId || null,
        subscription.planType || 'free',
        subscription.status || 'active',
        subscription.currentPeriodStart || null,
        subscription.currentPeriodEnd || null,
        subscription.usageCount || 0,
        subscription.usageLimit || PLAN_CONFIGS[subscription.planType || 'free'].usageLimit
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      planType: row.plan_type,
      status: row.status,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      usageCount: row.usage_count,
      usageLimit: row.usage_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

/**
 * Increment usage count for user
 */
export async function incrementUsage(userId: string): Promise<boolean> {
  return withDatabase(async (client: PoolClient) => {
    const result = await client.query(
      `UPDATE subscriptions 
       SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 
       RETURNING usage_count, usage_limit`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return true;
  });
}

/**
 * Reset usage count for user (typically called monthly)
 */
export async function resetUsage(userId: string): Promise<boolean> {
  return withDatabase(async (client: PoolClient) => {
    const result = await client.query(
      `UPDATE subscriptions 
       SET usage_count = 0, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1`,
      [userId]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  });
}

/**
 * Check if user has remaining usage
 */
export async function checkUsageLimit(userId: string): Promise<{ canUse: boolean; remaining: number; limit: number }> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription) {
    // Default to free plan for anonymous users
    return { canUse: true, remaining: 3, limit: 3 };
  }
  
  const isUnlimited = subscription.usageLimit === -1;
  const remaining = isUnlimited ? -1 : subscription.usageLimit - subscription.usageCount;
  const canUse = isUnlimited || remaining > 0;
  
  return {
    canUse,
    remaining,
    limit: subscription.usageLimit
  };
}

/**
 * Log API usage
 */
export async function logUsage(
  userId: string, 
  searchAddress: string, 
  planType: string, 
  success: boolean = true, 
  metadata: Record<string, any> = {}
): Promise<void> {
  return withDatabase(async (client: PoolClient) => {
    await client.query(
      `INSERT INTO usage_logs (user_id, search_address, plan_type, success, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, searchAddress, planType, success, JSON.stringify(metadata)]
    );
  });
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string, days: number = 30): Promise<{
  totalSearches: number;
  successfulSearches: number;
  currentMonthUsage: number;
  subscription: Subscription | null;
}> {
  return withDatabase(async (client: PoolClient) => {
    const [usageResult, subscription] = await Promise.all([
      client.query(
        `SELECT 
          COUNT(*) as total_searches,
          COUNT(*) FILTER (WHERE success = true) as successful_searches,
          COUNT(*) FILTER (WHERE timestamp >= date_trunc('month', CURRENT_TIMESTAMP)) as current_month_usage
         FROM usage_logs 
         WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'`,
        [userId]
      ),
      getSubscriptionByUserId(userId)
    ]);
    
    const stats = usageResult.rows[0] || { total_searches: 0, successful_searches: 0, current_month_usage: 0 };
    
    return {
      totalSearches: parseInt(stats.total_searches),
      successfulSearches: parseInt(stats.successful_searches),
      currentMonthUsage: parseInt(stats.current_month_usage),
      subscription
    };
  });
}

/**
 * Check if Stripe event has been processed
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  return withDatabase(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT id FROM stripe_events WHERE id = $1`,
      [eventId]
    );
    
    return result.rows.length > 0;
  });
}

/**
 * Mark Stripe event as processed
 */
export async function markEventAsProcessed(eventId: string, eventType: string, eventData: any): Promise<void> {
  return withDatabase(async (client: PoolClient) => {
    await client.query(
      `INSERT INTO stripe_events (id, type, data) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [eventId, eventType, JSON.stringify(eventData)]
    );
  });
}