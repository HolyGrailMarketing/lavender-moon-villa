# Setup Staging Branch for Client Testing

## Overview
Create a `staging` branch with all the Phase 3 Next.js work for client testing, while keeping `main` branch as the original static landing page.

## Current State
- `main` branch: Contains the original static HTML landing page (initial commit)
- Working directory: Has all Phase 3 Next.js work (uncommitted)
- Goal: Commit Next.js work to `staging` branch, keep `main` clean

## Steps

### 1. Create Staging Branch from Current Work
- Create new `staging` branch from current working directory state
- This will include all the Next.js/Phase 3 changes
- Branch command: `git checkout -b staging`

### 2. Commit Phase 3 Work to Staging
- Stage all current changes (Next.js conversion, Phase 3 features, etc.)
- Commit with message: "feat: Phase 2 & 3 - Next.js conversion and reservation system"
- Push staging branch to remote: `git push -u origin staging`

### 3. Ensure Main Branch Remains Clean
- Verify main branch still has the original landing page (it should - no commits were made)
- Main will continue to serve the static landing page at production URL

### 4. Configure Vercel for Staging Deployment
- Go to Vercel project settings
- The staging branch will automatically get preview deployments
- Optionally configure a production deployment for staging branch at a custom URL
- Document the staging URL for client access

### 5. Update Documentation
- Update README.md to explain:
  - Main branch: Production landing page (static)
  - Staging branch: Development/testing with full reservation system
  - How client accesses staging environment
  - Workflow: feature work → staging → main (when ready)

## Files to Modify
- README.md - Add staging branch documentation and workflow
- Git: Create new `staging` branch and commit Phase 3 work
- Vercel: Configure via dashboard (manual step with instructions)

## Branch Strategy
```
main (production)
  └── Static landing page only
  └── Deployed to production URL

staging (testing)
  └── Full Next.js app with reservation system
  └── Deployed to staging URL for client testing
  └── Can merge to main when landing page is ready to update
```

## Notes
- Staging uses the same Neon database (shared for now)
- Environment variables configured in Vercel dashboard
- Client gets dedicated staging URL from Vercel
- Main branch stays stable as public-facing landing page

