# Data Retention Setup

## Overview

The data retention system automatically anonymizes guest data after 7 years from their last check-out date, in compliance with the Jamaican Data Protection Act.

## Current Limitation

Due to Vercel plan limitations (2 cron jobs maximum), the data retention cron job cannot be automatically scheduled. The API endpoint is available and can be called manually or via an external service.

## Manual Execution

### Option 1: Manual API Call

You can manually trigger the data retention process by calling the API endpoint:

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/data-retention" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** Set `CRON_SECRET` in your Vercel environment variables and use it in the Authorization header.

### Option 2: External Cron Service

Use an external cron service (e.g., cron-job.org, EasyCron) to call the endpoint monthly:

- **URL:** `https://your-domain.vercel.app/api/cron/data-retention`
- **Method:** GET
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`
- **Schedule:** First day of each month at 2:00 AM UTC

### Option 3: Upgrade Vercel Plan

Upgrade your Vercel plan to allow more cron jobs, then add this to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-checkin-emails",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/data-retention",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

## Environment Variables

Make sure to set the following in your Vercel project:

- `CRON_SECRET` - A secure random string used to authenticate cron job requests

## What It Does

The data retention process:

1. Finds guests with reservations that checked out more than 7 years ago
2. Anonymizes their personal data:
   - Name → "Guest #[ID]"
   - Email → "anonymized-[ID]@lavendermoon.anonymized"
   - Phone → NULL
   - Address → NULL
3. Preserves reservation metadata (dates, room, price) for business analytics
4. Marks the guest record as anonymized with a timestamp

## Database Migration

Before running the data retention process, ensure you've run the migration:

```sql
-- Run: database-migrations/add-data-retention-fields.sql
```

This adds the `data_retention_anonymized` and `anonymized_at` fields to the `guests` table.

## Monitoring

Check the API response to see how many guests were anonymized:

```json
{
  "success": true,
  "timestamp": "2026-01-06T10:00:00.000Z",
  "cutoff_date": "2019-01-06T10:00:00.000Z",
  "guests_found": 5,
  "guests_anonymized": 5
}
```

