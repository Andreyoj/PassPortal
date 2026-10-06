import fs from 'node:fs/promises';
import path from 'node:path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { FOTOS_DIR } from '../utils/paths';

export async function actualizarFotoCiudadano(id: number, fotoAnterior: string | null, fotoUrl: string): Promise<string> {
	const [resultado] = await pool.query<ResultSetHeader>(
		'UPDATE ciudadanos SET foto_url = :fotoUrl WHERE id = :id',
		{ id, fotoUrl },
	);
	if (resultado.affectedRows === 0) {
		throw new Error('No se pudo actualizar la fotografía del ciudadano.');
	}

	if (fotoAnterior?.startsWith('/uploads/fotos/')) {
		const archivoAnterior = path.basename(fotoAnterior);
		await fs.rm(path.join(FOTOS_DIR, archivoAnterior), { force: true });
	}
	return fotoUrl;
}
