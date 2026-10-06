import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody, ApiErrorResponse } from '../models/api-response.model';
import { HttpError } from './http-error';

function construirRespuesta(codigo: string, mensaje: string, detalles?: unknown): ApiErrorResponse {
	const error: ApiErrorBody = { codigo, mensaje };
	if (detalles !== undefined) {
		error.detalles = detalles;
	}
	return { ok: false, error };
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
	next(new HttpError(404, 'RUTA_NO_ENCONTRADA', `La ruta ${req.method} ${req.originalUrl} no existe.`));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
	if (err instanceof HttpError) {
		res.status(err.statusCode).json(construirRespuesta(err.codigo, err.message, err.detalles));
		return;
	}

	if (err instanceof SyntaxError && 'body' in err) {
		res
			.status(400)
			.json(construirRespuesta('JSON_INVALIDO', 'El cuerpo de la solicitud no es un JSON válido.'));
		return;
	}

	console.error('[ERROR NO CONTROLADO]', err);
	res
		.status(500)
		.json(construirRespuesta('ERROR_INTERNO', 'Ocurrió un error interno en el servidor.'));
};
