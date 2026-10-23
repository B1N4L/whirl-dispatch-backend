import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';

export const docsRouter = Router();

// Expose raw OpenAPI JSON spec
docsRouter.get('/json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerDocument);
});

// Interactive Swagger UI documentation
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'WhirlDispatch OpenAPI 3.0 Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));
