# Pass Portal

Sistema de Gestión Migratoria (SGM): plataforma interna para operadores y empleados públicos de control migratorio. Permite consultar y actualizar fichas de ciudadanos, recibir alertas proactivas de documentos por vencer y gestionar arraigos, bloqueos legales y multas.

**Desarrollador:** André Emanuel Yoj Gómez
**Institución:** Centro Educativo Técnico Kinal, Perito en Informática

## Requisitos e instalación

- Node.js 22 o posterior
- pnpm 10 o posterior
- MySQL 8.0 o posterior

```powershell
pnpm install
```

Ejecuta `backend/src/db/schema.sql` y luego `backend/src/db/seed.sql` en MySQL Workbench. Configura tus credenciales y variables locales directamente en `backend/.env`. `JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres; genera uno localmente con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` y guárdalo únicamente en `.env`, junto con `JWT_EXPIRES_IN=8h`.

## Ejecución
```bash
pnpm install
pnpm dev:backend
pnpm dev:frontend
```

La API queda en `http://localhost:3000` y Angular en `http://localhost:4200`.

Para crear el primer administrador:

```powershell
pnpm --filter backend create-admin
```

El script solicita usuario, nombre, correo y contraseña (mínimo 10 caracteres), y almacena únicamente el hash bcrypt en MySQL.

Para crear empleados adicionales con rol:

```powershell
pnpm --filter backend create-employee
```

El script acepta los roles `OPERADOR`, `SUPERVISOR` o `ADMINISTRADOR`.

### Datos de demostración

Después de cargar `schema.sql` y `seed.sql`, ejecuta opcionalmente
`backend/src/db/seed-demo.sql`. Este archivo agrega 40 ciudadanos ficticios,
80 documentos, multas, restricciones y movimientos en puestos de control
guatemaltecos. No agrega fotografías: la interfaz utiliza avatares con
iniciales. Los datos demo pueden recargarse porque el script reemplaza su
rango de registros (`id` 7 a 46).

Para cargar diez cuentas de prueba con todos los roles, ejecuta después de
`seed.sql`:

```text
backend/src/db/seed-test-users.sql
```

Las cuentas `usuario1` a `usuario4`, `operador1` a `operador2`,
`supervisor1` a `supervisor2` y `administrador1` a `administrador2` usan como
contraseña el mismo nombre de usuario seguido de `@passportal.com`. Son
credenciales exclusivas para desarrollo local.

## Recorrido de presentación

1. Inicia sesión con un empleado creado por `create-admin` o `create-employee`.
2. En el dashboard muestra el saludo, las métricas de vencimiento, el gráfico y filtra las alertas críticas.
3. Abre la ficha de Luis Alberto Gómez Rivas (`/ciudadanos/4`) para mostrar la restricción activa, documentos y movimientos.
4. Busca `Ortiz` en Ciudadanos y abre la ficha de María Fernanda Ortiz Castillo.
5. En la ficha de Pedro José Castañeda Ruiz (`/ciudadanos/6`) muestra la multa pendiente y las acciones según el rol.
6. Usa “Imprimir ficha” para mostrar la vista preparada para papel.

El entorno de demostración utiliza datos ficticios y no incluye fotografías; las iniciales sirven como avatar hasta que se cargue una imagen de prueba.

## Base de datos
La aplicación usa MySQL con la base `pass_portal_IN5BM`. Configura las credenciales locales en `backend/.env` y ejecuta, en este orden, `backend/src/db/schema.sql` y `backend/src/db/seed.sql`.

## Scripts y verificación

```bash
pnpm --filter backend typecheck
pnpm --filter backend test
pnpm --filter backend build
pnpm --filter frontend build
```

Con el backend en ejecución, el estado de la API se consulta en `http://localhost:3000/api/health`.

## Roles y endpoints

Todas las rutas `/api`, salvo `/api/health` y `/api/auth/login`, requieren `Authorization: Bearer <token>`.

| Endpoint | OPERADOR | SUPERVISOR | ADMINISTRADOR |
| --- | --- | --- | --- |
| `GET /api/alertas`, ciudadanos y fichas | Sí | Sí | Sí |
| `PUT /api/ciudadanos/:id` y foto | Sí | Sí | Sí |
| `POST /api/ciudadanos/:id/multas` y pagar | Sí | Sí | Sí |
| `PATCH /api/multas/:id/anular` | No | Sí | Sí |
| `POST /api/ciudadanos/:id/arraigos` y levantar | No | Sí | Sí |
| `GET /api/auth/me` | Sesión | Sesión | Sesión |
| `POST /api/auth/register` | Cuenta normal | Cuenta normal | Cuenta normal |
| `GET/POST/PUT /api/auth/users` | No | No | Sí |
| `PUT /api/auth/me` | Sí | Sí | Sí |

## Estructura

- `backend/src`: API, middleware, rutas y servicios.
- `backend/src/db`: esquema y datos de ejemplo.
- `frontend/src/app`: rutas, componentes, modelos y servicios Angular.
- `frontend/src/app/components/profile`: perfil personal editable.
- `frontend/src/app/components/admin-users`: gestión administrativa de cuentas.
- `backend/uploads/fotos`: fotografías cargadas.

## Limitaciones conocidas

Las fotografías se sirven como recursos estáticos públicos y el nombre del archivo contiene el DPI del ciudadano. En un despliegue real deberían servirse detrás de autenticación y utilizar identificadores opacos, no datos personales en la URL.
