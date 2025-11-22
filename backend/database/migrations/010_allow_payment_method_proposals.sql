-- Migration: 010_allow_payment_method_proposals.sql
-- Description: Replace global unique constraint with partial constraints to allow proposals
-- Created: 2024-11-22

-- Drop the existing unique constraint
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS unique_restaurant_payment;

-- Create partial unique index for verified payment methods
-- This ensures only one VERIFIED payment method per type per restaurant
CREATE UNIQUE INDEX idx_unique_verified_payment 
ON payment_methods (restaurant_id, payment_type) 
WHERE is_verified = true;

-- Create partial unique index for pending payment methods
-- This ensures only one PENDING proposal per type per restaurant (to avoid spam)
CREATE UNIQUE INDEX idx_unique_pending_payment 
ON payment_methods (restaurant_id, payment_type) 
WHERE is_verified = false;
