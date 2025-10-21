const express = require('express');
const router = express.Router();
const cashDiscountController = require('../controllers/cashDiscountController');
const { authenticate, authorize, requireRegistered } = require('../middleware/auth');

// Public routes
router.get('/restaurant/:restaurantId', cashDiscountController.getByRestaurant.bind(cashDiscountController));

// Protected routes - registered users
router.post('/', authenticate, requireRegistered, cashDiscountController.submit.bind(cashDiscountController));
router.post('/:id/vote', authenticate, requireRegistered, cashDiscountController.vote.bind(cashDiscountController));
router.put('/:id', authenticate, requireRegistered, cashDiscountController.update.bind(cashDiscountController));

// Admin routes
router.post('/:id/verify', authenticate, authorize('admin'), cashDiscountController.verify.bind(cashDiscountController));
router.delete('/:id', authenticate, authorize('admin'), cashDiscountController.delete.bind(cashDiscountController));

module.exports = router;
