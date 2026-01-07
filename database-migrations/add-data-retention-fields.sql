-- Add anonymization tracking to guests table
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS data_retention_anonymized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;

-- Add index for retention queries
CREATE INDEX IF NOT EXISTS idx_guests_anonymized ON guests(data_retention_anonymized, anonymized_at);

-- Add comment explaining the fields
COMMENT ON COLUMN guests.data_retention_anonymized IS 'Flag indicating if guest data has been anonymized for data retention compliance';
COMMENT ON COLUMN guests.anonymized_at IS 'Timestamp when guest data was anonymized';

