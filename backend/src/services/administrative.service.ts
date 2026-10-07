import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type { Multa, Restriccion } from '../models/domain.model';

interface FineRow extends RowDataPacket {
	id: number;
	ciudadano_id: number;
	concepto: string;
	monto: number | string;
	moneda: string;
	estado: Multa['estado'];
	fecha_registro: string;
	fecha_pago: string | null;
	registrado_por: number | null;
	creado_en: string;
	actualizado_en: string;
}

interface RestrictionRow extends RowDataPacket {
	id: number;
	ciudadano_id: number;
	tipo: Restriccion['tipo'];
	motivo: string;
	autoridad: string;
	numero_expediente: string | null;
	fecha_inicio: string;
	fecha_fin: string | null;
	activo: number;
	registrado_por: number | null;
	creado_en: string;
	actualizado_en: string;
}

function mapFine(row: FineRow): Multa {
	return {
		id: row.id,
		ciudadanoId: row.ciudadano_id,
		concepto: row.concepto,
		monto: Number(row.monto),
		moneda: row.moneda,
		estado: row.estado,
		fechaRegistro: row.fecha_registro,
		fechaPago: row.fecha_pago,
		registradoPor: row.registrado_por,
		creadoEn: row.creado_en,
		actualizadoEn: row.actualizado_en,
	};
}

function mapRestriction(row: RestrictionRow): Restriccion {
	return {
		id: row.id,
		ciudadanoId: row.ciudadano_id,
		tipo: row.tipo,
		motivo: row.motivo,
		autoridad: row.autoridad,
		numeroExpediente: row.numero_expediente,
		fechaInicio: row.fecha_inicio,
		fechaFin: row.fecha_fin,
		activo: row.activo === 1,
		registradoPor: row.registrado_por,
		creadoEn: row.creado_en,
		actualizadoEn: row.actualizado_en,
	};
}

export interface NuevaMulta {
	concepto: string;
	monto: number;
	moneda: string;
}

export interface NuevoArraigo {
	tipo: Restriccion['tipo'];
	motivo: string;
	autoridad: string;
	numeroExpediente?: string;
	fechaInicio: string;
	fechaFin?: string;
}

export async function crearMulta(ciudadanoId: number, multa: NuevaMulta, empleadoId: number): Promise<Multa> {
	const [result] = await pool.query<ResultSetHeader>(
		`INSERT INTO multas (ciudadano_id, concepto, monto, moneda, fecha_registro, registrado_por)
		 VALUES (:ciudadanoId, :concepto, :monto, :moneda, CURDATE(), :empleadoId)`,
		{ ciudadanoId, empleadoId, ...multa },
	);
	const [rows] = await pool.query<FineRow[]>('SELECT * FROM multas WHERE id = :id', { id: result.insertId });
	return mapFine(rows[0]);
}

export async function pagarMulta(id: number, ciudadanoId?: number): Promise<Multa | null> {
	const [result] = await pool.query<ResultSetHeader>(
		"UPDATE multas SET estado = 'PAGADA', fecha_pago = CURDATE() WHERE id = :id AND estado = 'PENDIENTE' AND (:ciudadanoId IS NULL OR ciudadano_id = :ciudadanoId)",
		{ id, ciudadanoId: ciudadanoId ?? null },
	);
	if (result.affectedRows === 0) return null;
	const [rows] = await pool.query<FineRow[]>('SELECT * FROM multas WHERE id = :id', { id });
	return mapFine(rows[0]);
}

export async function anularMulta(id: number, empleadoId: number): Promise<Multa | null> {
	const conexion = await pool.getConnection();
	try {
		await conexion.beginTransaction();
		const [result] = await conexion.query<ResultSetHeader>(
			"UPDATE multas SET estado = 'ANULADA' WHERE id = :id AND estado = 'PENDIENTE'",
			{ id },
		);
		if (result.affectedRows === 0) {
			await conexion.rollback();
			return null;
		}
		await conexion.query(
			`INSERT INTO historial_estados
				(ciudadano_id, entidad, entidad_id, estado_nuevo, detalle, empleado_id)
			 SELECT ciudadano_id, 'MULTA', id, 'ANULADA', 'Multa anulada', :empleadoId
			 FROM multas WHERE id = :id`,
			{ id, empleadoId },
		);
		await conexion.commit();
	} catch (error: unknown) {
		await conexion.rollback();
		throw error;
	} finally {
		conexion.release();
	}
	const [rows] = await pool.query<FineRow[]>('SELECT * FROM multas WHERE id = :id', { id });
	return mapFine(rows[0]);
}

export async function obtenerMultasCiudadano(ciudadanoId: number): Promise<Multa[]> {
	const [rows] = await pool.query<FineRow[]>(
		'SELECT * FROM multas WHERE ciudadano_id = :ciudadanoId ORDER BY fecha_registro DESC, id DESC',
		{ ciudadanoId },
	);
	return rows.map(mapFine);
}

export async function obtenerRestriccionesCiudadano(ciudadanoId: number): Promise<Restriccion[]> {
	const [rows] = await pool.query<RestrictionRow[]>(
		'SELECT * FROM arraigos WHERE ciudadano_id = :ciudadanoId ORDER BY fecha_inicio DESC, id DESC',
		{ ciudadanoId },
	);
	return rows.map(mapRestriction);
}

export async function crearRestriccion(ciudadanoId: number, restriccion: NuevoArraigo, empleadoId: number): Promise<Restriccion> {
	const [result] = await pool.query<ResultSetHeader>(
		`INSERT INTO arraigos
			(ciudadano_id, tipo, motivo, autoridad, numero_expediente, fecha_inicio, fecha_fin, registrado_por)
		 VALUES (:ciudadanoId, :tipo, :motivo, :autoridad, :numeroExpediente, :fechaInicio, :fechaFin, :empleadoId)`,
		{
			ciudadanoId,
			...restriccion,
			numeroExpediente: restriccion.numeroExpediente ?? null,
			fechaFin: restriccion.fechaFin ?? null,
			empleadoId,
		},
	);
	const [rows] = await pool.query<RestrictionRow[]>('SELECT * FROM arraigos WHERE id = :id', { id: result.insertId });
	return mapRestriction(rows[0]);
}

export async function levantarRestriccion(id: number, empleadoId: number): Promise<Restriccion | null> {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE arraigos SET activo = 0 WHERE id = :id AND activo = 1',
		{ id },
	);
	if (result.affectedRows === 0) return null;
	const [rows] = await pool.query<RestrictionRow[]>('SELECT * FROM arraigos WHERE id = :id', { id });
	return mapRestriction(rows[0]);
}
