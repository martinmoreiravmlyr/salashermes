# Salas Hermes / Salas WPP - roadmap a producción

> For Hermes: ejecutar este plan por sprint, con TDD en la lógica de negocio y verificación de lint/tests/build/prisma al cerrar cada bloque.

Objetivo:
Llevar la app actual de dashboard demo a una versión operativa para producción, con flujo real de reservas, persistencia en PostgreSQL, autenticación, permisos y administración básica.

Arquitectura:
Mantener Next.js 16 App Router y la capa de servicio existente, pero reemplazar progresivamente el repositorio en memoria por Prisma/PostgreSQL. La UI seguirá sobre la misma página principal y APIs actuales, incorporando formularios reales, acciones autenticadas y paneles administrativos sin rehacer la base visual ya validada.

Tech stack:
- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Prisma 7 + PostgreSQL
- Auth.js / NextAuth
- Vercel
- Vitest

Estado base verificado hoy:
- npm run lint -> OK
- npm run test:run -> OK (17 tests)
- npm run build -> OK
- npm run prisma:validate -> OK

---

## Meta de producto

La app debe permitir:
1. ver disponibilidad semanal real de salas
2. crear reservas desde la UI
3. cancelar reservas según permisos
4. identificar al usuario real y mostrar “mis reservas”
5. operar con datos persistentes
6. administrar pendientes, restricciones y auditoría
7. desplegar en Vercel con una base PostgreSQL productiva

---

## Sprint 1 - Flujo real de reservas desde la UI

Resultado esperado:
- el usuario puede crear una reserva desde la app sin usar curl ni endpoints manuales
- el usuario puede cancelar sus reservas desde “mis reservas”
- la UI da feedback claro de éxito/error

Archivos foco:
- src/app/page.tsx
- src/app/api/bookings/route.ts
- src/app/api/bookings/[id]/cancel/route.ts
- src/lib/booking-service.ts
- src/lib/booking-rules.ts
- tests/booking-service.test.ts

Tareas:
1. agregar formulario visible para crear reserva
2. capturar sala, fecha, inicio, fin, motivo, participantes y aprobación
3. mostrar errores de validación de negocio de forma legible
4. agregar acción de cancelar en bloque “mis reservas”
5. refrescar snapshot/dashboard luego de reservar o cancelar
6. cubrir los flujos nuevos con tests de servicio si aparece nueva lógica

Criterio de cierre:
- crear reserva desde UI
- cancelar reserva desde UI
- no permitir solapes ni franjas inválidas
- lint/tests/build en verde

---

## Sprint 2 - Persistencia real con Prisma y PostgreSQL

Resultado esperado:
- las reservas sobreviven a reinicios y despliegues
- la app deja de depender del repositorio en memoria para entornos reales

Archivos foco:
- src/lib/server-data.ts
- src/lib/booking-service.ts
- prisma/schema.prisma
- prisma.config.ts
- crear src/lib/prisma.ts
- crear src/lib/repositories/prisma-booking-repository.ts
- tests/booking-service.test.ts

Tareas:
1. crear cliente Prisma reutilizable
2. implementar repositorio Prisma para rooms y bookings
3. mapear Room/Booking del dominio actual a Prisma
4. mantener fallback demo solo para desarrollo si realmente hace falta
5. guardar participantes, cancelaciones y timestamps reales
6. preparar seed inicial con las salas correctas del negocio

Criterio de cierre:
- POST /api/bookings persiste en base real
- cancelación actualiza estado en PostgreSQL
- el dashboard lee desde Prisma cuando DATABASE_URL está presente
- prisma validate/generate y build en verde

---

## Sprint 3 - Auth.js y permisos reales

Resultado esperado:
- “mis reservas” se basa en el usuario logueado
- sólo owner o admin pueden cancelar
- se eliminan dependencias centrales de DEMO_USER_EMAIL

Archivos foco:
- prisma/schema.prisma
- crear src/lib/auth.ts o auth config equivalente
- crear src/app/api/auth/[...nextauth]/route.ts si aplica
- src/lib/booking-service.ts
- src/app/page.tsx
- README.md
- .env.example

Tareas:
1. integrar Auth.js con Prisma
2. definir sesión mínima con email, nombre y role
3. vincular reservas al usuario autenticado
4. usar sesión real para “mis reservas”
5. proteger cancelación según owner/admin
6. definir fallback de acceso para desarrollo local

Criterio de cierre:
- login funcional
- usuario estándar ve sus reservas reales
- admin puede cancelar cualquier reserva
- tests/lint/build en verde

---

## Sprint 4 - Panel operativo y reglas avanzadas

Resultado esperado:
- administración básica para operar la agenda sin intervención manual externa
- soporte para pendientes, restricciones y reglas del negocio

Archivos foco:
- src/lib/booking-rules.ts
- src/lib/booking-service.ts
- prisma/schema.prisma
- src/app/page.tsx o nuevas rutas de admin
- crear componentes admin según necesidad
- tests/booking-rules.test.ts
- tests/booking-service.test.ts

Tareas:
1. aprobar/rechazar reservas pendientes
2. configurar días bloqueados o feriados
3. soportar horarios válidos por sala o globales
4. configurar duración máxima por política
5. mostrar reservas restringidas con tratamiento visual claro
6. registrar acciones operativas relevantes

Criterio de cierre:
- admin puede gestionar pendientes
- reglas configurables se aplican de forma consistente
- cobertura de casos de negocio críticos

---

## Sprint 5 - Auditoría, hardening y salida a producción

Resultado esperado:
- despliegue productivo controlado
- trazabilidad de acciones clave
- documentación suficiente para operar y rollbackear

Archivos foco:
- README.md
- .env.example
- vercel.json
- prisma/schema.prisma
- src/lib/booking-service.ts
- opcional: docs/plans/production-checklist.md

Tareas:
1. usar AuditLog de Prisma de verdad
2. registrar create/cancel/approve/reject
3. documentar variables de entorno y setup productivo
4. definir checklist de deploy y smoke test post-deploy
5. validar estrategia de rollback
6. revisar mensajes de error y estados vacíos en UI

Criterio de cierre:
- deploy productivo documentado
- smoke test manual definido
- auditoría mínima persistida
- release lista para Vercel + PostgreSQL

---

## Orden recomendado de ejecución

1. Sprint 1: flujo UI real
2. Sprint 2: persistencia Prisma/Postgres
3. Sprint 3: Auth.js + roles
4. Sprint 4: administración y reglas avanzadas
5. Sprint 5: auditoría, hardening y producción

---

## Criterios de calidad por sprint

Al final de cada sprint correr:
- npm run lint
- npm run test:run
- npm run build
- npm run prisma:validate

Si un sprint toca Prisma, agregar además:
- npm run prisma:generate

Antes de producción:
- validar create booking
- validar cancel booking
- validar lectura de disponibilidad semanal
- validar permisos de usuario/admin
- validar persistencia real después de reinicio/deploy

---

## Decisión de ejecución

Vamos a trabajar por sprint.

Motivo:
- permite entregar valor visible rápido
- evita mezclar persistencia, auth y admin en un solo cambio gigante
- deja puntos claros para testear y decidir cuándo subir a producción

La próxima implementación recomendada es Sprint 1.
