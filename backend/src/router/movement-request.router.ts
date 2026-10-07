import { Router } from 'express';
import {
	crearSolicitudMovimiento,
	listarSolicitudesCiudadano,
	listarSolicitudesMovimiento,
	resolverSolicitudMovimiento,
	type NuevaSolicitudMovimiento,
} from '../services/movement-request.service';
import type { EstadoSolicitudMovimiento } from '../models/domain.model';
import { requireRole } from '../middleware/auth.middleware';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';

const estados = ['PENDIENTE', 'APROBADA', 'RECHAZADA'] as const;

type EstadoResolucion = Exclude<EstadoSolicitudMovimiento, 'PENDIENTE'>;

function objetoBody(body: unknown): Record<string, unknown> {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		throw new HttpError(400, 'CUERPO_INVALIDO', 'El cuerpo debe ser un objeto JSON.');
	}
	return body as Record<string, unknown>;
}

function texto(body: Record<string, unknown>, campo: string, maximo: number): string {
	const valor = body[campo];
	if (typeof valor !== 'string' || valor.trim() === '' || valor.length > maximo) {
		throw new HttpError(400, `${campo.toUpperCase()}_INVALIDO`, `${campo} es obligatorio y no puede superar ${maximo} caracteres.`);
	}
	return valor.trim();
}

function fecha(valor: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(new Date(`${valor}T00:00:00Z`).getTime())) {
		throw new HttpError(400, 'FECHA_SOLICITADA_INVALIDA', 'La fecha solicitada debe tener formato AAAA-MM-DD.');
	}
	return valor;
}

function idPositivo(valor: string | string[]): number {
	const numero = Number(Array.isArray(valor) ? valor[0] : valor);
	if (!Number.isSafeInteger(numero) || numero <= 0) {
		throw new HttpError(400, 'ID_SOLICITUD_INVALIDO', 'El id de la solicitud debe ser válido.');
	}
	return numero;
}

export const movementRequestRouter = Router();

movementRequestRouter.post('/', requireRole('USUARIO'), async (req, res) => {
	const empleado = req.empleado!;
	if (!empleado.ciudadanoId) throw new HttpError(403, 'FICHA_NO_VINCULADA', 'Debes tener una ficha ciudadana vinculada para solicitar un movimiento.');
	const body = objetoBody(req.body);
	const paisOrigen = texto(body, 'paisOrigen', 60);
	const paisDestino = texto(body, 'paisDestino', 60);
	if (paisOrigen.toLocaleLowerCase() === paisDestino.toLocaleLowerCase()) {
		throw new HttpError(400, 'PAISES_IGUALES', 'El país de origen y destino deben ser diferentes.');
	}
	const solicitud: NuevaSolicitudMovimiento = {
		ciudadanoId: empleado.ciudadanoId,
		paisOrigen,
		paisDestino,
		fechaSolicitada: fecha(texto(body, 'fechaSolicitada', 10)),
		motivo: texto(body, 'motivo', 255),
	};
	sendOk(res, await crearSolicitudMovimiento(solicitud), 201);
});

movementRequestRouter.get('/mias', requireRole('USUARIO'), async (req, res) => {
	if (!req.empleado?.ciudadanoId) throw new HttpError(403, 'FICHA_NO_VINCULADA', 'Tu cuenta no tiene una ficha ciudadana vinculada.');
	sendOk(res, await listarSolicitudesCiudadano(req.empleado.ciudadanoId));
});

movementRequestRouter.get('/', requireRole('PERSONAL', 'ADMINISTRADOR'), async (req, res) => {
	const valorEstado = typeof req.query.estado === 'string' ? req.query.estado.toUpperCase() : undefined;
	if (valorEstado && !estados.includes(valorEstado as EstadoSolicitudMovimiento)) {
		throw new HttpError(400, 'ESTADO_INVALIDO', 'El estado de solicitud no es válido.');
	}
	sendOk(res, await listarSolicitudesMovimiento(valorEstado as EstadoSolicitudMovimiento | undefined));
});

movementRequestRouter.patch('/:id/resolver', requireRole('PERSONAL', 'ADMINISTRADOR'), async (req, res) => {
	const body = objetoBody(req.body);
	const estado = texto(body, 'estado', 10).toUpperCase();
	if (estado !== 'APROBADA' && estado !== 'RECHAZADA') {
		throw new HttpError(400, 'ESTADO_RESOLUCION_INVALIDO', 'La resolución debe ser APROBADA o RECHAZADA.');
	}
	const comentario = body.comentario === undefined ? null : texto(body, 'comentario', 255);
	const solicitud = await resolverSolicitudMovimiento(idPositivo(req.params.id), estado as EstadoResolucion, comentario, req.empleado!.id);
	if (!solicitud) throw new HttpError(409, 'SOLICITUD_YA_RESUELTA', 'La solicitud no existe o ya fue resuelta.');
	sendOk(res, solicitud);
});
