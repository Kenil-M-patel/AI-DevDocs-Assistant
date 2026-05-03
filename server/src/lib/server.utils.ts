import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
// import swaggerJSDoc from 'swagger-jsdoc';
// import swaggerUi from 'swagger-ui-express';
// import SwaggerConfig from '../config/swagger.config';
import config from '../config/config';
import logger, { morganMiddleware } from './logger';
import { ErrorMsg, ENV } from './constants';
import apiRoutes from '../routes/index';

export function createServer() {
  return new Promise<Express>((resolve, reject) => {
    try {
      const app: Express = express();

      let allowedOrigins =
        config.NODE_ENV === ENV.production
          ? [config.FRONTEND_URL]
          : [
              'http://localhost:4018',
              'http://localhost:4013',
              'http://192.168.29.210:4013',
              'http://45.248.33.161:4018',
              'http://localhost:3000',
              'http://45.248.33.161:4002',
              'https://web.zestymonk.com',
              'https://superadmin.zestymonk.com',
              'https://kitchen.zestymonk.com',
              'http://localhost:4013',
              'http://localhost:4013',
              'http://localhost:4015',
              'http://192.168.29.210:4013',
              'http://192.168.29.210:4015',
              'http://45.248.33.161:4015',
              'http://localhost:4013',
              'http://192.168.29.254:4015',
              'http://192.168.29.201:4015',
              'http://localhost:4014',
              'http://192.168.29.210:4014',
              'https://baseless-edwardo-unsmilingly.ngrok-free.dev',
            ];

      if (config.ALLOWED_ORIGINS) {
        allowedOrigins = [
          ...allowedOrigins,
          ...config.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
        ];
      }

      app.use(
        cors({
          credentials: true,
          origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
          ) => {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error(ErrorMsg.EXCEPTIONS.corsNotAllowed));
            }
          },
        }),
      );
      app.set('trust proxy', true);

      app.use(morganMiddleware);

      // Increase body parser limits for file uploads
      app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
      app.use(bodyParser.json({ limit: '50mb' }));

      // Serve static files from upload directory
      app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

      // API Routes
      app.use('/api/v1', apiRoutes);

      // Home Route
      app.get('/', (req: Request, res: Response) => {
        return res.send({ message: 'RAG-Chat-Backend Running Successfully' });
      });

      // const swaggerSpec = swaggerJSDoc(SwaggerConfig.options);
      // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

      resolve(app);
    } catch (err) {
      logger.error(err);
      reject(err);
    }
  });
}
