import { Router } from 'express';
import { actualizarContactoCiudadano, buscarCiudadanos, obtenerFichaCiudadano, type DatosContacto } from '../services/citizen.service';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';
import { requireRole } from '../middleware/auth.middleware';

export const citizenRouter = Router();

citizenRouter.get('/', async (req, res) => {
	const query = typeof req.query.q === 'string' ? req.query.q : undefined;
	sendOk(res, await buscarCiudadanos(query));
});

citizenRouter.get('/:id', async (req, res) => {
	const id = Number(req.params.id);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new HttpError(400, 'ID_CIUDADANO_INVALIDO', 'El id del ciudadano debe ser un entero positivo.');
	}
	const ficha = await obtenerFichaCiudadano(id);
	if (!ficha) {
		throw new HttpError(404, 'CIUDADANO_NO_ENCONTRADO', 'El ciudadano solicitado no existe.');
	}
	sendOk(res, ficha);
});

citizenRouter.put('/:id', requireRole('OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR'), async (req, res) => {
	const id = Number(req.params.id);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new HttpError(400, 'ID_CIUDADANO_INVALIDO', 'El id del ciudadano debe ser un entero positivo.');
	}
	if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
		throw new HttpError(400, 'CONTACTO_INVALIDO', 'El cuerpo debe ser un objeto con datos de contacto.');
	}

	const body = req.body as Record<string, unknown>;
	const datos: DatosContacto = {};
	if (body.telefono !== undefined) {
		if (typeof body.telefono !== 'string' || !/^[\d +()-]{8,20}$/.test(body.telefono)) {
			throw new HttpError(400, 'TELEFONO_INVALIDO', 'El teléfono debe tener entre 8 y 20 caracteres válidos.');
		}
		datos.telefono = body.telefono;
	}
	if (body.correo !== undefined) {
		if (typeof body.correo !== 'string' || body.correo.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.correo)) {
			throw new HttpError(400, 'CORREO_INVALIDO', 'El correo electrónico no es válido.');
		}
		datos.correo = body.correo;
	}
	if (body.direccion !== undefined) {
		if (typeof body.direccion !== 'string' || body.direccion.length > 255) {
			throw new HttpError(400, 'DIRECCION_INVALIDA', 'La dirección no puede superar 255 caracteres.');
		}
		datos.direccion = body.direccion;
	}
	if (Object.keys(datos).length === 0) {
		throw new HttpError(400, 'CONTACTO_SIN_CAMBIOS', 'Debes enviar al menos un campo de contacto válido.');
	}

	const ficha = await actualizarContactoCiudadano(id, datos, req.empleado!.id);
	if (!ficha) {
		throw new HttpError(404, 'CIUDADANO_NO_ENCONTRADO', 'El ciudadano solicitado no existe.');
	}
	sendOk(res, ficha);
});
