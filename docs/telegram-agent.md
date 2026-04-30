# Agente de Telegram para reservas

## Objetivo

Permitir que un agente Hermes atienda mensajes de Telegram para:
- consultar disponibilidad
- listar reservas de una persona
- crear reservas
- cancelar reservas

Sin darle acceso directo a MongoDB.

## Arquitectura recomendada

Telegram -> Hermes profile `telegram-reservas` -> skill `telegram-reservas` -> script cliente -> API interna protegida por token -> Booking service -> MongoDB

## Variables nuevas

Agregar en el entorno de la app:

```bash
TELEGRAM_AGENT_API_TOKEN="cambiar-por-token-largo-y-random"
TELEGRAM_AGENT_EMAIL="telegram-agent@empresa.com"
TELEGRAM_AGENT_NAME="Telegram Reservas Agent"
```

## Endpoints del agente

Todos requieren header:

```bash
Authorization: Bearer $TELEGRAM_AGENT_API_TOKEN
```

### Listar salas

`GET /api/agent/rooms?week=2026-05-05`

### Listar reservas / disponibilidad semanal

`GET /api/agent/bookings?week=2026-05-05&requesterEmail=ana@empresa.com`

### Crear reserva

`POST /api/agent/bookings`

Body:

```json
{
  "requester": "ana@empresa.com",
  "roomId": "atlas",
  "date": "2026-05-05",
  "start": "10:00",
  "end": "11:00",
  "title": "Planning",
  "participants": ["rrhh@empresa.com"],
  "reason": "Weekly sync",
  "requiresApproval": false
}
```

### Cancelar reserva

`POST /api/agent/bookings/<bookingId>/cancel`

## Cliente CLI para el agente

Script:

```bash
node scripts/telegram-agent-client.mjs help
```

Ejemplos:

```bash
export SALAS_BASE_URL="http://127.0.0.1:3000"
export TELEGRAM_AGENT_API_TOKEN="..."

node scripts/telegram-agent-client.mjs rooms --week 2026-05-05
node scripts/telegram-agent-client.mjs bookings --requesterEmail ana@empresa.com --week 2026-05-05
node scripts/telegram-agent-client.mjs create --requester ana@empresa.com --roomId atlas --date 2026-05-05 --start 10:00 --end 11:00 --title "Planning semanal" --participants rrhh@empresa.com,lider@empresa.com --reason "Sync"
node scripts/telegram-agent-client.mjs cancel --id <bookingId>
```

## Comportamiento recomendado del agente

1. Nunca escribir en Mongo directo.
2. Siempre usar el script `scripts/telegram-agent-client.mjs`.
3. Si faltan datos para crear la reserva, pedir solo los campos faltantes:
   - requester email
   - sala
   - fecha
   - inicio
   - fin
   - título
4. Antes de crear, resumir la reserva y pedir confirmación breve.
5. Si hay ambigüedad en sala, mostrar opciones válidas.
6. Para cancelar, confirmar el `bookingId` o listar reservas de esa persona primero.

## Perfil Hermes sugerido

- nombre: `telegram-reservas`
- herramientas mínimas recomendadas para Telegram:
  - clarify
  - skills
  - todo
  - terminal
  - memory
- evitar exponer herramientas no necesarias en Telegram.

## Skill sugerida

Crear una skill `telegram-reservas` con estas reglas:
- usar siempre el script cliente
- no inventar salas
- no asumir emails si el usuario no los dio
- confirmar antes de crear o cancelar
- mostrar respuestas cortas y operativas

## Puesta en marcha Hermes

1. Crear perfil:

```bash
hermes profile create telegram-reservas --clone
```

2. Editar el config del perfil y dejar toolsets mínimos para Telegram.

3. Configurar el bot de Telegram en ese perfil.

4. Arrancar gateway con ese perfil:

```bash
hermes --profile telegram-reservas gateway run
```

O instalarlo como servicio:

```bash
hermes --profile telegram-reservas gateway install
hermes --profile telegram-reservas gateway start
```
