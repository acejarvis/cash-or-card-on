const paymentMethodDAO = require('../dao/paymentMethodDAO');
const { AppError } = require('../middleware/errorHandler');

class PaymentMethodController {
  // Get payment methods for a restaurant
  async getByRestaurant(req, res, next) {
    try {
      const { restaurantId } = req.params;
      const paymentMethods = await paymentMethodDAO.findByRestaurant(restaurantId);

      res.json({
        count: paymentMethods.length,
        paymentMethods,
      });
    } catch (err) {
      next(err);
    }
  }

  // Submit payment method
  async submit(req, res, next) {
    try {
      const { restaurantId, paymentType, isAccepted } = req.body;

      if (!restaurantId || !paymentType || isAccepted === undefined) {
        throw new AppError('restaurantId, paymentType, and isAccepted are required', 400);
      }

      const validTypes = ['cash', 'debit', 'visa', 'mastercard', 'amex', 'discover', 'other'];
      if (!validTypes.includes(paymentType)) {
        throw new AppError('Invalid payment type', 400);
      }

      const paymentMethod = await paymentMethodDAO.upsert(
        restaurantId,
        paymentType,
        isAccepted,
        req.user.id
      );

      res.status(201).json({
        message: 'Payment method submitted successfully',
        paymentMethod,
      });
    } catch (err) {
      next(err);
    }
  }

  // Vote on payment method
  async vote(req, res, next) {
    try {
      const { id } = req.params;
      const { voteType } = req.body;

      if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
        throw new AppError('Valid voteType (upvote/downvote) is required', 400);
      }

      const paymentMethod = await paymentMethodDAO.vote(id, req.user.id, voteType);

      res.json({
        message: 'Vote recorded successfully',
        paymentMethod,
      });
    } catch (err) {
      next(err);
    }
  }

  // Verify payment method (admin)
  async verify(req, res, next) {
    try {
      const { id } = req.params;
      const paymentMethod = await paymentMethodDAO.verify(id, req.user.id);

      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      res.json({
        message: 'Payment method verified successfully',
        paymentMethod,
      });
    } catch (err) {
      next(err);
    }
  }

  // Delete payment method
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await paymentMethodDAO.delete(id);

      if (!result) {
        throw new AppError('Payment method not found', 404);
      }

      res.json({
        message: 'Payment method deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentMethodController();
