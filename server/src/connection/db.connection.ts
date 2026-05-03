import { Sequelize } from 'sequelize';
import logger from '../lib/logger';
import config from '../config/db.config';

interface DbConfig {
  DATABASE_NAME: string;
  DATABASE_NAME_TEST: string;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_HOST: string;
}

const dbConfig: DbConfig = config;

export const sequelize = new Sequelize(
  process.env.NODE_ENV === 'test' ? dbConfig.DATABASE_NAME_TEST : dbConfig.DATABASE_NAME,
  dbConfig.DATABASE_USERNAME,
  dbConfig.DATABASE_PASSWORD,
  {
    host: dbConfig.DATABASE_HOST,
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      // ssl: {
      //   rejectUnauthorized: false,
      // },
      connectTimeout: 30000,
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 60000,
    },
    // pool: {
    //   max: 3,
    //   min: 1,
    //   idle: 10000,
    //   acquire: 30000,
    //   evict: 1000,
    // },
    pool: {
      max: 10,
      min: 2,
      idle: 30000,
      acquire: 60000,
      evict: 10000,
    },
    retry: {
      max: 3,
    },
    logging: false,
  },
);

logger.debug(
  `[DB] Connecting to host=${dbConfig.DATABASE_HOST} db=${dbConfig.DATABASE_NAME}`,
);

const connectWithRetry = async (retries = 5, delay = 1000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info(
        `Database connection established with PostgreSQL database: "${dbConfig.DATABASE_NAME}".`,
      );
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${i + 1}/${retries} failed: ${error}`);

      if (i === retries - 1) {
        logger.error('All database connection attempts failed. Exiting application.');
        process.exit(1);
      }

      const backoffDelay = delay * Math.pow(2, i);
      logger.info(`Retrying database connection in ${backoffDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
};

export const connect = async (): Promise<void> => {
  await connectWithRetry();

  // Register all Sequelize models + FK associations
  await import('../models/index');

  // Sync schema: adds new columns/tables without dropping existing data
  await sequelize.sync({ alter: true });
  logger.info('Database schema synced successfully.');
};

export const disconnect = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed gracefully.');
  } catch (error) {
    logger.error(`Error closing database connection: ${error}`);
  }
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error(`Database health check failed: ${error}`);
    return false;
  }
};
