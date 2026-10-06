# Pass Portal

Sistema de Gestión Migratoria (SGM): plataforma interna para operadores y empleados públicos de control migratorio. Permite consultar y actualizar fichas de ciudadanos, recibir alertas proactivas de documentos por vencer y gestionar arraigos, bloqueos legales y multas.

**Desarrollador:** André Emanuel Yoj Gómez
**Institución:** Centro Educativo Técnico Kinal, Perito en Informática

## Stack
- **Frontend:** Angular + TypeScript (componentes standalone)
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** MySQL
- **Gestor de paquetes:** pnpm workspaces

## Estructura
- `backend/`: API REST
- `frontend/`: aplicación web

## Ejecución
```bash
pnpm install
pnpm dev:backend
pnpm dev:frontend
```

## Base de datos
La aplicación usa MySQL con la base `pass_portal_IN5BM`. Configura las credenciales locales en `backend/.env` y ejecuta, en este orden, `backend/src/db/schema.sql` y `backend/src/db/seed.sql`.

## Verificación
```bash
pnpm --filter backend typecheck
pnpm --filter backend build
pnpm --filter frontend build
```

Con el backend en ejecución, el estado de la API se consulta en `http://localhost:3000/api/health`.
