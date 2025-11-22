-- Migration: 009_update_restaurant_summary_view.sql
-- Description: Update restaurant_summary view to include average rating and count, AND filter unverified items
-- Created: 2024-11-22

DROP VIEW IF EXISTS restaurant_summary;

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
    
    -- Rating statistics
    COALESCE(AVG(rr.rating), 0)::NUMERIC(3,1) AS average_rating,
    COUNT(DISTINCT rr.id) AS rating_count,
    
    -- Aggregated payment methods (ONLY VERIFIED)
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
        ) FILTER (WHERE pm.id IS NOT NULL AND pm.is_verified = true),
        '[]'::json
    ) AS payment_methods,
    
    -- Aggregated cash discounts (ONLY VERIFIED AND ACTIVE)
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
        ) FILTER (WHERE cd.id IS NOT NULL AND cd.is_verified = true AND cd.is_active = true),
        '[]'::json
    ) AS cash_discounts
FROM restaurants r
LEFT JOIN payment_methods pm ON r.id = pm.restaurant_id
LEFT JOIN cash_discounts cd ON r.id = cd.restaurant_id
LEFT JOIN restaurant_ratings rr ON r.id = rr.restaurant_id
GROUP BY r.id;

COMMENT ON VIEW restaurant_summary IS 'Consolidated view of restaurants with verified payment methods, discounts, and ratings';
