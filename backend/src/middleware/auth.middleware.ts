import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { EmpleadoAutenticado, JwtPayload } from '../models/auth.model';
import type { NombreRol } from '../models/domain.model';
import { HttpError } from '../utils/http-error';

declare global {
	namespace Express {
		interface Request { empleado?: EmpleadoAutenticado; }
	}
}

function secretoJwt(): string {
	const secreto = process.env.JWT_SECRET;
	if (!secreto || secreto.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
	return secreto;
}

export function validarConfiguracionJwt(): void {
	secretoJwt();
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
	const encabezado = req.header('authorization');
	const token = encabezado?.startsWith('Bearer ') ? encabezado.slice(7) : '';
	if (!token) { next(new HttpError(401, 'NO_AUTORIZADO', 'Se requiere autenticación.')); return; }
	try {
		const payload = jwt.verify(token, secretoJwt());
		if (typeof payload !== 'object' || payload === null || typeof payload.sub !== 'string' || typeof payload.usuario !== 'string' || !['PERSONAL', 'ADMINISTRADOR', 'USUARIO'].includes(payload.rol as string)) {
			throw new Error('Payload inválido');
		}
		const datos = payload as JwtPayload;
		req.empleado = { id: Number(datos.sub), usuario: datos.usuario, nombreCompleto: '', correo: '', rol: datos.rol };
		next();
	} catch {
		next(new HttpError(401, 'TOKEN_INVALIDO', 'La sesión no es válida o ha expirado.'));
	}
}

export function requireRole(...roles: NombreRol[]) {
	return (req: Request, _res: Response, next: NextFunction): void => {
		if (!req.empleado || !roles.includes(req.empleado.rol)) { next(new HttpError(403, 'PERMISOS_INSUFICIENTES', 'No tienes permisos para realizar esta acción.')); return; }
		next();
	};
}
