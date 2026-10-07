import 'dotenv/config';
import fs from 'node:fs';
import type { Server } from 'node:http';
import { cerrarPool, verificarConexion } from './db';
import { app } from './server';
import { FOTOS_DIR } from './utils/paths';
import { validarConfiguracionJwt } from './middleware/auth.middleware';

const PUERTO = Number(process.env.PORT ?? 3000);

async function iniciar(): Promise<void> {
	fs.mkdirSync(FOTOS_DIR, { recursive: true });
	validarConfiguracionJwt();

	await verificarConexion();
	console.log('[DB] Conexión a MySQL verificada.');

	const servidor: Server = app.listen(PUERTO, () => {
		console.log(`[SERVIDOR] Pass Portal API escuchando en http://localhost:${PUERTO}`);
	});

	const apagar = (signal: NodeJS.Signals): void => {
		console.log(`[SERVIDOR] ${signal} recibido. Cerrando...`);
		servidor.close(() => {
			cerrarPool()
				.catch((error: unknown) => console.error('[DB] Error al cerrar el pool:', error))
				.finally(() => process.exit(0));
		});
	};

	process.on('SIGINT', apagar);
	process.on('SIGTERM', apagar);
}

iniciar().catch((error: unknown) => {
	console.error('[ARRANQUE] No se pudo iniciar el servidor:', error);
	process.exit(1);
});
