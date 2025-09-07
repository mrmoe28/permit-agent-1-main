'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS, formatPlanLimit, calculateYearlyPrice } from '@/lib/constants/subscription-plans';
import { formatCurrency } from '@/lib/utils/index';
import { 
  Building2, 
  Check, 
  Star, 
  Zap, 
  Users, 
  Shield, 
  Headphones, 
  Smartphone, 
  Globe, 
  BarChart3,
  Clock,
  FileText,
  Search,
  ArrowRight,
  CheckCircle,
  Quote
} from 'lucide-react';
import Link from 'next/link';
import { ProfileIcon } from '@/components/profile-icon';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'searches': <Zap className="h-4 w-4" />,
  'support': <Headphones className="h-4 w-4" />,
  'export': <BarChart3 className="h-4 w-4" />,
  'mobile': <Smartphone className="h-4 w-4" />,
  'api': <Globe className="h-4 w-4" />,
  'team': <Users className="h-4 w-4" />,
  'security': <Shield className="h-4 w-4" />
};

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "General Contractor",
    company: "Chen Construction",
    content: "PermitAgent saved me 10+ hours per project. The automatic jurisdiction discovery is a game-changer.",
    rating: 5
  },
  {
    name: "Mike Rodriguez",
    role: "Project Manager",
    company: "Urban Development Co.",
    content: "Finally, a tool that actually works. The AI extraction is incredibly accurate and saves so much time.",
    rating: 5
  },
  {
    name: "Jennifer Walsh",
    role: "Architect",
    company: "Walsh Design Studio",
    content: "The Pro plan pays for itself with just one project. The export features are exactly what we needed.",
    rating: 5
  }
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      // Redirect to sign in with free plan (existing route)
      window.location.href = '/sign-in?plan=free';
      return;
    }

    setLoadingPlanId(planId);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: planId === 'pro' ? 
            (billingInterval === 'yearly' ? process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) :
            (billingInterval === 'yearly' ? process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID),
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        })
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes('search')) return FEATURE_ICONS.searches;
    if (lowerFeature.includes('support')) return FEATURE_ICONS.support;
    if (lowerFeature.includes('export')) return FEATURE_ICONS.export;
    if (lowerFeature.includes('mobile')) return FEATURE_ICONS.mobile;
    if (lowerFeature.includes('api')) return FEATURE_ICONS.api;
    if (lowerFeature.includes('team')) return FEATURE_ICONS.team;
    return <Check className="h-4 w-4" />;
  };

  const getPlanPrice = (plan: any, interval: 'monthly' | 'yearly') => {
    if (plan.price === 0) return 0;
    return interval === 'yearly' ? calculateYearlyPrice(plan.price) : plan.price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PermitAgent</h1>
                <p className="text-gray-600 text-sm">Find permit information for any address</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <ProfileIcon />
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Trusted by 500+ contractors
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get the permit information you need with a plan that scales with your business. 
            Start free and upgrade as you grow.
          </p>
          
          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Save 10+ Hours</h3>
              <p className="text-gray-600 text-sm">
                Skip manual research across government websites
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Search className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600 text-sm">
                Accurate extraction from any government website
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Export Ready</h3>
              <p className="text-gray-600 text-sm">
                Download organized permit packets instantly
              </p>
            </div>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                billingInterval === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              title={`Switch to ${billingInterval === 'monthly' ? 'yearly' : 'monthly'} billing`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingInterval === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingInterval === 'yearly' && (
              <Badge variant="success" className="ml-2">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = getPlanPrice(plan, billingInterval);
            const isLoading = loadingPlanId === plan.id;
            
            return (
              <Card key={plan.id} className={`relative ${plan.recommended ? 'border-blue-500 border-2' : ''}`}>
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-blue-600 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500">
                          /{billingInterval === 'yearly' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingInterval === 'yearly' && price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatCurrency(plan.price)}/month billed annually
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPlanLimit(plan.searchLimit)}
                    </div>
                    <div className="text-sm text-gray-500">
                      permit searches {plan.searchLimit === -1 ? '' : 'per month'}
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="text-blue-600 mt-0.5">
                          {getFeatureIcon(feature)}
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className={`w-full ${plan.recommended ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.recommended ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      plan.price === 0 ? 'Get Started Free' : `Choose ${plan.displayName}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Compare Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Features</th>
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <th key={plan.id} className="text-center py-3 px-4">
                      <div className="font-semibold">{plan.displayName}</div>
                      <div className="text-sm text-gray-500 font-normal">
                        {formatCurrency(getPlanPrice(plan, billingInterval))}
                        {plan.price > 0 && `/${billingInterval === 'yearly' ? 'yr' : 'mo'}`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Monthly Searches</td>
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {formatPlanLimit(plan.searchLimit)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Customer Support</td>
                  <td className="text-center py-3 px-4">Email</td>
                  <td className="text-center py-3 px-4">Priority Email</td>
                  <td className="text-center py-3 px-4">Phone + Email</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">API Access</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Team Management</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">White Label</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What Our Customers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="text-center">
                <div className="mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current inline mx-0.5" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-4 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-gray-500">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Can I change my plan at any time?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we&apos;ll prorate any charges or refunds accordingly.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                What happens if I exceed my search limit?
              </h3>
              <p className="text-gray-600 text-sm">
                Free plan users will be prompted to upgrade. Pro users can purchase additional searches 
                or upgrade to Business for unlimited access.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Is my payment information secure?
              </h3>
              <p className="text-gray-600 text-sm">
                Absolutely. We use Stripe for secure payment processing. We never store your payment 
                information on our servers.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 text-sm">
                We offer a 30-day money-back guarantee on all paid plans. Contact our support team 
                if you&apos;re not satisfied with your subscription.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                How accurate is the permit information?
              </h3>
              <p className="text-gray-600 text-sm">
                Our AI-powered extraction is highly accurate, but we always recommend verifying 
                permit requirements directly with your local jurisdiction before applying.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-blue-600" />
                What support do you provide?
              </h3>
              <p className="text-gray-600 text-sm">
                Free users get email support. Pro users get priority email support. Business users 
                get dedicated phone and email support with a dedicated account manager.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white mb-16">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Streamline Your Permit Research?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join hundreds of contractors who save 10+ hours per project with PermitAgent. 
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => handleSelectPlan('free')}
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => handleSelectPlan('pro')}
            >
              Choose Pro Plan
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              PermitAgent helps contractors and property owners find permit information quickly and accurately.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Questions about pricing? Contact us at{' '}
              <a href="mailto:support@permitagent.com" className="text-blue-600 hover:underline">
                support@permitagent.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}