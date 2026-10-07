-- Pass Portal - Instalacion completa de base de datos

CREATE DATABASE IF NOT EXISTS pass_portal_IN5BM
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pass_portal_IN5BM;

-- Roles y empleados del personal del sistema
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
  ciudadano_id INT UNSIGNED NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_empleados_usuario (usuario),
  UNIQUE KEY uq_empleados_correo (correo),
  CONSTRAINT fk_empleados_rol FOREIGN KEY (rol_id) REFERENCES roles (id)
) ENGINE=InnoDB;

-- Ciudadanos (ficha personal)
-- La columna dpi guarda el número de identificación de la persona.
-- foto_url guarda la ruta pública, p. ej. /uploads/fotos/<dpi>_<timestamp>.jpg

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

SET @fk_empleados_ciudadano_existe = (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_empleados_ciudadano'
);
SET @sql_fk_empleados_ciudadano = IF(
  @fk_empleados_ciudadano_existe = 0,
  'ALTER TABLE empleados ADD CONSTRAINT fk_empleados_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos (id)',
  'SELECT 1'
);
PREPARE stmt_fk_empleados_ciudadano FROM @sql_fk_empleados_ciudadano;
EXECUTE stmt_fk_empleados_ciudadano;
DEALLOCATE PREPARE stmt_fk_empleados_ciudadano;

-- Documentos migratorios
-- El estado (VIGENTE / POR_VENCER / VENCIDO) NO se almacena:
-- se calcula dinámicamente en el backend a partir de fecha_vencimiento.

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

-- Multas y deudas administrativas

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

-- Arraigos, bloqueos legales y restricciones de salida
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

-- Historial migratorio (entradas y salidas)
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

-- Solicitudes de movimiento migratorio
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
) ENGINE=InnoDB;

-- Historial de cambios de estado (auditoría)
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

USE pass_portal_IN5BM;

INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
  (1, 'ADMINISTRADOR', 'Acceso total al sistema y gestión de empleados'),
  (2, 'PERSONAL', 'Consulta y gestión de fichas, multas y arraigos'),
  (4, 'USUARIO', 'Cuenta normal con acceso a su perfil personal');

INSERT IGNORE INTO tipos_documento (id, codigo, nombre) VALUES
  (1, 'PASAPORTE', 'Pasaporte'),
  (2, 'RESIDENCIA', 'Residencia'),
  (3, 'VISA', 'Visa'),
  (4, 'PERMISO_TEMPORAL', 'Permiso temporal');

INSERT IGNORE INTO ciudadanos
  (id, dpi, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad, telefono, correo, direccion)
VALUES
  (1, '2000000000101', 'María Fernanda', 'Ortiz Castillo', '1990-03-14', 'F', 'Guatemalteca', '+502 5555 0101', 'maria.ortiz@example.com', 'Zona 10, Ciudad de Guatemala'),
  (2, '2000000000102', 'Jorge Luis', 'Ramírez Soto', '1985-07-22', 'M', 'Mexicana', '+502 5555 0102', 'jorge.ramirez@example.com', 'Zona 4, Ciudad de Guatemala'),
  (3, '2000000000103', 'Ana Sofía', 'Hernández Pérez', '1994-11-05', 'F', 'Salvadoreña', '+502 5555 0103', 'ana.hernandez@example.com', 'Zona 1, Ciudad de Guatemala'),
  (4, '2000000000104', 'Luis Alberto', 'Gómez Rivas', '1979-01-30', 'M', 'Hondureña', '+502 5555 0104', 'luis.gomez@example.com', 'Mixco, Guatemala'),
  (5, '2000000000105', 'Camila Andrea', 'Torres Vega', '1992-09-18', 'F', 'Colombiana', '+502 5555 0105', 'camila.torres@example.com', 'Zona 14, Ciudad de Guatemala'),
  (6, '2000000000106', 'Pedro José', 'Castañeda Ruiz', '1988-05-09', 'M', 'Nicaragüense', '+502 5555 0106', 'pedro.castaneda@example.com', 'Villa Nueva, Guatemala');

INSERT IGNORE INTO documentos
  (id, ciudadano_id, tipo_documento_id, numero, pais_emisor, fecha_emision, fecha_vencimiento)
VALUES
  (1, 1, 1, 'P-GT-4471029', 'Guatemala', DATE_SUB(CURDATE(), INTERVAL 1870 DAY), DATE_SUB(CURDATE(), INTERVAL 45 DAY)),
  (2, 2, 2, 'RT-2023-00871', 'Guatemala', DATE_SUB(CURDATE(), INTERVAL 340 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY)),
  (3, 3, 3, 'V-2026-55102', 'Guatemala', DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_ADD(CURDATE(), INTERVAL 55 DAY)),
  (4, 4, 1, 'P-HN-9920311', 'Honduras', DATE_SUB(CURDATE(), INTERVAL 1745 DAY), DATE_ADD(CURDATE(), INTERVAL 80 DAY)),
  (5, 5, 1, 'P-CO-7710045', 'Colombia', DATE_SUB(CURDATE(), INTERVAL 400 DAY), DATE_ADD(CURDATE(), INTERVAL 1425 DAY)),
  (6, 5, 2, 'RT-2025-01322', 'Guatemala', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 700 DAY)),
  (7, 6, 4, 'PT-2026-03310', 'Guatemala', DATE_SUB(CURDATE(), INTERVAL 100 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
  (8, 6, 1, 'P-NI-3308821', 'Nicaragua', DATE_SUB(CURDATE(), INTERVAL 900 DAY), DATE_ADD(CURDATE(), INTERVAL 925 DAY)),
  (9, 2, 1, 'P-MX-G45120077', 'México', DATE_SUB(CURDATE(), INTERVAL 1200 DAY), DATE_ADD(CURDATE(), INTERVAL 625 DAY));

INSERT IGNORE INTO multas
  (id, ciudadano_id, concepto, monto, moneda, estado, fecha_registro, fecha_pago)
VALUES
  (1, 6, 'Permanencia irregular: permiso temporal vencido', 300.00, 'GTQ', 'PENDIENTE', DATE_SUB(CURDATE(), INTERVAL 5 DAY), NULL),
  (2, 2, 'Trámite extemporáneo de renovación', 100.00, 'GTQ', 'PAGADA', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 55 DAY));

INSERT IGNORE INTO arraigos
  (id, ciudadano_id, tipo, motivo, autoridad, numero_expediente, fecha_inicio, fecha_fin, activo)
VALUES
  (1, 4, 'ARRAIGO', 'Proceso judicial en curso', 'Juzgado Tercero de Primera Instancia Penal', 'C-01045-2026-00312', DATE_SUB(CURDATE(), INTERVAL 20 DAY), NULL, 1);

INSERT IGNORE INTO movimientos_migratorios
  (id, ciudadano_id, documento_id, tipo, fecha_hora, puesto_control, pais_origen_destino)
VALUES
  (1, 2, 9, 'ENTRADA', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 340 DAY), '08:15:00'), 'Puesto Fronterizo Tecún Umán II', 'México'),
  (2, 3, 3, 'ENTRADA', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 35 DAY), '09:30:00'), 'Puesto Fronterizo Pedro de Alvarado', 'El Salvador'),
  (3, 5, 5, 'ENTRADA', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 400 DAY), '14:05:00'), 'Aeropuerto Internacional La Aurora', 'Colombia'),
  (4, 4, 4, 'ENTRADA', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 150 DAY), '11:40:00'), 'Puesto Fronterizo Agua Caliente', 'Honduras');

-- Datos adicionales de demostración.
-- Todos los nombres, DPI y movimientos de este archivo son ficticios.
USE pass_portal_IN5BM;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM solicitudes_movimiento WHERE ciudadano_id BETWEEN 7 AND 46;
DELETE FROM movimientos_migratorios WHERE ciudadano_id BETWEEN 7 AND 46;
DELETE FROM historial_estados WHERE ciudadano_id BETWEEN 7 AND 46;
DELETE FROM multas WHERE ciudadano_id BETWEEN 7 AND 46;
DELETE FROM arraigos WHERE ciudadano_id BETWEEN 7 AND 46;
DELETE FROM documentos WHERE ciudadano_id BETWEEN 7 AND 46;
DELETE FROM ciudadanos WHERE id BETWEEN 7 AND 46;
SET FOREIGN_KEY_CHECKS = 1;

DELIMITER //
CREATE PROCEDURE cargar_datos_demo()
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE v_id INT;
  DECLARE v_tipo INT;
  DECLARE v_dias INT;
  DECLARE v_puesto VARCHAR(100);
  DECLARE v_pais VARCHAR(60);

  WHILE i < 40 DO
    SET v_id = i + 7;
    INSERT INTO ciudadanos
      (id, dpi, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad, telefono, correo, direccion)
    VALUES
      (v_id, CONCAT('29990000', LPAD(v_id, 5, '0')),
       CASE MOD(i, 10)
         WHEN 0 THEN 'Daniela Sofía' WHEN 1 THEN 'Mateo Alejandro'
         WHEN 2 THEN 'Valeria Isabel' WHEN 3 THEN 'Sebastián Andrés'
         WHEN 4 THEN 'Lucía Fernanda' WHEN 5 THEN 'Emiliano José'
         WHEN 6 THEN 'Gabriela Elena' WHEN 7 THEN 'Nicolás David'
         WHEN 8 THEN 'Mariana Celeste' ELSE 'Diego Alejandro'
       END,
       CASE MOD(i, 10)
         WHEN 0 THEN 'Méndez Paredes' WHEN 1 THEN 'Vargas Molina'
         WHEN 2 THEN 'Rojas Herrera' WHEN 3 THEN 'Navarro Castillo'
         WHEN 4 THEN 'Santos Mejía' WHEN 5 THEN 'Cordero Figueroa'
         WHEN 6 THEN 'López Cabrera' WHEN 7 THEN 'Morales Fuentes'
         WHEN 8 THEN 'Ortega Salinas' ELSE 'Reyes Zamora'
       END,
       DATE_SUB('1998-01-15', INTERVAL i * 127 DAY),
       CASE WHEN MOD(i, 3) = 0 THEN 'F' WHEN MOD(i, 3) = 1 THEN 'M' ELSE 'X' END,
       CASE MOD(i, 10)
         WHEN 0 THEN 'Guatemalteca' WHEN 1 THEN 'Salvadoreña'
         WHEN 2 THEN 'Hondureña' WHEN 3 THEN 'Nicaragüense'
         WHEN 4 THEN 'Mexicana' WHEN 5 THEN 'Colombiana'
         WHEN 6 THEN 'Venezolana' WHEN 7 THEN 'Estadounidense'
         WHEN 8 THEN 'Española' ELSE 'Coreana'
       END,
       CONCAT('+502 5555 ', LPAD(v_id, 4, '0')),
       CONCAT('demo.', v_id, '@example.test'),
       CONCAT('Zona ', MOD(i, 15) + 1, ', Ciudad de Guatemala'));

    SET v_tipo = MOD(i, 4) + 1;
    SET v_dias = CASE
      WHEN i < 8 THEN -(i + 5)
      WHEN i < 14 THEN i - 7
      WHEN i < 20 THEN i - 13 + 30
      WHEN i < 26 THEN i - 19 + 60
      ELSE 365 + i * 12
    END;
    INSERT INTO documentos
      (id, ciudadano_id, tipo_documento_id, numero, pais_emisor, fecha_emision, fecha_vencimiento)
    VALUES
      (100 + i, v_id, v_tipo, CONCAT('DEMO-', LPAD(v_id, 3, '0'), '-A'),
       CASE MOD(i, 5) WHEN 0 THEN 'Guatemala' WHEN 1 THEN 'México' WHEN 2 THEN 'Colombia' WHEN 3 THEN 'Estados Unidos' ELSE 'España' END,
       DATE_SUB(CURDATE(), INTERVAL 1500 DAY), DATE_ADD(CURDATE(), INTERVAL v_dias DAY));

    INSERT INTO documentos
      (id, ciudadano_id, tipo_documento_id, numero, pais_emisor, fecha_emision, fecha_vencimiento)
    VALUES
      (200 + i, v_id, MOD(i + 1, 4) + 1, CONCAT('DEMO-', LPAD(v_id, 3, '0'), '-B'),
       CASE MOD(i, 4) WHEN 0 THEN 'Guatemala' WHEN 1 THEN 'Honduras' WHEN 2 THEN 'Nicaragua' ELSE 'Venezuela' END,
       DATE_SUB(CURDATE(), INTERVAL 400 DAY), DATE_ADD(CURDATE(), INTERVAL (500 + i * 15) DAY));

    SET v_puesto = CASE MOD(i, 8)
      WHEN 0 THEN 'Aeropuerto Internacional La Aurora'
      WHEN 1 THEN 'Tecún Umán II'
      WHEN 2 THEN 'Pedro de Alvarado'
      WHEN 3 THEN 'Agua Caliente'
      WHEN 4 THEN 'El Florido'
      WHEN 5 THEN 'La Mesilla'
      WHEN 6 THEN 'Puerto Barrios'
      ELSE 'Santo Tomás de Castilla'
    END;
    SET v_pais = CASE MOD(i, 6)
      WHEN 0 THEN 'Guatemala' WHEN 1 THEN 'México' WHEN 2 THEN 'El Salvador'
      WHEN 3 THEN 'Honduras' WHEN 4 THEN 'Colombia' ELSE 'Estados Unidos'
    END;
    INSERT INTO movimientos_migratorios
      (ciudadano_id, documento_id, tipo, fecha_hora, puesto_control, pais_origen_destino)
    VALUES
      (v_id, 100 + i, 'ENTRADA', DATE_SUB(NOW(), INTERVAL (i + 2) MONTH), v_puesto, v_pais),
      (v_id, 100 + i, 'SALIDA', DATE_SUB(NOW(), INTERVAL (i + 1) MONTH), v_puesto, v_pais),
      (v_id, 200 + i, 'ENTRADA', DATE_SUB(NOW(), INTERVAL i DAY), v_puesto, v_pais);
    SET i = i + 1;
  END WHILE;

  INSERT INTO multas (ciudadano_id, concepto, monto, moneda, estado, fecha_registro, fecha_pago)
  VALUES
    (7, 'Declaración migratoria extemporánea', 150.00, 'GTQ', 'PENDIENTE', CURDATE(), NULL),
    (8, 'Renovación fuera de plazo', 350.00, 'GTQ', 'PAGADA', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
    (9, 'Documento no actualizado', 500.00, 'GTQ', 'PENDIENTE', DATE_SUB(CURDATE(), INTERVAL 12 DAY), NULL),
    (10, 'Ingreso por puesto no habilitado', 1200.00, 'GTQ', 'PAGADA', DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
    (11, 'Aviso de cambio de domicilio tardío', 100.00, 'GTQ', 'PENDIENTE', DATE_SUB(CURDATE(), INTERVAL 8 DAY), NULL),
    (12, 'Permanencia irregular', 1500.00, 'GTQ', 'PENDIENTE', DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL),
    (13, 'Trámite incompleto', 225.00, 'GTQ', 'PAGADA', DATE_SUB(CURDATE(), INTERVAL 55 DAY), DATE_SUB(CURDATE(), INTERVAL 50 DAY)),
    (14, 'Registro extemporáneo', 275.00, 'GTQ', 'PENDIENTE', DATE_SUB(CURDATE(), INTERVAL 6 DAY), NULL);

  INSERT INTO arraigos (ciudadano_id, tipo, motivo, autoridad, numero_expediente, fecha_inicio, activo)
  VALUES
    (15, 'ARRAIGO', 'Proceso judicial en curso', 'Juzgado de Primera Instancia Penal', 'DEMO-ARR-001', DATE_SUB(CURDATE(), INTERVAL 15 DAY), 1),
    (16, 'BLOQUEO_LEGAL', 'Orden administrativa vigente', 'Dirección General de Migración', 'DEMO-BLO-002', DATE_SUB(CURDATE(), INTERVAL 30 DAY), 1),
    (17, 'RESTRICCION_SALIDA', 'Medida cautelar', 'Juzgado de Familia', 'DEMO-RES-003', DATE_SUB(CURDATE(), INTERVAL 8 DAY), 1),
    (18, 'ARRAIGO', 'Comparecencia pendiente', 'Juzgado de Paz', 'DEMO-ARR-004', DATE_SUB(CURDATE(), INTERVAL 60 DAY), 1),
    (19, 'ARRAIGO', 'Caso cerrado', 'Juzgado de Paz', 'DEMO-ARR-005', DATE_SUB(CURDATE(), INTERVAL 100 DAY), 0),
    (20, 'BLOQUEO_LEGAL', 'Obligación cumplida', 'Dirección General de Migración', 'DEMO-BLO-006', DATE_SUB(CURDATE(), INTERVAL 120 DAY), 0);
END//
DELIMITER ;

CALL cargar_datos_demo();
DROP PROCEDURE cargar_datos_demo;

-- Usuarios de prueba para desarrollo local.
-- Contraseñas: Usuario2026@ para USUARIO, Personal2026@ para PERSONAL y Admin2026@ para ADMINISTRADOR.
USE pass_portal_IN5BM;

INSERT IGNORE INTO empleados (rol_id, ciudadano_id, nombre_completo, usuario, correo, password_hash)
SELECT r.id, u.ciudadano_id, u.nombre, u.usuario, u.correo, u.password_hash
FROM roles r
JOIN (
  SELECT 'usuario1' usuario, 1 ciudadano_id, 'Usuario de prueba 1' nombre, 'usuario1@passportal.local' correo, '$2b$12$zjFyFiiQfVRHKTs7RLh/j.71Emtw9DSsz/Y/emdAs7LGD0rBZt8Qq' password_hash, 'USUARIO' rol
  UNION ALL SELECT 'usuario2', 2, 'Usuario de prueba 2', 'usuario2@passportal.local', '$2b$12$zjFyFiiQfVRHKTs7RLh/j.71Emtw9DSsz/Y/emdAs7LGD0rBZt8Qq', 'USUARIO'
  UNION ALL SELECT 'usuario3', 3, 'Usuario de prueba 3', 'usuario3@passportal.local', '$2b$12$zjFyFiiQfVRHKTs7RLh/j.71Emtw9DSsz/Y/emdAs7LGD0rBZt8Qq', 'USUARIO'
  UNION ALL SELECT 'usuario4', 4, 'Usuario de prueba 4', 'usuario4@passportal.local', '$2b$12$zjFyFiiQfVRHKTs7RLh/j.71Emtw9DSsz/Y/emdAs7LGD0rBZt8Qq', 'USUARIO'
  UNION ALL SELECT 'personal1', NULL, 'Personal de prueba 1', 'personal1@passportal.local', '$2b$12$k9XuJUwUbjZj0WqxDeVdNO3i56xr2g8.2PaoQsH/OUCtUZ36RC4gK', 'PERSONAL'
  UNION ALL SELECT 'personal2', NULL, 'Personal de prueba 2', 'personal2@passportal.local', '$2b$12$k9XuJUwUbjZj0WqxDeVdNO3i56xr2g8.2PaoQsH/OUCtUZ36RC4gK', 'PERSONAL'
  UNION ALL SELECT 'personal3', NULL, 'Personal de prueba 3', 'personal3@passportal.local', '$2b$12$k9XuJUwUbjZj0WqxDeVdNO3i56xr2g8.2PaoQsH/OUCtUZ36RC4gK', 'PERSONAL'
  UNION ALL SELECT 'personal4', NULL, 'Personal de prueba 4', 'personal4@passportal.local', '$2b$12$k9XuJUwUbjZj0WqxDeVdNO3i56xr2g8.2PaoQsH/OUCtUZ36RC4gK', 'PERSONAL'
  UNION ALL SELECT 'administrador1', NULL, 'Administrador de prueba 1', 'administrador1@passportal.local', '$2b$12$IRFcoFJvnS6CdRSr6l5BAOrEXcLknbjEl/xKI2qZAfmdG61D3uxTS', 'ADMINISTRADOR'
  UNION ALL SELECT 'administrador2', NULL, 'Administrador de prueba 2', 'administrador2@passportal.local', '$2b$12$IRFcoFJvnS6CdRSr6l5BAOrEXcLknbjEl/xKI2qZAfmdG61D3uxTS', 'ADMINISTRADOR'
) u ON u.rol = r.nombre;