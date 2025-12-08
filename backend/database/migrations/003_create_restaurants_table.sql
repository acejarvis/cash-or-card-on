-- Migration: 003_create_restaurants_table.sql
-- Description: Create restaurants table with verification status
-- Created: 2024-10-20

CREATE TYPE restaurant_category AS ENUM (
    'Chinese', 'Korean', 'Japanese', 'Vietnamese', 'Thai', 
    'Italian', 'French', 'Indian', 'Mexican', 'American',
    'Mediterranean', 'Canadian', 'Fusion', 'Other'
);

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL DEFAULT 'Ontario',
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    
    -- Business information
    category restaurant_category NOT NULL,
    cuisine_tags TEXT[], -- Additional cuisine descriptors
    website_url TEXT,
    
    -- Operating hours (stored as JSON)
    -- Format: {"monday": {"open": "11:00", "close": "22:00"}, ...}
    operating_hours JSONB,
    
    -- Verification and data source
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    data_source VARCHAR(50) NOT NULL DEFAULT 'user_submission', -- user_submission, yelp, google_maps
    external_id VARCHAR(255), -- ID from external source (Yelp/Google)
    image_url VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_data_sync TIMESTAMP WITH TIME ZONE -- For external data updates
);

-- Indexes for performance
CREATE INDEX idx_restaurants_name ON restaurants USING gin(name gin_trgm_ops);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_restaurants_verified ON restaurants(is_verified);
CREATE INDEX idx_restaurants_cuisine_tags ON restaurants USING gin(cuisine_tags);
CREATE INDEX idx_restaurants_external_id ON restaurants(external_id);
CREATE INDEX idx_restaurants_created_at ON restaurants(created_at DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE restaurants IS 'Restaurant information including address and verification status';
COMMENT ON COLUMN restaurants.operating_hours IS 'JSON object with daily operating hours';
COMMENT ON COLUMN restaurants.is_verified IS 'Admin verification status for data accuracy';
COMMENT ON COLUMN restaurants.data_source IS 'Origin of restaurant data (user_submission, yelp, google_maps)';
