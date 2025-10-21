-- Migration: 007_create_views.sql
-- Description: Create views for common queries and reporting
-- Created: 2024-10-20

-- View: Restaurant summary with payment methods and cash discounts
CREATE OR REPLACE VIEW restaurant_summary AS
SELECT 
    r.id,
    r.name,
    r.address,
    r.city,
    r.province,
    r.postal_code,
    r.phone,
    r.category,
    r.cuisine_tags,
    r.website_url,
    r.operating_hours,
    r.is_verified,
    r.created_at,
    r.updated_at,
    
    -- Aggregated payment methods
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'type', pm.payment_type,
                'is_accepted', pm.is_accepted,
                'upvotes', pm.upvotes,
                'downvotes', pm.downvotes,
                'confidence_score', pm.confidence_score,
                'is_verified', pm.is_verified
            )
        ) FILTER (WHERE pm.id IS NOT NULL),
        '[]'::json
    ) AS payment_methods,
    
    -- Aggregated cash discounts
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'percentage', cd.discount_percentage,
                'description', cd.description,
                'upvotes', cd.upvotes,
                'downvotes', cd.downvotes,
                'confidence_score', cd.confidence_score,
                'is_verified', cd.is_verified,
                'is_active', cd.is_active
            )
        ) FILTER (WHERE cd.id IS NOT NULL AND cd.is_active = true),
        '[]'::json
    ) AS cash_discounts
FROM restaurants r
LEFT JOIN payment_methods pm ON r.id = pm.restaurant_id
LEFT JOIN cash_discounts cd ON r.id = cd.restaurant_id
GROUP BY r.id;

COMMENT ON VIEW restaurant_summary IS 'Consolidated view of restaurants with payment methods and discounts';

-- View: User contribution statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.created_at,
    
    -- Contribution counts
    COUNT(DISTINCT pm.id) AS payment_methods_submitted,
    COUNT(DISTINCT cd.id) AS cash_discounts_submitted,
    COUNT(DISTINCT pmv.id) AS payment_method_votes_cast,
    COUNT(DISTINCT cdv.id) AS cash_discount_votes_cast,
    
    -- Verification counts (for admins)
    COUNT(DISTINCT pm_verified.id) AS payment_methods_verified,
    COUNT(DISTINCT cd_verified.id) AS cash_discounts_verified,
    COUNT(DISTINCT r_verified.id) AS restaurants_verified,
    
    -- Total contributions
    (COUNT(DISTINCT pm.id) + COUNT(DISTINCT cd.id) + 
     COUNT(DISTINCT pmv.id) + COUNT(DISTINCT cdv.id)) AS total_contributions
     
FROM users u
LEFT JOIN payment_methods pm ON u.id = pm.submitted_by
LEFT JOIN cash_discounts cd ON u.id = cd.submitted_by
LEFT JOIN payment_method_votes pmv ON u.id = pmv.user_id
LEFT JOIN cash_discount_votes cdv ON u.id = cdv.user_id
LEFT JOIN payment_methods pm_verified ON u.id = pm_verified.verified_by
LEFT JOIN cash_discounts cd_verified ON u.id = cd_verified.verified_by
LEFT JOIN restaurants r_verified ON u.id = r_verified.verified_by
GROUP BY u.id, u.username, u.email, u.role, u.created_at;

COMMENT ON VIEW user_statistics IS 'User contribution and activity statistics';

-- View: Restaurants needing verification
CREATE OR REPLACE VIEW restaurants_pending_verification AS
SELECT 
    r.id,
    r.name,
    r.address,
    r.city,
    r.category,
    r.created_at,
    COUNT(DISTINCT pm.id) AS unverified_payment_methods,
    COUNT(DISTINCT cd.id) AS unverified_cash_discounts
FROM restaurants r
LEFT JOIN payment_methods pm ON r.id = pm.restaurant_id AND pm.is_verified = false
LEFT JOIN cash_discounts cd ON r.id = cd.restaurant_id AND cd.is_verified = false
WHERE r.is_verified = false 
   OR pm.id IS NOT NULL 
   OR cd.id IS NOT NULL
GROUP BY r.id, r.name, r.address, r.city, r.category, r.created_at
ORDER BY r.created_at DESC;

COMMENT ON VIEW restaurants_pending_verification IS 'Restaurants and data requiring admin verification';
