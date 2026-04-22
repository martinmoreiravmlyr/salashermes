# Salas Hermes

MVP funcional de una app de reservas de salas construido con Next.js 16 + Tailwind CSS.

Estado actual:
- dashboard visual con vista semanal por sala
- filtros por owner, participante, capacidad mínima y tipo de recurso
- métricas rápidas y panel de "mis reservas"
- API routes para listar salas, listar reservas, crear reserva y cancelar reserva
- capa de servicio para reglas de negocio y validaciones
- schema Prisma inicial listo para evolucionar a PostgreSQL
- fallback demo en memoria para que el proyecto siga deployando sin depender aún de una base real

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

## Deploy en Vercel

Hoy puede deployarse sin variables reales porque usa un fallback demo en memoria.

Si luego querés pasar a productivo:
1. configurar `DATABASE_URL`
2. correr migraciones Prisma
3. reemplazar el repositorio demo por el repositorio Prisma
4. conectar Auth.js para sesión y roles reales

## Variables de entorno

Ver `.env.example`.

## Próximos pasos sugeridos

- repositorio Prisma real detrás de la capa de servicio
- Auth.js con roles `admin` y `usuario`
- formularios UI para crear/cancelar reservas desde la app
- pantalla de admin para auditoría, días bloqueados y aprobación manual
