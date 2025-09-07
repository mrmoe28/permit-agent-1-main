#!/bin/bash

# Vercel Deployment Fix Script
# Automatically fixes common deployment issues

set -e

echo "🔧 Vercel Deployment Auto-Fix Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Fix lockfile conflicts
echo "Step 1: Resolving lockfile conflicts..."
if [ -f "/Users/user/package-lock.json" ] && [ -f "package-lock.json" ]; then
    print_warning "Multiple lockfiles detected"
    
    # Compare timestamps
    if [ "/Users/user/package-lock.json" -nt "package-lock.json" ]; then
        print_status "Using newer lockfile from parent directory"
        cp /Users/user/package-lock.json package-lock.json
    else
        print_status "Project lockfile is current"
    fi
    
    # Remove parent lockfile if it exists
    if [ -f "/Users/user/package-lock.json" ]; then
        print_warning "Removing parent directory lockfile to prevent conflicts"
        rm -f /Users/user/package-lock.json
    fi
else
    print_status "No lockfile conflicts found"
fi

# Step 2: Clean build artifacts
echo ""
echo "Step 2: Cleaning build artifacts..."
rm -rf .next
rm -rf .vercel/output
print_status "Build artifacts cleaned"

# Step 3: Reinstall dependencies
echo ""
echo "Step 3: Reinstalling dependencies..."
rm -rf node_modules
npm ci
print_status "Dependencies reinstalled"

# Step 4: Check environment variables
echo ""
echo "Step 4: Checking environment variables..."
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found, pulling from Vercel..."
    vercel env pull .env.local
fi

# Check for required environment variables
required_vars=("OPENAI_API_KEY")
missing_vars=()

if [ -f ".env.local" ]; then
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.local; then
            missing_vars+=($var)
        fi
    done
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_warning "Please add these to your Vercel project settings"
else
    print_status "All required environment variables present"
fi

# Step 5: Run type checking
echo ""
echo "Step 5: Running type checking..."
npm run lint 2>&1 | tee lint-output.log || true

if grep -q "error" lint-output.log; then
    print_warning "Lint errors found, attempting auto-fix..."
    npx eslint . --fix --ext .ts,.tsx,.js,.jsx
    print_status "Auto-fix applied"
fi
rm -f lint-output.log

# Step 6: Test build locally
echo ""
echo "Step 6: Testing build locally..."
if npm run build; then
    print_status "Local build successful"
else
    print_error "Local build failed - check the errors above"
    exit 1
fi

# Step 7: Check Vercel configuration
echo ""
echo "Step 7: Verifying Vercel configuration..."
if [ ! -d ".vercel" ]; then
    print_warning ".vercel directory not found, linking project..."
    vercel link --yes
fi

if [ -f ".vercel/project.json" ]; then
    print_status "Vercel project linked"
else
    print_error "Failed to link Vercel project"
    exit 1
fi

# Step 8: Deploy to Vercel
echo ""
echo "Step 8: Deploying to Vercel..."
echo ""
read -p "Deploy to production? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting production deployment..."
    vercel --prod
else
    print_status "Starting preview deployment..."
    vercel
fi

echo ""
echo "====================================="
echo -e "${GREEN}✅ Deployment fix complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check the deployment URL provided above"
echo "2. Monitor the deployment status with: vercel ls"
echo "3. View logs if needed with: vercel logs [deployment-url]"
echo ""
echo "For continuous monitoring, run:"
echo "  npx tsx scripts/vercel-monitor.ts --continuous"