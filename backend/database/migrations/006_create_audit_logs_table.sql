-- Migration: 006_create_audit_logs_table.sql
-- Description: Create audit logs for tracking all modifications
-- Created: 2024-10-20

CREATE TYPE audit_action AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 
    'VERIFY', 'UNVERIFY',
    'VOTE_UP', 'VOTE_DOWN', 'VOTE_CHANGE', 'VOTE_REMOVE'
);

CREATE TYPE audit_entity AS ENUM (
    'user', 'restaurant', 'payment_method', 'cash_discount'
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type audit_entity NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    
    -- User who performed the action
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Change details
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    
    -- Additional context
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Partition by month for performance (optional, for production scaling)
-- This can be enabled later as data grows

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system modifications';
COMMENT ON COLUMN audit_logs.old_values IS 'JSON snapshot of entity before change';
COMMENT ON COLUMN audit_logs.new_values IS 'JSON snapshot of entity after change';
