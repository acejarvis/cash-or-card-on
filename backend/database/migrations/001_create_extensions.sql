-- Migration: 001_create_extensions.sql
-- Description: Create PostgreSQL extensions for enhanced functionality
-- Created: 2024-10-20

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
