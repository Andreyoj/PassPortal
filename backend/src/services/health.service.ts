import { pool } from '../db';
import type { EstadoBaseDatos, HealthStatus } from '../models/health.model';

export async function obtenerEstadoSalud(): Promise<HealthStatus> {
	let baseDatos: EstadoBaseDatos = 'CONECTADA';

	try {
		await pool.query('SELECT 1');
	} catch {
		baseDatos = 'SIN_CONEXION';
	}

	return {
		estado: baseDatos === 'CONECTADA' ? 'OK' : 'DEGRADADO',
		baseDatos,
		entorno: process.env.NODE_ENV ?? 'development',
		fecha: new Date().toISOString(),
		uptimeSegundos: Math.round(process.uptime()),
	};
}
