#!/bin/bash

echo "=== Vercel Setup Checker ==="
echo ""

# Check if in correct directory
if [ ! -f "vridge_front/package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Check for vercel.json
if [ -f "vridge_front/vercel.json" ]; then
    echo "✅ vercel.json found"
else
    echo "❌ vercel.json not found in vridge_front/"
fi

# Check for .vercel directory
if [ -d "vridge_front/.vercel" ]; then
    echo "✅ .vercel directory exists"
    if [ -f "vridge_front/.vercel/project.json" ]; then
        echo "📋 Project info:"
        cat vridge_front/.vercel/project.json | grep -E '"projectId"|"orgId"'
    fi
else
    echo "⚠️  .vercel directory not found - run 'vercel link' in vridge_front/"
fi

# Check environment files
echo ""
echo "📄 Environment files:"
for env_file in vridge_front/.env*; do
    if [ -f "$env_file" ]; then
        echo "  - $(basename $env_file)"
    fi
done

# Test build
echo ""
echo "🔨 Testing build..."
cd vridge_front
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Check /tmp/build.log for details"
    tail -20 /tmp/build.log
fi

echo ""
echo "=== Setup Check Complete ==="