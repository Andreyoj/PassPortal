import { Router } from 'express';
import { alertRouter } from './alert.router';
import { administrativeRouter } from './administrative.router';
import { citizenRouter } from './citizen.router';
import { healthRouter } from './health.router';
import { photoRouter } from './photo.router';
import { authRouter } from './auth.router';
import { movementRequestRouter } from './movement-request.router';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use(authenticate);
apiRouter.use('/alertas', requireRole('PERSONAL', 'ADMINISTRADOR'), alertRouter);
apiRouter.use('/ciudadanos', citizenRouter);
apiRouter.use('/solicitudes-movimiento', movementRequestRouter);
apiRouter.use(administrativeRouter);
apiRouter.use(photoRouter);
