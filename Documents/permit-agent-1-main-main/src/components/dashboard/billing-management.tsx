'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Subscription } from '@/types';
import { getPlanById, SUBSCRIPTION_PLANS } from '@/lib/constants/subscription-plans';
import { formatCurrency } from '@/lib/utils/index';
import { 
  CreditCard, 
  Calendar, 
  Settings, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Receipt
} from 'lucide-react';

interface BillingManagementProps {
  subscription: Subscription;
  onPlanChange?: (newPlanId: string) => void;
}

export function BillingManagement({ subscription, onPlanChange: _onPlanChange }: BillingManagementProps) {
  // const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const currentPlan = getPlanById(subscription.planType);
  const availablePlans = SUBSCRIPTION_PLANS.filter(plan => 
    plan.id !== subscription.planType && plan.id !== 'free'
  );
  
  const handleManageBilling = async () => {
    setLoadingAction('portal');
    
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
    } finally {
      setLoadingAction(null);
    }
  };
  
  const handleUpgrade = async (planId: string) => {
    setLoadingAction(planId);
    
    try {
      const targetPlan = getPlanById(planId);
      if (!targetPlan) return;
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: targetPlan.stripePriceId,
          customerId: subscription.stripeCustomerId,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing`
        })
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating upgrade session:', error);
    } finally {
      setLoadingAction(null);
    }
  };
  
  if (!currentPlan) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Unable to load billing information
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
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
            {/* Plan Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentPlan.displayName}</h3>
                  <p className="text-gray-600">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentPlan.price)}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-600">Renews on:</span>
                    <span className="ml-1 font-medium">
                      {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-600">Next charge:</span>
                    <span className="ml-1 font-medium">
                      {subscription.cancelAtPeriodEnd ? 'None' : formatCurrency(currentPlan.price)}
                    </span>
                  </span>
                </div>
              </div>
              
              {subscription.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Subscription Ending</p>
                      <p className="mt-1">
                        Your subscription will end on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}. 
                        You&apos;ll be switched to the Free plan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleManageBilling}
                disabled={loadingAction !== null}
                className="flex-1"
              >
                {loadingAction === 'portal' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </div>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
              
              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <Button 
                  variant="outline" 
                  onClick={handleManageBilling}
                  disabled={loadingAction !== null}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Customer Portal
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upgrade Options */}
      {availablePlans.length > 0 && subscription.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Get more features and higher limits with an upgraded plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availablePlans.map((plan) => {
                const isUpgrade = plan.price > currentPlan.price;
                const isLoading = loadingAction === plan.id;
                
                return (
                  <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{plan.displayName}</h4>
                          {plan.recommended && (
                            <Badge variant="default" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {plan.searchLimit === -1 ? 'Unlimited' : plan.searchLimit} searches/month
                          </span>
                          {plan.features.slice(0, 2).map((feature: string, index: number) => (
                            <span key={index} className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {feature.split(' ').slice(0, 3).join(' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(plan.price)}
                          </div>
                          <div className="text-sm text-gray-500">per month</div>
                        </div>
                        
                        <Button 
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isLoading}
                          variant={isUpgrade ? 'default' : 'outline'}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </div>
                          ) : (
                            <>
                              {isUpgrade ? 'Upgrade' : 'Switch'}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Billing History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Billing history will appear here</p>
            <p className="text-xs text-gray-400 mt-1">
              Use the &quot;Manage Billing&quot; button above to view detailed invoice history
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}