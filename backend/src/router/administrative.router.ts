import { Router } from 'express';
import {
	crearMulta,
	crearRestriccion,
	levantarRestriccion,
	pagarMulta,
	type NuevaMulta,
	type NuevoArraigo,
} from '../services/administrative.service';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';

const tiposRestriccion = ['ARRAIGO', 'BLOQUEO_LEGAL', 'RESTRICCION_SALIDA'] as const;

function enteroPositivo(valor: string, campo: string): number {
	const numero = Number(valor);
	if (!Number.isSafeInteger(numero) || numero <= 0) {
		throw new HttpError(400, `${campo.toUpperCase()}_INVALIDO`, `El ${campo} debe ser un entero positivo.`);
	}
	return numero;
}

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

export const administrativeRouter = Router();

administrativeRouter.post('/ciudadanos/:id/multas', async (req, res) => {
	const ciudadanoId = enteroPositivo(req.params.id, 'ciudadano');
	const body = objetoBody(req.body);
	const monto = body.monto;
	if (typeof monto !== 'number' || !Number.isFinite(monto) || monto <= 0 || monto > 99999999.99) {
		throw new HttpError(400, 'MONTO_INVALIDO', 'El monto debe ser un número mayor que cero.');
	}
	const moneda = body.moneda === undefined ? 'GTQ' : texto(body, 'moneda', 3).toUpperCase();
	if (!/^[A-Z]{3}$/.test(moneda)) {
		throw new HttpError(400, 'MONEDA_INVALIDA', 'La moneda debe usar un código de tres letras.');
	}
	const multa: NuevaMulta = { concepto: texto(body, 'concepto', 200), monto, moneda };
	sendOk(res, await crearMulta(ciudadanoId, multa), 201);
});

administrativeRouter.patch('/multas/:id/pagar', async (req, res) => {
	const id = enteroPositivo(req.params.id, 'multa');
	const multa = await pagarMulta(id);
	if (!multa) throw new HttpError(404, 'MULTA_NO_ENCONTRADA', 'La multa no existe o ya no está pendiente.');
	sendOk(res, multa);
});

administrativeRouter.post('/ciudadanos/:id/arraigos', async (req, res) => {
	const ciudadanoId = enteroPositivo(req.params.id, 'ciudadano');
	const body = objetoBody(req.body);
	const tipo = body.tipo;
	if (typeof tipo !== 'string' || !tiposRestriccion.includes(tipo as (typeof tiposRestriccion)[number])) {
		throw new HttpError(400, 'TIPO_RESTRICCION_INVALIDO', 'El tipo de restricción no es válido.');
	}
	const fechaInicio = texto(body, 'fechaInicio', 10);
	const fechaFin = body.fechaFin === undefined ? undefined : texto(body, 'fechaFin', 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) || (fechaFin !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin))) {
		throw new HttpError(400, 'FECHA_INVALIDA', 'Las fechas deben usar el formato AAAA-MM-DD.');
	}
	if (fechaFin !== undefined && fechaFin < fechaInicio) {
		throw new HttpError(400, 'RANGO_FECHAS_INVALIDO', 'La fecha final no puede ser anterior a la inicial.');
	}
	const restriccion: NuevoArraigo = {
		tipo: tipo as NuevoArraigo['tipo'],
		motivo: texto(body, 'motivo', 255),
		autoridad: texto(body, 'autoridad', 120),
		numeroExpediente: body.numeroExpediente === undefined ? undefined : texto(body, 'numeroExpediente', 60),
		fechaInicio,
		fechaFin,
	};
	sendOk(res, await crearRestriccion(ciudadanoId, restriccion), 201);
});

administrativeRouter.patch('/arraigos/:id/levantar', async (req, res) => {
	const id = enteroPositivo(req.params.id, 'arraigo');
	const restriccion = await levantarRestriccion(id);
	if (!restriccion) throw new HttpError(404, 'ARRAIGO_NO_ENCONTRADO', 'El arraigo no existe o ya está levantado.');
	sendOk(res, restriccion);
});
