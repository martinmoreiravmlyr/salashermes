# Salas WPP - presentación y reservas asistidas

> For Hermes: implementar en iteraciones chicas usando TDD y verificando lint/build en cada paso.

Objetivo:
Convertir el dashboard actual en una versión lista para demo ejecutiva con marca Salas WPP, soporte de modo día/noche y un chatbot lateral izquierdo que ayude a reservar salas rápidamente.

Arquitectura:
Mantener Next.js App Router y la capa de servicio ya existente. Extender la UI con un theme toggle persistente, rebranding global y un panel de asistente conversacional que inicialmente opere sobre las APIs existentes y el catálogo demo/real. El chatbot debe quedar desacoplado para luego conectarlo a Auth.js y persistencia real.

Tech stack:
- Next.js 16 App Router
- Tailwind CSS v4
- TypeScript
- APIs internas existentes (/api/rooms, /api/bookings)
- Estado UI local para theme/chat en la primera iteración

---

## Alcance nuevo confirmado por el usuario

1. Renombrar el producto a "Salas WPP"
2. Agregar modo día y modo noche
3. Agregar chatbot fijo a la izquierda para ayudar a reservar salas
4. Mantener foco en una experiencia presentable para demo

---

## Fase 1 - Rebranding Salas WPP

Resultado esperado:
- nombre actualizado en metadata, header, hero, README y textos clave
- tono visual alineado a una demo más corporativa

Tareas:
- actualizar metadata en src/app/layout.tsx
- actualizar copy principal en src/app/page.tsx
- actualizar README.md
- revisar endpoints/documentación donde aparezca el nombre viejo

Verificación:
- buscar "Salas Hermes" y dejar solo referencias históricas si son necesarias
- npm run lint
- npm run build

---

## Fase 2 - Theme system día/noche

Resultado esperado:
- toggle visible en header
- tema oscuro como default si conviene a la demo
- tema persistido en localStorage o cookie
- tokens de color centralizados para superficies, texto, bordes y acentos

Diseño sugerido:
- crear un ThemeProvider client component
- usar data-theme en html/body
- migrar gradientes/fondos a variables CSS
- validar contraste en ambas variantes

Archivos candidatos:
- crear src/components/theme-provider.tsx
- crear src/components/theme-toggle.tsx
- modificar src/app/layout.tsx
- modificar src/app/globals.css
- ajustar src/app/page.tsx

Tests/validación:
- smoke test del provider si vale la pena
- npm run lint
- npm run build

---

## Fase 3 - Chatbot lateral izquierdo

Resultado esperado:
- panel fijo/colapsable a la izquierda
- onboarding breve: "Te ayudo a encontrar y reservar una sala"
- respuestas guiadas basadas en capacidad, día, horario y tipo de sala
- CTA para proponer reserva usando POST /api/bookings

MVP conversacional sugerido:
- mensaje inicial con chips de acción rápida
- flujo guiado:
  1. cuántas personas
  2. fecha
  3. horario
  4. tipo de sala
  5. sugerencias disponibles
  6. CTA para reservar
- primer release con lógica local + APIs internas, sin LLM externo

Arquitectura sugerida:
- crear src/components/booking-assistant.tsx
- crear src/components/chat-message.tsx
- crear src/components/quick-action-chip.tsx
- crear helper src/lib/assistant.ts para construir sugerencias
- conectar con /api/rooms y /api/bookings

Tests:
- testear helper de sugerencias con casos mínimos
- testear creación de reserva sugerida si se agrega helper de submit

---

## Fase 4 - Demo polish

Resultado esperado:
- layout de tres zonas bien marcado: chatbot izquierda, contenido central, panel/filtros lateral o superior
- responsive razonable en laptop y desktop
- empty states, loaders visuales y microcopy claro
- versión ideal para presentación en vivo

Checklist de presentación:
- hero corto y más ejecutivo
- métricas visibles arriba
- catálogo real de salas visible
- chatbot entendible en menos de 5 segundos
- modo día/noche listo para mostrar contraste visual

---

## Orden recomendado de ejecución

1. Rebranding a Salas WPP
2. Theme provider + toggle día/noche
3. Helper del asistente conversacional
4. UI del chatbot izquierdo
5. Integración con APIs de reservas
6. Pulido final de layout para demo
7. Lint + tests + build + push

---

## Riesgos / notas

- El chatbot no necesita IA real en esta fase; conviene hacerlo determinístico para la demo
- El modo día puede requerir repensar transparencias y bordes que hoy están optimizados para dark mode
- Si el panel izquierdo ocupa mucho ancho, conviene hacerlo colapsable
- Cuando entre Auth.js, el chatbot podrá usar el usuario real para reservar sin pedir email manual
