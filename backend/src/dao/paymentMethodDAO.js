const { pool } = require('../config/database');

class PaymentMethodDAO {
  // Get payment methods for a restaurant
  async findByRestaurant(restaurantId) {
    const query = `
      SELECT pm.*, COUNT(pmv.id) as total_votes
      FROM payment_methods pm
      LEFT JOIN payment_method_votes pmv ON pm.id = pmv.payment_method_id
      WHERE pm.restaurant_id = $1
      GROUP BY pm.id
      ORDER BY pm.confidence_score DESC
    `;
    const result = await pool.query(query, [restaurantId]);
    return result.rows;
  }

  // Create or update payment method
  async upsert(restaurantId, paymentType, isAccepted, submittedBy) {
    const query = `
      INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, submitted_by, upvotes)
      VALUES ($1, $2, $3, $4, 1)
      ON CONFLICT (restaurant_id, payment_type)
      DO UPDATE SET 
        is_accepted = EXCLUDED.is_accepted,
        upvotes = payment_methods.upvotes + 1,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [restaurantId, paymentType, isAccepted, submittedBy]);
    return result.rows[0];
  }

  // Vote on payment method
  async vote(paymentMethodId, userId, voteType) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user already voted
      const checkQuery = 'SELECT * FROM payment_method_votes WHERE payment_method_id = $1 AND user_id = $2';
      const existing = await client.query(checkQuery, [paymentMethodId, userId]);

      if (existing.rows.length > 0) {
        // Update existing vote
        const updateQuery = `
          UPDATE payment_method_votes 
          SET vote_type = $1, updated_at = CURRENT_TIMESTAMP
          WHERE payment_method_id = $2 AND user_id = $3
          RETURNING *
        `;
        await client.query(updateQuery, [voteType, paymentMethodId, userId]);
      } else {
        // Create new vote
        const insertQuery = `
          INSERT INTO payment_method_votes (payment_method_id, user_id, vote_type)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        await client.query(insertQuery, [paymentMethodId, userId, voteType]);
      }

      // Update confidence score
      const updateScoreQuery = `
        UPDATE payment_methods
        SET confidence_score = calculate_confidence_score(upvotes, downvotes)
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateScoreQuery, [paymentMethodId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Verify payment method (admin)
  async verify(id, adminId) {
    const query = `
      UPDATE payment_methods 
      SET is_verified = true, verified_by = $1, verified_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [adminId, id]);
    return result.rows[0];
  }

  // Delete payment method
  async delete(id) {
    const query = 'DELETE FROM payment_methods WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get user's vote on a payment method
  async getUserVote(paymentMethodId, userId) {
    const query = 'SELECT * FROM payment_method_votes WHERE payment_method_id = $1 AND user_id = $2';
    const result = await pool.query(query, [paymentMethodId, userId]);
    return result.rows[0];
  }
}

module.exports = new PaymentMethodDAO();
