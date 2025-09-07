import { Subscription } from '@/types';

interface UsageData {
  currentUsage: number;
  limit: number;
  resetDate: Date;
}

interface UserSubscription extends Subscription {
  usage: UsageData;
}

// Mock subscription data for development and testing
export const mockUsageData: UsageData = {
  currentUsage: 2,
  limit: 3,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
};

export const mockFreeSubscription: UserSubscription = {
  id: 'sub_1',
  userId: 'user_1',
  planType: 'free',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  stripeCustomerId: 'cus_test_123',
  stripeSubscriptionId: undefined,
  usageCount: 2,
  usageLimit: 3,
  usage: mockUsageData,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  updatedAt: new Date()
};

export const mockProSubscription: UserSubscription = {
  id: 'sub_2',
  userId: 'user_2',
  planType: 'pro',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  stripeCustomerId: 'cus_test_456',
  stripeSubscriptionId: 'sub_test_789',
  usageCount: 32,
  usageLimit: 50,
  usage: {
    currentUsage: 32,
    limit: 50,
    resetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
  },
  createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  updatedAt: new Date()
};

export const mockBusinessSubscription: UserSubscription = {
  id: 'sub_3',
  userId: 'user_3',
  planType: 'business',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  stripeCustomerId: 'cus_test_789',
  stripeSubscriptionId: 'sub_test_012',
  usageCount: 127,
  usageLimit: -1,
  usage: {
    currentUsage: 127,
    limit: -1, // Unlimited
    resetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  },
  createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
  updatedAt: new Date()
};

export const mockNearLimitSubscription: UserSubscription = {
  ...mockFreeSubscription,
  usage: {
    ...mockUsageData,
    currentUsage: 3,
    limit: 3
  }
};

export const mockOverLimitSubscription: UserSubscription = {
  ...mockFreeSubscription,
  usage: {
    ...mockUsageData,
    currentUsage: 5,
    limit: 3,
  }
};

// Helper function to get mock subscription by plan
export function getMockSubscriptionByPlan(planId: string): UserSubscription {
  switch (planId) {
    case 'free':
      return mockFreeSubscription;
    case 'pro':
      return mockProSubscription;
    case 'business':
      return mockBusinessSubscription;
    default:
      return mockFreeSubscription;
  }
}

// Helper function to simulate different usage states
export function getMockSubscriptionByUsage(usageType: 'normal' | 'near_limit' | 'over_limit'): UserSubscription {
  switch (usageType) {
    case 'near_limit':
      return mockNearLimitSubscription;
    case 'over_limit':
      return mockOverLimitSubscription;
    default:
      return mockFreeSubscription;
  }
}