# Salas WPP

MVP funcional de una app de reservas de salas construido con Next.js 16 + Tailwind CSS.

Estado actual:
- dashboard visual con vista semanal por sala
- filtros por owner, participante, capacidad mínima y tipo de recurso
- métricas rápidas y panel de "mis reservas"
- UI real para crear y cancelar reservas desde la app
- Auth.js con credenciales y sesiones JWT respaldadas por MongoDB
- API routes para listar salas, listar reservas, crear reserva y cancelar reserva
- capa de servicio para reglas de negocio y validaciones
- persistencia real con MongoDB + Mongoose cuando existe `MONGODB_URI`
- alternativa Prisma + PostgreSQL todavía disponible cuando existe `DATABASE_URL`
- fallback demo en memoria para que el proyecto siga deployando sin depender de una base real

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
npm run prisma:validate
npm run prisma:generate
```

## Endpoints disponibles

```bash
GET  /api/rooms
GET  /api/bookings?week=2026-04-22
GET  /api/bookings?mine=true&week=2026-04-22
POST /api/bookings
POST /api/bookings/:id/cancel
POST /api/auth/[...nextauth]
GET  /api/auth/[...nextauth]
```

Notas:
- `POST /api/bookings` y `POST /api/bookings/:id/cancel` usan la sesión actual, no confían en emails enviados por el cliente.
- `GET /api/bookings` usa la sesión si existe; si no, puede aceptar `userEmail` para modo demo/público.

## Persistencia

Orden de prioridad actual:
1. `USE_DEMO_REPOSITORY=true` fuerza demo en memoria
2. `MONGODB_URI` activa MongoDB + Mongoose
3. `DATABASE_URL` activa Prisma + PostgreSQL
4. si no hay variables, se usa demo en memoria

Cuando se usa MongoDB:
- las salas base se sincronizan automáticamente en la colección `rooms`
- las reservas se guardan en la colección `bookings`
- los usuarios de Auth.js se guardan en la colección `users`
- no hace falta Prisma para operar la reserva real

## Auth.js

El login actual usa credenciales (email + password) con sesión JWT.

Flujo:
1. crear cuenta desde la UI principal
2. iniciar sesión
3. crear y cancelar reservas con identidad tomada del servidor

Variables mínimas:

```bash
MONGODB_URI="mongodb://localhost:27017/salashermes"
NEXTAUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"
```

## Deploy en Vercel

Hoy puede deployarse sin variables reales porque usa un fallback demo en memoria.

Si querés usar MongoDB en productivo:
1. configurar `MONGODB_URI`
2. configurar `NEXTAUTH_SECRET`
3. configurar `NEXTAUTH_URL`
4. dejar `USE_DEMO_REPOSITORY` sin definir o en `false`
5. levantar la app y dejar que sincronice las salas base

Si preferís PostgreSQL:
1. configurar `DATABASE_URL`
2. correr migraciones Prisma contra PostgreSQL
3. cargar salas/reservas iniciales en la base
4. dejar `USE_DEMO_REPOSITORY` sin definir o en `false`

## Variables de entorno

Ver `.env.example`.

## Próximos pasos sugeridos

- roles admin reales con aprobaciones manuales
- pantalla de auditoría y días bloqueados
- script de seed/backfill para mover reservas demo a MongoDB o PostgreSQL
- integración de identidad corporativa/SSO en lugar de credenciales locales
