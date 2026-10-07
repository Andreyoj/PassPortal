import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware';
import { autenticar, obtenerEmpleado } from '../services/auth.service';
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

authRouter.get('/me', authenticate, async (req, res) => {
	const empleado = await obtenerEmpleado(req.empleado!.id);
	if (!empleado) throw new HttpError(401, 'NO_AUTORIZADO', 'La sesión no es válida o ha expirado.');
	sendOk(res, empleado);
});
