-- Datos adicionales de demostración. Ejecutar después de schema.sql y seed.sql.
-- Todos los nombres, DPI y movimientos de este archivo son ficticios.
USE pass_portal_IN5BM;

SET FOREIGN_KEY_CHECKS = 0;
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
