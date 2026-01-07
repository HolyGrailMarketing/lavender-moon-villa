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
