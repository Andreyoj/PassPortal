-- ============================================================
-- Pass Portal - Sistema de Gestión Migratoria (SGM)
-- Esquema de base de datos para MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS pass_portal_IN5BM
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pass_portal_IN5BM;

-- ------------------------------------------------------------
-- Roles y empleados (operadores del sistema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL,
  descripcion VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS empleados (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_id TINYINT UNSIGNED NOT NULL,
  nombre_completo VARCHAR(120) NOT NULL,
  usuario VARCHAR(40) NOT NULL,
  correo VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_empleados_usuario (usuario),
  UNIQUE KEY uq_empleados_correo (correo),
  CONSTRAINT fk_empleados_rol FOREIGN KEY (rol_id) REFERENCES roles (id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Ciudadanos (ficha personal)
-- La columna dpi guarda el número de identificación de la persona.
-- foto_url guarda la ruta pública, p. ej. /uploads/fotos/<dpi>_<timestamp>.jpg
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ciudadanos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dpi VARCHAR(20) NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo ENUM('M', 'F', 'X') NOT NULL,
  nacionalidad VARCHAR(60) NOT NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(120) NULL,
  direccion VARCHAR(255) NULL,
  foto_url VARCHAR(255) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ciudadanos_dpi (dpi),
  KEY idx_ciudadanos_nombre (apellidos, nombres)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Documentos migratorios
-- El estado (VIGENTE / POR_VENCER / VENCIDO) NO se almacena:
-- se calcula dinámicamente en el backend a partir de fecha_vencimiento.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_documento (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipos_documento_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ciudadano_id INT UNSIGNED NOT NULL,
  tipo_documento_id TINYINT UNSIGNED NOT NULL,
  numero VARCHAR(40) NOT NULL,
  pais_emisor VARCHAR(60) NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  observaciones VARCHAR(255) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_documentos_tipo_numero (tipo_documento_id, numero),
  KEY idx_documentos_vencimiento (fecha_vencimiento),
  KEY idx_documentos_ciudadano (ciudadano_id),
  CONSTRAINT fk_documentos_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id),
  CONSTRAINT fk_documentos_tipo FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento (id),
  CONSTRAINT ck_documentos_fechas CHECK (fecha_vencimiento >= fecha_emision)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Multas y deudas administrativas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS multas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ciudadano_id INT UNSIGNED NOT NULL,
  concepto VARCHAR(200) NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'GTQ',
  estado ENUM('PENDIENTE', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
  fecha_registro DATE NOT NULL,
  fecha_pago DATE NULL,
  registrado_por INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_multas_ciudadano_estado (ciudadano_id, estado),
  CONSTRAINT fk_multas_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id),
  CONSTRAINT fk_multas_empleado FOREIGN KEY (registrado_por) REFERENCES empleados (id),
  CONSTRAINT ck_multas_monto CHECK (monto > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Arraigos, bloqueos legales y restricciones de salida
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arraigos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ciudadano_id INT UNSIGNED NOT NULL,
  tipo ENUM('ARRAIGO', 'BLOQUEO_LEGAL', 'RESTRICCION_SALIDA') NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  autoridad VARCHAR(120) NOT NULL,
  numero_expediente VARCHAR(60) NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  registrado_por INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_arraigos_ciudadano_activo (ciudadano_id, activo),
  CONSTRAINT fk_arraigos_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id),
  CONSTRAINT fk_arraigos_empleado FOREIGN KEY (registrado_por) REFERENCES empleados (id),
  CONSTRAINT ck_arraigos_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Historial migratorio (entradas y salidas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_migratorios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ciudadano_id INT UNSIGNED NOT NULL,
  documento_id INT UNSIGNED NULL,
  tipo ENUM('ENTRADA', 'SALIDA') NOT NULL,
  fecha_hora DATETIME NOT NULL,
  puesto_control VARCHAR(100) NOT NULL,
  pais_origen_destino VARCHAR(60) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimientos_ciudadano_fecha (ciudadano_id, fecha_hora),
  CONSTRAINT fk_movimientos_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id),
  CONSTRAINT fk_movimientos_documento FOREIGN KEY (documento_id) REFERENCES documentos (id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Historial de cambios de estado (auditoría)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_estados (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ciudadano_id INT UNSIGNED NOT NULL,
  entidad ENUM('CIUDADANO', 'DOCUMENTO', 'MULTA', 'ARRAIGO') NOT NULL,
  entidad_id INT UNSIGNED NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_nuevo VARCHAR(30) NOT NULL,
  detalle VARCHAR(255) NULL,
  empleado_id INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_historial_ciudadano_fecha (ciudadano_id, creado_en),
  CONSTRAINT fk_historial_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id),
  CONSTRAINT fk_historial_empleado FOREIGN KEY (empleado_id) REFERENCES empleados (id)
) ENGINE=InnoDB;
