import logger from './logger';

export default new (class AppUtils {
  async init(): Promise<void> {
    // Basic app initialization goes here
    logger.info('App data initialized');
  }
})();
