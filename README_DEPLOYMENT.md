# Deployment Guide for Vlanet/VideoPlanet

This guide ensures stable and error-free deployments.

## Prerequisites

### 1. GitHub Secrets Setup
Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN`: Your Vercel access token
- `VERCEL_ORG_ID`: Your Vercel organization ID  
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 2. Vercel Project Configuration
1. Create a project in Vercel dashboard
2. Link it to your GitHub repository
3. Set the custom domain (vlanet.net)

## Environment Variables

The following environment variables are automatically set during build:

```bash
REACT_APP_API_BASE_URL=https://videoplanet.up.railway.app/api
REACT_APP_BACKEND_API_URL=https://videoplanet.up.railway.app/api
REACT_APP_BACKEND_URI=https://videoplanet.up.railway.app
REACT_APP_SOCKET_URI=wss://videoplanet.up.railway.app
```

## Deployment Process

### Automatic Deployment
Every push to the `main` branch triggers:
1. Backend deployment to Railway (automatic)
2. Frontend deployment to Vercel (via GitHub Actions)

### Manual Deployment
1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"

## Troubleshooting

### Common Issues and Solutions

1. **Package-lock.json conflicts**
   ```bash
   cd vridge_front
   rm -rf node_modules package-lock.json
   npm install
   git add package-lock.json
   git commit -m "fix: Update package-lock.json"
   git push
   ```

2. **Build failures**
   - Check if all environment variables are set
   - Verify `vercel.json` configuration
   - Test build locally: `cd vridge_front && npm run build`

3. **Vercel deployment errors**
   - Verify GitHub Secrets are correctly set
   - Check Vercel project settings
   - Ensure domain is properly configured

## Testing Deployment Locally

Run the test script:
```bash
cd vridge_front
chmod +x deploy-test.sh
./deploy-test.sh
```

## Important Notes

1. Always test builds locally before pushing
2. Keep dependencies up to date
3. Monitor GitHub Actions logs for errors
4. Use `--legacy-peer-deps` for dependency conflicts
5. The deployment uses pre-built files to avoid Vercel build environment issues

## Support

For issues:
1. Check GitHub Actions logs
2. Verify Vercel dashboard for errors
3. Test locally with the deploy-test.sh script
4. Review this documentation