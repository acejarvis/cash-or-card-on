# DB Schema

```markdown
┌─────────────┐
│   USERS     │
├─────────────┤
│ user_id PK  │───┐
│ username    │   │
│ email       │   │
│ role        │   │
└─────────────┘   │
                  │
    ┌─────────────┘
    │
    ▼
┌─────────────────────┐         ┌──────────────────┐
│   RESTAURANTS       │◄───────►│   CATEGORIES     │
├─────────────────────┤         ├──────────────────┤
│ restaurant_id PK    │         │ category_id PK   │
│ name                │         │ name             │
│ logo_url            │         │ icon             │
│ address             │         └──────────────────┘
│ city                │                  ▲
│ status              │                  │
│ created_by FK       │         ┌────────┴───────────┐
└─────────────────────┘         │ RESTAURANT_        │
         │                      │ CATEGORIES         │
         │                      └────────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌────────────────────┐              ┌─────────────────────┐
│ OPERATING_HOURS    │              │ PAYMENT_METHODS     │
├────────────────────┤              ├─────────────────────┤
│ hours_id PK        │              │ payment_method_id PK│
│ restaurant_id FK   │              │ name                │
│ day_of_week        │              │ icon                │
│ open_time          │              └─────────────────────┘
│ close_time         │                       ▲
└────────────────────┘                       │
                                    ┌────────┴──────────────────┐
                                    │ RESTAURANT_PAYMENT_       │
                                    │ METHODS                   │
                                    │ (vote_count)              │
                                    └───────────────────────────┘
                                             ▲
                                             │
                                    ┌────────┴──────────────────┐
                                    │ PAYMENT_METHOD_VOTES      │
                                    │ (user_id FK)              │
                                    └───────────────────────────┘

         ┌─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌────────────────────┐              ┌─────────────────────┐
│ CASH_DISCOUNTS     │              │ RESTAURANT_RATINGS  │
├────────────────────┤              ├─────────────────────┤
│ discount_id PK     │              │ rating_id PK        │
│ percentage         │              │ restaurant_id FK    │
│ display_label      │              │ user_id FK          │
└────────────────────┘              │ rating (1-5)        │
         ▲                          └─────────────────────┘
         │
┌────────┴──────────────────┐
│ RESTAURANT_CASH_          │
│ DISCOUNTS                 │
│ (vote_count)              │
└───────────────────────────┘
         ▲
         │
┌────────┴──────────────────┐
│ CASH_DISCOUNT_VOTES       │
│ (user_id FK)              │
└───────────────────────────┘
```

```sql
-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- ============================================================================
-- RESTAURANTS TABLE
-- ============================================================================
CREATE TABLE restaurants (
    restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    logo_url VARCHAR(500),
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'Canada',
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    status ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_city (city),
    INDEX idx_status (status),
    INDEX idx_name (name),
    FULLTEXT idx_fulltext_search (name, street_address, city, description)
);

-- ============================================================================
-- OPERATING HOURS TABLE
-- ============================================================================
CREATE TABLE operating_hours (
    hours_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_restaurant_day (restaurant_id, day_of_week),
    INDEX idx_restaurant (restaurant_id)
);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Sample categories insert
INSERT INTO categories (name, icon, description) VALUES
('Italian', '🍕', 'Italian cuisine'),
('Chinese', '🥡', 'Chinese cuisine'),
('Japanese', '🍜', 'Japanese cuisine'),
('Fast Food', '🍔', 'Fast food restaurants'),
('Mexican', '🌮', 'Mexican cuisine'),
('Pizza', '🍕', 'Pizza places'),
('Vegetarian', '🥗', 'Vegetarian options'),
('Asian', '🍱', 'Asian cuisine'),
('Indian', '🍛', 'Indian cuisine'),
('Mediterranean', '🥙', 'Mediterranean cuisine');

-- ============================================================================
-- RESTAURANT CATEGORIES (Many-to-Many)
-- ============================================================================
CREATE TABLE restaurant_categories (
    restaurant_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (restaurant_id, category_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_category (category_id)
);

-- ============================================================================
-- PAYMENT METHODS TABLE
-- ============================================================================
CREATE TABLE payment_methods (
    payment_method_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Sample payment methods insert
INSERT INTO payment_methods (name, icon, display_order) VALUES
('Visa', '💳', 1),
('Mastercard', '💳', 2),
('Debit', '💳', 3),
('Cash', '💵', 4),
('American Express', '💳', 5),
('Interac', '💳', 6),
('Apple Pay', '📱', 7),
('Google Pay', '📱', 8),
('Cryptocurrency', '₿', 9);

-- ============================================================================
-- RESTAURANT PAYMENT METHODS (Many-to-Many with Vote Count)
-- ============================================================================
CREATE TABLE restaurant_payment_methods (
    restaurant_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (restaurant_id, payment_method_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_payment_method (payment_method_id),
    INDEX idx_vote_count (vote_count)
);

-- ============================================================================
-- PAYMENT METHOD VOTES TABLE
-- ============================================================================
CREATE TABLE payment_method_votes (
    vote_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type ENUM('upvote', 'downvote') DEFAULT 'upvote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_payment_vote (restaurant_id, payment_method_id, user_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_user (user_id)
);

-- ============================================================================
-- CASH DISCOUNTS TABLE
-- ============================================================================
CREATE TABLE cash_discounts (
    discount_id INT PRIMARY KEY AUTO_INCREMENT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    display_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_percentage (discount_percentage),
    INDEX idx_percentage (discount_percentage)
);

-- Sample cash discounts insert
INSERT INTO cash_discounts (discount_percentage, display_label) VALUES
(0.00, 'No Discount'),
(3.00, '3% Discount'),
(5.00, '5% Discount'),
(10.00, '10% Discount'),
(15.00, '15% Discount');

-- ============================================================================
-- RESTAURANT CASH DISCOUNTS (Many-to-Many with Vote Count)
-- ============================================================================
CREATE TABLE restaurant_cash_discounts (
    restaurant_id INT NOT NULL,
    discount_id INT NOT NULL,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (restaurant_id, discount_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES cash_discounts(discount_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_discount (discount_id),
    INDEX idx_vote_count (vote_count)
);

-- ============================================================================
-- CASH DISCOUNT VOTES TABLE
-- ============================================================================
CREATE TABLE cash_discount_votes (
    vote_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    discount_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type ENUM('upvote', 'downvote') DEFAULT 'upvote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES cash_discounts(discount_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_discount_vote (restaurant_id, discount_id, user_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_user (user_id)
);

-- ============================================================================
-- RESTAURANT EDITS/MODIFICATIONS LOG TABLE
-- ============================================================================
CREATE TABLE restaurant_edit_history (
    edit_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    user_id INT NOT NULL,
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edit_type ENUM('create', 'update', 'delete') DEFAULT 'update',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- USER ACTIVITY LOG TABLE
-- ============================================================================
CREATE TABLE user_activity_log (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type ENUM('restaurant_added', 'payment_voted', 'discount_voted', 'restaurant_edited', 'login') NOT NULL,
    restaurant_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- RESTAURANT RATINGS TABLE (Optional - for star ratings)
-- ============================================================================
CREATE TABLE restaurant_ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_restaurant_rating (restaurant_id, user_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_rating (rating)
);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Restaurant Details with Average Rating
CREATE VIEW vw_restaurant_details AS
SELECT 
    r.restaurant_id,
    r.name,
    r.logo_url,
    r.street_address,
    r.city,
    r.province,
    r.postal_code,
    r.phone,
    r.email,
    r.website,
    r.description,
    r.status,
    r.created_at,
    COALESCE(AVG(rr.rating), 0) AS avg_rating,
    COUNT(DISTINCT rr.rating_id) AS rating_count
FROM restaurants r
LEFT JOIN restaurant_ratings rr ON r.restaurant_id = rr.restaurant_id
GROUP BY r.restaurant_id;

-- View: Restaurant Payment Methods with Votes
CREATE VIEW vw_restaurant_payments AS
SELECT 
    rpm.restaurant_id,
    r.name AS restaurant_name,
    pm.payment_method_id,
    pm.name AS payment_method,
    pm.icon,
    rpm.vote_count
FROM restaurant_payment_methods rpm
JOIN restaurants r ON rpm.restaurant_id = r.restaurant_id
JOIN payment_methods pm ON rpm.payment_method_id = pm.payment_method_id
ORDER BY rpm.restaurant_id, rpm.vote_count DESC;

-- View: Restaurant Cash Discounts with Votes
CREATE VIEW vw_restaurant_discounts AS
SELECT 
    rcd.restaurant_id,
    r.name AS restaurant_name,
    cd.discount_id,
    cd.discount_percentage,
    cd.display_label,
    rcd.vote_count
FROM restaurant_cash_discounts rcd
JOIN restaurants r ON rcd.restaurant_id = r.restaurant_id
JOIN cash_discounts cd ON rcd.discount_id = cd.discount_id
ORDER BY rcd.restaurant_id, rcd.vote_count DESC;

-- View: User Contributions Summary
CREATE VIEW vw_user_contributions AS
SELECT 
    u.user_id,
    u.username,
    COUNT(DISTINCT r.restaurant_id) AS restaurants_added,
    COUNT(DISTINCT pmv.vote_id) AS payment_votes,
    COUNT(DISTINCT cdv.vote_id) AS discount_votes,
    MAX(ual.created_at) AS last_activity
FROM users u
LEFT JOIN restaurants r ON u.user_id = r.created_by
LEFT JOIN payment_method_votes pmv ON u.user_id = pmv.user_id
LEFT JOIN cash_discount_votes cdv ON u.user_id = cdv.user_id
LEFT JOIN user_activity_log ual ON u.user_id = ual.user_id
GROUP BY u.user_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update payment method vote count after insert
DELIMITER //
CREATE TRIGGER after_payment_vote_insert
AFTER INSERT ON payment_method_votes
FOR EACH ROW
BEGIN
    UPDATE restaurant_payment_methods
    SET vote_count = vote_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE restaurant_id = NEW.restaurant_id 
    AND payment_method_id = NEW.payment_method_id;
END//

-- Trigger: Update payment method vote count after delete
CREATE TRIGGER after_payment_vote_delete
AFTER DELETE ON payment_method_votes
FOR EACH ROW
BEGIN
    UPDATE restaurant_payment_methods
    SET vote_count = GREATEST(0, vote_count - 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE restaurant_id = OLD.restaurant_id 
    AND payment_method_id = OLD.payment_method_id;
END//

-- Trigger: Update cash discount vote count after insert
CREATE TRIGGER after_discount_vote_insert
AFTER INSERT ON cash_discount_votes
FOR EACH ROW
BEGIN
    UPDATE restaurant_cash_discounts
    SET vote_count = vote_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE restaurant_id = NEW.restaurant_id 
    AND discount_id = NEW.discount_id;
END//

-- Trigger: Update cash discount vote count after delete
CREATE TRIGGER after_discount_vote_delete
AFTER DELETE ON cash_discount_votes
FOR EACH ROW
BEGIN
    UPDATE restaurant_cash_discounts
    SET vote_count = GREATEST(0, vote_count - 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE restaurant_id = OLD.restaurant_id 
    AND discount_id = OLD.discount_id;
END//

-- Trigger: Log restaurant edits
CREATE TRIGGER after_restaurant_update
AFTER UPDATE ON restaurants
FOR EACH ROW
BEGIN
    IF OLD.name != NEW.name THEN
        INSERT INTO restaurant_edit_history (restaurant_id, user_id, field_changed, old_value, new_value, edit_type)
        VALUES (NEW.restaurant_id, NEW.created_by, 'name', OLD.name, NEW.name, 'update');
    END IF;
    
    IF OLD.street_address != NEW.street_address THEN
        INSERT INTO restaurant_edit_history (restaurant_id, user_id, field_changed, old_value, new_value, edit_type)
        VALUES (NEW.restaurant_id, NEW.created_by, 'street_address', OLD.street_address, NEW.street_address, 'update');
    END IF;
    
    -- Add more field tracking as needed
END//

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Get restaurant full details
DELIMITER //
CREATE PROCEDURE sp_get_restaurant_details(IN p_restaurant_id INT)
BEGIN
    -- Restaurant basic info
    SELECT * FROM vw_restaurant_details WHERE restaurant_id = p_restaurant_id;
    
    -- Operating hours
    SELECT * FROM operating_hours WHERE restaurant_id = p_restaurant_id ORDER BY 
        FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    
    -- Categories
    SELECT c.* FROM categories c
    JOIN restaurant_categories rc ON c.category_id = rc.category_id
    WHERE rc.restaurant_id = p_restaurant_id;
    
    -- Payment methods with votes
    SELECT * FROM vw_restaurant_payments WHERE restaurant_id = p_restaurant_id;
    
    -- Cash discounts with votes
    SELECT * FROM vw_restaurant_discounts WHERE restaurant_id = p_restaurant_id;
END//

-- Procedure: Search restaurants
CREATE PROCEDURE sp_search_restaurants(
    IN p_search_term VARCHAR(255),
    IN p_city VARCHAR(100),
    IN p_category_id INT,
    IN p_payment_method_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT DISTINCT r.*, 
           COALESCE(AVG(rr.rating), 0) AS avg_rating,
           COUNT(DISTINCT rr.rating_id) AS rating_count
    FROM restaurants r
    LEFT JOIN restaurant_ratings rr ON r.restaurant_id = rr.restaurant_id
    LEFT JOIN restaurant_categories rc ON r.restaurant_id = rc.restaurant_id
    LEFT JOIN restaurant_payment_methods rpm ON r.restaurant_id = rpm.restaurant_id
    WHERE r.status = 'active'
        AND (p_search_term IS NULL OR r.name LIKE CONCAT('%', p_search_term, '%'))
        AND (p_city IS NULL OR r.city = p_city)
        AND (p_category_id IS NULL OR rc.category_id = p_category_id)
        AND (p_payment_method_id IS NULL OR rpm.payment_method_id = p_payment_method_id)
    GROUP BY r.restaurant_id
    ORDER BY r.name
    LIMIT p_limit OFFSET p_offset;
END//

DELIMITER ;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_restaurant_city_status ON restaurants(city, status);
CREATE INDEX idx_restaurant_status_created ON restaurants(status, created_at);
CREATE INDEX idx_payment_votes_restaurant_user ON payment_method_votes(restaurant_id, user_id);
CREATE INDEX idx_discount_votes_restaurant_user ON cash_discount_votes(restaurant_id, user_id);
```