import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db';

const terminal = readline.createInterface({ input, output });
try {
	const usuario = (await terminal.question('Usuario: ')).trim();
	const nombre = (await terminal.question('Nombre completo: ')).trim();
	const correo = (await terminal.question('Correo: ')).trim();
	const password = await terminal.question('Contraseña (mínimo 10 caracteres): ');
	if (!usuario || !nombre || !correo || password.length < 10) throw new Error('Todos los datos son obligatorios y la contraseña debe tener al menos 10 caracteres.');
	const hash = await bcrypt.hash(password, 12);
	await pool.query(
		`INSERT INTO empleados (rol_id, nombre_completo, usuario, correo, password_hash)
		 SELECT id, :nombre, :usuario, :correo, :hash FROM roles WHERE nombre = 'ADMINISTRADOR'`,
		{ nombre, usuario, correo, hash },
	);
	console.log('Administrador creado correctamente.');
} finally {
	terminal.close();
	await pool.end();
}
