const cashDiscountDAO = require('../dao/cashDiscountDAO');
const { AppError } = require('../middleware/errorHandler');

class CashDiscountController {
  // Get cash discounts for a restaurant
  async getByRestaurant(req, res, next) {
    try {
      const { restaurantId } = req.params;
      const cashDiscounts = await cashDiscountDAO.findByRestaurant(restaurantId);

      res.json({
        count: cashDiscounts.length,
        cashDiscounts,
      });
    } catch (err) {
      next(err);
    }
  }

  // Submit cash discount
  async submit(req, res, next) {
    try {
      const { restaurantId, discountPercentage, description } = req.body;

      if (!restaurantId || discountPercentage === undefined) {
        throw new AppError('restaurantId and discountPercentage are required', 400);
      }

      if (discountPercentage < 0 || discountPercentage > 100) {
        throw new AppError('Discount percentage must be between 0 and 100', 400);
      }

      const cashDiscount = await cashDiscountDAO.create(
        restaurantId,
        discountPercentage,
        description || null,
        req.user.id
      );

      res.status(201).json({
        message: 'Cash discount submitted successfully',
        cashDiscount,
      });
    } catch (err) {
      next(err);
    }
  }

  // Vote on cash discount
  async vote(req, res, next) {
    try {
      const { id } = req.params;
      const { voteType } = req.body;

      if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
        throw new AppError('Valid voteType (upvote/downvote) is required', 400);
      }

      const cashDiscount = await cashDiscountDAO.vote(id, req.user.id, voteType);

      res.json({
        message: 'Vote recorded successfully',
        cashDiscount,
      });
    } catch (err) {
      next(err);
    }
  }

  // Update cash discount
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const cashDiscount = await cashDiscountDAO.update(id, updates);

      if (!cashDiscount) {
        throw new AppError('Cash discount not found', 404);
      }

      res.json({
        message: 'Cash discount updated successfully',
        cashDiscount,
      });
    } catch (err) {
      next(err);
    }
  }

  // Verify cash discount (admin)
  async verify(req, res, next) {
    try {
      const { id } = req.params;
      const cashDiscount = await cashDiscountDAO.verify(id, req.user.id);

      if (!cashDiscount) {
        throw new AppError('Cash discount not found', 404);
      }

      res.json({
        message: 'Cash discount verified successfully',
        cashDiscount,
      });
    } catch (err) {
      next(err);
    }
  }

  // Delete cash discount
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await cashDiscountDAO.delete(id);

      if (!result) {
        throw new AppError('Cash discount not found', 404);
      }

      res.json({
        message: 'Cash discount deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CashDiscountController();
