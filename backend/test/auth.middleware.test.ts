import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../src/middleware/auth.middleware';

test('requireRole permite un rol autorizado y rechaza uno no autorizado', () => {
	const siguiente = { llamado: false };
	const next = () => { siguiente.llamado = true; };
	const req = { empleado: { id: 1, usuario: 'personal', nombreCompleto: 'Personal', correo: 'personal@test', rol: 'PERSONAL' } } as never;
	requireRole('PERSONAL')(req, {} as never, next);
	assert.equal(siguiente.llamado, true);

	let error: unknown;
	requireRole('ADMINISTRADOR')(req, {} as never, (value: unknown) => { error = value; });
	assert.equal((error as { statusCode: number }).statusCode, 403);
});
