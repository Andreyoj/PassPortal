import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type { Ciudadano, Documento, FichaCiudadano, MovimientoMigratorio, Multa, Restriccion } from '../models/domain.model';
import { clasificarDocumento } from './alert-classifier';

interface CitizenRow extends RowDataPacket {
	id: number;
	dpi: string;
	nombres: string;
	apellidos: string;
	fecha_nacimiento: string;
	sexo: Ciudadano['sexo'];
	nacionalidad: string;
	telefono: string | null;
	correo: string | null;
	direccion: string | null;
	foto_url: string | null;
	creado_en: string;
	actualizado_en: string;
}

interface DocumentRow extends RowDataPacket {
	id: number;
	ciudadano_id: number;
	tipo_documento_id: number;
	tipo_documento: string;
	numero: string;
	pais_emisor: string;
	fecha_emision: string;
	fecha_vencimiento: string;
	observaciones: string | null;
}

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

interface MovementRow extends RowDataPacket {
	id: number;
	ciudadano_id: number;
	documento_id: number | null;
	tipo: MovimientoMigratorio['tipo'];
	fecha_hora: string;
	puesto_control: string;
	pais_origen_destino: string;
	creado_en: string;
}

interface TotalRow extends RowDataPacket {
	total: number | string;
}

export interface DatosContacto {
	telefono?: string;
	correo?: string;
	direccion?: string;
}

export interface DatosFichaCiudadano extends DatosContacto {
	dpi: string;
	nombres: string;
	apellidos: string;
	fechaNacimiento: string;
	sexo: Ciudadano['sexo'];
	nacionalidad: string;
}

export async function crearFichaCiudadano(datos: DatosFichaCiudadano, empleadoId: number): Promise<FichaCiudadano> {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();
		const [result] = await connection.execute<ResultSetHeader>(
			`INSERT INTO ciudadanos (dpi, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad, telefono, correo, direccion)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[datos.dpi, datos.nombres, datos.apellidos, datos.fechaNacimiento, datos.sexo, datos.nacionalidad, datos.telefono ?? null, datos.correo ?? null, datos.direccion ?? null],
		);
		await connection.execute('UPDATE empleados SET ciudadano_id = ? WHERE id = ?', [result.insertId, empleadoId]);
		await connection.commit();
		return (await obtenerFichaCiudadano(result.insertId))!;
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

export async function actualizarDatosFicha(id: number, datos: DatosFichaCiudadano, empleadoId: number): Promise<FichaCiudadano | null> {
	const [result] = await pool.execute<ResultSetHeader>(
		`UPDATE ciudadanos SET dpi=?, nombres=?, apellidos=?, fecha_nacimiento=?, sexo=?, nacionalidad=?, telefono=?, correo=?, direccion=? WHERE id=?`,
		[datos.dpi, datos.nombres, datos.apellidos, datos.fechaNacimiento, datos.sexo, datos.nacionalidad, datos.telefono ?? null, datos.correo ?? null, datos.direccion ?? null, id],
	);
	if (!result.affectedRows) return null;
	await pool.execute(`INSERT INTO historial_estados (ciudadano_id, entidad, estado_nuevo, detalle, empleado_id) VALUES (?, 'CIUDADANO', 'ACTUALIZADO', 'Ficha ciudadana actualizada', ?)`, [id, empleadoId]);
	return obtenerFichaCiudadano(id);
}

function mapCitizen(row: CitizenRow): Ciudadano {
	return {
		id: row.id,
		dpi: row.dpi,
		nombres: row.nombres,
		apellidos: row.apellidos,
		fechaNacimiento: row.fecha_nacimiento,
		sexo: row.sexo,
		nacionalidad: row.nacionalidad,
		telefono: row.telefono,
		correo: row.correo,
		direccion: row.direccion,
		fotoUrl: row.foto_url,
		creadoEn: row.creado_en,
		actualizadoEn: row.actualizado_en,
	};
}

function mapDocument(row: DocumentRow): Documento {
	const classification = clasificarDocumento(row.fecha_vencimiento);
	return {
		id: row.id,
		ciudadanoId: row.ciudadano_id,
		tipoDocumentoId: row.tipo_documento_id,
		numero: row.numero,
		paisEmisor: row.pais_emisor,
		fechaEmision: row.fecha_emision,
		fechaVencimiento: row.fecha_vencimiento,
		observaciones: row.observaciones,
		estado: classification.etiqueta,
		estadoAlerta: classification.estado,
	};
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

function mapMovement(row: MovementRow): MovimientoMigratorio {
	return {
		id: row.id,
		ciudadanoId: row.ciudadano_id,
		documentoId: row.documento_id,
		tipo: row.tipo,
		fechaHora: row.fecha_hora,
		puestoControl: row.puesto_control,
		paisOrigenDestino: row.pais_origen_destino,
		creadoEn: row.creado_en,
	};
}

export async function buscarCiudadanos(query?: string): Promise<Ciudadano[]> {
	const termino = query?.trim();
	const [rows] = termino
		? await pool.query<CitizenRow[]>(
				`SELECT id, dpi, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad,
					telefono, correo, direccion, foto_url, creado_en, actualizado_en
				 FROM ciudadanos
				 WHERE dpi LIKE :termino OR nombres LIKE :termino OR apellidos LIKE :termino
				 ORDER BY apellidos, nombres`,
				{ termino: `%${termino}%` },
			)
		: await pool.query<CitizenRow[]>(
				`SELECT id, dpi, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad,
					telefono, correo, direccion, foto_url, creado_en, actualizado_en
				 FROM ciudadanos ORDER BY apellidos, nombres`,
			);
	return rows.map(mapCitizen);
}

export async function obtenerFichaCiudadano(id: number): Promise<FichaCiudadano | null> {
	const [citizenRows] = await pool.query<CitizenRow[]>(
		`SELECT id, dpi, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad,
			telefono, correo, direccion, foto_url, creado_en, actualizado_en
		 FROM ciudadanos WHERE id = :id`,
		{ id },
	);
	const citizen = citizenRows[0];
	if (!citizen) return null;

	const [documents, fines, restrictions, movements, pendingTotal] = await Promise.all([
		pool.query<DocumentRow[]>(
			`SELECT d.id, d.ciudadano_id, d.tipo_documento_id, td.nombre AS tipo_documento,
				d.numero, d.pais_emisor, d.fecha_emision, d.fecha_vencimiento, d.observaciones
			 FROM documentos d INNER JOIN tipos_documento td ON td.id = d.tipo_documento_id
			 WHERE d.ciudadano_id = :id ORDER BY d.fecha_vencimiento`,
			{ id },
		),
		pool.query<FineRow[]>('SELECT * FROM multas WHERE ciudadano_id = :id ORDER BY fecha_registro DESC', { id }),
		pool.query<RestrictionRow[]>('SELECT * FROM arraigos WHERE ciudadano_id = :id ORDER BY fecha_inicio DESC', { id }),
		pool.query<MovementRow[]>(
			'SELECT * FROM movimientos_migratorios WHERE ciudadano_id = :id ORDER BY fecha_hora DESC',
			{ id },
		),
		pool.query<TotalRow[]>(
			"SELECT COALESCE(SUM(monto), 0) AS total FROM multas WHERE ciudadano_id = :id AND estado = 'PENDIENTE'",
			{ id },
		),
	]);

	const multas = fines[0].map(mapFine);
	const restricciones = restrictions[0].map(mapRestriction);
	return {
		...mapCitizen(citizen),
		documentos: documents[0].map(mapDocument),
		multas,
		restricciones,
		movimientos: movements[0].map(mapMovement),
		restriccionActiva: restricciones.some((restriction) => restriction.activo),
		totalMultasPendientes: Number(pendingTotal[0][0]?.total ?? 0),
	};
}

export async function actualizarContactoCiudadano(id: number, datos: DatosContacto, empleadoId: number): Promise<FichaCiudadano | null> {
	const campos: string[] = [];
	const valores: Record<string, string | number> = { id };

	if (datos.telefono !== undefined) {
		campos.push('telefono = :telefono');
		valores.telefono = datos.telefono;
	}
	if (datos.correo !== undefined) {
		campos.push('correo = :correo');
		valores.correo = datos.correo;
	}
	if (datos.direccion !== undefined) {
		campos.push('direccion = :direccion');
		valores.direccion = datos.direccion;
	}

	if (campos.length === 0) {
		return null;
	}

	const conexion = await pool.getConnection();
	try {
		await conexion.beginTransaction();
		const [resultado] = await conexion.query<ResultSetHeader>(
			`UPDATE ciudadanos SET ${campos.join(', ')} WHERE id = :id`,
			valores,
		);
		if (resultado.affectedRows === 0) {
			await conexion.rollback();
			return null;
		}
		await conexion.query(
			`INSERT INTO historial_estados
				(ciudadano_id, entidad, estado_nuevo, detalle, empleado_id)
			 VALUES (:id, 'CIUDADANO', 'ACTUALIZADO', 'Datos de contacto actualizados', :empleadoId)`,
			{ id, empleadoId },
		);
		await conexion.commit();
	} catch (error: unknown) {
		await conexion.rollback();
		throw error;
	} finally {
		conexion.release();
	}

	return obtenerFichaCiudadano(id);
}
