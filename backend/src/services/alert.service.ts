import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type { DocumentoAlerta, ResumenAlertas } from '../models/alert.model';
import type { EstadoAlerta } from '../models/domain.model';
import { clasificarDocumento } from './alert-classifier';

export { clasificarDocumento } from './alert-classifier';

interface DocumentoRow extends RowDataPacket {
	id: number;
	ciudadano_id: number;
	dpi: string;
	nombres: string;
	apellidos: string;
	tipo_documento: string;
	numero: string;
	fecha_vencimiento: string;
}

interface ConteoRow extends RowDataPacket {
	total: number;
}

function convertirDocumento(row: DocumentoRow): DocumentoAlerta {
	const clasificacion = clasificarDocumento(row.fecha_vencimiento);
	return {
		id: row.id,
		ciudadanoId: row.ciudadano_id,
		dpi: row.dpi,
		nombreCiudadano: `${row.nombres} ${row.apellidos}`,
		tipoDocumento: row.tipo_documento,
		numero: row.numero,
		fechaVencimiento: row.fecha_vencimiento,
		diasParaVencer: clasificacion.diasRestantes,
		estadoDocumento: clasificacion.etiqueta,
		estadoAlerta: clasificacion.estado,
	};
}

export async function obtenerAlertas(estado?: EstadoAlerta): Promise<DocumentoAlerta[]> {
	const [filas] = await pool.query<DocumentoRow[]>(
		`SELECT d.id, d.ciudadano_id, c.dpi, c.nombres, c.apellidos,
			td.nombre AS tipo_documento, d.numero, d.fecha_vencimiento
		 FROM documentos d
		 INNER JOIN ciudadanos c ON c.id = d.ciudadano_id
		 INNER JOIN tipos_documento td ON td.id = d.tipo_documento_id
		 ORDER BY d.fecha_vencimiento ASC, d.id ASC`,
	);

	const alertas = filas.map((fila) => convertirDocumento(fila));
	return estado === undefined ? alertas : alertas.filter((alerta) => alerta.estadoAlerta === estado);
}

export async function obtenerResumenAlertas(): Promise<ResumenAlertas> {
	const alertas = await obtenerAlertas();
	const [multasResult, arraigosResult] = await Promise.all([
		pool.query<ConteoRow[]>(
			"SELECT COUNT(*) AS total FROM multas WHERE estado = 'PENDIENTE'",
		),
		pool.query<ConteoRow[]>(
			'SELECT COUNT(*) AS total FROM arraigos WHERE activo = 1 AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())',
		),
	]);

	const resumen: ResumenAlertas = {
		vencidos: alertas.filter((alerta) => alerta.diasParaVencer <= 0).length,
		porVencer30: alertas.filter((alerta) => alerta.diasParaVencer >= 1 && alerta.diasParaVencer <= 30).length,
		porVencer60: alertas.filter((alerta) => alerta.diasParaVencer >= 31 && alerta.diasParaVencer <= 60).length,
		porVencer90: alertas.filter((alerta) => alerta.diasParaVencer >= 61 && alerta.diasParaVencer <= 90).length,
		vigentes: alertas.filter((alerta) => alerta.diasParaVencer > 90).length,
		total: alertas.length,
		multasPendientes: multasResult[0][0]?.total ?? 0,
		arraigosActivos: arraigosResult[0][0]?.total ?? 0,
	};

	return resumen;
}
