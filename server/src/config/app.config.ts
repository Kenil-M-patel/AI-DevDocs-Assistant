import config from './config';

export default {
  port: config.PORT,
  env: config.NODE_ENV,
  debug: config.DEBUG,
  baseUrl: config.BASE_URL,
  frontendUrl: config.FRONTEND_URL,
};
