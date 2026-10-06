import assert from 'node:assert/strict';
import test from 'node:test';
import { clasificarDocumento } from '../src/services/alert-classifier';

const hoy = '2026-10-06';

test('clasifica todos los bordes de vencimiento', () => {
	const casos = [
		['-1', '2026-10-05', 'ROJO', 'VENCIDO', null],
		['0', '2026-10-06', 'ROJO', 'VENCIDO', null],
		['1', '2026-10-07', 'AMARILLO', 'POR_VENCER', 30],
		['30', '2026-11-05', 'AMARILLO', 'POR_VENCER', 30],
		['31', '2026-11-06', 'AMARILLO', 'POR_VENCER', 60],
		['60', '2026-12-05', 'AMARILLO', 'POR_VENCER', 60],
		['61', '2026-12-06', 'AMARILLO', 'POR_VENCER', 90],
		['90', '2027-01-04', 'AMARILLO', 'POR_VENCER', 90],
		['91', '2027-01-05', 'VERDE', 'VIGENTE', null],
	] as const;

	for (const [dias, fecha, estado, etiqueta, rango] of casos) {
		assert.deepEqual(clasificarDocumento(fecha, hoy), {
			estado,
			etiqueta,
			rango,
			diasRestantes: Number(dias),
		});
	}
});
