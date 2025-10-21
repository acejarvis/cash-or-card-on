const userDAO = require('../dao/userDAO');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      const { email, username, password, role = 'registered' } = req.body;

      // Validate input
      if (!email || !username || !password) {
        throw new AppError('Email, username, and password are required', 400);
      }

      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      // Check if user already exists
      const existingUser = await userDAO.findByEmail(email);
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await userDAO.create(email, username, passwordHash, role);

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user
      const user = await userDAO.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
      }

      // Update last login
      await userDAO.updateLastLogin(user.id);

      // Generate token
      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await userDAO.findById(req.user.id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get user statistics
      const stats = await userDAO.getStatistics(req.user.id);

      res.json({
        user,
        statistics: stats || {},
      });
    } catch (err) {
      next(err);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const { username, email } = req.body;
      const updates = {};

      if (username) updates.username = username;
      if (email) updates.email = email;

      if (Object.keys(updates).length === 0) {
        throw new AppError('No updates provided', 400);
      }

      const updatedUser = await userDAO.update(req.user.id, updates);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
