import { sequelize } from '../connection/db.connection';
import logger from '../lib/logger';
export class DatabaseUtils {
  static getPoolStatus() {
    const pool = (sequelize.connectionManager as any).pool;
    return {
      totalConnections: pool?.size || 0,
      usedConnections: pool?.used || 0,
      availableConnections: pool?.available || 0,
      waitingCount: pool?.pending || 0,
    };
  }
  static logDatabaseStatus() {
    const status = this.getPoolStatus();
    logger.info('Database Pool Status:', {
      total: status.totalConnections,
      used: status.usedConnections,
      available: status.availableConnections,
      waiting: status.waitingCount,
    });
  }
  static isDatabaseUnderStress(): boolean {
    const status = this.getPoolStatus();
    if (status.totalConnections === 0) return false;
    const utilizationRate = status.usedConnections / status.totalConnections;
    return utilizationRate > 0.8; // More than 80% utilization
  }
  static async getPerformanceMetrics() {
    try {
      const startTime = Date.now();
      await sequelize.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        responseTime,
        isHealthy: responseTime < 1000, // Healthy if response time < 1 second
        poolStatus: this.getPoolStatus(),
      };
    } catch (error) {
      logger.error('Failed to get database performance metrics:', error);
      return {
        responseTime: -1,
        isHealthy: false,
        poolStatus: this.getPoolStatus(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  static async closeIdleConnections() {
    try {
      const pool = (sequelize.connectionManager as any).pool;
      if (pool && typeof pool.drain === 'function') {
        await pool.drain();
        logger.info('Idle database connections closed');
      }
    } catch (error) {
      logger.error('Failed to close idle connections:', error);
    }
  }
}
export const setupDatabaseEventHandlers = () => {
  const pool = (sequelize.connectionManager as any).pool;

  // Some pool implementations (sequelize-pool) do not expose EventEmitter APIs
  if (pool && typeof pool.on === 'function') {
    pool.on('connection', () => {
      logger.debug('New database connection established');
    });

    pool.on('acquire', () => {
      logger.debug('Database connection acquired from pool');
    });

    pool.on('release', () => {
      logger.debug('Database connection released to pool');
    });

    pool.on('error', (error: Error) => {
      logger.error('Database pool error:', error);
    });
  } else {
    logger.debug(
      'Database pool events not supported by current pool implementation. Skipping event handlers.',
    );
  }

  // Log pool status every 5 minutes
  setInterval(
    () => {
      DatabaseUtils.logDatabaseStatus();

      if (DatabaseUtils.isDatabaseUnderStress()) {
        logger.warn('Database is under stress - high connection utilization');
      }
    },
    5 * 60 * 1000,
  ); // 5 minutes
};
