const { verifyToken } = require('../utils/auth');

// Authenticate user by JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authentication required',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired',
    });
  }

  req.user = decoded;
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

// Authorize by role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

// Require registered user (not guest)
const requireRegistered = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Authentication required',
    });
  }

  if (req.user.role === 'guest') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Registered account required for this action',
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireRegistered,
};
