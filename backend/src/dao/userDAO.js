const { pool } = require('../config/database');

class UserDAO {
  // Create a new user
  async create(email, username, passwordHash, role = 'registered') {
    const query = `
      INSERT INTO users (email, username, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, username, role, is_active, email_verified, created_at
    `;
    const result = await pool.query(query, [email, username, passwordHash, role]);
    return result.rows[0];
  }

  // Find user by email
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  async findById(id) {
    const query = 'SELECT id, email, username, role, is_active, email_verified, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Update last login
  async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }

  // Get user statistics
  async getStatistics(userId) {
    const query = 'SELECT * FROM user_statistics WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Update user profile
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, username, role, is_active, email_verified
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new UserDAO();
