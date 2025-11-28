-- Description: Create cash discounts table and voting system

CREATE TABLE cash_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    description TEXT, -- Optional details about the discount
    
    -- Vote tracking
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    confidence_score DECIMAL(5, 4) DEFAULT 0.0,
    
    -- Metadata
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true, -- Discount may expire
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT valid_discount_votes CHECK (upvotes >= 0 AND downvotes >= 0)
);

CREATE TABLE cash_discount_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_discount_id UUID NOT NULL REFERENCES cash_discounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- One vote per user per cash discount
    CONSTRAINT unique_user_discount_vote UNIQUE (cash_discount_id, user_id)
);

-- Indexes
CREATE INDEX idx_cash_discounts_restaurant ON cash_discounts(restaurant_id);
CREATE INDEX idx_cash_discounts_verified ON cash_discounts(is_verified);
CREATE INDEX idx_cash_discounts_active ON cash_discounts(is_active);
CREATE INDEX idx_cash_discounts_confidence ON cash_discounts(confidence_score DESC);
CREATE INDEX idx_cash_discount_votes_user ON cash_discount_votes(user_id);
CREATE INDEX idx_cash_discount_votes_discount ON cash_discount_votes(cash_discount_id);

-- Triggers
CREATE TRIGGER update_cash_discounts_updated_at BEFORE UPDATE ON cash_discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_discount_votes_updated_at BEFORE UPDATE ON cash_discount_votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_cash_discount_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE cash_discounts SET upvotes = upvotes + 1 WHERE id = NEW.cash_discount_id;
        ELSE
            UPDATE cash_discounts SET downvotes = downvotes + 1 WHERE id = NEW.cash_discount_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE cash_discounts SET upvotes = upvotes - 1 WHERE id = OLD.cash_discount_id;
        ELSE
            UPDATE cash_discounts SET downvotes = downvotes - 1 WHERE id = OLD.cash_discount_id;
        END IF;
        IF NEW.vote_type = 'upvote' THEN
            UPDATE cash_discounts SET upvotes = upvotes + 1 WHERE id = NEW.cash_discount_id;
        ELSE
            UPDATE cash_discounts SET downvotes = downvotes + 1 WHERE id = NEW.cash_discount_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE cash_discounts SET upvotes = upvotes - 1 WHERE id = OLD.cash_discount_id;
        ELSE
            UPDATE cash_discounts SET downvotes = downvotes - 1 WHERE id = OLD.cash_discount_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cash_discount_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON cash_discount_votes
    FOR EACH ROW EXECUTE FUNCTION update_cash_discount_votes();

-- Comments
COMMENT ON TABLE cash_discounts IS 'Cash discount percentages offered by restaurants';
COMMENT ON TABLE cash_discount_votes IS 'User votes on cash discount accuracy';
COMMENT ON COLUMN cash_discounts.is_active IS 'Whether the discount is currently active';
