-- Description: Create payment methods table and voting system

CREATE TYPE payment_type AS ENUM ('cash', 'debit', 'visa', 'mastercard', 'amex', 'discover', 'other');

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    payment_type payment_type NOT NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT true,
    
    -- Vote tracking
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    confidence_score DECIMAL(5, 4) DEFAULT 0.0, -- Calculated score based on votes
    
    -- Metadata
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per restaurant-payment_type combination
    CONSTRAINT unique_restaurant_payment UNIQUE (restaurant_id, payment_type),
    CONSTRAINT valid_votes CHECK (upvotes >= 0 AND downvotes >= 0)
);

CREATE TABLE payment_method_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- One vote per user per payment method
    CONSTRAINT unique_user_payment_vote UNIQUE (payment_method_id, user_id)
);

-- Indexes
CREATE INDEX idx_payment_methods_restaurant ON payment_methods(restaurant_id);
CREATE INDEX idx_payment_methods_type ON payment_methods(payment_type);
CREATE INDEX idx_payment_methods_verified ON payment_methods(is_verified);
CREATE INDEX idx_payment_methods_confidence ON payment_methods(confidence_score DESC);
CREATE INDEX idx_payment_method_votes_user ON payment_method_votes(user_id);
CREATE INDEX idx_payment_method_votes_method ON payment_method_votes(payment_method_id);

-- Triggers
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_method_votes_updated_at BEFORE UPDATE ON payment_method_votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_payment_method_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE payment_methods SET upvotes = upvotes + 1 WHERE id = NEW.payment_method_id;
        ELSE
            UPDATE payment_methods SET downvotes = downvotes + 1 WHERE id = NEW.payment_method_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Remove old vote
        IF OLD.vote_type = 'upvote' THEN
            UPDATE payment_methods SET upvotes = upvotes - 1 WHERE id = OLD.payment_method_id;
        ELSE
            UPDATE payment_methods SET downvotes = downvotes - 1 WHERE id = OLD.payment_method_id;
        END IF;
        -- Add new vote
        IF NEW.vote_type = 'upvote' THEN
            UPDATE payment_methods SET upvotes = upvotes + 1 WHERE id = NEW.payment_method_id;
        ELSE
            UPDATE payment_methods SET downvotes = downvotes + 1 WHERE id = NEW.payment_method_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE payment_methods SET upvotes = upvotes - 1 WHERE id = OLD.payment_method_id;
        ELSE
            UPDATE payment_methods SET downvotes = downvotes - 1 WHERE id = OLD.payment_method_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_method_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON payment_method_votes
    FOR EACH ROW EXECUTE FUNCTION update_payment_method_votes();

-- Function to calculate confidence score (Wilson score interval)
CREATE OR REPLACE FUNCTION calculate_confidence_score(upvotes INTEGER, downvotes INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    n INTEGER;
    p DECIMAL;
    z DECIMAL := 1.96; -- 95% confidence
    score DECIMAL;
BEGIN
    n := upvotes + downvotes;
    IF n = 0 THEN
        RETURN 0.0;
    END IF;
    
    p := upvotes::DECIMAL / n;
    score := (p + z*z/(2*n) - z * sqrt((p*(1-p)+z*z/(4*n))/n))/(1+z*z/n);
    
    RETURN ROUND(score, 4);
END;
$$ language 'plpgsql';

-- Comments
COMMENT ON TABLE payment_methods IS 'Payment methods accepted by restaurants with crowdsourced voting';
COMMENT ON TABLE payment_method_votes IS 'User votes on payment method accuracy';
COMMENT ON COLUMN payment_methods.confidence_score IS 'Wilson score interval for vote reliability';
