const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const SALT_ROUNDS = 10;

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password with hash
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.JWT.SECRET, {
    expiresIn: config.JWT.EXPIRES_IN,
  });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT.SECRET);
  } catch (err) {
    return null;
  }
}

// Generate refresh token
function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, config.JWT.SECRET, {
    expiresIn: config.JWT.REFRESH_EXPIRES_IN,
  });
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
};
