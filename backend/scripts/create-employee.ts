import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db';

const terminal = readline.createInterface({ input, output });
const roles = new Set(['OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR']);

async function main(): Promise<void> {
	try {
		const usuario = (await terminal.question('Usuario: ')).trim();
		const nombre = (await terminal.question('Nombre completo: ')).trim();
		const correo = (await terminal.question('Correo: ')).trim();
		const password = await terminal.question('Contraseña (mínimo 10 caracteres): ');
		const rol = (await terminal.question('Rol (OPERADOR, SUPERVISOR o ADMINISTRADOR): ')).trim().toUpperCase();
		if (!usuario || !nombre || !correo || password.length < 10 || !roles.has(rol)) {
			throw new Error('Datos inválidos: la contraseña debe tener al menos 10 caracteres y el rol debe ser válido.');
		}
		const hash = await bcrypt.hash(password, 12);
		await pool.query(
			`INSERT INTO empleados (rol_id, nombre_completo, usuario, correo, password_hash)
			 SELECT id, :nombre, :usuario, :correo, :hash FROM roles WHERE nombre = :rol`,
			{ nombre, usuario, correo, hash, rol },
		);
		console.log('Empleado creado correctamente.');
	} finally {
		terminal.close();
		await pool.end();
	}
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : 'No se pudo crear el empleado.');
	process.exitCode = 1;
});
