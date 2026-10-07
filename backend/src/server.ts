import cors from 'cors';
import express, { type Application } from 'express';
import { apiRouter } from './router';
import { errorHandler, notFoundHandler } from './utils/error-handler';
import { FOTOS_DIR } from './utils/paths';
import helmet from 'helmet';

const origenesPermitidos = (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
	.split(',')
	.map((origen) => origen.trim())
	.filter((origen) => origen.length > 0);

export const app: Application = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
	cors({
		origin: origenesPermitidos,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	}),
);
app.use(express.json({ limit: '1mb' }));

app.use('/uploads/fotos', express.static(FOTOS_DIR, { index: false, maxAge: '1d' }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
