const { pool } = require('../config/database');

class RatingDAO {
    // Create or update a rating
    async upsert(restaurantId, userId, rating, comment) {
        const query = `
      INSERT INTO restaurant_ratings (restaurant_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (restaurant_id, user_id)
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
        const result = await pool.query(query, [restaurantId, userId, rating, comment]);
        return result.rows[0];
    }

    // Get ratings for a restaurant
    async findByRestaurant(restaurantId, limit = 10, offset = 0) {
        const query = `
      SELECT rr.*, u.username
      FROM restaurant_ratings rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.restaurant_id = $1
      ORDER BY rr.created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const result = await pool.query(query, [restaurantId, limit, offset]);
        return result.rows;
    }

    // Get a user's rating for a restaurant
    async getUserRating(restaurantId, userId) {
        const query = `
      SELECT * FROM restaurant_ratings
      WHERE restaurant_id = $1 AND user_id = $2
    `;
        const result = await pool.query(query, [restaurantId, userId]);
        return result.rows[0];
    }
}

module.exports = new RatingDAO();
