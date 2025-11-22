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
    // Try to find an existing pending proposal for this type
    const findPendingQuery = `
      SELECT * FROM payment_methods 
      WHERE restaurant_id = $1 AND payment_type = $2 AND is_verified = false
    `;
    const pendingResult = await pool.query(findPendingQuery, [restaurantId, paymentType]);

    if (pendingResult.rows.length > 0) {
      // Update existing proposal
      const updateQuery = `
        UPDATE payment_methods 
        SET is_accepted = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [isAccepted, pendingResult.rows[0].id]);
      return result.rows[0];
    }

    // No pending proposal, create a new one (even if a verified one exists)
    // The partial unique index allows this.
    const insertQuery = `
      INSERT INTO payment_methods (restaurant_id, payment_type, is_accepted, submitted_by, upvotes, is_verified)
      VALUES ($1, $2, $3, $4, 1, false)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [restaurantId, paymentType, isAccepted, submittedBy]);
    return result.rows[0];
  }

  // Vote on payment method - allows multiple votes from same user
  async vote(paymentMethodId, userId, voteType) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Always create a new vote (allows multiple votes from same user)
      const insertQuery = `
        INSERT INTO payment_method_votes (payment_method_id, user_id, vote_type)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      await client.query(insertQuery, [paymentMethodId, userId, voteType]);

      // Update confidence score
      // Recalculate upvotes and downvotes from votes table
      const countVotesQuery = `
        SELECT
          COUNT(*) FILTER (WHERE vote_type = 'upvote') AS upvotes,
          COUNT(*) FILTER (WHERE vote_type = 'downvote') AS downvotes
        FROM payment_method_votes
        WHERE payment_method_id = $1
      `;
      const voteCountsResult = await client.query(countVotesQuery, [paymentMethodId]);
      const { upvotes, downvotes } = voteCountsResult.rows[0];

      // Update confidence score using fresh counts
      const updateScoreQuery = `
        UPDATE payment_methods
        SET confidence_score = calculate_confidence_score($2::integer, $3::integer),
            upvotes = $2::integer,
            downvotes = $3::integer
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateScoreQuery, [paymentMethodId, upvotes, downvotes]);

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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the payment method to be verified
      const getQuery = 'SELECT * FROM payment_methods WHERE id = $1';
      const pmResult = await client.query(getQuery, [id]);
      const pm = pmResult.rows[0];

      if (!pm) throw new Error('Payment method not found');

      // Check if there is already a verified payment method for this restaurant and type
      const findVerifiedQuery = `
        SELECT * FROM payment_methods 
        WHERE restaurant_id = $1 AND payment_type = $2 AND is_verified = true AND id != $3
      `;
      const verifiedResult = await client.query(findVerifiedQuery, [pm.restaurant_id, pm.payment_type, id]);

      if (verifiedResult.rows.length > 0) {
        // Delete the old verified payment method
        const deleteQuery = 'DELETE FROM payment_methods WHERE id = $1';
        await client.query(deleteQuery, [verifiedResult.rows[0].id]);
      }

      // Verify the new one
      const updateQuery = `
        UPDATE payment_methods 
        SET is_verified = true, verified_by = $1, verified_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await client.query(updateQuery, [adminId, id]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
  // Get pending payment methods
  async getPending() {
    const query = `
      SELECT pm.*, r.name as restaurant_name, u.username as submitted_by_username
      FROM payment_methods pm
      JOIN restaurants r ON pm.restaurant_id = r.id
      LEFT JOIN users u ON pm.submitted_by = u.id
      WHERE pm.is_verified = false
      ORDER BY pm.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new PaymentMethodDAO();
