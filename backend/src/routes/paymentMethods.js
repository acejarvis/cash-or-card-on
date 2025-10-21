const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const { authenticate, authorize, requireRegistered } = require('../middleware/auth');

// Public routes
router.get('/restaurant/:restaurantId', paymentMethodController.getByRestaurant.bind(paymentMethodController));

// Protected routes - registered users
router.post('/', authenticate, requireRegistered, paymentMethodController.submit.bind(paymentMethodController));
router.post('/:id/vote', authenticate, requireRegistered, paymentMethodController.vote.bind(paymentMethodController));

// Admin routes
router.post('/:id/verify', authenticate, authorize('admin'), paymentMethodController.verify.bind(paymentMethodController));
router.delete('/:id', authenticate, authorize('admin'), paymentMethodController.delete.bind(paymentMethodController));

module.exports = router;
