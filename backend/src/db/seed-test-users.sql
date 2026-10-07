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
