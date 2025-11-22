-- Migration: 008_create_restaurant_ratings.sql
-- Description: Create restaurant_ratings table
-- Created: 2024-11-22

CREATE TABLE restaurant_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one rating per user per restaurant
    CONSTRAINT unique_user_restaurant_rating UNIQUE (restaurant_id, user_id)
);

-- Indexes
CREATE INDEX idx_restaurant_ratings_restaurant_id ON restaurant_ratings(restaurant_id);
CREATE INDEX idx_restaurant_ratings_user_id ON restaurant_ratings(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_restaurant_ratings_updated_at BEFORE UPDATE ON restaurant_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE restaurant_ratings IS 'User ratings and reviews for restaurants';
