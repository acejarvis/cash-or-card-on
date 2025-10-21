const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticate, authorize, requireRegistered } = require('../middleware/auth');

// Public routes
router.get('/', restaurantController.getAll.bind(restaurantController));
router.get('/search', restaurantController.search.bind(restaurantController));
router.get('/:id', restaurantController.getById.bind(restaurantController));

// Protected routes - registered users
router.post('/', authenticate, requireRegistered, restaurantController.create.bind(restaurantController));
router.put('/:id', authenticate, requireRegistered, restaurantController.update.bind(restaurantController));

// Admin routes
router.post('/:id/verify', authenticate, authorize('admin'), restaurantController.verify.bind(restaurantController));
router.get('/admin/pending', authenticate, authorize('admin'), restaurantController.getPendingVerification.bind(restaurantController));
router.delete('/:id', authenticate, authorize('admin'), restaurantController.delete.bind(restaurantController));

module.exports = router;
