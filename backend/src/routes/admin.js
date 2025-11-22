const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const restaurantDAO = require('../dao/restaurantDAO');
const paymentMethodDAO = require('../dao/paymentMethodDAO');
const cashDiscountDAO = require('../dao/cashDiscountDAO');

// Middleware to ensure admin access
router.use(authenticate, authorize('admin'));

// Get all pending items
router.get('/pending', async (req, res) => {
    try {
        const [restaurants, paymentMethods, cashDiscounts] = await Promise.all([
            restaurantDAO.getPendingVerification(),
            paymentMethodDAO.getPending(),
            cashDiscountDAO.getPending()
        ]);

        res.json({
            restaurants,
            paymentMethods,
            cashDiscounts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve an item
router.post('/approve/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const adminId = req.user.id;
        let result;

        switch (type) {
            case 'restaurant':
                result = await restaurantDAO.verify(id, adminId);
                break;
            case 'payment-method':
                result = await paymentMethodDAO.verify(id, adminId);
                break;
            case 'cash-discount':
                result = await cashDiscountDAO.verify(id, adminId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid type' });
        }

        if (!result) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject (delete) an item
router.post('/reject/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        let result;

        switch (type) {
            case 'restaurant':
                result = await restaurantDAO.delete(id);
                break;
            case 'payment-method':
                result = await paymentMethodDAO.delete(id);
                break;
            case 'cash-discount':
                result = await cashDiscountDAO.delete(id);
                break;
            default:
                return res.status(400).json({ error: 'Invalid type' });
        }

        if (!result) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item rejected and deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
