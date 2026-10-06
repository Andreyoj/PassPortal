import { Router } from 'express';
import { alertRouter } from './alert.router';
import { healthRouter } from './health.router';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/alertas', alertRouter);
