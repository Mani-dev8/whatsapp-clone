import { Application } from 'express';
import { RegisterRoutes } from './routes'; // TSOA-generated routes
import swaggerUi from 'swagger-ui-express';
import swaggerJson from './swagger.json'; // TSOA-generated Swagger spec

export function registerRoutes(app: Application) {
  // Register TSOA routes
  RegisterRoutes(app);

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJson));
}