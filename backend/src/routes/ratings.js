const express = require('express');
const router = express.Router();
const ratingDAO = require('../dao/ratingDAO');
const { authenticate } = require('../middleware/auth');

// Get ratings for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const ratings = await ratingDAO.findByRestaurant(req.params.restaurantId, limit, offset);
        res.json(ratings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's rating for a restaurant
router.get('/restaurant/:restaurantId/user', authenticate, async (req, res) => {
    try {
        const rating = await ratingDAO.getUserRating(req.params.restaurantId, req.user.id);
        res.json(rating || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit a rating
router.post('/restaurant/:restaurantId', authenticate, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const result = await ratingDAO.upsert(req.params.restaurantId, req.user.id, rating, comment);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
