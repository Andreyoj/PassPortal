import { Router } from 'express';
import type { EstadoAlerta } from '../models/domain.model';
import { obtenerAlertas, obtenerResumenAlertas } from '../services/alert.service';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';

const estadosAlerta: readonly EstadoAlerta[] = ['VERDE', 'AMARILLO', 'ROJO'];

export const alertRouter = Router();

alertRouter.get('/resumen', async (_req, res) => {
	sendOk(res, await obtenerResumenAlertas());
});

alertRouter.get('/', async (req, res) => {
	const estadoQuery = typeof req.query.estado === 'string' ? req.query.estado.toUpperCase() : undefined;
	if (estadoQuery !== undefined && !estadosAlerta.includes(estadoQuery as EstadoAlerta)) {
		throw new HttpError(400, 'ESTADO_ALERTA_INVALIDO', 'El estado debe ser VERDE, AMARILLO o ROJO.');
	}

	sendOk(res, await obtenerAlertas(estadoQuery as EstadoAlerta | undefined));
});
