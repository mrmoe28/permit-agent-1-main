interface SubscriptionPlan {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  price: number;
  interval?: string;
  searchLimit: number;
  features: string[];
  stripePriceId?: string;
  popular?: boolean;
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for trying out PermitAgent',
    price: 0,
    interval: 'month',
    searchLimit: 3,
    features: [
      '3 permit searches per month',
      'Basic jurisdiction information',
      'Permit fees and requirements',
      'Contact information',
      'Export to PDF'
    ]
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    description: 'For contractors and small teams',
    price: 19,
    interval: 'month',
    searchLimit: 50,
    recommended: true,
    features: [
      '50 permit searches per month',
      'All Free features',
      'Priority customer support',
      'Advanced export options',
      'Search history and bookmarks',
      'Email notifications',
      'Mobile app access'
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID
  },
  {
    id: 'business',
    name: 'business',
    displayName: 'Business',
    description: 'For large teams and enterprises',
    price: 49,
    interval: 'month',
    searchLimit: -1, // Unlimited
    features: [
      'Unlimited permit searches',
      'All Pro features',
      'API access for integrations',
      'Team management dashboard',
      'Custom reporting',
      'Dedicated account manager',
      'Priority phone support',
      'White-label options'
    ],
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID
  }
];

export const FREE_PLAN = SUBSCRIPTION_PLANS.find(plan => plan.id === 'free')!;
export const PRO_PLAN = SUBSCRIPTION_PLANS.find(plan => plan.id === 'pro')!;
export const BUSINESS_PLAN = SUBSCRIPTION_PLANS.find(plan => plan.id === 'business')!;

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function isUnlimitedPlan(planId: string): boolean {
  const plan = getPlanById(planId);
  return plan ? plan.searchLimit === -1 : false;
}

export function formatPlanLimit(limit: number): string {
  if (limit === -1) return 'Unlimited';
  return limit.toString();
}

export function calculateYearlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.83); // 17% discount for yearly
}

export function getRecommendedPlan(): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find(plan => plan.recommended) || PRO_PLAN;
}