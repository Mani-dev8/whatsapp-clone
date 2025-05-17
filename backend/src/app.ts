import compression from 'compression';
import express, { Application } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { logger } from './api/middlewares/loggerMiddleware';
import { errorHandler } from './api/middlewares/errorHandlerMiddleware';

const app: Application = express();

app.use(express.json());

app.use(compression());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// request logging middleware
app.use(logger);

app.use('api-docs', swaggerUi.serve, swaggerUi.setup());

app.use(errorHandler);

export default app;
