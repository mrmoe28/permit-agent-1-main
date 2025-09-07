'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Subscription, UsageStats } from '@/types';

interface UsageDashboardProps {
  subscription: Subscription;
  usageData?: UsageStats;
  onUpgrade?: () => void;
  showUpgradePrompt?: boolean;
}
import { getPlanById } from '@/lib/constants/subscription-plans';
import { formatCurrency } from '@/lib/utils/index';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock
} from 'lucide-react';
import { PaywallModal } from '@/components/paywall/paywall-modal';

export function UsageDashboard({ subscription, showUpgradePrompt = false }: UsageDashboardProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  
  const plan = getPlanById(subscription.planType);
  const currentUsage = subscription.usageCount;
  const limit = subscription.usageLimit;
  const usagePercentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const remainingSearches = Math.max(0, limit - currentUsage);
  const daysUntilReset = subscription.currentPeriodEnd ? 
    Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    30;
  
  const getUsageStatus = () => {
    if (limit === -1) return 'unlimited';
    if (usagePercentage >= 100) return 'exceeded';
    if (usagePercentage >= 80) return 'warning';
    if (usagePercentage >= 60) return 'moderate';
    return 'good';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unlimited': return 'text-green-600';
      case 'exceeded': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'moderate': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };
  
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'moderate': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripeCustomerId,
          returnUrl: window.location.href
        })
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
    }
  };

  const usageStatus = getUsageStatus();
  
  if (!plan) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Unable to load subscription information
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Usage Dashboard
              </CardTitle>
              <CardDescription>
                Track your permit searches and subscription usage
              </CardDescription>
            </div>
            <Badge 
              variant={subscription.status === 'active' ? 'default' : 'destructive'}
              className="capitalize"
            >
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">{plan.displayName} Plan</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(plan.price)}
                </div>
                <div className="text-sm text-gray-500">per month</div>
              </div>
            </div>
            
            {/* Usage Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Monthly Searches</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getStatusColor(usageStatus)}`}>
                    {limit === -1 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Unlimited
                      </span>
                    ) : (
                      `${currentUsage} / ${limit}`
                    )}
                  </span>
                </div>
              </div>
              
              {limit > 0 && (
                <div className="space-y-2">
                  <div className="relative">
                    <Progress 
                      value={Math.min(usagePercentage, 100)} 
                      className="h-3"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(usageStatus)}`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {usageStatus === 'exceeded' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={getStatusColor(usageStatus)}>
                        {usageStatus === 'exceeded' ? (
                          'Limit exceeded'
                        ) : usageStatus === 'warning' ? (
                          'Approaching limit'
                        ) : usageStatus === 'moderate' ? (
                          `${remainingSearches} remaining`
                        ) : (
                          `${remainingSearches} searches available`
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Resets in {daysUntilReset} days</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Upgrade Prompt */}
            {(showUpgradePrompt || usageStatus === 'exceeded' || usageStatus === 'warning') && plan.id !== 'business' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">
                      {usageStatus === 'exceeded' ? 'Upgrade Required' : 'Consider Upgrading'}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {usageStatus === 'exceeded' 
                        ? 'You\'ve reached your monthly limit. Upgrade to continue searching.'
                        : 'Get more searches and premium features with a higher tier plan.'
                      }
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => setShowPaywall(true)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      View Upgrade Options
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Subscription Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-600" />
            Subscription Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Current Period</label>
                <div className="text-sm text-gray-900">
                  Ends {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm capitalize ${
                    subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {subscription.status}
                  </span>
                  {subscription.cancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-xs">
                      Canceling
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleManageBilling}
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Usage analytics coming soon</p>
            <p className="text-xs text-gray-400 mt-1">
              We&apos;re working on detailed usage analytics and reporting features
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Paywall Modal */}
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        currentUsage={currentUsage}
        limit={limit}
        planType={plan.id}
        trigger={usageStatus === 'exceeded' ? 'limit_reached' : 'upgrade_prompt'}
      />
    </div>
  );
}