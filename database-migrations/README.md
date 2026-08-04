# Database Migrations

This directory contains SQL migration scripts for updating the database schema.

## Update Reservation Status Constraint

### Problem
The database constraint `reservations_status_check` doesn't include the new payment statuses (`deposit_paid` and `paid_in_full`), causing errors when trying to update reservation status after payment.

### Solution
Run the migration script to update the constraint to include all valid status values.

### How to Run

#### Option 1: Using Neon Console
1. Go to your Neon project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `update-reservation-status-constraint.sql`
4. Execute the SQL

#### Option 2: Using psql
```bash
psql $DATABASE_URL -f database-migrations/update-reservation-status-constraint.sql
```

#### Option 3: Using a Database Client
Open the SQL file in your preferred database client (pgAdmin, DBeaver, etc.) and execute it against your database.

### What the Migration Does
1. Drops the existing `reservations_status_check` constraint
2. Creates a new constraint that allows all valid status values:
   - `pending`
   - `deposit_paid`
   - `paid_in_full`
   - `checked_in`
   - `checked_out`
   - `cancelled`

### Verification
After running the migration, the script will verify the constraint was created correctly by querying the constraint definition.

### Rollback
If you need to rollback, you can restore the old constraint (if you know what it was), or simply run the migration again as it's idempotent (uses `IF EXISTS`).

---

## Add Guest Name to Reservations

### Problem
When the same email is used with different names, all reservations show the same name (from the guests table). This prevents preserving the name that was entered at booking time.

### Solution
Store the guest name directly on each reservation at booking time, so each reservation preserves the name that was entered.

### How to Run

#### Option 1: Using Neon Console
1. Go to your Neon project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add-guest-name-to-reservations.sql`
4. Execute the SQL

#### Option 2: Using psql
```bash
psql $DATABASE_URL -f database-migrations/add-guest-name-to-reservations.sql
```

### What the Migration Does
1. Adds `guest_first_name` and `guest_last_name` columns to the `reservations` table
2. Backfills existing reservations with guest names from the `guests` table
3. Verifies the columns were added correctly

### After Migration
- New reservations will store the guest name entered at booking time
- Each reservation will display the name that was entered when it was created
- Existing reservations will show the current guest name (backfilled from guests table)

### Verification
After running the migration, the script will verify the columns were added by querying the table schema.

---

## Add Room Images Table

### Problem
Vercel Blob Storage `list()` operations count as Advanced Operations and have usage limits. The Hobby plan has a limit of 2K Advanced Operations per month, which was being exceeded by frequent image listing operations.

### Solution
Store image URLs in a PostgreSQL database table instead of using `list()` operations. This eliminates Advanced Operations usage while keeping images stored in Vercel Blob Storage (or public folder) for actual file storage.

### How to Run

#### Option 1: Using Neon Console
1. Go to your Neon project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add-room-images-table.sql`
4. Execute the SQL

#### Option 2: Using psql
```bash
psql $DATABASE_URL -f database-migrations/add-room-images-table.sql
```

### What the Migration Does
1. Creates `room_images` table to store image URLs, filenames, and metadata
2. Creates indexes for fast lookups by `room_slug` and thumbnail queries
3. Creates unique constraint to prevent duplicate URLs for the same room
4. Verifies the table was created correctly

### After Migration
- Image URLs are stored in the database instead of using `list()` operations
- Images are still stored in Vercel Blob Storage (or public folder) for actual file storage
- Database queries replace Vercel Blob `list()` calls, eliminating Advanced Operations usage
- Existing images in blob storage will be automatically migrated to the database on first access
- New uploads automatically save URLs to the database

### Benefits
- **No Advanced Operations**: Database queries don't count toward Vercel Blob limits
- **Faster**: Database queries are faster than blob storage listing
- **Cost-effective**: Works within Neon Free plan limits (minimal storage for URLs)
- **Scalable**: Can handle thousands of images without hitting operation limits

### Verification
After running the migration, the script will verify the table was created by querying the table schema.

## Add 'confirmed' Reservation Status

### Problem
With online payment disabled (`PAYMENTS_ENABLED = false` in `src/lib/config.ts`), guests book without paying and settle the balance at check-in. Those reservations are created with status `confirmed`, which the `reservations_status_check` constraint did not allow.

### Solution
Run `add-confirmed-status.sql` to recreate the constraint with `confirmed` included.

### How to Run
```bash
psql $DATABASE_URL -f database-migrations/add-confirmed-status.sql
```
Or paste the file contents into the Neon SQL Editor.

**Run this before deploying the pay-on-arrival changes** — otherwise every public booking fails with constraint violation `23514`.

### What the Migration Does
1. Drops the existing `reservations_status_check` constraint
2. Recreates it allowing `pending`, `confirmed`, `deposit_paid`, `paid_in_full`, `checked_in`, `checked_out`, `cancelled`
3. Verifies the constraint definition

### Status: Applied
This migration has already been run against the production database.
