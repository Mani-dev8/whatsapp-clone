import compression from 'compression';
import express, { Application } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from './api/middlewares/loggerMiddleware';
import { errorHandler } from './api/middlewares/errorHandlerMiddleware';
import { registerRoutes } from './api/routes';
import { AuthenticatedRequest } from './api/middlewares/authMiddleware';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(compression());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request logging
app.use(logger);

// Register TSOA routes and Swagger UI
registerRoutes(app);

app.use((req: AuthenticatedRequest, res, next) => {
  console.log('App middleware request.user:', req.user);
  next();
});

// Error handling (must be last)
app.use(errorHandler);

export default app;
