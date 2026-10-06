import { Router } from 'express';
import { alertRouter } from './alert.router';
import { administrativeRouter } from './administrative.router';
import { citizenRouter } from './citizen.router';
import { healthRouter } from './health.router';
import { photoRouter } from './photo.router';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/alertas', alertRouter);
apiRouter.use('/ciudadanos', citizenRouter);
apiRouter.use(administrativeRouter);
apiRouter.use(photoRouter);
