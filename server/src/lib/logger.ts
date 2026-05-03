import appConfig from '../config/app.config';
import winston from 'winston';
import morgan from 'morgan';


const { combine, timestamp, printf, colorize, json, splat } = winston.format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine logging level
const level = () => {
  const env = appConfig.env || 'development';
  if (env === 'test') return 'silent';
  const isDevelopment = env === 'development';
  return isDevelopment || appConfig.debug ? 'debug' : 'warn';
};

// Add colors for console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Console formatter (colored, human-readable)
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  splat(),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  }));

// File formatter (structured JSON)
const fileFormat = combine(
  timestamp(),
  splat(),
  json(), // structured JSON for logs
);

// Transports
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat,
  }),
  new winston.transports.File({
    filename: 'logs/all.log',
    format: fileFormat,
  }),
];

// Create logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Morgan middleware to log HTTP requests in structured format
export const morganMiddleware = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => {
        const parts = message.trim().split(' ');
        const ip = parts[0];
        const method = parts[1];
        const url = parts[2];
        const status = parseInt(parts[3], 10);
        const responseTime = parseFloat(parts[6]);

        logger.http({
          message: `${method} ${url}`,
          ip,
          method,
          path: url,
          status,
          responseTime,
        });
      },
    },
  },
);

export default logger;
