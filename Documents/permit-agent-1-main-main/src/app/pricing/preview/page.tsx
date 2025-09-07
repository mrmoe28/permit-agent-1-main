'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageDashboard } from '@/components/dashboard/usage-dashboard';
import { PaywallModal } from '@/components/paywall/paywall-modal';
import { UsageBanner } from '@/components/paywall/usage-banner';
import { 
  mockFreeSubscription, 
  mockProSubscription, 
  mockNearLimitSubscription,
  mockOverLimitSubscription 
} from '@/lib/mock/subscription-data';
import { Building2 } from 'lucide-react';
import Link from 'next/link';

export default function PricingPreviewPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState(mockFreeSubscription);
  
  const subscriptionOptions = [
    { key: 'free', label: 'Free Plan', data: mockFreeSubscription },
    { key: 'pro', label: 'Pro Plan', data: mockProSubscription },
    { key: 'near_limit', label: 'Near Limit', data: mockNearLimitSubscription },
    { key: 'over_limit', label: 'Over Limit', data: mockOverLimitSubscription },
  ];
  
  const modalTriggers = [
    { key: 'limit_reached', label: 'Limit Reached Modal', trigger: 'limit_reached' as const },
    { key: 'upgrade_prompt', label: 'Upgrade Prompt Modal', trigger: 'upgrade_prompt' as const },
    { key: 'feature_gate', label: 'Feature Gate Modal', trigger: 'feature_gate' as const },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PermitAgent</h1>
                <p className="text-gray-600 text-sm">Component Preview</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-blue-600 hover:text-blue-800">
                View Pricing Page
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Preview Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subscription Selector */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Subscription Type</h3>
                  <div className="space-y-2">
                    {subscriptionOptions.map(option => (
                      <button
                        key={option.key}
                        onClick={() => setSelectedSubscription(option.data)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedSubscription.id === option.data.id
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">
                          {option.data.usage.currentUsage}/{option.data.usage.limit === -1 ? '∞' : option.data.usage.limit} searches
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Modal Triggers */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Test Modals</h3>
                  <div className="space-y-2">
                    {modalTriggers.map(modal => (
                      <Button
                        key={modal.key}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveModal(modal.key)}
                      >
                        {modal.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Quick Links */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
                  <div className="space-y-2">
                    <Link href="/pricing" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Live Pricing Page
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Usage Banner */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Usage Banner</h2>
              <UsageBanner 
                currentUsage={selectedSubscription.usage.currentUsage}
                limit={selectedSubscription.usage.limit}
                planType={selectedSubscription.planType}
              />
            </div>
            
            {/* Usage Dashboard */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Usage Dashboard</h2>
              <UsageDashboard 
                subscription={selectedSubscription}
              />
            </div>
            
            {/* Component Info */}
            <Card>
              <CardHeader>
                <CardTitle>Component Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Plan:</span>
                    <span className="ml-2 capitalize">{selectedSubscription.planType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 capitalize">{selectedSubscription.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Usage:</span>
                    <span className="ml-2">
                      {selectedSubscription.usage.currentUsage}/{selectedSubscription.usage.limit === -1 ? '∞' : selectedSubscription.usage.limit}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Reset Date:</span>
                    <span className="ml-2">
                      {new Date(selectedSubscription.usage.resetDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {modalTriggers.map(modal => (
        <PaywallModal 
          key={modal.key}
          isOpen={activeModal === modal.key}
          onClose={() => setActiveModal(null)}
          currentUsage={selectedSubscription.usage.currentUsage}
          limit={selectedSubscription.usage.limit}
          planType={selectedSubscription.planType}
          trigger={modal.trigger}
        />
      ))}
    </div>
  );
}