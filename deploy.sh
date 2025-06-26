#!/bin/bash

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Deploy Backend to Railway
echo -e "${BLUE}1. Deploying Backend to Railway...${NC}"
cd vridge_back
git add -A
git commit -m "Deploy: Backend update $(date +'%Y-%m-%d %H:%M:%S')" || true
git push origin main
echo -e "${GREEN}✓ Backend deployed to Railway${NC}"

# 2. Build Frontend for vlanet.net
echo -e "${BLUE}2. Building Frontend for vlanet.net...${NC}"
cd ../vridge_front

# Copy environment variables
cp .env.vlanet .env.production.local

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# 3. Deploy to Vercel (if using Vercel CLI)
echo -e "${BLUE}3. Deploying Frontend to Vercel...${NC}"
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo -e "${RED}Vercel CLI not installed. Please install it with: npm i -g vercel${NC}"
    echo "Or connect your GitHub repository to Vercel for automatic deployments"
fi

echo -e "${GREEN}🎉 Deployment process completed!${NC}"

# Summary
echo ""
echo "Deployment Summary:"
echo "- Backend: https://videoplanet.up.railway.app"
echo "- Frontend: https://vlanet.net"
echo ""
echo "Note: Make sure to:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure custom domain (vlanet.net) in Vercel"
echo "3. Update DNS records to point to Vercel"