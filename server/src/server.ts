import logger from './lib/logger';
import appConfig from './config/app.config';
import App from './lib/app.utils';
import * as ServerUtils from './lib/server.utils';
import * as RedisUtils from './lib/redis.utils';
import * as DATABASE from './connection/db.connection';
import { initSocket } from './socket/socket';
import { setupDatabaseEventHandlers } from './utils/db.utils';
import './workers/document.worker'; // multi-format document embedding worker


// Global server instance for graceful shutdown
let server: any = null;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');

      // Close database connection
      await DATABASE.disconnect();

      logger.info('Graceful shutdown completed.');
      process.exit(0);
    });
  } else {
    await DATABASE.disconnect();
    process.exit(0);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Database connection monitoring
const startConnectionMonitoring = () => {
  setInterval(async () => {
    const isHealthy = await DATABASE.checkConnection();
    if (!isHealthy) {
      logger.warn('Database connection health check failed. Attempting to reconnect...');
      try {
        await DATABASE.connect();
        logger.info('Database reconnection successful.');
      } catch (error) {
        logger.error('Database reconnection failed:', error);
      }
    }
  }, 30000); // Check every 30 seconds
};

void (async () => {
  try {
    // Connect Redis
    await RedisUtils.connectToRedis();

    // Connect Database
    await DATABASE.connect();



    // Setup database event handlers and monitoring
    setupDatabaseEventHandlers();

    startConnectionMonitoring();

    // Connect Server
    ServerUtils.createServer()
      .then((app) => {
        void App.init();

        // Start the server
        const PORT = appConfig.port;
        server = app.listen(PORT, () => {
          logger.info(`Server is running on port ${PORT}`);
        });
        initSocket(server);
      })
      .catch((err) => {
        logger.error('Server startup failed:', err);
        process.exit(1);
      });
  } catch (error) {
    logger.error('Application startup failed:', error);
    process.exit(1);
  }
})();
