import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware';
import { administrarEmpleado, autenticar, listarEmpleados, obtenerEmpleado, registrarUsuario } from '../services/auth.service';
import { HttpError } from '../utils/http-error';
import { sendOk } from '../utils/http-response';
import { credencialesCompletas } from '../utils/auth-validation';

const limitadorLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { ok: false, error: { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos. Intenta nuevamente más tarde.' } } });
export const authRouter = Router();
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
	const value = body as Record<string, unknown>;
	const datos = { usuario: String(value.usuario ?? '').trim(), nombreCompleto: String(value.nombreCompleto ?? '').trim(), correo: String(value.correo ?? '').trim(), password: String(value.password ?? '') };
	if (!datos.usuario || !datos.nombreCompleto || !datos.correo || datos.password.length < 10) throw new HttpError(400, 'DATOS_INVALIDOS', 'Completa todos los campos y usa una contraseña de al menos 10 caracteres.');
	return datos;
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

authRouter.put('/me', authenticate, async (req, res) => {
	const value = req.body as Record<string, unknown>;
	const empleado = await administrarEmpleado(req.empleado!.id, {
		nombreCompleto: String(value.nombreCompleto ?? '').trim(),
		correo: String(value.correo ?? '').trim(),
		password: typeof value.password === 'string' && value.password ? value.password : undefined,
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
	const rol = String((req.body as Record<string, unknown>).rol ?? '');
	if (!['USUARIO', 'OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR'].includes(rol)) throw new HttpError(400, 'ROL_INVALIDO', 'El rol indicado no es válido.');
	const empleado = await registrarUsuario(datos);
	const actualizado = await administrarEmpleado(empleado.id, { nombreCompleto: datos.nombreCompleto, correo: datos.correo, rol: rol as 'USUARIO' | 'OPERADOR' | 'SUPERVISOR' | 'ADMINISTRADOR' });
	sendOk(res, actualizado, 201);
});

authRouter.put('/users/:id', authenticate, async (req, res) => {
	if (req.empleado?.rol !== 'ADMINISTRADOR') throw new HttpError(403, 'PERMISOS_INSUFICIENTES', 'Solo un administrador puede gestionar usuarios.');
	const value = req.body as Record<string, unknown>;
	const rol = value.rol as 'USUARIO' | 'OPERADOR' | 'SUPERVISOR' | 'ADMINISTRADOR' | undefined;
	if (rol && !['USUARIO', 'OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR'].includes(rol)) throw new HttpError(400, 'ROL_INVALIDO', 'El rol indicado no es válido.');
	const empleado = await administrarEmpleado(Number(req.params.id), { usuario: String(value.usuario ?? '').trim(), nombreCompleto: String(value.nombreCompleto ?? '').trim(), correo: String(value.correo ?? '').trim(), rol, activo: typeof value.activo === 'boolean' ? value.activo : undefined, password: typeof value.password === 'string' && value.password ? value.password : undefined });
	if (!empleado) throw new HttpError(404, 'EMPLEADO_NO_ENCONTRADO', 'El usuario no existe.');
	sendOk(res, empleado);
});
