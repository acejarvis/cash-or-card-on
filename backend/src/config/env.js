require('dotenv').config();

module.exports = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  DB: {
    HOST: process.env.POSTGRES_HOST || 'localhost',
    PORT: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    NAME: process.env.POSTGRES_DB || 'cash_or_card',
    USER: process.env.POSTGRES_USER || 'postgres',
    PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
