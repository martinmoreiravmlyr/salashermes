# Salas Hermes

MVP visual de una app de reservas de salas construido con Next.js 16 + Tailwind CSS.

Qué incluye en este primer push:
- vista semanal por sala
- filtros por owner, participante, capacidad mínima y tipo de recurso
- métricas rápidas de ocupación y reservas
- estados visuales de reservas
- datos demo listos para validar UX en Vercel
- tests unitarios para reglas de reserva y helpers de agenda

Importante:
- esta versión todavía no usa base de datos ni autenticación real
- está pensada para validar look & feel, navegación y estructura del dominio
- el próximo paso natural es conectar Prisma + Auth.js + APIs de reservas

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

## Deploy en Vercel

Este snapshot no requiere variables de entorno para funcionar.

Pasos:
1. importar el repo en Vercel
2. framework preset: Next.js
3. install command: `npm install`
4. build command: `npm run build`
5. output: default de Next.js

## Variables de entorno

Hoy no son necesarias para el demo visual. Dejé `.env.example` preparado para la siguiente iteración.

## Siguiente iteración sugerida

- Prisma schema para salas, reservas y usuarios
- Auth.js con roles `admin` y `usuario`
- API routes para listar/crear/cancelar reservas
- persistencia real de filtros y mis reservas
- bloqueo de solapamientos y políticas configurables desde admin
