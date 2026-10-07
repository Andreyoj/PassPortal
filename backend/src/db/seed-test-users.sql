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
  UNION ALL SELECT 'personal1', 'Personal de prueba 1', 'personal1@passportal.local', '$2b$12$7oStALRYTQW1YRHd4mOdl.ltRXByNrzWIFpnrmOqeA0JvpomdNvF2', 'PERSONAL'
  UNION ALL SELECT 'personal2', 'Personal de prueba 2', 'personal2@passportal.local', '$2b$12$vgKvm9FEqy.z7rCMh0RFou7Amtq7PO7tO8/MVjALUIVgJkz8ItqbO', 'PERSONAL'
  UNION ALL SELECT 'personal3', 'Personal de prueba 3', 'personal3@passportal.local', '$2b$12$ZxwhuWpImBzSo4eaItsL0ep08z46PZJOoRlWoH237erBtGsLwYpli', 'PERSONAL'
  UNION ALL SELECT 'personal4', 'Personal de prueba 4', 'personal4@passportal.local', '$2b$12$1n/TzSodqr4ZTW.mvJVRcuuiwX6G.EHZu68jxdROAzlFbGK/bhWnu', 'PERSONAL'
  UNION ALL SELECT 'administrador1', 'Administrador de prueba 1', 'administrador1@passportal.local', '$2b$12$arcRu8yQMNMwdNMcRUaOlemvInRhsAwFPtrxDQwwFkGgPkj.cDSQG', 'ADMINISTRADOR'
  UNION ALL SELECT 'administrador2', 'Administrador de prueba 2', 'administrador2@passportal.local', '$2b$12$8s3Wb1MgvxFeqds8yTe1j..flBasfzOppzAMKKXvYaTIfBB1mPmm6', 'ADMINISTRADOR'
) u ON u.rol = r.nombre;
