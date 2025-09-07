'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PaywallModalProps } from '@/types';
import { SUBSCRIPTION_PLANS, formatPlanLimit } from '@/lib/constants/subscription-plans';
import { formatCurrency } from '@/lib/utils/index';
import { 
  Zap, 
  TrendingUp, 
  Crown, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Star
} from 'lucide-react';

export function PaywallModal({
  isOpen,
  onClose,
  currentUsage = 0,
  limit = 3,
  planType: _planType = 'free',
  trigger = 'limit_reached'
}: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  
  const usagePercentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const remainingSearches = Math.max(0, limit - currentUsage);
  
  const getModalContent = () => {
    switch (trigger) {
      case 'limit_reached':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
          title: "Search Limit Reached",
          description: `You've used all ${limit} of your monthly searches. Upgrade to continue finding permit information.`,
          urgency: "high"
        };
      case 'upgrade_prompt':
        return {
          icon: <TrendingUp className="h-12 w-12 text-blue-500" />,
          title: "Ready to Do More?",
          description: `You've used ${currentUsage} of ${limit} searches this month. Upgrade for unlimited access and premium features.`,
          urgency: "medium"
        };
      case 'feature_gate':
        return {
          icon: <Crown className="h-12 w-12 text-purple-500" />,
          title: "Premium Feature",
          description: "This feature is available with Pro and Business plans. Upgrade to unlock advanced capabilities.",
          urgency: "low"
        };
      default:
        return {
          icon: <Zap className="h-12 w-12 text-blue-500" />,
          title: "Upgrade Your Plan",
          description: "Get more searches and premium features with a paid plan.",
          urgency: "medium"
        };
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: planId === 'pro' ? 
            process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID : 
            process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
          successUrl: `${window.location.origin}${window.location.pathname}?upgraded=true`,
          cancelUrl: `${window.location.origin}${window.location.pathname}`
        })
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = getModalContent();
  const proPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === 'pro')!;
  const businessPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === 'business')!;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {modalContent.icon}
          </div>
          <DialogTitle className="text-2xl font-bold">
            {modalContent.title}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {modalContent.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Usage Progress (only show if relevant) */}
        {trigger === 'limit_reached' || trigger === 'upgrade_prompt' ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Monthly Usage
              </span>
              <span className="text-sm text-gray-500">
                {currentUsage} / {formatPlanLimit(limit)} searches
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2 mb-2" />
            <div className="text-xs text-gray-500">
              {trigger === 'limit_reached' ? (
                <span className="text-red-600 font-medium">No searches remaining</span>
              ) : (
                <span>{remainingSearches} searches remaining</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Plan Selection */}
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Choose Your Upgrade
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pro Plan */}
            <div 
              className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedPlan === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedPlan('pro')}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-blue-600 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              
              <div className="text-center">
                <h4 className="font-bold text-xl text-gray-900">{proPlan.displayName}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatCurrency(proPlan.price)}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{proPlan.description}</p>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{formatPlanLimit(proPlan.searchLimit)} searches/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Advanced exports</span>
                </div>
              </div>
            </div>
            
            {/* Business Plan */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedPlan === 'business' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedPlan('business')}
            >
              <div className="text-center">
                <h4 className="font-bold text-xl text-gray-900">{businessPlan.displayName}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-purple-600">
                    {formatCurrency(businessPlan.price)}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{businessPlan.description}</p>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited searches</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Team management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={isLoading}
            className={`w-full ${selectedPlan === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Redirecting...
              </div>
            ) : (
              <span className="flex items-center gap-2">
                Upgrade to {selectedPlan === 'pro' ? 'Pro' : 'Business'}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
            disabled={isLoading}
          >
            {trigger === 'limit_reached' ? 'Maybe Later' : 'Continue with Free'}
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            🔒 Secure payment powered by Stripe • Cancel anytime • 30-day money back guarantee
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}