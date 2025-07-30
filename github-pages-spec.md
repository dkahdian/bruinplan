# GitHub Pages Deployment Specification for BruinPlan

## Overview

BruinPlan is deployed to GitHub Pages using a custom GitHub Actions workflow that builds the SvelteKit application as a static site and deploys it to the repository's GitHub Pages environment.

## Deployment Architecture

### Repository Setup
- **Repository**: `dkahdian/bruinplan`
- **Branch**: `main` (primary deployment branch)
- **GitHub Pages Source**: GitHub Actions (not legacy branch-based deployment)
- **Base Path**: `/bruinplan` (matches repository name)

### SvelteKit Configuration

The application uses `@sveltejs/adapter-static` for static site generation:

```javascript
// svelte.config.js
import adapterStatic from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapterStatic({
      fallback: '404.html',        // SPA fallback for client-side routing
      precompress: false          // Disable precompression for GitHub Pages
    }),
    paths: {
      base: process.argv.includes('dev') ? '' : process.env.BASE_PATH
    }
  }
};
```

**Key Configuration Notes:**
- **Dynamic Adapter Selection**: Uses `adapter-auto` in development and `adapter-static` in production
- **Base Path Handling**: Automatically sets base path from `BASE_PATH` environment variable in production
- **Fallback**: Uses `404.html` as fallback for SPA routing (GitHub Pages serves this for missing routes)

## GitHub Actions Workflow

### Workflow File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: 'main'

jobs:
  build_site:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: build
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'
        run: |
          npm run build
          cp build/404.html build/index.html

      - name: Upload Artifacts
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'build/'

  deploy:
    needs: build_site
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

### Workflow Breakdown

#### Build Job (`build_site`)
1. **Checkout**: Gets the latest code from `main` branch
2. **Node.js Setup**: Installs Node.js 20 with npm cache
3. **Dependencies**: Runs `npm install`
4. **Build**: 
   - Sets `BASE_PATH` environment variable to `/bruinplan`
   - Runs `npm run build` (which triggers SvelteKit static build)
   - **Critical Step**: Copies `404.html` to `index.html` for root route handling
5. **Upload**: Uploads the `build/` directory as a GitHub Pages artifact

#### Deploy Job (`deploy`)
1. **Dependencies**: Waits for `build_site` to complete
2. **Permissions**: Has write access to GitHub Pages and ID token
3. **Environment**: Deploys to `github-pages` environment
4. **Deploy**: Uses official `actions/deploy-pages@v4` action

## Static Assets and Data

### Directory Structure After Build
```
build/
├── index.html              # Root route (copied from 404.html)
├── 404.html               # SPA fallback for missing routes
├── course_index.json      # Course search index
├── major_index.json       # Major search index
├── majors.json           # Legacy major data (if exists)
├── subjects.json         # Subject list
├── .nojekyll             # Prevents Jekyll processing
├── courses/              # Course data by subject (168 files)
│   ├── AERO ST.json
│   ├── ANTHRO.json
│   └── ...
├── majors/               # Major requirement files
│   ├── Aerospace Engineering.json
│   ├── Computer Science.json
│   └── ...
└── _app/                 # SvelteKit application bundle
    ├── version.json
    ├── env.js
    └── immutable/        # Hashed static assets
```

### Data Loading Strategy
- **Lazy Loading**: Course and major data loaded on-demand via fetch API
- **Index Files**: Small index files enable fast search without loading full datasets
- **Split Course Data**: 168 separate JSON files (one per subject) for efficient loading
- **Client-Side Caching**: Data cached in memory after first load

## Browser Routing and SPA Behavior

### Route Handling
1. **GitHub Pages**: Serves static files from `build/` directory
2. **Missing Routes**: GitHub Pages serves `404.html` for any missing file
3. **SvelteKit Router**: `404.html` contains the full SvelteKit app, which handles client-side routing
4. **Root Route**: `index.html` is identical to `404.html` to handle direct visits to base URL

### URL Structure
- **Base URL**: `https://dkahdian.github.io/bruinplan/`
- **Course Pages**: `/bruinplan/courses/[courseId]`
- **Major Pages**: `/bruinplan/majors/[majorId]`
- **Other Routes**: `/bruinplan/about`, `/bruinplan/help`, etc.

## Jekyll Prevention

### `.nojekyll` File
A `.nojekyll` file is placed in the build output to prevent GitHub Pages from processing files with Jekyll, which could interfere with SvelteKit's file structure and routing.

## Known Issues and Limitations

### Current Issues (None Critical)
✅ **All major issues resolved as of latest deployment**

### Potential Improvements
1. **Precompression**: Could enable gzip precompression for faster loading
2. **CDN Caching**: Static assets could benefit from longer cache headers
3. **Bundle Splitting**: Large course data bundle could be further optimized

## Deployment Triggers

### Automatic Deployment
- **Trigger**: Any push to `main` branch
- **Build Time**: ~2-3 minutes
- **Propagation**: 1-5 minutes after build completion

### Manual Deployment
- Navigate to GitHub repository > Actions tab
- Select "Deploy to GitHub Pages" workflow
- Click "Run workflow" > Select `main` branch

## Environment Variables

### Build-Time Variables
- `BASE_PATH`: Set to `/bruinplan` during GitHub Actions build
- `NODE_ENV`: Automatically set to `production` during build

### Runtime Configuration
- No runtime environment variables required
- All configuration handled at build time

## Security and Permissions

### GitHub Repository Settings
- **Pages Source**: GitHub Actions (recommended)
- **Environment Protection**: Optional branch protection rules
- **Secrets**: None required for basic deployment

### Required Permissions
```yaml
permissions:
  pages: write      # Deploy to GitHub Pages
  id-token: write   # OIDC token for secure deployment
```

## Monitoring and Debugging

### Deployment Status
- Check GitHub repository > Actions tab for build logs
- Environment deployments visible in repository > Environments

### Common Debug Steps
1. **Build Fails**: Check Actions logs for npm/build errors
2. **404 Errors**: Verify base path configuration and routing
3. **Asset Loading**: Check browser network tab for failed requests
4. **Data Issues**: Verify JSON files exist in build output

### Logs and Debugging
- **Build Logs**: Available in GitHub Actions for 90 days
- **Runtime Errors**: Browser console (client-side only)
- **Performance**: Browser DevTools for bundle analysis

## Best Practices

### Deployment Workflow
1. **Local Testing**: Always test locally with `npm run build && npm run preview`
2. **Base Path Testing**: Test with base path using `BASE_PATH=/bruinplan npm run build`
3. **Incremental Changes**: Small, focused commits for easier debugging
4. **Branch Protection**: Consider requiring PR reviews for `main` branch

### Performance Considerations
- **Bundle Size**: Monitor bundle size warnings during build
- **Data Splitting**: Keep individual course/major files small
- **Image Optimization**: Optimize any images before committing
- **Lazy Loading**: Utilize SvelteKit's built-in code splitting

## Troubleshooting Guide

### Common Issues and Solutions

#### Build Failures
```bash
# Check for TypeScript errors
npm run check

# Check for linting issues
npm run lint

# Local build test
npm run build
```

#### Routing Issues
1. Verify `base` path is correctly configured in `app.html`
2. Check that all internal links use `$app/paths` base path
3. Ensure `404.html` fallback is properly configured

#### Data Loading Issues
1. Verify JSON files are included in build output
2. Check network requests in browser DevTools
3. Validate JSON syntax in data files

This specification should be updated as the deployment process evolves or GitHub Pages features change.
