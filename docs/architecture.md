# Diario de arquitectura — NeosView (TaskPilot)

> Documento vivo. Se actualiza cuando cambia una pieza estructural o se conecta un sistema nuevo.
> Última revisión: 2026-06-17.

---

## 1. Qué es

**NeosView** (nombre interno del producto) es una app Next.js que sirve como *consola personal* alrededor de **Azure DevOps** (ADO). El usuario se conecta a su org/proyecto/team de ADO y desde la app puede:

- Ver su dashboard de sprint, tareas, bugs y HU ([src/app/(shell)/page.tsx](src/app/(shell)/page.tsx), [src/app/(shell)/tasks/page.tsx](src/app/(shell)/tasks/page.tsx)).
- Registrar horas sobre work items desde un formulario clásico **o desde un copiloto en lenguaje natural** que ya interpreta "2h en #1234 revisando PR" → acción ejecutada contra ADO ([src/lib/agent/interpret.ts](src/lib/agent/interpret.ts)).
- Analizar sprints y proyecto (cumplimiento de objetivo, capacidad, métricas) con históricos *congelados* en BD para que el dashboard no dependa del estado actual de ADO ([src/lib/db/schema.ts](src/lib/db/schema.ts)).
- Gestionar su conexión ADO (PAT u OAuth Microsoft Entra) desde Configuración.

Está pensado para una sola organización (la del autor, por los nombres por defecto en [.env.local](.env.local): `technologyfactory` / `Plataforma Virtual - NARP`), pero el código es multi-org.

---

## 2. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16.2.4** (App Router) | ⚠️ Versión con cambios rompientes vs. docs viejos — leer `node_modules/next/dist/docs/` antes de tocar nada del router. |
| UI | React 19.2.4, Tailwind 4, `@base-ui/react`, `lucide-react`, `recharts`, `react-day-picker`, `sonner` | Componentes en [src/components/](src/components/). |
| Formularios | `react-hook-form` + `zod` (v4) + `@hookform/resolvers` | Schemas en [src/lib/schemas/](src/lib/schemas/). |
| Persistencia | **Postgres en Neon** vía `@neondatabase/serverless` + `drizzle-orm` 0.45 + `drizzle-kit` 0.31 | Cliente único en [src/lib/db/client.ts](src/lib/db/client.ts), soporta WebSocket (transacciones). |
| Auth | `iron-session` (cookie cifrada) + Microsoft Entra (OAuth2) + PAT (Basic Auth) | Sesión en [src/lib/auth/session.ts](src/lib/auth/session.ts). |
| Seguridad | Cifrado AES-256-GCM de secretos en BD ([src/lib/security/secret-cipher.ts](src/lib/security/secret-cipher.ts)), `bcryptjs` para password local, `dompurify` para HTML de ADO. |
| LLM | OpenAI HTTP directo (`gpt-4o-mini` por defecto) — sin SDK, sin streaming | Único punto: [src/lib/agent/interpret.ts](src/lib/agent/interpret.ts). |
| Documentos | `@react-pdf/renderer` | (presente, no es la pieza central). |
| WebSocket | `ws` (para Neon HTTP+WS en Node runtime) | Solo server side. |
| Deploy target | **Vercel** (por `POSTGRES_URL`, `NEXT_PUBLIC_SITE_URL`, redirects en [next.config.ts](next.config.ts)) | Dominio prod: `neosview.estremor.com` ([docs/azure-entra-branding.md](docs/azure-entra-branding.md)). |

---

## 3. Vista de alto nivel

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              NAVEGADOR (RSC + cliente)                        │
│  Rutas:  /  /copilot  /history  /time-log  /work-items  /tasks  /bugs       │
│          /analysis/proyecto  /analysis/sprints  /settings  /login  /registro │
│  Route groups: (shell) — con sidebar y conexión  ·  (account) — limpio        │
│  (legal) — /privacy /terms                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                │                                │
                │ Server Actions / fetch          │ fetch /api/*
                ▼                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Next.js — App Router (src/app)                        │
│  api/ado/*        api/auth/{login,register,azdo/*,pat}                         │
│  api/preview      api/execute           api/sprints/*   api/settings/*        │
│  api/health       api/execute/create-task                                       │
└──────────────────────────────────────────────────────────────────────────────┘
                │                          │                     │
                ▼                          ▼                     ▼
┌─────────────────────────┐  ┌──────────────────────────┐  ┌─────────────────┐
│  src/lib/auth/*         │  │  src/lib/azure-devops/*  │  │ src/lib/agent/* │
│  iron-session + DB      │  │  cliente HTTP a ADO      │  │ interpret.ts    │
│  Entra OAuth / PAT      │  │  PAT (Basic) | OAuth     │  │ OpenAI HTTP     │
│  hidratación + refresco │  │  (Bearer) → dev.azure.com │  │ + heurística    │
└─────────────────────────┘  └──────────────────────────┘  └─────────────────┘
                │                          │
                ▼                          ▼
┌─────────────────────────┐  ┌──────────────────────────────────────────────────┐
│  src/lib/db/*           │  │            Azure DevOps REST API                 │
│  Drizzle + Neon (WS)    │  │  Work Items, WIQL, Iterations, Teams,            │
│  Ports + Repos          │  │  Process Config, Graph (identity)                │
│  + Cifrado AES-GCM      │  └──────────────────────────────────────────────────┘
└─────────────────────────┘
                │
                ▼
        Postgres (Neon)
```

---

## 4. Modelo de datos ([src/lib/db/schema.ts](src/lib/db/schema.ts))

7 tablas, 4 migraciones activas en [drizzle/](drizzle/) + un *meta*.

| Tabla | Para qué |
|---|---|
| `users` | Identidad del producto. `authProvider ∈ {local, entra}`. |
| `ado_connections` | Cómo este usuario llama a ADO: `authMethod ∈ {pat, oauth}`. Guarda secretos **cifrados AES-GCM** (`encryptedSecrets` = `{pat}` o `{refreshToken}`). 1:1 con `users`. |
| `sprint_goals` | Objetivo general del sprint, único por (org, proyecto, team, sprintPath). |
| `sprint_story_goals` | Meta por HU dentro del sprint: estado/TAC baseline y target, observación, si cuenta para el objetivo. |
| `sprint_snapshots` | Foto inmutable del cierre de retrospectiva. Permite dashboard histórico sin depender de ADO. |
| `sprint_story_snapshots` | Foto por HU congelada en el snapshot (estado final, status: `achieved/partial/missed/excluded/no_target`). |

**Decisiones:**
- Todo lo "vivo" sigue en ADO. En BD solo va: identidad de usuario, secretos cifrados, **histórico congelado** y configuración de scope (sprintPath, etc.). Esto evita que un cambio retroactivo en ADO rompa análisis pasados.
- Identidad dual: el usuario puede ser `local` (registro email+password con PAT) o `entra` (OAuth Microsoft). La conexión ADO después se vincula a la org/proyecto/team que elija, independientemente del método de login.

---

## 5. Autenticación y sesión

Dos puertas, ambas terminan en la misma cookie `taskpilot_session`:

1. **Local + PAT** ([src/app/(account)/registro/page.tsx](src/app/(account)/registro/page.tsx))
   - Registro: email + password (bcrypt) + PAT de ADO. PAT se cifra con AES-GCM y se guarda en `ado_connections.encryptedSecrets`.
   - Login: valida bcrypt, rehidrata sesión con el PAT descifrado.

2. **Entra OAuth** ([src/lib/auth/entra.ts](src/lib/auth/entra.ts), [src/lib/auth/complete-entra-oauth-sign-in.ts](src/lib/auth/complete-entra-oauth-sign-in.ts))
   - Flujo OAuth2 + PKCE contra Microsoft Entra.
   - Callback en [/api/auth/azdo/callback](src/app/api/auth/azdo/callback).
   - `refreshToken` se persiste en `ado_connections` (cifrado). `accessToken` vive en sesión, se refresca on-demand ([src/lib/auth/sync-oauth-refresh-to-db.ts](src/lib/auth/sync-oauth-refresh-to-db.ts)).

La sesión ([src/lib/auth/session.ts](src/lib/auth/session.ts)) además cachea:
- `adoProfile` (displayName + publicAlias + id) → evita pedir el perfil a ADO en cada render.
- `adoProcessProfiles` por `org::proyecto` → qué campos custom existen (fecha de trabajo, maqueta, integrador, QA) → discovery ejecutado al conectar.

**Doble capa de cifrado:** cookie cifrada con `IRON_SESSION_PASSWORD` (32+ chars), secretos en BD cifrados con `ENCRYPTION_KEY` (AES-256-GCM). El primero protege la sesión en tránsito/cliente; el segundo protege la BD en reposo si alguien la dumpea.

---

## 6. Integración con Azure DevOps

Cliente mínimo en [src/lib/azure-devops/client.ts](src/lib/azure-devops/client.ts): un `fetch` con `cache: 'no-store'` y header `Authorization` según modo (Basic para PAT, Bearer para OAuth).

Capa de dominio en [src/lib/azure-devops/](src/lib/azure-devops/):

| Módulo | Función |
|---|---|
| `work-items.ts`, `work-item-patch.ts` | Lectura/escritura de work items. |
| `sprints.ts`, `iterations` | Iteraciones / sprintPath. |
| `teams.ts`, `projects.ts`, `tags.ts` | Equipos, proyectos, tags. |
| `process-profile.ts`, `backlog-item-fields-config.ts`, `working-date-field-discovery.ts` | **Discovery** del proceso del proyecto del usuario: qué campos custom hay, cuál es la "fecha de trabajo", cómo se llaman los estados, etc. El resultado se cachea en sesión. |
| `resolve-auth.ts` | Resuelve el `AdoCallerAuth` final (PAT descifrado o accessToken refrescado) para que las rutas API lo usen sin pensar. |
| `task-states.ts`, `bug-states.ts`, `validate-backlog-transition.ts` | Validaciones de transiciones válidas por tipo de proceso. |

> El proyecto detecta automáticamente el proceso del ADO del usuario (`Scrum`/`Agile`/`CMMI`/proceso custom) y configura nombres de estados, campos custom (e.g. `Custom.WorkingDate`), nombres de tipos (`Product Backlog Item`, `Task`, `Bug`). Esto evita hardcodear por proceso.

---

## 7. UI / route groups

```
src/app/
├── layout.tsx                  # root: fuentes (Satoshi local + JetBrains Mono), JSON-LD, Toaster, ThemeProvider
├── (account)/
│   ├── login/page.tsx          # login (local o disparar Entra)
│   └── registro/page.tsx       # registro con PAT
├── (shell)/
│   ├── layout.tsx              # AppShell con sidebar + conexión ADO en sidebar
│   ├── page.tsx                # Dashboard (/)
│   ├── copilot/page.tsx        # Copiloto IA (/copilot)
│   ├── history/page.tsx        # Historial (/history)
│   ├── time-log/page.tsx       # Registro manual de horas (/time-log)
│   ├── work-items/             # HU (backlog items)
│   ├── tasks/                  # Tasks
│   ├── bugs/                   # Bugs
│   ├── analysis/proyecto/      # Análisis del proyecto
│   ├── analysis/sprints/       # Análisis por sprint
│   └── settings/               # Configuración (conexión ADO, perfil de proceso)
├── (legal)/privacy, /terms
└── api/                        # rutas API (ver §3)
```

**Patrón:** cada feature tiene su carpeta en [src/components/](src/components/) (ado, auth, bugs, connection, copilot, dashboard, history, navigation, settings, sprints, tags, tasks, time-log, work-items…) y una gemela en [src/lib/](src/lib/) con la lógica. Los *hooks* viven en [src/hooks/](src/hooks/) por dominio.

**Layout visual:** dashboard y análisis usan **streaming** ([src/components/dashboard/dashboard-sections-stream.tsx](src/components/dashboard/dashboard-sections-stream.tsx) + `<Suspense>` por sección) para mostrar el shell rápido y luego hidratar con datos de ADO. Patrón replicable.

**Modo demo:** si no hay conexión ADO viva, las páginas muestran un shell con datos de demo ([src/components/dashboard/dashboard-mock-sections.tsx](src/components/dashboard/dashboard-mock-sections.tsx)). El usuario puede "conectar" desde el sidebar.

---

## 8. Capa de persistencia (puertos y adaptadores)

Hay un esfuerzo consciente por mantener la capa fina:

```
src/lib/db/
├── client.ts                 # getDb() singleton (Drizzle + Neon HTTP+WS)
├── resolve-database-url.ts   # soporta DATABASE_URL / POSTGRES_URL (Vercel)
├── schema.ts                 # tablas
├── ports/                    # interfaces (contratos)
│   ├── ado-connection.repository.port.ts
│   ├── entra-user.repository.port.ts
│   ├── local-user.repository.port.ts
│   ├── sprint-goal.repository.port.ts
│   ├── sprint-story-goal.repository.port.ts
│   └── sprint-snapshot.repository.port.ts
├── adapters/drizzle/         # implementaciones Drizzle
└── container.ts              # composición (inyecta adapters en los servicios)
```

Esto deja la puerta abierta a testear con un adapter en memoria y a cambiar el ORM sin tocar `lib/auth/*` ni `lib/services/*`.

---

## 9. Servicios

Hay una carpeta [src/services/](src/services/) con subdominios (ado, auth, sprints, tags). Es donde vive la **orquestación** que cruza ADO + BD + sesión. La idea es que las rutas API sean finas (validan, llaman al servicio, devuelven) y la lógica testeable esté en servicios.

> Hoy los servicios son pocos — la mayor parte de la lógica está repartida entre `lib/azure-devops/*` (lado ADO) y los repositorios (lado BD). Conviene ir moviendo orquestación a `src/services/*` cuando crezca.

---

## 10. Observabilidad y errores

- [/api/health](src/app/api/health/route.ts) → chequea variables de entorno, configuración de cifrado, BD y ADO. Devuelve 503 si falta algo crítico. Diagnóstico sin secretos.
- Errores centralizados en [src/lib/errors/](src/lib/errors/): `user-messages.ts` (catálogo de mensajes user-facing en español), `map-error-to-user-message.ts`, `log-api-error.ts`. Patrón `apiErrorResponse()` para no repetir status codes.
- Catálogo de UI: [src/components/copilot/copilot-error-alert.tsx](src/components/copilot/copilot-error-alert.tsx) muestra errores con el copy de `user-messages`.

---

## 11. SEO, legal, branding

- [src/lib/seo/metadata.ts](src/lib/seo/metadata.ts) construye metadata por página; [src/lib/seo/json-ld.ts](src/lib/seo/json-seo/json-ld.ts) genera `SoftwareApplication` JSON-LD en el root layout.
- `sitemap.ts`, `robots.ts`, `manifest.ts` en [src/app/](src/app/).
- Fuentes: Satoshi (local variable) + JetBrains Mono (Google). CSS en [src/app/globals.css](src/app/globals.css).
- Branding de Microsoft Entra documentado en [docs/azure-entra-branding.md](docs/azure-entra-branding.md).

---

## 12. El Copiloto actual (la pieza LLM que **ya** existe)

No empezar de cero. Ya hay un copiloto funcionando que vale la pena tener claro antes de meter más LLM:

- **Entrada:** texto libre del usuario.
- **Salida JSON validada con Zod** ([src/lib/schemas/agent.ts](src/lib/schemas/agent.ts)) contra `previewResultSchema`:
  - `log_work`: `{ workItemId, hours, comment }` listo para ejecutar.
  - `needs_clarification`: pregunta corta para el usuario.
  - `unsupported`: cuando la intención no aplica.
- **Dos rutas:**
  - `POST /api/preview` → solo interpreta y devuelve el preview.
  - `POST /api/execute` → recibe un preview válido, resuelve `AdoCallerAuth`, llama a `logWorkOnWorkItem()` y registra horas en ADO.
- **Doble motor con fallback:**
  1. **OpenAI** (HTTP directo a `chat/completions`, `response_format: json_object`, `temperature: 0.1`, modelo `gpt-4o-mini` configurable). Lee `OPENAI_API_KEY` / `OPENAI_MODEL`.
  2. **Heurística regex** ([parseHeuristic](src/lib/agent/interpret.ts#L17)) como fallback si no hay clave o si OpenAI falla.
- **Historial** ([src/components/copilot/copilot-history-view.tsx](src/components/copilot/copilot-history-view.tsx), hook en [src/hooks/use-copilot-history.ts](src/hooks/use-copilot-history.ts)) guarda interpretaciones y ejecuciones por usuario.

**Por qué este diseño importa para lo que viene:** ya hay un patrón *preview → confirm → execute*, validación con Zod, fallback determinístico, y separación entre "interpretar" y "actuar". Cualquier feature LLM nueva debería reutilizar ese patrón.

---

## 13. Plan LLM — qué se va a conectar

Asunciones sobre lo que querés sumar (corregime si me equivoco):

### 13.1 Reporte de horas en lenguaje natural (caso ya cubierto)
El flujo `/copilot` ya hace esto: el usuario escribe, la IA devuelve `log_work`, el usuario confirma, se ejecuta en ADO. **No requiere LLM nuevo** — se puede seguir mejorando el system prompt y/o afinar heurísticas, pero la tubería existe.

### 13.2 Resumen semanal / reporte de horas en prosa
Tipo "esta semana le dediqué X horas al HU Y, con foco en QA". Lo natural acá es:

1. **Origen de datos:** `sprint_story_snapshots` + `sprint_story_goals` (histórico congelado) + un query de WIQL a ADO para horas de la semana en curso (`WorkItems/CompletedWork`).
2. **Pasada LLM:** enviar al LLM un JSON compacto con: `{ sprint, storyPoints, horas, estados finales, observaciones }` y pedir un resumen ejecutivo en español.
3. **Salida:** HTML saneado con `dompurify` antes de renderear (la app ya lo usa para HTML de ADO).

### 13.3 Sugerencia de cierre de sprint / próximos pasos
Cruzar `sprint_story_goals` con `sprint_story_snapshots` (qué se logró, qué quedó parcial, qué no se tocó) y pedir al LLM una propuesta de carry-over y comentario de retrospectiva editable. El humano sigue siendo quien cierra el sprint en [src/app/(shell)/analysis/sprints/page.tsx](src/app/(shell)/analysis/sprints/page.tsx).

### 13.4 Clasificación / tagging de comentarios de horas
Hoy el comentario de horas es texto libre del usuario. Se puede usar un LLM barato para extraer tags (`revisión`, `QA`, `bugfix`, `refactor`) y guardarlos para análisis posterior. **Ojo:** esto multiplica llamadas — ver §13.6.

### 13.5 Búsqueda semántica en historial
Hoy [src/hooks/use-history-filter.ts](src/hooks/use-history-filter.ts) es filtros por texto/fecha. Una capa LLM podría: resumir clusters, responder "¿en qué HU trabajé más la semana pasada?", etc.

### 13.6 Decisiones de diseño (importantes)

| Decisión | Recomendación | Por qué |
|---|---|---|
| ¿SDK de Anthropic / OpenAI o HTTP directo? | **HTTP directo** (como ya hace `interpret.ts`) | Menos deps, control total del prompt y formato, sin streaming innecesario. Sumar SDK solo si necesitás *tools* o visión. |
| ¿Qué modelo? | Mantener `gpt-4o-mini` por defecto para flujos baratos; subir a `gpt-4.1` solo para resúmenes narrativos donde la calidad pesa. | Costo/latencia. |
| ¿Dónde corre? | Server-side en rutas API Next.js. **Nunca exponer la API key al cliente.** | La key está en `OPENAI_API_KEY` server-only. |
| ¿Streaming? | **No** por ahora. Resúmenes y reportes no exigen SSE; mantener respuesta JSON simple. | Streaming suma complejidad al RSC y al manejo de errores. |
| ¿Persistir prompts/respuestas? | Sí, en una tabla nueva `llm_interactions` (id, userId, feature, prompt_hash, response_json, model, latency_ms, created_at). | Para auditoría, costos, debugging y futuro fine-tuning. |
| ¿Rate limit / costo? | Sí — un guard por usuario (ej. N requests/minuto). | Evitar que un script pegado al `/api/copilot` haga un hoyo financiero. |
| ¿Privacidad? | Tope de PII: nunca mandar tokens, PATs, refresh tokens, ni el contenido de work items que el usuario no debería ver. Sanitizar antes de mandar al LLM. | |
| ¿Fallback heurístico? | **Siempre** tener fallback determinístico, como ya hace el copiloto. | Si OpenAI cae, la app no se rompe. |
| ¿Evaluar? | Set fijo de prompts de prueba (golden dataset) ejecutable en CI. | Las salidas de LLM se degradan silenciosamente; sin eval no te das cuenta. |

### 13.7 Estructura propuesta para sumar features LLM

Hoy hay **un** módulo (`src/lib/agent/interpret.ts`) acoplado al caso `log_work`. Cuando sumemos los casos 13.2–13.5 conviene refactorizar a:

```
src/lib/agent/
├── interpret.ts                 # fachada pública (compat)
├── providers/
│   ├── openai.ts                # HTTP directo + retry
│   └── heuristic.ts             # fallbacks deterministas
├── features/
│   ├── log-work/
│   │   ├── prompt.ts            # system + few-shot
│   │   ├── schema.ts            # zod
│   │   └── runner.ts            # parse → preview
│   ├── weekly-summary/
│   ├── sprint-recap/
│   └── comment-tagging/
├── interaction-log.ts           # persiste en tabla llm_interactions
└── guard.ts                     # rate-limit + sanitización
```

Esto deja cada feature con su prompt, su schema y su runner, todos detrás del mismo provider + log + guard.

---

## 14. Diagrama lógico después de sumar LLM

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Frontend (RSC + cliente)                                │
│  /copilot (NL → horas)  ·  /analysis/sprints (recap IA)                     │
│  /time-log (tagging IA) ·  /history (búsqueda semántica)                    │
└──────────────────────────────────────────────────────────────────────────────┘
            │                                  │
            ▼                                  ▼
┌──────────────────────────┐      ┌──────────────────────────────────────────┐
│   /api/preview,          │      │   /api/analysis/weekly-summary            │
│   /api/analysis/*        │      │   /api/analysis/sprint-recap              │
│   /api/time-log/suggest   │      │   /api/history/semantic                   │
└──────────────────────────┘      └──────────────────────────────────────────┘
            │                                  │
            ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        src/lib/agent/* (refactor §13.7)                       │
│   providers/openai + providers/heuristic                                     │
│   features/{log-work, weekly-summary, sprint-recap, comment-tagging}         │
│   guard (rate-limit, sanitización) · interaction-log → BD                     │
└──────────────────────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────────────────────┐
│   Azure DevOps (vía       │   │     Postgres (Neon) + Drizzle               │
│   src/lib/azure-devops/*) │   │   - users, ado_connections, sprints*        │
│   - WIQL                  │   │   - llm_interactions (NUEVA)                │
│   - work items patch      │   └──────────────────────────────────────────────┘
│   - completed work         │
└──────────────────────────┘
```

---

## 15. Riesgos / cosas a cerrar antes de meter más LLM

1. **Tests del copiloto actual.** No hay golden dataset versionado. Sin esto no podés decir si un cambio de prompt mejora o empeora.
2. **Costos visibles.** Hoy no hay tablero de uso por feature/usuario. Sumar la tabla `llm_interactions` + un endpoint `/api/health` que reporte gasto estimado.
3. **El módulo `interpret.ts` hoy es pequeño y *felizmente* acoplado.** Cualquier feature nueva lo va a engordar. Mejor refactor §13.7 antes que después.
4. **`src/services/` está poco usado.** Los features LLM son buena excusa para empujar orquestación ahí (preparar contexto desde BD + ADO, llamar al runner, devolver al route handler).
5. **Seguridad de prompts.** Si en algún momento el LLM devuelve HTML o markdown que se renderea, *obligatorio* pasar por `dompurify`. Ya hay helper en [src/lib/html/](src/lib/html/).
6. **Streaming vs RSC.** Si más adelante querés streaming, Next 16 soporta `streamUI` y RSC streams, pero suma complejidad. No empezar por ahí.

---

## 16. Decisiones registradas

- **Persistencia mínima en BD.** La verdad vive en ADO; BD guarda identidad + congelados. Romper este principio (ej. cachear work items crudos) acoplaría la app a la forma de la respuesta de ADO y haría que un cambio de proceso del cliente rompa features.
- **Doble cifrado de secretos.** Cookie cifrada (transporte) + AES-GCM en BD (reposo). El PAT y el refresh token NUNCA van al cliente.
- **No exponer API keys al cliente.** `OPENAI_API_KEY` y los secretos de Entra son server-only. Cualquier feature nueva debe respetarlo.
- **Discover > hardcode del proceso ADO.** El proceso del ADO del cliente puede ser Scrum, Agile, CMMI o uno custom. La app descubre campos custom y nombres de estado y los cachea en sesión. No hardcodear.
- **Streaming en dashboard.** El shell se renderea rápido; las secciones de ADO se hidratan con `<Suspense>`. Patrón a mantener en features nuevas que tarden (ej. recap de sprint con LLM).

---

## 17. Próximos pasos sugeridos

1. **Refactor §13.7** sin cambiar comportamiento (cero features nuevas). Tests golden antes/después.
2. Sumar **weekly-summary** como primera feature nueva, leyendo de `sprint_story_snapshots` + WIQL de horas. Es la que más valor da con menos riesgo.
3. Tabla `llm_interactions` y `/api/health` con métricas de costo.
4. Recién después: comment-tagging y búsqueda semántica.