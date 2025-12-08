const { pool } = require('../config/database');

class RestaurantDAO {
  // Get all restaurants with optional filters
  async findAll(filters = {}) {
    let query = 'SELECT * FROM restaurant_summary WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.city) {
      query += ` AND city ILIKE $${paramCount}`;
      params.push(`%${filters.city}%`);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.is_verified !== undefined) {
      query += ` AND is_verified = $${paramCount}`;
      params.push(filters.is_verified);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get single restaurant by ID
  async findById(id) {
    const query = 'SELECT * FROM restaurant_summary WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create new restaurant
  async create(restaurantData) {
    const {
      name,
      address,
      city,
      province = 'Ontario',
      postal_code,
      phone,
      category,
      cuisine_tags = [],
      website_url,
      operating_hours,
      data_source = 'user_submission',
      image_url
    } = restaurantData;

    const query = `
      INSERT INTO restaurants (
        name, address, city, province, postal_code, phone,
        category, cuisine_tags, website_url, operating_hours, data_source, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name, address, city, province, postal_code, phone,
      category, cuisine_tags, website_url, operating_hours, data_source, image_url
    ]);

    return result.rows[0];
  }

  // Update restaurant
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'address', 'city', 'province', 'postal_code', 'phone',
      'category', 'cuisine_tags', 'website_url', 'operating_hours', 'image_url'
    ];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE restaurants 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Verify restaurant (admin only)
  async verify(id, adminId) {
    const query = `
      UPDATE restaurants 
      SET is_verified = true, verified_by = $1, verified_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [adminId, id]);
    return result.rows[0];
  }

  // Delete restaurant
  async delete(id) {
    const query = 'DELETE FROM restaurants WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get restaurants pending verification
  async getPendingVerification() {
    const query = 'SELECT * FROM restaurants_pending_verification ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Search restaurants by name (fuzzy)
  async search(searchTerm, limit = 10) {
    const query = `
      SELECT id, name, address, city, category
      FROM restaurants
      WHERE name ILIKE $1
      ORDER BY similarity(name, $2) DESC
      LIMIT $3
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, searchTerm, limit]);
    return result.rows;
  }
}

module.exports = new RestaurantDAO();
