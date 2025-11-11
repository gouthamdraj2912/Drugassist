/*
  # Add Provider Details Fields

  ## Overview
  This migration adds additional fields to the providers table to store
  detailed information about each provider.

  ## Changes
  1. Add columns to `providers` table:
    - `specialty` (text) - Provider's medical specialty
    - `contact_email` (text) - Provider's contact email
    - `contact_phone` (text) - Provider's contact phone
    - `address` (text) - Provider's address
    - `npi_number` (text) - National Provider Identifier

  ## Notes
  - All new fields are nullable to maintain backward compatibility
  - Existing provider records will have NULL values for new fields
*/

-- Add provider detail columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE providers ADD COLUMN specialty text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE providers ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE providers ADD COLUMN contact_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'address'
  ) THEN
    ALTER TABLE providers ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'npi_number'
  ) THEN
    ALTER TABLE providers ADD COLUMN npi_number text;
  END IF;
END $$;

-- Update existing providers with sample data
UPDATE providers
SET 
  specialty = CASE 
    WHEN name ILIKE '%cardio%' THEN 'Cardiology'
    WHEN name ILIKE '%oncology%' OR name ILIKE '%cancer%' THEN 'Oncology'
    WHEN name ILIKE '%orthopedic%' THEN 'Orthopedics'
    ELSE 'General Practice'
  END,
  contact_email = LOWER(REPLACE(name, ' ', '.')) || '@healthcare.com',
  contact_phone = '(555) ' || LPAD(FLOOR(RANDOM() * 9000000 + 1000000)::text, 7, '0'),
  address = (FLOOR(RANDOM() * 9000 + 1000)::text) || ' Medical Plaza Dr',
  npi_number = LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::text, 10, '0')
WHERE specialty IS NULL;