# Pass Portal

Sistema de Gestión Migratoria (SGM): plataforma interna para personal de control migratorio. Permite consultar y actualizar fichas de ciudadanos, recibir alertas proactivas de documentos por vencer y gestionar arraigos, bloqueos legales y multas.

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

El script acepta los roles `PERSONAL` o `ADMINISTRADOR`.

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

Las cuentas `usuario1` a `usuario4`, `personal1` a `personal4` y
`administrador1` a `administrador2` usan estas contraseñas de prueba:
`Usuario2026@`, `Personal2026@` y `Admin2026@`, respectivamente. Las primeras
cuatro cuentas ciudadanas quedan vinculadas a las fichas 1 a 4 para mostrar su
información migratoria. Son credenciales exclusivas para desarrollo local.

| Usuario | Rol | Contraseña | Ficha |
| --- | --- | --- | --- |
| `usuario1` | USUARIO | `Usuario2026@` | Ciudadano 1 |
| `usuario2` | USUARIO | `Usuario2026@` | Ciudadano 2 |
| `usuario3` | USUARIO | `Usuario2026@` | Ciudadano 3 |
| `usuario4` | USUARIO | `Usuario2026@` | Ciudadano 4 |
| `personal1` | PERSONAL | `Personal2026@` | No aplica |
| `personal2` | PERSONAL | `Personal2026@` | No aplica |
| `personal3` | PERSONAL | `Personal2026@` | No aplica |
| `personal4` | PERSONAL | `Personal2026@` | No aplica |
| `administrador1` | ADMINISTRADOR | `Admin2026@` | No aplica |
| `administrador2` | ADMINISTRADOR | `Admin2026@` | No aplica |

El pago de multas es una función interna de demostración: cambia la multa de
`PENDIENTE` a `PAGADA`, registra la fecha y actualiza el total de la ficha. No
se conecta a una tarjeta, banco ni pasarela externa.

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

| Endpoint | USUARIO | PERSONAL | ADMINISTRADOR |
| --- | --- | --- | --- |
| `GET /api/alertas`, ciudadanos y fichas | No | Sí | Sí |
| `PUT /api/ciudadanos/:id` y foto | No | Sí | Sí |
| `POST /api/ciudadanos/:id/multas` y pagar | No | Sí | Sí |
| `PATCH /api/multas/:id/anular` | No | Sí | Sí |
| `POST /api/ciudadanos/:id/arraigos` y levantar | No | Sí | Sí |
| `GET /api/auth/me` | Sesión | Sesión | Sesión |
| `POST /api/auth/register` | Cuenta normal | Cuenta normal | Cuenta normal |
| `GET/POST/PUT /api/auth/users` | No | No | Sí |
| `PUT /api/auth/me` | Sí | Sí | Sí |

Las cuentas con rol `USUARIO` son ciudadanos y tienen la pestaña
**Mi información migratoria**. El administrador las vincula a una ficha usando
el DPI desde **Usuarios y roles**; desde allí cada ciudadano solo puede ver su
propia ficha.

## Guía de clases y archivos modificables

Esta lista sirve como mapa para modificar la aplicación con HTML, CSS,
TypeScript o lógica del backend. Los componentes Angular contienen su
template HTML y sus estilos CSS en el mismo archivo.

### Frontend

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/src/app/components/login/login.component.ts` | Pantalla de inicio de sesión, validación y acceso |
| `frontend/src/app/components/register/register.component.ts` | Registro público de ciudadanos |
| `frontend/src/app/components/profile/profile.component.ts` | Datos de la cuenta y cambio de contraseña |
| `frontend/src/app/components/citizen-self/citizen-self.component.ts` | Creación de la ficha propia del ciudadano |
| `frontend/src/app/components/ficha/ficha.component.ts` | Ficha migratoria, foto, documentos, multas, arraigos y movimientos |
| `frontend/src/app/components/ficha/administrative-dialog.component.ts` | Formularios de multas y restricciones |
| `frontend/src/app/components/ciudadanos/ciudadanos.component.ts` | Búsqueda y listado de ciudadanos |
| `frontend/src/app/components/dashboard/dashboard.component.ts` | Métricas, alertas y documentos prioritarios |
| `frontend/src/app/components/admin-users/admin-users.component.ts` | CRUD administrativo de cuentas, roles y vínculo por DPI |
| `frontend/src/app/components/shell/shell.component.ts` | Menú, permisos visuales, barra superior y cierre de sesión |
| `frontend/src/app/services/api.service.ts` | Cliente HTTP de fichas, multas, arraigos, fotos y alertas |
| `frontend/src/app/services/auth.service.ts` | Sesión, token JWT y rol actual |
| `frontend/src/app/services/auth.guard.ts` | Protección de rutas por autenticación y rol |
| `frontend/src/app/services/http-error.interceptor.ts` | Manejo global de errores HTTP |
| `frontend/src/app/services/notification.service.ts` | Mensajes y notificaciones |
| `frontend/src/app/app.routes.ts` | Rutas y pantallas disponibles |
| `frontend/src/app/models/domain.model.ts` | Tipos de ciudadano, documento, multa, restricción y movimiento |
| `frontend/src/app/utils/presentation.ts` | Avatares, estados y textos visuales |

### Backend

| Archivo | Responsabilidad |
| --- | --- |
| `backend/src/router/auth.router.ts` | Login, registro, perfil, ficha propia y CRUD de usuarios |
| `backend/src/router/citizen.router.ts` | Búsqueda, consulta y actualización de ciudadanos |
| `backend/src/router/administrative.router.ts` | CRUD operativo de multas y arraigos y pago de demostración |
| `backend/src/router/photo.router.ts` | Carga, validación y guardado permanente de fotografías |
| `backend/src/router/alert.router.ts` | Alertas y resumen de vencimientos |
| `backend/src/router/index.ts` | Montaje de rutas y permisos generales |
| `backend/src/services/auth.service.ts` | Hash bcrypt, JWT, usuarios y vínculo con ficha |
| `backend/src/services/citizen.service.ts` | CRUD de fichas, documentos, multas, restricciones y movimientos de lectura |
| `backend/src/services/administrative.service.ts` | Altas, pagos, anulaciones y levantamiento de registros |
| `backend/src/services/photo.service.ts` | Actualización de la ruta de fotografía y limpieza del archivo anterior |
| `backend/src/services/alert.service.ts` | Consultas de alertas documentales |
| `backend/src/services/alert-classifier.ts` | Clasificación VERDE, AMARILLO y ROJO |
| `backend/src/middleware/auth.middleware.ts` | Validación de JWT y autorización por rol |
| `backend/src/utils/error-handler.ts` | Respuestas de errores controladas |
| `backend/src/utils/http-error.ts` | Errores HTTP tipados |
| `backend/src/db/schema.sql` | Tablas, relaciones y restricciones MySQL |
| `backend/src/db/seed.sql` | Catálogos y datos mínimos |
| `backend/src/db/seed-demo.sql` | Ciudadanos y datos ficticios de presentación |
| `backend/src/db/seed-test-users.sql` | Diez cuentas de prueba y sus vínculos ciudadanos |

## Estructura

- `backend/src`: API, middleware, rutas y servicios.
- `backend/src/db`: esquema y datos de ejemplo.
- `frontend/src/app`: rutas, componentes, modelos y servicios Angular.
- `frontend/src/app/components/profile`: perfil personal editable.
- `frontend/src/app/components/admin-users`: gestión administrativa de cuentas.
- `backend/uploads/fotos`: fotografías cargadas.

## Limitaciones conocidas

Las fotografías se sirven como recursos estáticos públicos y el nombre del archivo contiene el DPI del ciudadano. En un despliegue real deberían servirse detrás de autenticación y utilizar identificadores opacos, no datos personales en la URL.
