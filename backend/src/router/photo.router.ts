import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { Router, type RequestHandler } from 'express';
import { obtenerFichaCiudadano } from '../services/citizen.service';
import { actualizarFotoCiudadano } from '../services/photo.service';
import { FOTOS_DIR } from '../utils/paths';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';

const tiposImagen = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensiones: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
};

const almacenamiento = multer.diskStorage({
	destination: FOTOS_DIR,
	filename: (req, _file, callback) => {
		callback(null, `ciudadano-${req.params.id}-${Date.now()}.upload`);
	},
});

const cargaFoto = multer({
	storage: almacenamiento,
	limits: { fileSize: 5 * 1024 * 1024, files: 1 },
	fileFilter: (_req, file, callback) => {
		if (!tiposImagen.has(file.mimetype)) {
			callback(new HttpError(400, 'FORMATO_FOTO_INVALIDO', 'La foto debe ser JPG, PNG o WEBP.'));
			return;
		}
		callback(null, true);
	},
});

const cargarUnaFoto: RequestHandler = (req, res, next): void => {
	cargaFoto.single('foto')(req, res, (error: unknown) => {
		if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
			next(new HttpError(400, 'FOTO_DEMASIADO_GRANDE', 'La foto no puede superar 5 MB.'));
			return;
		}
		if (error !== undefined && error !== null) {
			next(error);
			return;
		}
		next();
	});
};

export const photoRouter = Router();

photoRouter.post('/ciudadanos/:id/foto', cargarUnaFoto, async (req, res) => {
	const id = Number(req.params.id);
	if (!Number.isSafeInteger(id) || id <= 0) {
		if (req.file) await fs.rm(req.file.path, { force: true });
		throw new HttpError(400, 'ID_CIUDADANO_INVALIDO', 'El id del ciudadano debe ser un entero positivo.');
	}
	if (!req.file) {
		throw new HttpError(400, 'FOTO_REQUERIDA', 'Debes enviar una foto en el campo foto.');
	}

	const ficha = await obtenerFichaCiudadano(id);
	if (!ficha) {
		await fs.rm(req.file.path, { force: true });
		throw new HttpError(404, 'CIUDADANO_NO_ENCONTRADO', 'El ciudadano solicitado no existe.');
	}

	const extension = extensiones[req.file.mimetype];
	const nombre = `${ficha.dpi}_${Date.now()}${extension}`;
	const destino = path.join(FOTOS_DIR, nombre);
	await fs.rename(req.file.path, destino);

	const fotoUrl = await actualizarFotoCiudadano(id, ficha.fotoUrl, `/uploads/fotos/${nombre}`);
	sendOk(res, { fotoUrl }, 201);
});
