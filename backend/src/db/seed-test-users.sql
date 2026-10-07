-- Usuarios de prueba para desarrollo local.
-- Contraseña de cada cuenta: <usuario>@passportal.com
USE pass_portal_IN5BM;

INSERT IGNORE INTO empleados (rol_id, nombre_completo, usuario, correo, password_hash)
SELECT r.id, u.nombre, u.usuario, u.correo, u.password_hash
FROM roles r
JOIN (
  SELECT 'usuario1' usuario, 'Usuario de prueba 1' nombre, 'usuario1@passportal.local' correo, '$2b$12$elSlNpfjmgVUOz8z6FBYa.JyFgPCdM65jNFIXb.QlyQXp7y5DrvRe' password_hash, 'USUARIO' rol
  UNION ALL SELECT 'usuario2', 'Usuario de prueba 2', 'usuario2@passportal.local', '$2b$12$ILCd8dZCJseuhQ9iMVe5COi8j8pizaNRWwGFVwylUJNXu3VXBIPru', 'USUARIO'
  UNION ALL SELECT 'usuario3', 'Usuario de prueba 3', 'usuario3@passportal.local', '$2b$12$aWXR292BBmay2jQGXyod7u7qeLxNK01jiPvzq396BJz9OtSYI/qwe', 'USUARIO'
  UNION ALL SELECT 'usuario4', 'Usuario de prueba 4', 'usuario4@passportal.local', '$2b$12$tcQeMXkmG8oLdB5IfnuyLO4kmPed4KOdUaO07iiOt1RKUsuRGdF3G', 'USUARIO'
  UNION ALL SELECT 'operador1', 'Operador de prueba 1', 'operador1@passportal.local', '$2b$12$6y.NId0pKoAfCJ.CdyPsie61BwE25BQ685WG6Zj2uLXbw3vuPH8QK', 'OPERADOR'
  UNION ALL SELECT 'operador2', 'Operador de prueba 2', 'operador2@passportal.local', '$2b$12$h6uHWSndZQGlVr8VCtEGXOG.719TfiHe8aMtG2PCdGttZrMJKgd3e', 'OPERADOR'
  UNION ALL SELECT 'supervisor1', 'Supervisor de prueba 1', 'supervisor1@passportal.local', '$2b$12$MD1Gaui4SHi3VF2FVRW.mewuRKcujRgcFKtyC3sPDKAmylwDHvT3G', 'SUPERVISOR'
  UNION ALL SELECT 'supervisor2', 'Supervisor de prueba 2', 'supervisor2@passportal.local', '$2b$12$TVN7kvPLHkAwmxy4vKDQEerq7GM7tKKcsFMtXIak/iRij8jqarVre', 'SUPERVISOR'
  UNION ALL SELECT 'administrador1', 'Administrador de prueba 1', 'administrador1@passportal.local', '$2b$12$arcRu8yQMNMwdNMcRUaOlemvInRhsAwFPtrxDQwwFkGgPkj.cDSQG', 'ADMINISTRADOR'
  UNION ALL SELECT 'administrador2', 'Administrador de prueba 2', 'administrador2@passportal.local', '$2b$12$8s3Wb1MgvxFeqds8yTe1j..flBasfzOppzAMKKXvYaTIfBB1mPmm6', 'ADMINISTRADOR'
) u ON u.rol = r.nombre;
