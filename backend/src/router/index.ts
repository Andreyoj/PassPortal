import { Router } from 'express';
import { healthRouter } from './health.router';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
