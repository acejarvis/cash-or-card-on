-- Seed Data: Initial test data for Cash-or-Card-ON
-- Created: 2024-10-20

-- Create test users
-- Password for test users: 
-- - admin@cash-or-card.com: 'admin123'
-- - user@cash-or-card.com: 'user123'
-- - contributor@cash-or-card.com: 'contributor123'
INSERT INTO users (id, email, username, password_hash, role, is_active, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@cash-or-card.com', 'admin', '$2b$10$PccCGQEKV6FjozMASuXeXuSRNA1MmQJE61LwH5hLmmnbZxrk/HSBK', 'admin', true, true),
    ('550e8400-e29b-41d4-a716-446655440002', 'user@cash-or-card.com', 'user', '$2b$10$ZAWE3D7N/KrNOPxywWTQ2uNtW1zxD7oFejpxFSdytNP.qPFzs1Yk6', 'registered', true, true),
    ('550e8400-e29b-41d4-a716-446655440003', 'contributor@cash-or-card.com', 'contributor', '$2b$10$DAJo0QSXOwYFsu5hjvvoB.6z/q5zAMijmtZ6Av.ssCTqe45i7Kc5.', 'registered', true, true);

-- Create test restaurants (based on real examples from proposal)
INSERT INTO restaurants (id, name, address, city, province, postal_code, phone, category, cuisine_tags, operating_hours, is_verified, verified_by, verified_at, data_source, image_url) VALUES
    (
        '650e8400-e29b-41d4-a716-446655440001',
        'Haidilao Hot Pot Scarborough',
        '1571 Sandhurst Cir',
        'Scarborough',
        'Ontario',
        'M1V 1V2',
        '437-778-6616',
        'Chinese',
        ARRAY['Hotpot', 'Chinese'],
        '{"monday": {"open": "11:00", "close": "05:00"}, "tuesday": {"open": "11:00", "close": "05:00"}, "wednesday": {"open": "11:00", "close": "05:00"}, "thursday": {"open": "11:00", "close": "05:00"}, "friday": {"open": "11:00", "close": "5:00"}, "saturday": {"open": "11:00", "close": "5:00"}, "sunday": {"open": "12:00", "close": "5:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Haidilao Hot Pot Scarborough.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440002',
        'Hanyang Jokbal',
        '6016 Yonge St',
        'North York',
        'Ontario',
        'M2M 3V9',
        '416-792-5808',
        'Korean',
        ARRAY['Korean'],
        '{"monday": {"open": "12:00", "close": "01:00"}, "tuesday": {"open": "12:00", "close": "01:00"}, "wednesday": {"open": "12:00", "close": "01:00"}, "thursday": {"open": "12:00", "close": "01:00"}, "friday": {"open": "12:00", "close": "01:00"}, "saturday": {"open": "12:00", "close": "01:00"}, "sunday": {"open": "12:00", "close": "01:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Hanyang Jokbal.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440003',
        'Hao Xiong Di Chinese BBQ',
        '4675 Steeles Ave E',
        'Scarborough',
        'Ontario',
        'M1V 4S5',
        '416-609-0808',
        'Chinese',
        ARRAY['BBQ', 'Chinese'],
        '{"monday": {"open": "11:30", "close": "23:00"}, "tuesday": {"open": "11:30", "close": "23:00"}, "wednesday": {"open": "11:30", "close": "23:00"}, "thursday": {"open": "11:30", "close": "23:00"}, "friday": {"open": "11:30", "close": "00:00"}, "saturday": {"open": "11:30", "close": "00:00"}, "sunday": {"open": "11:30", "close": "23:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Hao Xiong Di Chinese Bbq.jpg'
    ),
        (
        '650e8400-e29b-41d4-a716-446655440004',
        'Katsuya',
        '6050 Yonge St',
        'North York',
        'Ontario',
        'M2M 3W5',
        '647-729-6161',
        'Japanese',
        ARRAY['Cafe', 'Japanese'],
        '{"monday": {"open": "12:00", "close": "22:00"}, "tuesday": {"open": "12:00", "close": "22:00"}, "wednesday": {"open": "12:00", "close": "22:00"}, "thursday": {"open": "12:00", "close": "22:00"}, "friday": {"open": "12:00", "close": "23:00"}, "saturday": {"open": "12:00", "close": "23:00"}, "sunday": {"open": "12:00", "close": "22:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Katsuya.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440005',
        'Lala Spicy Food',
        '4261 Sheppard Ave E',
        'Scarborough',
        'Ontario',
        'M1S 1T4',
        '647-348-8882',
        'Chinese',
        ARRAY['Szechuan', 'Chinese'],
        '{"monday": {"open": "11:00", "close": "21:30"}, "tuesday": {"open": "11:00", "close": "21:30"}, "wednesday": {"open": "11:00", "close": "21:30"}, "thursday": {"open": "11:00", "close": "21:30"}, "friday": {"open": "11:00", "close": "22:00"}, "saturday": {"open": "11:00", "close": "22:00"}, "sunday": {"open": "11:00", "close": "21:30"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Lala Spicy Food.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440006',
        'Mandarin Restaurant',
        '7660 Woodbine Ave',
        'Markham',
        'Ontario',
        'L3R 2N2',
        '905-479-6000',
        'Chinese',
        ARRAY['Buffet', 'Chinese'],
        '{"monday": {"open": "11:30", "close": "21:00"}, "tuesday": {"open": "11:30", "close": "21:00"}, "wednesday": {"open": "11:30", "close": "21:00"}, "thursday": {"open": "11:30", "close": "21:00"}, "friday": {"open": "11:30", "close": "22:00"}, "saturday": {"open": "11:30", "close": "22:00"}, "sunday": {"open": "11:30", "close": "21:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Mandarin Restaurant.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440007',
        'Omiwol Korean BBQ',
        '5317 Yonge St',
        'North York',
        'Ontario',
        'M2N 5R4',
        '416-222-3322',
        'Korean',
        ARRAY['BBQ', 'Korean'],
        '{"monday": {"open": "11:30", "close": "22:00"}, "tuesday": {"open": "11:30", "close": "22:00"}, "wednesday": {"open": "11:30", "close": "22:00"}, "thursday": {"open": "11:30", "close": "22:00"}, "friday": {"open": "11:30", "close": "23:00"}, "saturday": {"open": "11:30", "close": "23:00"}, "sunday": {"open": "11:30", "close": "22:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Omiwol Korean Bbq.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440008',
        'Smash Kitchen and Bar',
        '4261 Hwy 7',
        'Markham',
        'Ontario',
        'L3R 9W6',
        '905-940-2000',
        'American',
        ARRAY['Comfort Food', 'American', 'Seafood'],
        '{"monday": {"open": "11:30", "close": "22:00"}, "tuesday": {"open": "11:30", "close": "22:00"}, "wednesday": {"open": "11:30", "close": "22:00"}, "thursday": {"open": "11:30", "close": "22:00"}, "saturday": {"open": "11:30", "close": "23:00"}, "sunday": {"open": "10:00", "close": "22:00"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Smash Kitchen and Bar.jpg'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440009',
        'Sugo',
        '1281 Bloor Street W',
        'Toronto',
        'Ontario',
        'M6H 1N7',
        '416-535-1717',
        'Italian',
        ARRAY['Italian', 'Sandwiches', 'Cocktail Bars'],
        '{"monday": {"open": "11:30", "close": "21:30"}, "tuesday": {"open": "11:30", "close": "21:30"}, "wednesday": {"open": "11:30", "close": "21:30"}, "thursday": {"open": "11:30", "close": "21:30"}, "friday": {"open": "11:30", "close": "22:00"}, "saturday": {"open": "11:30", "close": "22:00"}, "sunday": {"open": "11:30", "close": "21:30"}}'::jsonb,
        true,
        '550e8400-e29b-41d4-a716-446655440001',
        CURRENT_TIMESTAMP,
        'user_submission',
        'Sugo.jpg'
    );

-- Insert payment methods
-- Haidilao Hot Pot Scarborough: All major cards except Amex
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', 'cash', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440001', 'debit', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440001', 'visa', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440001', 'mastercard', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440001', 'amex', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Hanyang Jokbal: All major cards except Amex
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440002', 'cash', true, 3, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440002', 'debit', true, 3, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440002', 'visa', true, 3, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440002', 'mastercard', true, 3, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440002', 'amex', true, 3, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Hao Xiong Di: All major cards except Amex
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440003', 'cash', true, 8, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440003', 'debit', true, 8, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440003', 'visa', false, 0, 7, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440003', 'mastercard', false, 0, 7, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440003', 'amex', false, 0, 8, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Katsuya: All major cards
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440004', 'cash', true, 6, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440004', 'debit', true, 6, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440004', 'visa', true, 6, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440004', 'mastercard', true, 6, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440004', 'amex', true, 6, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Lala Spicy: Cash, Debit, Visa, MC (no Amex)
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440005', 'cash', true, 4, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440005', 'debit', true, 4, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440005', 'visa', true, 4, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440005', 'mastercard', true, 4, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440005', 'amex', false, 0, 3, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Mandarin Restaurant: All major cards
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440006', 'cash', true, 10, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440006', 'debit', true, 10, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440006', 'visa', true, 10, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440006', 'mastercard', true, 10, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440006', 'amex', true, 10, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Omiwol: Cash, Debit, Visa, MC (no Amex)
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440007', 'cash', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440007', 'debit', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440007', 'visa', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440007', 'mastercard', true, 5, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440007', 'amex', false, 0, 4, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);
-- Smash Kitchen: All major cards
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440008', 'cash', true, 7, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440008', 'debit', true, 7, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440008', 'visa', true, 7, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440008', 'mastercard', true, 7, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440008', 'amex', true, 7, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);
-- Sugo: Cash, Debit, Visa, MC (no Amex)
INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440009', 'cash', true, 9, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440009', 'debit', true, 9, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440009', 'visa', true, 9, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440009', 'mastercard', true, 9, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440009', 'amex', false, 0, 5, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP); 



-- Insert cash discounts
INSERT INTO cash_discounts (restaurant_id, discount_percentage, description, upvotes, downvotes, submitted_by, is_verified, verified_by, verified_at) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', 2.00, 'Small cash discount on total bill', 3, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440003', 10.00, '10% off when paying cash', 10, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440004', 5.00, '5% cash discount', 7, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440005', 5.00, 'Cash discount available', 5, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440006', 5.00, '5% off with cash payment', 6, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440008', 3.00, '3% cash discount on total bill', 4, 0, '550e8400-e29b-41d4-a716-446655440003', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
    ('650e8400-e29b-41d4-a716-446655440009', 5.00, '5% discount for cash payments', 8, 0, '550e8400-e29b-41d4-a716-446655440002', true, '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP);

-- Update confidence scores
UPDATE payment_methods SET confidence_score = calculate_confidence_score(upvotes, downvotes);
UPDATE cash_discounts SET confidence_score = calculate_confidence_score(upvotes, downvotes);

-- Insert some audit log entries
INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, new_values, ip_address, notes) VALUES
    ('restaurant', '650e8400-e29b-41d4-a716-446655440001', 'CREATE', '550e8400-e29b-41d4-a716-446655440010', '{"name": "Ichiban Japanese Restaurant", "city": "Scarborough"}'::jsonb, '192.168.1.100', 'Initial restaurant submission'),
    ('restaurant', '650e8400-e29b-41d4-a716-446655440001', 'VERIFY', '550e8400-e29b-41d4-a716-446655440001', '{"is_verified": true}'::jsonb, '192.168.1.50', 'Admin verified restaurant data');
