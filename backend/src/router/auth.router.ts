import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware';
import { administrarEmpleado, autenticar, listarEmpleados, obtenerEmpleado, obtenerFichaPropia, registrarUsuario } from '../services/auth.service';
import { actualizarDatosFicha, crearFichaCiudadano, type DatosFichaCiudadano } from '../services/citizen.service';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';
import { credencialesCompletas } from '../utils/auth-validation';
import { pool } from '../db';
import type { RowDataPacket } from 'mysql2';

const limitadorLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { ok: false, error: { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos. Intenta nuevamente más tarde.' } } });
export const authRouter = Router();

function objetoBody(body: unknown): Record<string, unknown> {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		throw new HttpError(400, 'CUERPO_INVALIDO', 'El cuerpo debe ser un objeto JSON.');
	}
	return body as Record<string, unknown>;
}

function texto(value: unknown, campo: string, maximo: number, minimo = 1): string {
	if (typeof value !== 'string') throw new HttpError(400, `${campo.toUpperCase()}_INVALIDO`, `${campo} debe ser texto.`);
	const result = value.trim();
	if (result.length < minimo || result.length > maximo) throw new HttpError(400, `${campo.toUpperCase()}_INVALIDO`, `${campo} debe tener entre ${minimo} y ${maximo} caracteres.`);
	return result;
}

function correo(value: unknown): string {
	const result = texto(value, 'correo', 120);
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(result)) throw new HttpError(400, 'CORREO_INVALIDO', 'Ingresa un correo electrónico válido.');
	return result;
}

function nombre(value: unknown, campo: string): string {
	const result = texto(value, campo, 120);
	if (!/^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u.test(result)) throw new HttpError(400, `${campo.toUpperCase()}_INVALIDO`, `${campo} solo puede contener letras, espacios, guiones y apóstrofes.`);
	return result;
}
authRouter.post('/login', limitadorLogin, async (req, res) => {
	if (!credencialesCompletas(req.body)) throw new HttpError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos');
	const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim() : '';
	const password = typeof req.body?.password === 'string' ? req.body.password : '';
	if (!usuario || !password) throw new HttpError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos');
	const resultado = await autenticar(usuario, password);
	if (!resultado) throw new HttpError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos');
	sendOk(res, resultado);
});

function datosUsuario(body: unknown): { usuario: string; nombreCompleto: string; correo: string; password: string } {
	const value = objetoBody(body);
	const usuario = texto(value.usuario, 'usuario', 40, 3);
	if (!/^[A-Za-z0-9._-]+$/.test(usuario)) throw new HttpError(400, 'USUARIO_INVALIDO', 'El usuario solo puede contener letras, números, punto, guion y guion bajo.');
	const password = texto(value.password, 'contraseña', 128, 10);
	return { usuario, nombreCompleto: nombre(value.nombreCompleto, 'nombreCompleto'), correo: correo(value.correo), password };
}

async function resolverCiudadanoId(value: unknown): Promise<number | null | undefined> {
	if (value === undefined) return undefined;
	if (value === null || value === '') return null;
	const dpi = String(value).trim();
	if (!/^\d{8,20}$/.test(dpi)) throw new HttpError(400, 'DPI_INVALIDO', 'El DPI debe contener entre 8 y 20 dígitos.');
	const [rows] = await pool.query<(RowDataPacket & { id: number })[]>('SELECT id FROM ciudadanos WHERE dpi = ? LIMIT 1', [dpi]);
	if (!rows[0]) throw new HttpError(404, 'FICHA_NO_ENCONTRADA', 'No existe una ficha ciudadana con ese DPI.');
	return rows[0].id;
}

authRouter.post('/register', async (req, res) => {
	const empleado = await registrarUsuario(datosUsuario(req.body));
	sendOk(res, empleado, 201);
});

authRouter.get('/me', authenticate, async (req, res) => {
	const empleado = await obtenerEmpleado(req.empleado!.id);
	if (!empleado) throw new HttpError(401, 'NO_AUTORIZADO', 'La sesión no es válida o ha expirado.');
	sendOk(res, empleado);
});

authRouter.get('/me/ficha', authenticate, async (req, res) => {
	const ficha = await obtenerFichaPropia(req.empleado!.id);
	if (!ficha) throw new HttpError(404, 'FICHA_NO_VINCULADA', 'Tu cuenta todavía no está vinculada a una ficha ciudadana. Solicita ayuda al administrador.');
	sendOk(res, ficha);
});

function datosFicha(body: unknown): DatosFichaCiudadano {
	const value = objetoBody(body);
	const datos = {
		dpi: texto(value.dpi, 'DPI', 20, 8),
		nombres: nombre(value.nombres, 'nombres'),
		apellidos: nombre(value.apellidos, 'apellidos'),
		fechaNacimiento: texto(value.fechaNacimiento, 'fechaNacimiento', 10, 10),
		sexo: value.sexo,
		nacionalidad: nombre(value.nacionalidad, 'nacionalidad'),
		telefono: value.telefono === undefined ? undefined : texto(value.telefono, 'telefono', 20, 8),
		correo: value.correo === undefined ? undefined : correo(value.correo),
		direccion: value.direccion === undefined ? undefined : texto(value.direccion, 'direccion', 255),
	};
	if (!/^\d{8,20}$/.test(datos.dpi) || !/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaNacimiento) || !['M', 'F', 'X'].includes(String(datos.sexo))) {
		throw new HttpError(400, 'FICHA_INVALIDA', 'Completa DPI, nombres, apellidos, fecha de nacimiento, sexo y nacionalidad.');
	}
	const fecha = new Date(`${datos.fechaNacimiento}T00:00:00Z`);
	if (Number.isNaN(fecha.getTime()) || fecha > new Date()) throw new HttpError(400, 'FECHA_NACIMIENTO_INVALIDA', 'La fecha de nacimiento debe ser válida y no futura.');
	return { ...datos, sexo: datos.sexo as DatosFichaCiudadano['sexo'] };
}

authRouter.put('/me/ficha', authenticate, async (req, res) => {
	if (req.empleado?.rol !== 'USUARIO') throw new HttpError(403, 'PERMISOS_INSUFICIENTES', 'Solo un ciudadano puede editar su ficha desde esta pantalla.');
	const datos = datosFicha(req.body);
	const ficha = req.empleado.ciudadanoId
		? await actualizarDatosFicha(req.empleado.ciudadanoId, datos, req.empleado.id)
		: await crearFichaCiudadano(datos, req.empleado.id);
	sendOk(res, ficha, req.empleado.ciudadanoId ? 200 : 201);
});

authRouter.put('/me', authenticate, async (req, res) => {
	const value = objetoBody(req.body);
	const empleado = await administrarEmpleado(req.empleado!.id, {
		nombreCompleto: nombre(value.nombreCompleto, 'nombreCompleto'),
		correo: correo(value.correo),
		password: value.password ? texto(value.password, 'contraseña', 128, 10) : undefined,
	});
	if (!empleado) throw new HttpError(404, 'EMPLEADO_NO_ENCONTRADO', 'El usuario no existe.');
	sendOk(res, empleado);
});

authRouter.get('/users', authenticate, async (req, res) => {
	if (req.empleado?.rol !== 'ADMINISTRADOR') throw new HttpError(403, 'PERMISOS_INSUFICIENTES', 'Solo un administrador puede gestionar usuarios.');
	sendOk(res, await listarEmpleados());
});

authRouter.post('/users', authenticate, async (req, res) => {
	if (req.empleado?.rol !== 'ADMINISTRADOR') throw new HttpError(403, 'PERMISOS_INSUFICIENTES', 'Solo un administrador puede gestionar usuarios.');
	const datos = datosUsuario(req.body);
	const body = objetoBody(req.body);
	const rol = texto(body.rol, 'rol', 20).toUpperCase();
	if (!['USUARIO', 'PERSONAL', 'ADMINISTRADOR'].includes(rol)) throw new HttpError(400, 'ROL_INVALIDO', 'El rol indicado no es válido.');
	const empleado = await registrarUsuario(datos);
	const actualizado = await administrarEmpleado(empleado.id, { nombreCompleto: datos.nombreCompleto, correo: datos.correo, rol: rol as 'USUARIO' | 'PERSONAL' | 'ADMINISTRADOR', ciudadanoId: await resolverCiudadanoId(body.dpiCiudadano) });
	sendOk(res, actualizado, 201);
});

authRouter.put('/users/:id', authenticate, async (req, res) => {
	if (req.empleado?.rol !== 'ADMINISTRADOR') throw new HttpError(403, 'PERMISOS_INSUFICIENTES', 'Solo un administrador puede gestionar usuarios.');
	const value = objetoBody(req.body);
	const id = Number(req.params.id);
	if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'ID_EMPLEADO_INVALIDO', 'El id del usuario debe ser un entero positivo.');
	const rol = value.rol as 'USUARIO' | 'PERSONAL' | 'ADMINISTRADOR' | undefined;
	if (rol && !['USUARIO', 'PERSONAL', 'ADMINISTRADOR'].includes(rol)) throw new HttpError(400, 'ROL_INVALIDO', 'El rol indicado no es válido.');
	const ciudadanoId = await resolverCiudadanoId(value.dpiCiudadano);
	const empleado = await administrarEmpleado(id, { usuario: value.usuario === undefined ? undefined : texto(value.usuario, 'usuario', 40, 3), nombreCompleto: nombre(value.nombreCompleto, 'nombreCompleto'), correo: correo(value.correo), rol, activo: typeof value.activo === 'boolean' ? value.activo : undefined, password: value.password ? texto(value.password, 'contraseña', 128, 10) : undefined, ciudadanoId });
	if (!empleado) throw new HttpError(404, 'EMPLEADO_NO_ENCONTRADO', 'El usuario no existe.');
	sendOk(res, empleado);
});
