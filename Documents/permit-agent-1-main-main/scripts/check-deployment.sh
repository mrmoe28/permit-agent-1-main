#!/bin/bash

# Simple deployment status checker
echo "🔍 Checking Vercel deployment status..."
echo ""

# Get the latest deployment
latest=$(vercel ls 2>/dev/null | grep -E "^\s+\S+\s+https://" | head -1)

if [ -z "$latest" ]; then
    echo "❌ Could not fetch deployment status"
    exit 1
fi

# Parse the deployment info
age=$(echo "$latest" | awk '{print $1}')
url=$(echo "$latest" | awk '{print $2}')
status=$(echo "$latest" | awk '{print $3 " " $4}')

# Check status and display appropriate message
if [[ "$status" == *"Ready"* ]]; then
    echo "✅ Latest deployment is READY!"
    echo "   Age: $age"
    echo "   URL: $url"
    echo ""
    echo "🎉 Deployment successful! Visit your site at:"
    echo "   $url"
elif [[ "$status" == *"Building"* ]] || [[ "$status" == *"Queued"* ]]; then
    echo "🔄 Deployment in progress..."
    echo "   Age: $age"
    echo "   Status: $status"
    echo "   URL: $url"
    echo ""
    echo "⏳ Please wait, deployment is still in progress..."
elif [[ "$status" == *"Error"* ]]; then
    echo "❌ Deployment failed!"
    echo "   Age: $age"
    echo "   URL: $url"
    echo ""
    echo "Run 'vercel logs $url' to see error details"
else
    echo "❓ Unknown status: $status"
    echo "   Age: $age"
    echo "   URL: $url"
fi

echo ""
echo "To see all deployments, run: vercel ls"
echo "To monitor continuously, run: watch -n 10 ./scripts/check-deployment.sh"