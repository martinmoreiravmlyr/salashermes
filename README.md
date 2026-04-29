# Salas Hermes

MVP funcional de una app de reservas de salas construido con Next.js 16 + Tailwind CSS.

Estado actual:
- dashboard visual con vista semanal por sala
- filtros por owner, participante, capacidad mínima y tipo de recurso
- métricas rápidas y panel de "mis reservas"
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
GET  /api/bookings?week=2026-04-22&userEmail=ana@empresa.com
GET  /api/bookings?mine=true&userEmail=ana@empresa.com
POST /api/bookings
POST /api/bookings/:id/cancel
```

Ejemplo de creación:

```bash
curl -X POST http://localhost:3000/api/bookings   -H 'content-type: application/json'   -d '{
    "roomId": "delta",
    "date": "2026-04-24",
    "start": "09:00",
    "end": "10:00",
    "title": "Entrevista final",
    "requester": "ana@empresa.com",
    "participants": ["rrhh@empresa.com"],
    "reason": "Hiring loop",
    "requiresApproval": true
  }'
```

## Persistencia

Orden de prioridad actual:
1. `USE_DEMO_REPOSITORY=true` fuerza demo en memoria
2. `MONGODB_URI` activa MongoDB + Mongoose
3. `DATABASE_URL` activa Prisma + PostgreSQL
4. si no hay variables, se usa demo en memoria

Cuando se usa MongoDB:
- las salas base se sincronizan automáticamente en la colección `rooms`
- las reservas se guardan en la colección `bookings`
- no hace falta Prisma para operar la reserva real

## Deploy en Vercel

Hoy puede deployarse sin variables reales porque usa un fallback demo en memoria.

Si querés usar MongoDB en productivo:
1. configurar `MONGODB_URI`
2. dejar `USE_DEMO_REPOSITORY` sin definir o en `false`
3. levantar la app y dejar que sincronice las salas base
4. conectar Auth.js para sesión y roles reales

Si preferís PostgreSQL:
1. configurar `DATABASE_URL`
2. correr migraciones Prisma contra PostgreSQL
3. cargar salas/reservas iniciales en la base
4. dejar `USE_DEMO_REPOSITORY` sin definir o en `false`

## Variables de entorno

Ver `.env.example`.

## Próximos pasos sugeridos

- Auth.js con roles `admin` y `usuario`
- formularios UI para crear/cancelar reservas desde la app
- pantalla de admin para auditoría, días bloqueados y aprobación manual
- script de seed/backfill para mover reservas demo a MongoDB o PostgreSQL
