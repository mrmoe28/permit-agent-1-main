#!/bin/bash

# PermitAgent Auto-Deploy Script
# Run this after git push to deploy to Vercel

echo "🚀 Deploying PermitAgent to Vercel..."

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Not on main branch. Current branch: $current_branch"
    echo "Please switch to main branch first: git checkout main"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ You have uncommitted changes. Please commit them first."
    git status --short
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://permitagent1.vercel.app"
