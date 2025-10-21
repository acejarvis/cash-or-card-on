require('dotenv').config();
const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./config/database');

const PORT = config.PORT;
const HOST = config.HOST;

// Test database connection before starting server
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log('');
      console.log('=================================================');
      console.log('  Cash-or-Card-ON Backend API');
      console.log('=================================================');
      console.log(`  Environment: ${config.NODE_ENV}`);
      console.log(`  Server URL:  http://${HOST}:${PORT}`);
      console.log(`  Health:      http://${HOST}:${PORT}/health`);
      console.log(`  API Docs:    http://${HOST}:${PORT}/api`);
      console.log('=================================================');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🔄 Gracefully shutting down server...');
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forcing server shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
