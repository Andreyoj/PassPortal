import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type { EstadoSolicitudMovimiento, SolicitudMovimiento } from '../models/domain.model';

interface RequestRow extends RowDataPacket {
	id: number;
	ciudadano_id: number;
	nombre_ciudadano: string;
	dpi_ciudadano: string;
	nacionalidad_ciudadano: string;
	pais_origen: string;
	pais_destino: string;
	fecha_solicitada: string;
	motivo: string;
	estado: EstadoSolicitudMovimiento;
	comentario_resolucion: string | null;
	revisado_por: number | null;
	revisado_en: string | null;
	creado_en: string;
	actualizado_en: string;
}

export interface NuevaSolicitudMovimiento {
	ciudadanoId: number;
	paisOrigen: string;
	paisDestino: string;
	fechaSolicitada: string;
	motivo: string;
}

function mapRequest(row: RequestRow): SolicitudMovimiento {
	return {
		id: row.id,
		ciudadanoId: row.ciudadano_id,
		nombreCiudadano: row.nombre_ciudadano,
		dpiCiudadano: row.dpi_ciudadano,
		nacionalidadCiudadano: row.nacionalidad_ciudadano,
		paisOrigen: row.pais_origen,
		paisDestino: row.pais_destino,
		fechaSolicitada: row.fecha_solicitada,
		motivo: row.motivo,
		estado: row.estado,
		comentarioResolucion: row.comentario_resolucion,
		revisadoPor: row.revisado_por,
		revisadoEn: row.revisado_en,
		creadoEn: row.creado_en,
		actualizadoEn: row.actualizado_en,
	};
}

const selectBase = `
	SELECT s.id, s.ciudadano_id, CONCAT(c.nombres, ' ', c.apellidos) AS nombre_ciudadano,
		c.dpi AS dpi_ciudadano, c.nacionalidad AS nacionalidad_ciudadano,
		s.pais_origen, s.pais_destino, s.fecha_solicitada, s.motivo, s.estado,
		s.comentario_resolucion, s.revisado_por, s.revisado_en, s.creado_en, s.actualizado_en
	FROM solicitudes_movimiento s
	INNER JOIN ciudadanos c ON c.id = s.ciudadano_id
`;

export async function crearSolicitudMovimiento(datos: NuevaSolicitudMovimiento): Promise<SolicitudMovimiento> {
	const [result] = await pool.query<ResultSetHeader>(
		`INSERT INTO solicitudes_movimiento
			(ciudadano_id, pais_origen, pais_destino, fecha_solicitada, motivo)
		 VALUES (:ciudadanoId, :paisOrigen, :paisDestino, :fechaSolicitada, :motivo)`,
		{ ...datos },
	);
	const [rows] = await pool.query<RequestRow[]>(`${selectBase} WHERE s.id = :id`, { id: result.insertId });
	return mapRequest(rows[0]);
}

export async function listarSolicitudesMovimiento(estado?: EstadoSolicitudMovimiento): Promise<SolicitudMovimiento[]> {
	const [rows] = await pool.query<RequestRow[]>(
		`${selectBase}${estado ? ' WHERE s.estado = :estado' : ''} ORDER BY s.creado_en DESC, s.id DESC`,
		estado ? { estado } : undefined,
	);
	return rows.map(mapRequest);
}

export async function listarSolicitudesCiudadano(ciudadanoId: number): Promise<SolicitudMovimiento[]> {
	const [rows] = await pool.query<RequestRow[]>(
		`${selectBase} WHERE s.ciudadano_id = :ciudadanoId ORDER BY s.creado_en DESC, s.id DESC`,
		{ ciudadanoId },
	);
	return rows.map(mapRequest);
}

export async function resolverSolicitudMovimiento(
	id: number,
	estado: Exclude<EstadoSolicitudMovimiento, 'PENDIENTE'>,
	comentarioResolucion: string | null,
	revisadoPor: number,
): Promise<SolicitudMovimiento | null> {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();
		const [requests] = await connection.query<RequestRow[]>(`${selectBase} WHERE s.id = :id FOR UPDATE`, { id });
		const request = requests[0];
		if (!request || request.estado !== 'PENDIENTE') {
			await connection.rollback();
			return null;
		}

		await connection.query(
			`UPDATE solicitudes_movimiento
			 SET estado = :estado, comentario_resolucion = :comentarioResolucion,
			     revisado_por = :revisadoPor, revisado_en = NOW()
			 WHERE id = :id`,
			{ id, estado, comentarioResolucion, revisadoPor },
		);

		if (estado === 'APROBADA') {
			await connection.query(
				`INSERT INTO movimientos_migratorios
					(ciudadano_id, tipo, fecha_hora, puesto_control, pais_origen_destino)
				 VALUES (:ciudadanoId, 'SALIDA', CONCAT(:fechaSolicitada, ' 00:00:00'), 'Solicitud migratoria aprobada', :paisOrigenDestino)`,
				{
					ciudadanoId: request.ciudadano_id,
					fechaSolicitada: request.fecha_solicitada,
					paisOrigenDestino: `${request.pais_origen} -> ${request.pais_destino}`,
				},
			);
		}

		await connection.commit();
	} catch (error: unknown) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}

	const [rows] = await pool.query<RequestRow[]>(`${selectBase} WHERE s.id = :id`, { id });
	return rows[0] ? mapRequest(rows[0]) : null;
}
