#!/bin/bash

# Deploy test script to validate configuration locally

echo "=== Vercel Deployment Test Script ==="
echo "This script will test the deployment process locally"
echo ""

# Check environment variables
echo "Checking environment variables..."
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ ERROR: VERCEL_TOKEN is not set"
    echo "Please set: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    echo "❌ ERROR: VERCEL_ORG_ID is not set"
    echo "Please set: export VERCEL_ORG_ID=your_org_id_here"
    exit 1
fi

if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ ERROR: VERCEL_PROJECT_ID is not set"
    echo "Please set: export VERCEL_PROJECT_ID=your_project_id_here"
    exit 1
fi

echo "✅ All environment variables are set"
echo ""

# Test build
echo "Testing build process..."
export REACT_APP_API_BASE_URL=https://videoplanet.up.railway.app/api
export REACT_APP_BACKEND_API_URL=https://videoplanet.up.railway.app/api
export REACT_APP_BACKEND_URI=https://videoplanet.up.railway.app
export REACT_APP_SOCKET_URI=wss://videoplanet.up.railway.app
export CI=false

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Test Vercel CLI
echo "Testing Vercel CLI..."
npx vercel --version
if [ $? -ne 0 ]; then
    echo "❌ Vercel CLI not available"
    exit 1
fi

echo "✅ Vercel CLI is available"
echo ""

echo "=== Test completed successfully ==="
echo "You can now deploy with: npx vercel --prod --token=$VERCEL_TOKEN"