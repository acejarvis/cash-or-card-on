const { pool } = require('../config/database');

class CashDiscountDAO {
  // Get cash discounts for a restaurant
  async findByRestaurant(restaurantId) {
    const query = `
      SELECT cd.*, COUNT(cdv.id) as total_votes
      FROM cash_discounts cd
      LEFT JOIN cash_discount_votes cdv ON cd.id = cdv.cash_discount_id
      WHERE cd.restaurant_id = $1 AND cd.is_active = true
      GROUP BY cd.id
      ORDER BY cd.confidence_score DESC
    `;
    const result = await pool.query(query, [restaurantId]);
    return result.rows;
  }

  // Create cash discount
  async create(restaurantId, discountPercentage, description, submittedBy) {
    const query = `
      INSERT INTO cash_discounts (restaurant_id, discount_percentage, description, submitted_by, upvotes)
      VALUES ($1, $2, $3, $4, 1)
      RETURNING *
    `;
    const result = await pool.query(query, [restaurantId, discountPercentage, description, submittedBy]);
    return result.rows[0];
  }

  // Vote on cash discount
  async vote(cashDiscountId, userId, voteType) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if user already voted
      const checkQuery = 'SELECT * FROM cash_discount_votes WHERE cash_discount_id = $1 AND user_id = $2';
      const existing = await client.query(checkQuery, [cashDiscountId, userId]);

      if (existing.rows.length > 0) {
        // Update existing vote
        const updateQuery = `
          UPDATE cash_discount_votes 
          SET vote_type = $1, updated_at = CURRENT_TIMESTAMP
          WHERE cash_discount_id = $2 AND user_id = $3
          RETURNING *
        `;
        await client.query(updateQuery, [voteType, cashDiscountId, userId]);
      } else {
        // Create new vote
        const insertQuery = `
          INSERT INTO cash_discount_votes (cash_discount_id, user_id, vote_type)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        await client.query(insertQuery, [cashDiscountId, userId, voteType]);
      }

      // Update confidence score
      const updateScoreQuery = `
        UPDATE cash_discounts
        SET confidence_score = calculate_confidence_score(upvotes, downvotes)
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateScoreQuery, [cashDiscountId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Update cash discount
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['discount_percentage', 'description', 'is_active'];

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
      UPDATE cash_discounts 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Verify cash discount (admin)
  async verify(id, adminId) {
    const query = `
      UPDATE cash_discounts 
      SET is_verified = true, verified_by = $1, verified_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [adminId, id]);
    return result.rows[0];
  }

  // Delete cash discount
  async delete(id) {
    const query = 'DELETE FROM cash_discounts WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get user's vote on a cash discount
  async getUserVote(cashDiscountId, userId) {
    const query = 'SELECT * FROM cash_discount_votes WHERE cash_discount_id = $1 AND user_id = $2';
    const result = await pool.query(query, [cashDiscountId, userId]);
    return result.rows[0];
  }
  // Get pending cash discounts
  async getPending() {
    const query = `
      SELECT cd.*, r.name as restaurant_name, u.username as submitted_by_username
      FROM cash_discounts cd
      JOIN restaurants r ON cd.restaurant_id = r.id
      LEFT JOIN users u ON cd.submitted_by = u.id
      WHERE cd.is_verified = false
      ORDER BY cd.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new CashDiscountDAO();
