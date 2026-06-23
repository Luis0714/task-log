# Neos IA — Casos de prueba

Casos manuales para el copiloto en `/neos-ia`.
Cubre: tarea única, múltiples tareas en una HU, múltiples tareas en varias HUs, búsqueda por nombre, horas aproximadas, fechas relativas, backlog y errores.

**Prerequisitos comunes**
- Sesión iniciada con Azure DevOps configurado (proyecto, equipo y sprint activos).
- Sprint con al menos 3 PBIs activas asignadas al usuario.

> **Nota sobre IDs**: En este proyecto los IDs de ADO son de 6 dígitos (ej. `#258439`), pero los usuarios conocen las historias por su número correlativo de título (ej. "HU 116" que aparece como "HU-116 – …" en el título de la PBI `#258439`). El sistema resuelve esto: intenta primero por ID directo y, si no existe, hace búsqueda por texto del título.

---

## 1. Tarea única en una HU

### TC-01 — ID explícito, toda la información en el mensaje
**Entrada**
```
Hoy trabajé 3 horas en la HU 1021 implementando el endpoint de exportación
```
**Flujo esperado**
1. `search_pbi("1021")` → `{ pbiId: 1021, pbiTitle: "Implementar módulo de exportación de reportes" }`
2. `create_tasks_batch` con 1 tarea:
   - `title`: algo como "Implementar endpoint de exportación"
   - `hours`: 3
   - `workingDate`: fecha de hoy
   - `activity`: según el rol del usuario (ej. `"Development"` para developer)
   - `state`: estado Done del proyecto
   - `markAsDone`: true

**UI esperada**
- Tarjeta de propuesta: "Encontré 1 actividad con 3h en total."
- 1 fila con la tarea lista para confirmar o editar.

---

### TC-02 — Sin ID, con nombre parcial de la HU (1 coincidencia)
**Entrada**
```
Mete 2 horas de hoy en la historia de exportación de reportes, estuve haciendo pruebas de integración
```
**Flujo esperado**
1. `search_pbi("exportación de reportes")` → 1 resultado → `{ pbiId: 1021, pbiTitle: "..." }`
2. `create_tasks_batch` con 1 tarea de 2h, actividad QA/Testing.

**UI esperada**
- Propuesta con la tarea bajo `#1021` sin pedir confirmación de la HU.

---

### TC-03 — Sin ID, con nombre parcial de la HU (varias coincidencias)
**Entrada**
```
Trabajé 1 hora en la historia de configuración
```
**Flujo esperado**
1. `search_pbi("configuración")` → varias coincidencias.
2. `needs_clarification` con tarjetas de candidatas.

**UI esperada**
- Pregunta: "Encontré N PBIs que coinciden con 'configuración'. ¿Cuál es la correcta?"
- Tarjetas clicables con los títulos de las PBIs candidatas.

**Segundo turno** (usuario hace clic en `#1034`)
```
La 1034
```
- `search_pbi("1034")` → `create_tasks_batch` con la tarea pendiente.

---

### TC-04 — Sin PBI mencionada
**Entrada**
```
Hoy estuve 2 horas arreglando un bug de producción
```
**Flujo esperado**
- `needs_clarification` con PBIs del sprint como candidatas.

**UI esperada**
- "¿En qué historia de usuario debo registrar este trabajo?"
- Tarjetas con las PBIs del sprint actual.

---

### TC-05 — Horas aproximadas ("toda la mañana")
**Entrada**
```
Esta mañana estuve en la HU 1034 haciendo el diseño de la pantalla
```
**Flujo esperado**
1. `search_pbi("1034")` → resuelve el ID.
2. No hay número de horas explícito → `question_with_options`:
   - "¿Cuántas horas estuviste esta mañana?"
   - Opciones: `2h`, `3h`, `4h`

**Segundo turno** (clic en `3h`)
- `create_tasks_batch` con 3h, actividad Design.

---

### TC-06 — Fecha relativa ("ayer")
**Entrada**
```
Ayer trabajé 4 horas en la HU 1058 corrigiendo el bug del cálculo de IVA
```
**Flujo esperado**
1. `search_pbi("1058")` → resuelve el ID.
2. `create_tasks_batch` con `workingDate` = fecha de ayer (calculada), 4h.

**UI esperada**
- Tarea con la fecha de ayer correcta.

---

### TC-07 — Formato coloquial de voz
**Entrada**
```
neos mete una hora de reunión de hoy en la mil veintiuno
```
**Flujo esperado**
1. El agente extrae "1021" de "mil veintiuno".

> **Nota**: El modelo LLM puede interpretar "mil veintiuno" como 1021. Si no lo hace, devuelve `needs_clarification` pidiendo el ID numérico.

2. `search_pbi("1021")` → `create_tasks_batch` con 1h, actividad Meeting.

---

## 2. Múltiples tareas en una sola HU

### TC-08 — Dos actividades distintas en el mismo día
**Entrada**
```
Hoy en la HU 1021 estuve 3 horas desarrollando el endpoint y 1 hora en reunión de revisión con el equipo
```
**Flujo esperado**
1. `search_pbi("1021")` → 1 llamada, resuelve el ID.
2. `create_tasks_batch` con 2 tareas bajo `pbiId: 1021`:
   - Tarea 1: ~3h, actividad Development, hoy
   - Tarea 2: ~1h, actividad Meeting, hoy

**UI esperada**
- "Encontré 2 actividades con 4h en total."
- 2 filas, ambas bajo la misma HU `#1021`.

---

### TC-09 — Actividades en días distintos de la misma HU
**Entrada**
```
En la HU 1034: ayer 2 horas de diseño y hoy 3 horas de maquetación
```
**Flujo esperado**
1. `search_pbi("1034")` → 1 llamada.
2. `create_tasks_batch` con 2 tareas:
   - Tarea 1: 2h, ayer, actividad Design
   - Tarea 2: 3h, hoy, actividad Design

**UI esperada**
- 2 filas con fechas distintas, ambas bajo `#1034`.

---

### TC-10 — Tres tareas en la misma HU con distintas actividades
**Entrada**
```
Hoy en la PBI de facturación #1058: 2 horas arreglando el bug del IVA, 1 hora de code review con el lead y 30 minutos actualizando la documentación
```
**Flujo esperado**
1. `search_pbi("1058")` → resuelve el ID.
2. `create_tasks_batch` con 3 tareas:
   - 2h, Development
   - 1h, Code review / Development
   - 0.5h, Documentation

**UI esperada**
- "3 actividades con 3.5h en total."

---

## 3. Múltiples tareas en varias HUs

### TC-11 — Dos HUs con IDs explícitos en un mensaje
**Entrada**
```
Hoy: 3 horas en la HU 1021 integrando la API de reportes y 2 horas en la HU 1058 corrigiendo el bug de facturación
```
**Flujo esperado**
1. `search_pbi("1021")` y `search_pbi("1058")` (pueden llamarse en paralelo o secuencial).
2. `create_tasks_batch` con 2 tareas, una por HU.

**UI esperada**
- "2 actividades con 5h en total."
- Las filas muestran la HU padre correspondiente a cada tarea.

---

### TC-12 — Tres HUs distintas, días distintos
**Entrada**
```
Esta semana: lunes 4 horas en la 1021 desarrollando, martes 2 horas en la 1034 en diseño y hoy 3 horas en la 1058 haciendo QA
```
**Flujo esperado**
1. `search_pbi("1021")`, `search_pbi("1034")`, `search_pbi("1058")`.
2. `create_tasks_batch` con 3 tareas con las fechas correctas (lunes, martes, hoy calculadas).

**UI esperada**
- "3 actividades con 9h en total."
- Cada fila muestra su HU y fecha correspondiente.

---

### TC-13 — HUs por nombre sin ID
**Entrada**
```
Hoy 2 horas en la historia de exportación y 1 hora en la de facturación, haciendo revisión en ambas
```
**Flujo esperado**
1. `search_pbi("exportación")` → si 1 resultado resuelve `#1021`.
2. `search_pbi("facturación")` → si 1 resultado resuelve `#1058`.
3. `create_tasks_batch` con 2 tareas.

Si alguna búsqueda retorna varias coincidencias → `needs_clarification` para esa HU; el flujo continúa con la otra ya resuelta y espera la selección del usuario.

---

### TC-14 — Una HU por ID y otra por nombre
**Entrada**
```
Hoy trabajé 3 horas en la HU 1021 y 2 horas en la historia de configuración de usuario
```
**Flujo esperado**
1. `search_pbi("1021")` → resuelve directamente.
2. `search_pbi("configuración de usuario")` → si hay coincidencia exacta resuelve `#1034`; si hay varias, `needs_clarification`.
3. Con ambas resueltas → `create_tasks_batch` con 2 tareas.

---

## 4. Consulta de backlog

### TC-15 — Preguntar por PBIs propias del sprint
**Entrada**
```
¿Qué PBIs tengo en el sprint?
```
**Flujo esperado**
- `list_work_items(types=["pbi"], assignedToMe=true, title="Tus PBIs en el sprint")`
- Sin `states` — el sistema excluye internamente los items Removed.

**UI esperada**
- Lista con las PBIs asignadas al usuario, con links a Azure DevOps.

---

### TC-16 — Preguntar por bugs
**Entrada**
```
Muéstrame los bugs abiertos del sprint
```
**Flujo esperado**
- `list_work_items(types=["bug"], title="Bugs en el sprint")`
- `assignedToMe` omitido (el usuario no dijo "mis").

**UI esperada**
- Lista de bugs del sprint (todo el equipo).

---

### TC-17 — Preguntar por tareas propias
**Entrada**
```
¿Qué tareas tengo asignadas?
```
**Flujo esperado**
- `list_work_items(types=["task"], assignedToMe=true, title="Tus tareas en el sprint")`

---

## 5. Aclaración, edición y confirmación

### TC-18 — Editar horas antes de confirmar
**Precondición**: TC-01 ejecutado, formulario visible con 3h.

**Acción**: Cambiar el campo de horas de la tarea a `2`.

**Resultado esperado**
- El resumen muestra "1 actividad · 2h en total".
- Al confirmar, ADO crea la tarea con 2h (no 3h).

---

### TC-19 — Cambiar actividad en el formulario
**Precondición**: TC-01 ejecutado, actividad mostrada como "Development".

**Acción**: Desplegar el `<Select>` de actividad y elegir "Code review".

**Resultado esperado**
- El selector muestra solo los valores reales del proyecto (sin hardcoding).
- Al confirmar, se crea sin error TF401320.

---

### TC-20 — Cancelar propuesta
**Precondición**: TC-08 ejecutado, formulario con 2 tareas visible.

**Acción**: Clic en "Cancelar".

**Resultado esperado**
- Formulario desaparece.
- No se crea ninguna tarea en ADO.
- La conversación permanece tal cual.

---

### TC-21 — Confirmar y crear con éxito
**Precondición**: TC-11 ejecutado, 2 tareas en el formulario.

**Acción**: Clic en "Confirmar y crear".

**Resultado esperado**
- Spinner mientras se crean.
- Mensaje de éxito: "2 tareas creadas · 5h registradas."
- Las tareas aparecen en Azure DevOps bajo sus respectivas HUs.

---

## 6. Conversación con historial

### TC-22 — Agregar tarea olvidada en la misma HU
**Turno 1**: TC-01 ejecutado (3h en `#1021`, tarea confirmada y creada).

**Turno 2**
```
Olvidé que también estuve 30 minutos revisando el PR de ese mismo ticket
```
**Flujo esperado**
- El agente usa el historial para saber que el contexto era `#1021`.
- `search_pbi("1021")` → `create_tasks_batch` con 1 tarea de 0.5h, actividad Code review.

**UI esperada**
- Nueva propuesta con 1 tarea.

---

### TC-23 — Cambiar de HU en el segundo turno
**Turno 1**: TC-01 ejecutado (3h en `#1021`).

**Turno 2**
```
Y ayer 2 horas en la HU de facturación
```
**Flujo esperado**
- `search_pbi("facturación")` → resuelve `#1058`.
- `create_tasks_batch` con 1 tarea de 2h en `#1058`, fecha de ayer.

---

## 7. Mensajes fuera de alcance

### TC-24 — Conversación general
**Entrada**
```
Hola, ¿cómo estás?
```
**Flujo esperado**
- `unsupported(reason="...")`

**UI esperada**
- Mensaje breve indicando que Neos IA es para registrar trabajo o consultar el backlog. Sin formulario ni tarjetas.

---

### TC-25 — Pregunta técnica fuera de alcance
**Entrada**
```
¿Cuánto es 2 + 2?
```
**Flujo esperado**
- `unsupported`.

---

## 8. Casos límite

### TC-26 — Fecha fuera del rango del sprint
**Entrada** (sprint: 2026-06-16 → 2026-06-30)
```
El 5 de junio trabajé 3 horas en la HU 1021
```
**Resultado esperado**
- El agente detecta que el 5 de junio está fuera del sprint activo y usa `question_with_options` para aclarar ("¿Quisiste decir el 16 de junio (primer día del sprint)?") o `needs_clarification`.
- No crea una tarea con una fecha inválida.

---

### TC-27 — ID de HU que no existe
**Entrada**
```
3 horas hoy en la HU 9999
```
**Flujo esperado**
1. `search_pbi("9999")` → la HU no existe.
2. `needs_clarification` con candidatos del sprint: "La HU #9999 no existe. ¿Cuál de estas es la correcta?"

**UI esperada**
- Tarjetas con las PBIs del sprint para seleccionar.

---

### TC-28 — Horas fuera de rango (>24)
**Entrada**
```
Hoy trabajé 30 horas en la HU 1021
```
**Resultado esperado**
- El agente no genera una tarea con `hours: 30`.
- Usa `question_with_options` para aclarar o divide en días si el contexto lo permite.

---

## Verificación previa: valores de actividad del proyecto

Antes de ejecutar los casos TC-01 a TC-23, verificar que el endpoint retorna los valores reales del proyecto:

```
GET /api/copilot/task-meta
```

**Respuesta esperada** (proceso Scrum estándar)
```json
{
  "activities": ["Deployment", "Design", "Development", "Documentation", "Management", "Requirements", "Testing"],
  "stateNames": ["New", "Active", "Resolved", "Closed"]
}
```

Si `activities` es `[]` → proceso Basic. Los casos de actividad crearán tareas sin campo Activity y no deberían generar error TF401320.
