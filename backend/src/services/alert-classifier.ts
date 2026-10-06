import type { EstadoAlerta } from '../models/domain.model';

export type EtiquetaAlerta = 'VENCIDO' | 'POR_VENCER' | 'VIGENTE';
export type RangoAlerta = 30 | 60 | 90 | null;

export interface ClasificacionDocumento {
	estado: EstadoAlerta;
	etiqueta: EtiquetaAlerta;
	rango: RangoAlerta;
	diasRestantes: number;
}

function fechaUtc(fecha: string): Date {
	const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(anio, mes - 1, dia));
}

export function clasificarDocumento(fechaVencimiento: string, hoy = new Date().toISOString()): ClasificacionDocumento {
	const diasRestantes = Math.floor(
		(fechaUtc(fechaVencimiento).getTime() - fechaUtc(hoy).getTime()) / 86_400_000,
	);

	if (diasRestantes <= 0) {
		return { estado: 'ROJO', etiqueta: 'VENCIDO', rango: null, diasRestantes };
	}
	if (diasRestantes <= 30) {
		return { estado: 'AMARILLO', etiqueta: 'POR_VENCER', rango: 30, diasRestantes };
	}
	if (diasRestantes <= 60) {
		return { estado: 'AMARILLO', etiqueta: 'POR_VENCER', rango: 60, diasRestantes };
	}
	if (diasRestantes <= 90) {
		return { estado: 'AMARILLO', etiqueta: 'POR_VENCER', rango: 90, diasRestantes };
	}
	return { estado: 'VERDE', etiqueta: 'VIGENTE', rango: null, diasRestantes };
}
