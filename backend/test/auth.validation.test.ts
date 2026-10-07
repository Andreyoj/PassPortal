import test from 'node:test';
import assert from 'node:assert/strict';
import { credencialesCompletas } from '../src/utils/auth-validation';

test('valida la forma mínima de las credenciales sin aceptar campos vacíos', () => {
	assert.equal(credencialesCompletas({ usuario: 'admin', password: 'secreto' }), true);
	assert.equal(credencialesCompletas({ usuario: ' ', password: 'secreto' }), false);
	assert.equal(credencialesCompletas({ usuario: 'admin', password: '' }), false);
	assert.equal(credencialesCompletas(null), false);
});
