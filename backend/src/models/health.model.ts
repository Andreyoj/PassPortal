export type EstadoServicio = 'OK' | 'DEGRADADO';
export type EstadoBaseDatos = 'CONECTADA' | 'SIN_CONEXION';

export interface HealthStatus {
	estado: EstadoServicio;
	baseDatos: EstadoBaseDatos;
	entorno: string;
	fecha: string;
	uptimeSegundos: number;
}
