USE pass_portal_IN5BM;

INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
  (1, 'ADMINISTRADOR', 'Acceso total al sistema y gestión de empleados'),
  (2, 'SUPERVISOR', 'Supervisa operaciones, multas y arraigos'),
  (3, 'OPERADOR', 'Consulta y actualización de fichas en ventanilla');

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
