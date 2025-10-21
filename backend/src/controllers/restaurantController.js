const restaurantDAO = require('../dao/restaurantDAO');
const { AppError } = require('../middleware/errorHandler');

class RestaurantController {
  // Get all restaurants with filters
  async getAll(req, res, next) {
    try {
      const { city, category, is_verified, search, limit, offset } = req.query;

      const filters = {};
      if (city) filters.city = city;
      if (category) filters.category = category;
      if (is_verified !== undefined) filters.is_verified = is_verified === 'true';
      if (search) filters.search = search;
      if (limit) filters.limit = parseInt(limit, 10);
      if (offset) filters.offset = parseInt(offset, 10);

      const restaurants = await restaurantDAO.findAll(filters);

      res.json({
        count: restaurants.length,
        restaurants,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get single restaurant by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await restaurantDAO.findById(id);

      if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
      }

      res.json(restaurant);
    } catch (err) {
      next(err);
    }
  }

  // Create new restaurant
  async create(req, res, next) {
    try {
      const restaurantData = req.body;

      // Validate required fields
      const requiredFields = ['name', 'address', 'city', 'category'];
      for (const field of requiredFields) {
        if (!restaurantData[field]) {
          throw new AppError(`${field} is required`, 400);
        }
      }

      const restaurant = await restaurantDAO.create(restaurantData);

      res.status(201).json({
        message: 'Restaurant created successfully',
        restaurant,
      });
    } catch (err) {
      next(err);
    }
  }

  // Update restaurant
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const restaurant = await restaurantDAO.update(id, updates);

      if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
      }

      res.json({
        message: 'Restaurant updated successfully',
        restaurant,
      });
    } catch (err) {
      next(err);
    }
  }

  // Delete restaurant
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await restaurantDAO.delete(id);

      if (!result) {
        throw new AppError('Restaurant not found', 404);
      }

      res.json({
        message: 'Restaurant deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  // Verify restaurant (admin only)
  async verify(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await restaurantDAO.verify(id, req.user.id);

      if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
      }

      res.json({
        message: 'Restaurant verified successfully',
        restaurant,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get restaurants pending verification
  async getPendingVerification(req, res, next) {
    try {
      const restaurants = await restaurantDAO.getPendingVerification();

      res.json({
        count: restaurants.length,
        restaurants,
      });
    } catch (err) {
      next(err);
    }
  }

  // Search restaurants
  async search(req, res, next) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        throw new AppError('Search query is required', 400);
      }

      const restaurants = await restaurantDAO.search(q, parseInt(limit, 10));

      res.json({
        count: restaurants.length,
        restaurants,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RestaurantController();
