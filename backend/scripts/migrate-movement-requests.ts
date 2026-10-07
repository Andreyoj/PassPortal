import 'dotenv/config';
import { pool } from '../src/db';

async function migrate(): Promise<void> {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS solicitudes_movimiento (
			id INT UNSIGNED NOT NULL AUTO_INCREMENT,
			ciudadano_id INT UNSIGNED NOT NULL,
			pais_origen VARCHAR(60) NOT NULL,
			pais_destino VARCHAR(60) NOT NULL,
			fecha_solicitada DATE NOT NULL,
			motivo VARCHAR(255) NOT NULL,
			estado ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
			comentario_resolucion VARCHAR(255) NULL,
			revisado_por INT UNSIGNED NULL,
			revisado_en DATETIME NULL,
			creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY idx_solicitudes_movimiento_estado (estado, creado_en),
			KEY idx_solicitudes_movimiento_ciudadano (ciudadano_id, creado_en),
			CONSTRAINT fk_solicitudes_movimiento_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id),
			CONSTRAINT fk_solicitudes_movimiento_revisor FOREIGN KEY (revisado_por) REFERENCES empleados (id),
			CONSTRAINT ck_solicitudes_movimiento_paises CHECK (pais_origen <> pais_destino)
		) ENGINE=InnoDB
	`);
	console.log('Tabla solicitudes_movimiento lista.');
	await pool.end();
}

migrate().catch((error: unknown) => {
	console.error('No se pudo crear solicitudes_movimiento:', error);
	process.exitCode = 1;
});
