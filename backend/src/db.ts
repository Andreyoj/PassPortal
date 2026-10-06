import { createPool, type Pool } from 'mysql2/promise';

function leerVariable(nombre: string): string {
	const valor = process.env[nombre];
	if (valor === undefined || valor.trim() === '') {
		throw new Error(`Falta la variable de entorno obligatoria ${nombre}. Revisa backend/.env`);
	}
	return valor;
}

export const pool: Pool = createPool({
	host: process.env.DB_HOST ?? 'localhost',
	port: Number(process.env.DB_PORT ?? 3306),
	user: leerVariable('DB_USER'),
	password: process.env.DB_PASSWORD ?? '',
	database: leerVariable('DB_NAME'),
	charset: 'utf8mb4_unicode_ci',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	namedPlaceholders: true,
	dateStrings: true,
});

export async function verificarConexion(): Promise<void> {
	const conexion = await pool.getConnection();
	try {
		await conexion.ping();
	} finally {
		conexion.release();
	}
}

export async function cerrarPool(): Promise<void> {
	await pool.end();
}
