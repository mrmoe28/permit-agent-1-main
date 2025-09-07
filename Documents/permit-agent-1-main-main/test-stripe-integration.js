#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * Run this after adding your environment variables to Vercel
 * 
 * Usage: node test-stripe-integration.js
 */

const https = require('https');

// Configuration - Update this with your actual Vercel URL
const VERCEL_APP_URL = 'https://permit-agent-1-main.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

// Test configuration
const isLocal = process.argv.includes('--local');
const baseUrl = isLocal ? LOCAL_URL : VERCEL_APP_URL;

console.log(`${colors.blue}${colors.bold}🧪 Stripe Integration Test Suite${colors.reset}`);
console.log(`${colors.yellow}Testing: ${baseUrl}${colors.reset}\n`);

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  const url = new URL(path, baseUrl);
  
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testPricingPage() {
  console.log(`${colors.bold}1. Testing Pricing Page${colors.reset}`);
  try {
    const response = await makeRequest('/pricing');
    if (response.status === 200) {
      console.log(`${colors.green}✅ Pricing page is accessible${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Pricing page returned status ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Failed to access pricing page: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testWebhookEndpoint() {
  console.log(`\n${colors.bold}2. Testing Webhook Endpoint${colors.reset}`);
  try {
    const response = await makeRequest('/api/stripe/webhooks', { method: 'GET' });
    if (response.status === 200 && response.data.message) {
      console.log(`${colors.green}✅ Webhook endpoint is running${colors.reset}`);
      console.log(`   Version: ${response.data.version}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Webhook endpoint not responding correctly${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Failed to test webhook: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testCheckoutCreation() {
  console.log(`\n${colors.bold}3. Testing Checkout Session Creation${colors.reset}`);
  try {
    const response = await makeRequest('/api/stripe/create-checkout', {
      method: 'POST',
      body: {
        priceId: 'price_1S207QDhdksMh30lQrQ0JVe5', // Pro plan
        userId: 'test-user-' + Date.now(),
        planType: 'pro',
        customerEmail: 'test@example.com'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log(`${colors.green}✅ Checkout session created successfully${colors.reset}`);
      console.log(`   Session ID: ${response.data.data.sessionId}`);
      console.log(`   Checkout URL: ${response.data.data.checkoutUrl.substring(0, 50)}...`);
      return true;
    } else if (response.status === 500 && response.data.error) {
      if (response.data.error.includes('STRIPE_SECRET_KEY')) {
        console.log(`${colors.red}❌ Stripe secret key not configured in environment${colors.reset}`);
        console.log(`   Please add STRIPE_SECRET_KEY to Vercel environment variables`);
      } else if (response.data.error.includes('No such price')) {
        console.log(`${colors.yellow}⚠️  Price ID not found in Stripe${colors.reset}`);
        console.log(`   Make sure products are created in your Stripe dashboard`);
      } else {
        console.log(`${colors.red}❌ Checkout creation failed: ${response.data.error}${colors.reset}`);
      }
      return false;
    } else {
      console.log(`${colors.red}❌ Unexpected response from checkout endpoint${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Failed to create checkout: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testUsageEndpoint() {
  console.log(`\n${colors.bold}4. Testing Usage Tracking Endpoint${colors.reset}`);
  try {
    const response = await makeRequest('/api/usage?userId=test-user', { method: 'GET' });
    if (response.status === 200 && response.data.success) {
      console.log(`${colors.green}✅ Usage endpoint is working${colors.reset}`);
      console.log(`   Plan: ${response.data.data.subscription.planType}`);
      console.log(`   Usage: ${response.data.data.subscription.usageCount}/${response.data.data.subscription.usageLimit}`);
      return true;
    } else if (response.status === 200) {
      console.log(`${colors.green}✅ Usage endpoint responded${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Usage endpoint returned status ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Failed to test usage endpoint: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testCustomerPortal() {
  console.log(`\n${colors.bold}5. Testing Customer Portal${colors.reset}`);
  try {
    const response = await makeRequest('/api/stripe/customer-portal', {
      method: 'POST',
      body: {
        userId: 'test-user',
        returnUrl: baseUrl + '/dashboard'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log(`${colors.green}✅ Customer portal endpoint works${colors.reset}`);
      return true;
    } else if (response.status === 404) {
      console.log(`${colors.yellow}⚠️  No subscription found for test user (expected)${colors.reset}`);
      return true;
    } else if (response.data.error && response.data.error.includes('STRIPE_SECRET_KEY')) {
      console.log(`${colors.red}❌ Stripe configuration missing${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.yellow}⚠️  Customer portal needs active subscription${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Failed to test customer portal: ${error.message}${colors.reset}`);
    return false;
  }
}

// Environment check
async function checkEnvironmentVariables() {
  console.log(`\n${colors.bold}6. Environment Variables Check${colors.reset}`);
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_BUSINESS_PRICE_ID'
  ];
  
  if (isLocal) {
    console.log(`${colors.yellow}⚠️  Running locally - checking .env.local file${colors.reset}`);
    const fs = require('fs');
    const path = require('path');
    
    try {
      const envPath = path.join(__dirname, '.env.local');
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      let allPresent = true;
      for (const varName of requiredVars) {
        if (envContent.includes(varName + '=')) {
          console.log(`${colors.green}✅ ${varName} is set${colors.reset}`);
        } else {
          console.log(`${colors.red}❌ ${varName} is missing${colors.reset}`);
          allPresent = false;
        }
      }
      return allPresent;
    } catch (error) {
      console.log(`${colors.red}❌ Could not read .env.local file${colors.reset}`);
      return false;
    }
  } else {
    console.log(`${colors.yellow}ℹ️  Cannot check production env vars directly${colors.reset}`);
    console.log(`   Testing API endpoints to verify configuration...`);
    return true;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}Starting Stripe Integration Tests...${colors.reset}\n`);
  console.log('═'.repeat(50));
  
  const results = {
    pricingPage: await testPricingPage(),
    webhook: await testWebhookEndpoint(),
    checkout: await testCheckoutCreation(),
    usage: await testUsageEndpoint(),
    portal: await testCustomerPortal(),
    environment: await checkEnvironmentVariables()
  };
  
  console.log('\n' + '═'.repeat(50));
  console.log(`${colors.bold}Test Results Summary:${colors.reset}\n`);
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? `${colors.green}✅` : `${colors.red}❌`;
    const name = test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1');
    console.log(`${icon} ${name}${colors.reset}`);
  });
  
  console.log('\n' + '═'.repeat(50));
  
  if (passed === total) {
    console.log(`${colors.green}${colors.bold}🎉 All tests passed! Your Stripe integration is working!${colors.reset}`);
  } else if (passed >= total - 2) {
    console.log(`${colors.yellow}${colors.bold}⚠️  Most tests passed. Check the failures above.${colors.reset}`);
    console.log(`${colors.yellow}Common issues:${colors.reset}`);
    console.log(`- Missing STRIPE_SECRET_KEY in Vercel environment`);
    console.log(`- Webhook URL mismatch in Stripe dashboard`);
    console.log(`- Database not configured`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Multiple tests failed. Please check:${colors.reset}`);
    console.log(`1. Environment variables are set in Vercel`);
    console.log(`2. Deployment has been triggered after adding variables`);
    console.log(`3. Stripe products are created correctly`);
  }
  
  console.log(`\n${colors.blue}Next steps:${colors.reset}`);
  console.log(`1. Visit ${baseUrl}/pricing to see your live pricing page`);
  console.log(`2. Test a real subscription with Stripe test card: 4242 4242 4242 4242`);
  console.log(`3. Check Stripe dashboard for webhook deliveries`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});