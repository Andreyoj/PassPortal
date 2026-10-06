import { Router } from 'express';
import { obtenerEstadoSalud } from '../services/health.service';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
	const estado = await obtenerEstadoSalud();

	if (estado.estado === 'DEGRADADO') {
		throw new HttpError(503, 'SERVICIO_DEGRADADO', 'La base de datos no responde.', estado);
	}

	sendOk(res, estado);
});
