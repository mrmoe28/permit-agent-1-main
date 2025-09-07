'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatPlanLimit } from '@/lib/constants/subscription-plans';
import { TrendingUp, X, Zap, AlertTriangle } from 'lucide-react';
import { PaywallModal } from './paywall-modal';

interface UsageBannerProps {
  currentUsage: number;
  limit: number;
  planType: string;
  onDismiss?: () => void;
  className?: string;
}

export function UsageBanner({ 
  currentUsage, 
  limit, 
  planType,
  onDismiss,
  className = ''
}: UsageBannerProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const usagePercentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const remainingSearches = Math.max(0, limit - currentUsage);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  // Don't show if unlimited plan or dismissed
  if (limit === -1 || isDismissed) {
    return null;
  }
  
  // Determine banner type based on usage
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;
  
  const getBannerStyle = () => {
    if (isAtLimit) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (isNearLimit) {
      return 'bg-amber-50 border-amber-200 text-amber-800';
    } else {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  const getIcon = () => {
    if (isAtLimit) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else if (isNearLimit) {
      return <TrendingUp className="h-5 w-5 text-amber-600" />;
    } else {
      return <Zap className="h-5 w-5 text-blue-600" />;
    }
  };
  
  const getMessage = () => {
    if (isAtLimit) {
      return {
        title: 'Search limit reached',
        description: `You've used all ${limit} searches this month. Upgrade to continue.`,
        action: 'Upgrade Now'
      };
    } else if (isNearLimit) {
      return {
        title: 'Approaching your limit',
        description: `${remainingSearches} of ${limit} searches remaining. Consider upgrading for unlimited access.`,
        action: 'View Plans'
      };
    } else {
      return {
        title: 'Track your usage',
        description: `${remainingSearches} of ${limit} searches remaining this month.`,
        action: 'Upgrade'
      };
    }
  };
  
  const message = getMessage();
  
  return (
    <>
      <div className={`border rounded-lg p-4 ${getBannerStyle()} ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{message.title}</h4>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <p className="text-sm mb-3 opacity-90">
              {message.description}
            </p>
            
            {/* Progress Bar */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>{currentUsage} used</span>
                <span>{formatPlanLimit(limit)} limit</span>
              </div>
              <Progress 
                value={Math.min(usagePercentage, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setShowPaywall(true)}
                className={`${
                  isAtLimit 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : isNearLimit 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {message.action}
              </Button>
              
              {!isAtLimit && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDismiss}
                  className="text-current hover:bg-black/5"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        currentUsage={currentUsage}
        limit={limit}
        planType={planType}
        trigger={isAtLimit ? 'limit_reached' : 'upgrade_prompt'}
      />
    </>
  );
}