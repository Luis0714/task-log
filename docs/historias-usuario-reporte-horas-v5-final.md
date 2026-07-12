# Épica: Reporte de horas trabajadas con asignaciones por excepción y novedades
## Documento de Historias de Usuario — v5 (corrección post-feedback del cliente)

**Objetivo de la épica:** Permitir a los roles de gestión generar un reporte por periodo que muestre, por persona, proyecto y equipo, las horas esperadas según la asignación vigente (o 100% por defecto si no existe configuración), las horas reportadas discriminadas en **desarrollo, bugs y novedades**, la cantidad y el detalle de las novedades (concatenado) y el % de cumplimiento, como insumo del proceso de pago.

**Alcance general:** Multi-proyecto y multi-equipo (una persona puede estar, p. ej., 40% en Proyecto A / Equipo Backend y 30% en Proyecto B / Equipo Backend y 30% en Proyecto C / Equipo QA). Un solo país: Colombia. Jornada de 8 horas por día hábil.

---

## Cambios respecto a v4 (resumen ejecutivo)

1. **Modelo de asignaciones cambia a "por excepción".** La base de datos **no** almacena el 100% por defecto; el sistema lo infiere del equipo al que pertenece cada usuario. Solo se persisten excepciones (cuando un usuario cambia de distribución, de equipo o de porcentaje).
2. **Tabla de asignaciones editable en línea.** No hay formulario de creación: el listado es una grilla cuyas celdas se editan directamente (Proyecto, Equipo, %, Fechas). Editar equivale a cerrar la vigencia anterior y crear la nueva.
3. **Aparece el concepto de "Equipo"** como dimensión de la asignación (no solo persona–proyecto), y también como columna del reporte.
4. **HUs de novedades se configuran por (Proyecto, Equipo)**, no solo por Proyecto.
5. **El reporte incluye la columna "Bugs"** separada de "Desarrollo" y la columna "Equipo", "Días hábiles", "Cantidad de novedades" y un "Detalle de novedades" concatenado en una sola celda.
6. **Modelo de cumplimiento** se amplía: `(desarrollo + bugs + novedades) / esperadas × 100`.
7. **Se elimina la "vista consolidada por persona"** del reporte (no fue solicitada por el cliente en esta iteración).

---

## Decisiones de negocio de la épica

| # | Decisión |
|---|---|
| D1 | Administran y consultan: Scrum Master, Product Manager, Product Owner y Súper Administrador de la plataforma |
| D2 | Jornada laboral: 8 horas por día hábil, igual para todos |
| D3 | Días hábiles según calendario de festivos de Colombia |
| D4 | Sobreasignación no permitida: la suma de asignaciones **vigentes** de una persona en fechas que se cruzan no puede superar 100%; el sistema bloquea el guardado |
| D5 | Asignaciones retroactivas no permitidas en esta fase (fecha inicio ≥ hoy) |
| D6 | **Edición equivale a cambio de asignación:** al editar una excepción vigente, se cierra la vigencia anterior (fecha fin = día anterior al nuevo inicio) y se crea un nuevo registro. Nunca se modifica el histórico |
| D7 | Modelo de cumplimiento: % cumplimiento = (horas desarrollo + horas bugs + horas novedades) ÷ horas esperadas × 100 |
| D8 | Datos consultados en tiempo real a la API de Azure DevOps al generar el reporte |
| D9 | Semáforo: verde ≥ 95%, amarillo 80–94%, rojo < 80% (umbrales parametrizables a futuro) |
| D10 | Exportación: solo Excel (.xlsx) |
| D11 | Fechas interpretadas como las almacena Azure DevOps |
| D12 | Sin histórico de reportes, sin auditoría y sin cierre de mes en esta fase |
| **D17** | **Asignación por defecto 100%:** todo usuario pertenece a un equipo; ese equipo tiene un proyecto principal. El sistema asume 100% de asignación del usuario en su (equipo, proyecto principal). Este 100% **no se almacena** en la base de datos |
| **D18** | **Persistencia por excepción:** la BD solo guarda las **excepciones** a la regla por defecto. Si un usuario no tiene excepciones activas, su reporte usa el 100% inferido |
| **D19** | **Configuración de HUs de novedades por (Proyecto, Equipo):** el alcance del identificador de historia de novedad es la combinación proyecto + equipo. La misma historia puede existir en varios (Proyecto, Equipo) si los contextos difieren, pero no duplicada dentro del mismo (Proyecto, Equipo) |
| **D20** | **Horas de novidades = horas reportadas** sobre tasks que pertenecen a las historias configuradas como novedad. No se calcula por intersección de fechas: se suma el *Completed Work* de las tasks dentro del periodo |
| **D21** | **Detalle de novedades concatenado en una sola celda** del reporte; la cantidad de novedades se muestra en una columna aparte |
| **D22** | **Bugs como columna propia:** las horas de work items de tipo *Bug* se reportan en una columna separada de *Desarrollo* y de *Novedades* |

**Fuera de alcance de la épica (fase 2):** advertencia de sobreasignación, asignaciones retroactivas, jornadas distintas de 8h, multi-país, histórico/congelamiento de reportes, propagación automática de novedades entre proyectos, exportación CSV/PDF, vista del reporte para el colaborador, edición de la asignación por defecto (viene de Azure DevOps).

---
---

# HU-01 — Gestión de asignaciones por excepción

## Historia de Usuario

**Como** usuario con rol de gestión (Scrum Master, Product Manager, Product Owner o Súper Administrador)

**Quiero** ver y editar directamente sobre una tabla la asignación de cada persona en cada (proyecto, equipo), partiendo del 100% por defecto

**Para** que la plataforma pueda calcular las horas que cada persona debe reportar en cualquier periodo, sin tener que registrar manualmente el caso base de "100% en su equipo".

## Objetivo de negocio

Contar con la fuente oficial y mínima de asignaciones: la plataforma asume 100% por defecto para todo usuario y solo guarda las **excepciones** (cambios de %, de proyecto, de equipo o de dedicación). Estas excepciones alimentan el cálculo de horas esperadas del reporte y pueden editarse en cualquier momento, garantizando que los cambios no alteren los cálculos de periodos pasados.

## Alcance

Esta historia incluye:

- Visualización del módulo de asignaciones y su listado unificado (excepciones + asignaciones por defecto inferidas).
- Filtros del listado (persona, proyecto, equipo, estado de la vigencia).
- Tabla editable **en línea** con celdas tipo Select / Input / DatePicker (sin formulario de creación separado).
- Creación de la primera excepción al editar una fila "por defecto".
- Cierre automático de vigencia al editar una excepción vigente.
- Cierre manual de una vigencia (fecha fin explícita).
- Validaciones al guardar: rango del %, fechas, sin retroactividad, sin sobreasignación, sin solapamiento, suma válida.
- Mensajes de éxito y error.
- Actualización automática de la tabla.
- Control de acceso por rol.

No incluye:

- Asignaciones retroactivas.
- Sobreasignación (>100%) ni advertencias de sobreasignación.
- Edición o eliminación del histórico de vigencias cerradas (el sistema las cierra pero no permite reabrirlas).
- Auditoría de cambios.
- Jornadas distintas a 8 horas.
- Sincronización automática de salidas de personal desde Azure.
- Configuración del equipo/proyecto principal del usuario (viene de Azure DevOps).

## Reglas de negocio

### Modelo por defecto

1. **Asignación por defecto (D17).** Cada usuario pertenece a un equipo, y cada equipo tiene un proyecto principal. Por defecto, el sistema asume que el usuario tiene **100%** de asignación en su (equipo, proyecto principal).
2. **Solo se persisten excepciones (D18).** La base de datos **no** guarda el 100% por defecto. Solo se persisten las excepciones que el administrador registre (cambios de %, de proyecto, de equipo o de dedicación).
3. **Inferencia en el reporte.** Si un usuario no tiene ninguna excepción vigente en un (proyecto, equipo), el reporte lo trata como 100% en su (equipo, proyecto principal).

### Excepciones

4. Una excepción pertenece a una combinación **(usuario, proyecto, equipo)**.
5. Un usuario puede tener varias excepciones vigentes simultáneas, máximo una por (proyecto, equipo).
6. **Tope 100% (D4).** La suma de los porcentajes de las excepciones **vigentes** de un usuario (cuyas vigencias se crucen en el tiempo) no puede superar 100%. El sistema bloquea el guardado cuando se intenta.
7. **Medio tiempo permitido.** La suma puede ser menor a 100% (ej. 50% = media jornada). El reporte interpreta la capacidad esperada como esa suma × días hábiles × 8.
8. **Solapamiento.** No pueden existir dos excepciones del mismo usuario en el mismo (proyecto, equipo) cuyas vigencias se solapen.
9. **Rango del %.** Entero entre 1 y 100. Sin decimales. Valor por defecto al crear: 100.
10. **Fecha inicio.** Obligatoria, ≥ fecha actual (D5). Por defecto: fecha actual.
11. **Fecha fin.** Opcional. Si se diligencia, debe ser ≥ fecha inicio. Vacía = vigencia abierta.
12. **Cierre automático.** Al editar una excepción vigente con una nueva fecha de inicio, la vigencia anterior recibe como fecha fin el día anterior al nuevo inicio. El sistema nunca modifica fechas de vigencias ya cerradas.
13. **Cierre manual.** El administrador puede fijar una fecha fin explícita para "cerrar" la vigencia (caso típico: el proyecto termina, la persona sale de la empresa).

### Tabla editable en línea

14. **Sin formulario de creación.** La pantalla principal es una **tabla editable**. Toda interacción es inline.
15. Columnas visibles: **Usuario** (solo lectura), **Proyecto** (Select), **Equipo** (Select dependiente del Proyecto), **% Asignación** (Input numérico entero), **Fecha inicio** (DatePicker), **Fecha fin** (DatePicker, opcional), **Estado** (vigente / histórica / por defecto).
16. **Proyecto:** Select con los proyectos disponibles en la plataforma (cacheables durante la sesión).
17. **Equipo:** Select dependiente del Proyecto seleccionado; lista los equipos del proyecto.
18. **% Asignación:** Input numérico. Entero. Acepta vacío con validación al guardar.
19. **Fechas:** DatePickers. La fecha inicio no puede ser anterior a hoy (D5); si se diligencia fecha fin debe ser ≥ fecha inicio.
20. **Filas "por defecto":** cuando un usuario no tiene excepciones, su fila aparece con un distintivo (p. ej. badge o color) que indica "por defecto" y con % = 100 en el (equipo, proyecto principal). Esta fila es editable: al editar %, Proyecto o Equipo se crea automáticamente la primera excepción del usuario, con fecha inicio = hoy.
21. **Confirmación al editar.** Toda edición debe pedir confirmación antes de persistir (para evitar cambios accidentales en celdas).
22. **Persistencia transaccional.** El "cerrar vigencia anterior + crear nueva" se ejecuta en una sola transacción: o ambas operaciones se completan o ninguna.

### Reglas transversales

23. El rol de la persona es obligatorio y se toma del catálogo de roles de la plataforma.
24. Las personas seleccionables en cualquier flujo de creación de excepción son los miembros de Azure DevOps del proyecto correspondiente.
25. Todos los roles de gestión (D1) pueden acceder al módulo y a sus operaciones. Los demás roles no.
26. Las horas esperadas de un periodo se calculan, para cada combinación (usuario, proyecto, equipo), como: **días hábiles del periodo (calendario Colombia) × 8 × % de asignación vigente**, sumando por tramos si hubo cambios dentro del periodo. Si no hay excepción, se usa el 100% por defecto de forma también proratada. (Cálculo consumido por HU-03.)

## Casos de ejemplo (cliente)

| Caso | Situación | Acción del administrador | Resultado en BD | Resultado en UI/reporte |
|---|---|---|---|---|
| **1** | Juan pertenece al Equipo Backend (Proyecto A). Nunca se le ha configurado nada. | Ninguna. | Sin registros para Juan. | Fila "por defecto": Usuario Juan, Proyecto Proyecto A, Equipo Backend, 100%. Capacidad esperada = 100% del periodo. |
| **2** | Juan viene con 100% en A; mañana lider decide 50/50 entre A y B. | El admin registra una excepción: A 50% desde 15-jul y otra: B 50% desde 15-jul. | 2 excepciones, ambas vigentes desde 15-jul. | Hasta 14-jul: A 100% (por defecto). Desde 15-jul: A 50% + B 50% = 100%. |
| **3** | Juan después pasa a A 40%, B 30%, C 30%. | El admin edita las excepciones existentes o crea una nueva para C. | 3 excepciones vigentes cuya suma = 100. | Suma de las tres = 100%, válido. Si intenta A 50% + B 40% + C 30% = 120%, el sistema bloquea. |
| **4** | Juan trabaja medio tiempo. | El admin registra 50% en su (proyecto, equipo) desde 1-ago. | 1 excepción al 50%. | Capacidad esperada = 50% × días × 8. |
| **5** | Un mes después, Juan ya no está al 50%; ahora al 60%. | El admin **edita** la misma fila (mismo ID lógico), cambiando % de 50 a 60 desde una nueva fecha de inicio. | La excepción anterior se cierra (fecha fin = día anterior al nuevo inicio). Se crea una nueva con 60%. | Histórico: 50% hasta X. Vigente: 60% desde X+1. |

## Flujo principal

1. El usuario con rol de gestión ingresa a la plataforma.
2. Ingresa al módulo **Asignaciones**.
3. Visualiza la tabla con tres tipos de filas:
   - **Excepciones vigentes** (estado = vigente).
   - **Excepciones históricas** (estado = histórica, con vigencia cerrada).
   - **Asignaciones por defecto** (estado = por defecto, badge distintivo, para usuarios sin excepciones en su equipo/proyecto principal).
4. Aplica filtros opcionales por persona, proyecto, equipo o estado.
5. Hace clic en una celda editable de cualquier fila (Proyecto, Equipo, %, Fecha inicio, Fecha fin).
6. El sistema abre el editor inline (Select / Input / DatePicker) sobre esa celda.
7. El usuario modifica el valor y confirma.
8. El sistema valida en tiempo real (al perder foco o al confirmar):
   - % entre 1 y 100.
   - Fecha inicio ≥ hoy.
   - Fecha fin ≥ fecha inicio (si diligenciada).
   - Suma de % vigentes del usuario ≤ 100.
   - Sin solapamiento con otra excepción vigente del mismo usuario en el mismo (proyecto, equipo).
9. Si la fila era una excepción vigente: el sistema asigna a la vigencia actual fecha fin = (nueva fecha inicio − 1 día) y crea una nueva excepción con los nuevos valores.
10. Si la fila era "por defecto": el sistema crea la primera excepción del usuario con los nuevos valores y fecha inicio = hoy.
11. El sistema muestra un mensaje de éxito y actualiza la tabla (la fila anterior queda como histórica, la nueva como vigente).

## Flujos alternos

**FA-01 — Edición con valores inválidos.** El usuario introduce un valor que no pasa las validaciones. Resultado: el editor muestra el mensaje específico, la celda regresa a su valor anterior y no se persiste nada.

**FA-02 — Cierre manual de vigencia.** El usuario hace clic sobre la fecha fin de una excepción vigente y diligencia una fecha fin ≥ hoy (o una fecha posterior al inicio). Resultado: la vigencia queda como histórica a partir de esa fecha, sin crear una nueva excepción, y la fila desaparece del filtro "vigente".

**FA-03 — Cancelar edición.** El usuario descarta el cambio en el editor inline (Esc o botón Cancelar). Resultado: la celda regresa al valor anterior, sin guardar.

**FA-04 — Filtros.** El usuario aplica filtros por persona, proyecto, equipo o estado (vigente/histórica/por defecto). Resultado: la tabla muestra solo las filas que cumplen los filtros.

**FA-05 — Selección de equipo.** Al cambiar el Proyecto en una celda, el Equipo se reinicia y se muestra un Select con los equipos del nuevo Proyecto (si no hay equipos para ese proyecto, el Equipo queda deshabilitado hasta seleccionar un Proyecto válido).

## Flujos de excepción

**FE-01 — Suma > 100%.** La nueva excepción provoca que la suma de % vigentes del usuario supere 100. Resultado: no se guarda, se muestra mensaje "Sobreasignación: la suma actual es X%. Distribución vigente: Proyecto A 50%, Proyecto B 30%."

**FE-02 — Solapamiento en el mismo (proyecto, equipo).** Ya existe una excepción vigente del mismo usuario en el mismo (proyecto, equipo) cuyas fechas se cruzan con la nueva. Resultado: no se guarda y se muestra mensaje de solapamiento.

**FE-03 — Fecha retroactiva.** La fecha inicio ingresada es anterior a hoy. Resultado: no se guarda, mensaje "No se permiten asignaciones retroactivas".

**FE-04 — Error del servidor.** Resultado: no se persiste ningún cambio (la transacción no se ejecuta), se informa el error y la celda regresa a su valor anterior.

**FE-05 — Sesión expirada.** Resultado: el usuario es redireccionado al inicio de sesión.

**FE-06 — Falla la consulta de proyectos/equipos.** Resultado: el Select correspondiente muestra el error y opción de reintentar; no se puede editar la celda hasta que carguen datos.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — El usuario con rol de gestión (D1) visualiza el módulo Asignaciones en el menú.

**CA-02** — Un usuario sin rol de gestión no visualiza el módulo ni puede acceder por URL directa.

**CA-03** — Al ingresar al módulo, se visualiza la tabla con las columnas: Usuario, Proyecto, Equipo, % Asignación, Fecha inicio, Fecha fin, Estado.

**CA-04** — La tabla muestra tres tipos de filas: **excepciones vigentes** (estado "vigente"), **excepciones históricas** (estado "histórica", vigencia cerrada) y **asignaciones por defecto** (estado "por defecto", con badge distintivo, para usuarios sin excepciones).

**CA-05** — Un usuario sin excepciones activas muestra **una sola fila** "por defecto" con (Proyecto = Proyecto principal del equipo, Equipo = su equipo, % = 100, Fecha inicio = sin valor, Fecha fin = sin valor).

**CA-06** — Se visualizan filtros por persona, proyecto, equipo y estado (vigente / histórica / por defecto).

**CA-07** — Al aplicar un filtro, la tabla muestra solo las filas que cumplen el criterio (sin recargar la página).

### Tabla editable en línea

**CA-08** — La tabla es **editable en línea**: las celdas de las columnas Proyecto, Equipo, %, Fecha inicio y Fecha fin pueden editarse directamente; la columna Usuario es de solo lectura.

**CA-09** — Al hacer clic en una celda editable, el sistema abre el editor apropiado: Select para Proyecto y Equipo, Input numérico para %, DatePicker para fechas.

**CA-10** — Al editar el Proyecto, el campo Equipo se actualiza a un Select con los equipos del nuevo Proyecto (dependencia).

**CA-11** — La columna % sólo acepta números enteros entre 1 y 100.

**CA-12** — La columna Fecha inicio no acepta valores anteriores a hoy.

**CA-13** — La columna Fecha fin, si se diligencia, no acepta valores anteriores a Fecha inicio.

**CA-14** — Toda edición debe mostrar una confirmación antes de persistir el cambio.

**CA-15** — Si el usuario cancela la confirmación, la celda regresa a su valor anterior sin guardar nada.

### Comportamiento al editar una excepción vigente

**CA-16** — Al confirmar la edición de una excepción vigente (X), con fecha inicio = F, el sistema asigna a X una fecha fin = F − 1 día, y crea un nuevo registro con los valores editados a partir de F.

**CA-17** — La edición se ejecuta en una sola transacción: o se completan el cierre y la creación, o no se persiste nada.

**CA-18** — Al editarse una excepción vigente, la tabla actualiza ambas filas: la anterior aparece como **histórica** y la nueva como **vigente**.

### Comportamiento al editar una asignación "por defecto"

**CA-19** — Al editar la fila "por defecto" de un usuario modificando % a un valor distinto de 100, el sistema crea una primera excepción para ese usuario con la fecha inicio = hoy y los valores editados.

**CA-20** — Al editar la fila "por defecto" modificando el Proyecto o el Equipo a otro distinto del (equipo, proyecto principal), el sistema crea una primera excepción con los nuevos valores y fecha inicio = hoy (interpretación: el usuario sale del equipo/proyecto principal para uno nuevo).

**CA-21** — Tras crear la primera excepción, la fila "por defecto" desaparece para ese usuario y es reemplazada por una fila de excepción vigente. (Si la suma vigente es 100%, no se mostrará más fila por defecto.)

### Casos del cliente (cobertura explícita)

**CA-22 — Caso 1 (cliente).** Juan pertenece al Equipo Backend (Proyecto A) y nunca tuvo configuración. La tabla muestra una sola fila para Juan: Usuario Juan, Proyecto Proyecto A, Equipo Backend, 100%, Fecha inicio = vacía, Fecha fin = vacía, Estado = "por defecto" (con badge). La BD no contiene ningún registro para Juan.

**CA-23 — Caso 2 (cliente).** Tras registrar excepción A 50% desde 15-jul y B 50% desde 15-jul, el reporte del periodo del 1 al 31 de julio calcula para Juan: hasta el 14-jul → A 100%; desde el 15-jul → A 50% + B 50%.

**CA-24 — Caso 3 (cliente).** Si el admin intenta guardar A 50% + B 40% + C 30% (suma = 120%), el sistema bloquea y muestra mensaje de sobreasignación. Si guarda A 40% + B 30% + C 30% (= 100), el sistema acepta.

**CA-25 — Caso 4 (cliente).** Si el admin guarda una sola excepción al 50%, el sistema entiende que la capacidad esperada de Juan será el 50% × días hábiles × 8, sin mostrar mensaje de error.

**CA-26 — Caso 5 (cliente).** Tras un mes, el admin cambia de 50% a 60% sobre la misma fila: la edición cierra la excepción previa (fecha fin = día anterior a la nueva fecha inicio) y crea una nueva al 60%; no se crea un registro adicional paralelo.

### Validaciones al guardar

**CA-27** — Si la suma de los % vigentes del usuario supera 100%, el sistema impide el guardado y muestra un mensaje con la distribución actual (proyecto, equipo, % de cada excepción vigente del usuario).

**CA-28** — Si ya existe una excepción del mismo usuario en el mismo (proyecto, equipo) cuyas fechas se cruzan con las nuevas, el sistema impide el guardado y muestra el mensaje de solapamiento.

**CA-29** — Si la fecha inicio es anterior a hoy, el sistema impide el guardado con mensaje de retroactividad (D5).

**CA-30** — Si la fecha fin es anterior a la fecha inicio, el sistema impide el guardado.

**CA-31** — Si % está fuera del rango 1–100 o no es entero, el sistema impide el guardado.

**CA-32** — Si todas las validaciones pasan, el sistema guarda, muestra un mensaje de éxito y actualiza la tabla.

### Cancelación y errores

**CA-33** — Al cancelar la edición, la celda regresa al valor anterior y no se guarda nada.

**CA-34** — Ante un error inesperado, no se crean registros parciales; la celda regresa al valor anterior y se informa al usuario.

**CA-35** — Si la sesión expira durante una edición, el usuario es redireccionado al inicio de sesión y los cambios no guardados se pierden (con aviso).

## Validaciones funcionales

- **Edición inline:** las celdas editables de las columnas Proyecto, Equipo, %, Fecha inicio y Fecha fin aceptan solo los valores permitidos; el resto de la columna no es editable.
- **%:** obligatorio, entero entre 1 y 100.
- **Fecha inicio:** obligatoria, ≥ fecha actual (D5).
- **Fecha fin:** opcional; si se diligencia, ≥ fecha inicio; si se deja vacía la vigencia queda abierta.
- **Regla de tope 100%:** suma de % de excepciones vigentes del usuario (con cruce de fechas) ≤ 100.
- **Regla de solapamiento:** una sola excepción por (usuario, proyecto, equipo) en cualquier fecha.
- **Inferencia 100%:** los usuarios sin excepciones activas no aparecen en la tabla de excepciones, pero sí aparecen como filas "por defecto" en la vista del administrador.
- **Transacción:** el "cerrar vigencia + crear nueva" se ejecuta atómicamente; o ambas operaciones se completan o ninguna.

## Validaciones técnicas

- Validaciones en frontend y backend; el backend valida el rol antes de cualquier operación y vuelve a calcular la suma con datos reales.
- La edición (cierre + creación) se ejecuta en una sola transacción.
- Los proyectos y equipos se consultan a la API de Azure DevOps; los resultados pueden cachearse durante la sesión del usuario.
- API con códigos HTTP adecuados: 200 OK (edición exitosa), 400 validación, 403 permisos, 409 conflicto por tope o solapamiento, 500 error interno.
- Latencia objetivo de la operación de edición: inferior a 2 segundos en condiciones normales.

## Dependencias

- Servicio de autenticación y roles/permisos de la plataforma.
- API de Azure DevOps: proyectos, equipos y miembros de equipo.
- Catálogo de roles de la plataforma.
- Calendario de festivos de Colombia (tabla administrable, precargada por año).
- Componente de tabla editable (edición inline con Select, Input numérico, DatePicker).

## Diseño

- Mockup en Figma de la tabla editable inline con sus tres tipos de filas (vigente, histórica, por defecto), filtros, edición inline, validaciones y mensajes.
- Diseño aprobado por UX.
- Componentes del sistema de diseño para tabla editable, Select dependiente, DatePicker y badges de estado.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración (incluyendo los cinco casos del cliente como pruebas explícitas); QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

---
---

# HU-02 — Configuración de historias de usuario de Novedades por (Proyecto, Equipo)

## Historia de Usuario

**Como** usuario con rol de gestión

**Quiero** vincular, para cada combinación (Proyecto, Equipo), una o varias historias de usuario del backlog como historias de "Novedades"

**Para** que el reporte de horas identifique las novedades por el identificador de las historias y por su contexto (Proyecto + Equipo), sin depender del nombre y sin mezclar contextos distintos.

## Objetivo de negocio

Dar a la plataforma una forma confiable y administrable de saber dónde viven las novedades en Azure DevOps, con un alcance estricto por (Proyecto, Equipo), soportando múltiples historias (por mes, por iteración, etc.) y resolviendo correctamente las colisiones: la misma historia puede ser novedad en (Proyecto A, Backend) y en (Proyecto B, Backend) sin ser la misma configuración.

## Alcance

Esta historia incluye:

- Sección de configuración de novedades dentro de la configuración de cada combinación (Proyecto, Equipo).
- Listado de HUs de novedades vinculadas a ese (Proyecto, Equipo).
- Buscador de historias de usuario del backlog del proyecto (por título o ID) en tiempo real contra Azure.
- Vinculación de una HU (guardando su work item ID).
- Validación de duplicados dentro del mismo (Proyecto, Equipo).
- Desvinculación de una HU con confirmación.
- Control de acceso por rol.

No incluye:

- Creación o edición de historias de usuario en Azure DevOps.
- Creación o edición de work items de novedad.
- Configuración de tipos de novedad (viven en Azure).
- Vinculación de work items que no sean historias de usuario.

## Reglas de negocio

1. Solo los roles de gestión (D1) pueden acceder a esta configuración.
2. **Alcance por (Proyecto, Equipo) (D19):** cada configuración es específica de una combinación (proyecto, equipo). La misma historia puede existir en múltiples combinaciones si los contextos son distintos.
3. Se pueden vincular **N** historias de usuario por (Proyecto, Equipo).
4. Solo se pueden vincular work items de tipo **Historia de Usuario** del backlog del proyecto elegido.
5. **Duplicado:** no se puede vincular dos veces la misma HU en el mismo (Proyecto, Equipo).
6. **Misma HU en distintos contextos:** la misma HU sí puede estar vinculada en otro (Proyecto, Equipo). Por ejemplo, HU 3421 puede existir como novedad en (Proyecto A, Backend) y también en (Proyecto B, Backend).
7. Lo que se persiste es el work item ID de la HU (no su título), para que renombrarla en Azure no rompa la configuración.
8. Desvincular una HU solo elimina la relación en la plataforma; no modifica nada en Azure.
9. Si una HU vinculada es eliminada en Azure, el reporte la ignora mostrando una alerta informativa, sin fallar.
10. Si una combinación (Proyecto, Equipo) no tiene HUs vinculadas, el reporte para esa combinación muestra 0 horas de novedades con la alerta "Novedades sin configurar".

## Casos de ejemplo (cliente)

| Caso | Situación | Acción | Resultado |
|---|---|---|---|
| **6** | El cliente quiere que las horas reportadas en las HUs 3421, 3508, 3600 sean "novedades" en el contexto (Proyecto A, Backend). | Vincular las tres HUs a la combinación (Proyecto A, Backend). | En el reporte del Proyecto A / Equipo Backend, las horas de tasks de esas tres HUs se clasifican como novedades. |
| **7** | La HU 3421 ya está en (Proyecto A, Backend) y el cliente también la quiere en (Proyecto B, Backend). | Vincular la misma HU 3421 a la combinación (Proyecto B, Backend). | El sistema lo permite porque son contextos distintos. |

**Inválido (no permitido):**

| Caso | Situación | Razón | Resultado esperado |
|---|---|---|---|
| **8** | Intentar vincular la HU 3421 dos veces a (Proyecto A, Backend). | Duplicado dentro del mismo (Proyecto, Equipo). | El sistema impide la vinculación y muestra mensaje de duplicado. |

## Flujo principal

1. El usuario con rol de gestión ingresa a la configuración del (Proyecto, Equipo).
2. Ingresa a la sección **Novedades**.
3. Visualiza el listado de HUs de novedades vinculadas: ID, título, estado en Azure, fecha de vinculación.
4. Hace clic en **Vincular historia de novedades**.
5. El sistema abre el buscador.
6. El usuario escribe parte del título o el ID de la historia.
7. El sistema consulta en tiempo real el backlog del proyecto en Azure y muestra las coincidencias (ID, título, estado).
8. El usuario selecciona la historia.
9. Presiona **Vincular**.
10. El sistema valida que no esté duplicada en ese (Proyecto, Equipo).
11. El sistema guarda el work item ID.
12. El sistema muestra un mensaje de éxito.
13. La historia aparece inmediatamente en el listado de vinculadas.

## Flujos alternos

**FA-01 — Cancelar vinculación.** El usuario presiona Cancelar o cierra el buscador. Resultado: no se vincula nada.

**FA-02 — Desvincular una HU.** El usuario hace clic en Desvincular sobre una HU del listado; el sistema pide confirmación; el usuario confirma. Resultado: la HU se elimina de la lista; los reportes de periodos futuros dejan de considerarla; no se modifica nada en Azure.

**FA-03 — Búsqueda sin resultados.** El texto buscado no coincide con ninguna HU del backlog del proyecto. Resultado: el sistema muestra "Sin resultados" y permite ajustar la búsqueda.

## Flujos de excepción

**FE-01 — HU duplicada en el mismo (Proyecto, Equipo).** Resultado: no se vincula y se muestra el mensaje de duplicado.

**FE-02 — Error de la API de Azure durante la búsqueda.** Resultado: el buscador muestra el error con opción de reintentar.

**FE-03 — Error del servidor al guardar.** Resultado: no se vincula la HU y se informa al usuario.

**FE-04 — Sesión expirada.** Resultado: el usuario es redireccionado al inicio de sesión.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — El usuario con rol de gestión visualiza la sección Novedades dentro de la configuración de cada (Proyecto, Equipo).

**CA-02** — Un usuario sin rol de gestión no visualiza la sección ni puede acceder por URL directa.

**CA-03** — Al ingresar a la sección, se visualiza el listado de HUs vinculadas con las columnas: ID, título, estado en Azure y fecha de vinculación.

**CA-04** — Si la combinación no tiene HUs vinculadas, el listado muestra un estado vacío indicando que el reporte no calculará novedades hasta configurar al menos una.

**CA-05** — Se visualiza el botón **Vincular historia de novedades**.

### Buscador

**CA-06** — Al hacer clic en Vincular historia de novedades, el sistema abre el buscador.

**CA-07** — Al escribir al menos 3 caracteres (o un ID numérico), el sistema consulta en tiempo real el backlog del proyecto en Azure y muestra las coincidencias con ID, título y estado.

**CA-08** — La búsqueda lista únicamente work items de tipo Historia de Usuario del proyecto configurado.

**CA-09** — Si la búsqueda no arroja coincidencias, el sistema muestra el mensaje "Sin resultados".

**CA-10** — Si la API de Azure falla durante la búsqueda, el sistema muestra el error con la opción de reintentar.

### Vinculación

**CA-11** — Al seleccionar una historia y presionar Vincular, el sistema guarda el work item ID de la historia ligado al (Proyecto, Equipo).

**CA-12** — Si la historia ya está vinculada al mismo (Proyecto, Equipo), el sistema impide la vinculación y muestra el mensaje de duplicado.

**CA-13** — Tras una vinculación exitosa, el sistema muestra mensaje de éxito, cierra el buscador y actualiza el listado.

**CA-14** — Si existen varias HUs vinculadas (p. ej. "Novedades Junio" y "Novedades Julio"), todas aparecen en el listado y todas son consideradas por el reporte (verificado en HU-03).

**CA-15 — Caso 6 (cliente).** En (Proyecto A, Backend) se pueden vincular las HUs 3421, 3508 y 3600; las tres quedan visibles en el listado.

**CA-16 — Caso 7 (cliente).** La HU 3421 puede vincularse simultáneamente en (Proyecto A, Backend) y en (Proyecto B, Backend) sin ser considerada duplicada.

**CA-17 — Caso 8 (cliente).** Intentar vincular la HU 3421 dos veces en (Proyecto A, Backend) genera mensaje de duplicado y bloqueo.

### Desvinculación

**CA-18** — Al hacer clic en Desvincular, el sistema solicita confirmación antes de proceder.

**CA-19** — Al confirmar, el sistema elimina el vínculo, muestra un mensaje de éxito y actualiza el listado.

**CA-20** — Al cancelar la confirmación, el vínculo permanece sin cambios.

**CA-21** — Al desvincular una HU, no se produce ningún cambio en Azure DevOps.

### Comportamiento ante inconsistencias

**CA-22** — Si una HU vinculada fue eliminada en Azure, al consultarla (en el listado o al generar el reporte), el sistema la marca/ignora con una alerta informativa sin que la funcionalidad falle.

**CA-23** — Si una HU vinculada fue renombrada en Azure, el sistema sigue reconociéndola por su ID y muestra el título actualizado.

## Validaciones funcionales

- **Búsqueda:** mínimo 3 caracteres para búsqueda por título; búsqueda directa por ID numérico.
- **Tipo de work item:** solo Historias de Usuario del backlog del proyecto.
- **Duplicados:** una HU solo puede estar vinculada una vez por (Proyecto, Equipo).
- **Misma HU en distintos contextos:** permitida sin restricción.
- **Confirmación obligatoria** para desvincular.

## Validaciones técnicas

- Validaciones en frontend y backend; el backend valida el rol y la unicidad dentro del (Proyecto, Equipo) antes de vincular/desvincular.
- La búsqueda usa la API de Azure DevOps (WIQL o endpoint de work items) filtrando por tipo Historia de Usuario y proyecto.
- La búsqueda debe tener debounce (mínimo 300 ms) para no saturar la API.
- Persistencia del vínculo: (proyecto, equipo, work item ID, fecha de vinculación, usuario que vinculó).
- Códigos HTTP adecuados: 201 vinculación, 400 validación, 403 permisos, 409 duplicado, 500 error interno.

## Dependencias

- Servicio de autenticación y roles de la plataforma.
- API de Azure DevOps: consulta de work items del backlog (WIQL).
- HU-01 no es prerrequisito técnico, pero ambas lo son de la HU-03.

## Diseño

- Mockup en Figma de la sección de configuración, buscador y confirmación de desvinculación.
- Diseño aprobado por UX.
- Componentes del sistema de diseño.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración (incluyendo los casos 6, 7 y 8 del cliente); QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

---
---

# HU-03 — Generación del reporte de horas por periodo

## Historia de Usuario

**Como** usuario con rol de gestión

**Quiero** generar en tiempo real un reporte de horas por mes o por rango de fechas, con una fila por **(usuario, proyecto, equipo)**

**Para** conocer qué se le está pagando a cada persona: horas esperadas según su asignación vigente (o 100% por defecto), horas trabajadas discriminadas en **desarrollo**, **bugs** y **novedades**, la cantidad de novedades con su **detalle concatenado** y el **% de cumplimiento**.

## Objetivo de negocio

Entregar el insumo oficial del proceso de pago: un reporte confiable, generado con datos en vivo de Azure DevOps, que compare lo esperado contra lo reportado por cada persona en cada (proyecto, equipo), discriminando desarrollo, bugs y novedades con su detalle, en una sola línea por combinación.

## Alcance

Esta historia incluye:

- Pantalla del reporte con selección de periodo por mes o por rango de fechas.
- Filtros por proyecto(s), equipo(s), persona(s) y rol.
- Generación en tiempo real contra la API de Azure DevOps.
- Cálculo de horas esperadas usando la asignación vigente o el 100% por defecto.
- Tabla de resultados con las 13 columnas definidas y semáforo de cumplimiento.
- Clasificación de horas en **Desarrollo**, **Bugs** y **Novedades** (D22).
- Detalle de novedades concatenado en una sola celda (D21).
- Cantidad de novedades en columna aparte.
- Exportación a Excel.
- Manejo de estados de carga y errores.

No incluye:

- Almacenamiento de reportes generados (histórico).
- Cierre o congelamiento de mes.
- Exportación a CSV o PDF.
- Vista del reporte para usuarios sin rol de gestión.
- Vista consolidada por persona multi-proyecto (no requerida por el cliente en esta fase).
- Edición de datos de Azure desde el reporte.

## Reglas de negocio

### Periodo y datos

1. Solo los roles de gestión (D1) pueden generar y visualizar el reporte.
2. **Periodo:** por mes (selector mes + año → del día 1 al último día del mes) o por rango de fechas (hasta ≥ desde).
3. **Datos en tiempo real (D8).** Al generar, la plataforma consulta la API de Azure DevOps en ese momento; el reporte muestra la fecha y hora de generación.
4. **Capacidad esperada** = **días hábiles del periodo (calendario Colombia) × 8 × % de asignación**, donde el % de asignación es el vigente en cada tramo del periodo. Si el usuario no tiene ninguna excepción activa en su (equipo, proyecto principal), se asume 100% por defecto.
5. El cálculo se hace **por tramos** cuando la asignación cambia dentro del periodo, y la suma coincide con la capacidad total del tramo.

### Clasificación de horas (D22)

6. **Horas desarrollo** = suma del *Completed Work* de las **tasks** de la persona en el proyecto cuyo trabajo cae dentro del periodo, **excluyendo** las tasks que pertenezcan a work items tipo *Bug* y las tasks que pertenezcan a HUs configuradas como novedad.
7. **Horas bugs** = suma del *Completed Work* de tasks (y del work item *Bug* si tiene trabajo directo) de los work items de tipo **Bug** asignados a la persona en el proyecto dentro del periodo.
8. **Horas novedades (D20)** = suma del *Completed Work* de las tasks que pertenecen a las HUs vinculadas como novedad para el (Proyecto, Equipo) dentro del periodo. No hay intersección de fechas a nivel de historia: se suma por tarea según su fecha de trabajo.
9. **Horas totales** = desarrollo + bugs + novedades.
10. **Cantidad de novedades** = número de HUs de novedad distintas en las que la persona tuvo trabajo dentro del periodo.
11. **Detalle de novedades** = concatenación en una sola celda de un texto por cada HU de novedad trabajada, con el formato: `<tipo> - <título>` (los "tipos" se leen dinámicamente del work item; si una HU no tiene tipo, se omite el prefijo).

### Cumplimiento y semáforo

12. **Modelo de cumplimiento (D7):** % cumplimiento = (horas desarrollo + horas bugs + horas novedades) ÷ horas esperadas × 100.
13. **Semáforo (D9):** verde ≥ 95%, amarillo 80–94%, rojo < 80%.
14. Persona con horas reportadas en el periodo pero sin asignación vigente ni asignación por defecto aplicable: aparece en el reporte con **"Sin configurar"**, sin horas esperadas y con alerta visual.

### Cobertura

15. Si una combinación (Proyecto, Equipo) no tiene HUs de novedades vinculadas, la columna **Horas novedades** y la **Cantidad de novedades** muestran 0 con la alerta "Novedades sin configurar".
16. Si una HU vinculada fue eliminada en Azure, se ignora con una alerta informativa y el reporte se genera con las demás.
17. **Novedades por proyecto (de la HU-01 v4):** cada registro de horas afecta únicamente al (Proyecto, Equipo) donde fue creado. Si un usuario multi-proyecto tiene novedades en varios, debe quedar registrado en cada uno (la propagación automática NO se hace en esta fase).

### Exportación

18. La exportación a Excel refleja exactamente las filas, columnas y filtros visibles, incluido el **Detalle de novedades** concatenado, la **Cantidad de novedades** y el estado del semáforo.

## Estructura del reporte

Una fila por combinación **(usuario, proyecto, equipo)**:

| # | Columna | Fuente / cálculo |
|---|---|---|
| 1 | Proyecto | Proyecto de Azure DevOps |
| 2 | Equipo | Equipo del proyecto dentro de Azure DevOps |
| 3 | Usuario | Usuario de Azure DevOps |
| 4 | % Asignación | Vigente en el periodo, con promedio ponderado si cambió. Si no hay excepción activa, "100% (por defecto)" |
| 5 | Días hábiles | Días hábiles del periodo intersección con la vigencia de la asignación |
| 6 | Horas esperadas | Días hábiles × 8 × % (Regla 4–5) |
| 7 | Horas desarrollo | Regla 6 |
| 8 | Horas bugs | Regla 7 |
| 9 | Horas novedades | Regla 8 |
| 10 | Horas totales | Columna 7 + columna 8 + columna 9 |
| 11 | Cantidad de novedades | Regla 10 |
| 12 | Detalle de novedades | Concatenación Regla 11 |
| 13 | % Cumplimiento | Regla 12, con semáforo de color |

## Caso de ejemplo (cliente)

**Periodo:** 1 al 31 de julio.

**Dato base:**
- 22 días hábiles en Colombia en julio.
- Jornada: 8 h/día.
- Juan tiene excepción vigente: 50% en Proyecto A.

**Cálculo (paso a paso, equivalente al ejemplo del cliente):**

| Paso | Cálculo | Resultado |
|---|---|---|
| 1 | Días hábiles del periodo | 22 |
| 2 | Horas base: 22 × 8 | 176 |
| 3 | Capacidad esperada: 176 × 50% | **88 h** |
| 4 | Horas desarrollo de Juan en A | 60 |
| 5 | Horas bugs de Juan en A | 20 |
| 6 | Horas novedades de Juan en A (tasks en HUs configuradas como novedad) | 8 |
| 7 | Horas totales: 60 + 20 + 8 | **88 h** |
| 8 | Cumplimiento: 88 / 88 × 100 | **100% (verde)** |

**Detalle de novedades (concatenado):** "VPN caída - No fue posible acceder al servidor. Permiso médico - Cita odontológica. Capacitación Scrum - Formación interna." (texto referencial ilustrativo).

**Cantidad de novedades:** 3.

## Flujo principal

1. El usuario con rol de gestión ingresa al módulo **Reporte de horas**.
2. Visualiza los controles de periodo (mes o rango) y los filtros (proyectos, equipos, personas, rol).
3. Selecciona el periodo (p. ej. "Julio 2026") y los proyectos/equipos a incluir.
4. Presiona **Generar reporte**.
5. El sistema muestra el indicador de carga y consulta en tiempo real a Azure DevOps.
6. El sistema resuelve para cada (usuario, proyecto, equipo) su % de asignación vigente en el periodo (o el 100% por defecto si no hay excepción).
7. El sistema clasifica las horas del periodo en desarrollo, bugs y novedades, según las reglas 6–8.
8. El sistema calcula horas totales y cumplimiento.
9. El sistema muestra la tabla con las 13 columnas, el semáforo y la fecha/hora de generación.
10. El usuario visualiza la columna **Detalle de novedades** con el texto concatenado de las novedades trabajadas.
11. El usuario presiona **Exportar a Excel**.
12. El sistema genera y descarga el archivo .xlsx con el contenido visible.

## Flujos alternos

**FA-01 — Reporte por rango de fechas.** El usuario elige el modo rango e ingresa desde/hasta. Resultado: el reporte se calcula con los días hábiles de ese rango exacto.

**FA-02 — Cambio de filtros tras generar.** El usuario modifica filtros o periodo. Resultado: la tabla actual queda marcada como desactualizada y se solicita regenerar; los cálculos no se reutilizan.

**FA-03 — Persona sin actividad.** Una persona con asignación (vigente o por defecto) no tiene tasks ni bugs ni novedades en el periodo. Resultado: aparece con horas esperadas > 0, reportado = 0 y cumplimiento 0% (rojo).

## Flujos de excepción

**FE-01 — Error de la API de Azure durante la generación.** Resultado: el sistema muestra un mensaje de error claro con opción de reintentar. Nunca se muestra un reporte parcial sin aviso.

**FE-02 — (Proyecto, Equipo) sin HUs de novedades configuradas.** Resultado: la columna **Horas novedades** muestra 0 con la alerta "Novedades sin configurar" en las filas correspondientes.

**FE-03 — HU de novedades vinculada pero eliminada en Azure.** Resultado: esa HU se ignora, se muestra una alerta informativa y el reporte se genera con las demás.

**FE-04 — Tarea sin fecha o sin persona asignada.** Resultado: la tarea se excluye del cálculo y se lista en una alerta de "Novedades con datos incompletos" / "Tareas con datos incompletos" con su ID, para corrección en Azure.

**FE-05 — Rango inválido.** Fecha hasta anterior a fecha desde. Resultado: no se genera el reporte y se muestra el mensaje de validación.

**FE-06 — Generación excede el tiempo máximo.** Resultado: el sistema informa que la consulta está tardando y mantiene el indicador de progreso o permite cancelar.

**FE-07 — Sesión expirada.** Resultado: el usuario es redireccionado al inicio de sesión.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — El usuario con rol de gestión visualiza el módulo Reporte de horas en el menú.

**CA-02** — Un usuario sin rol de gestión no visualiza el módulo ni puede acceder por URL directa.

**CA-03** — Al ingresar, se visualizan el selector de modo de periodo (Mes / Rango), los filtros de proyecto(s), equipo(s), persona(s), rol y el botón **Generar reporte**.

### Selección de periodo

**CA-04** — En modo Mes, se muestra un selector de mes y año.

**CA-05** — Al seleccionar un mes, el sistema toma como periodo del día 1 al último día de ese mes.

**CA-06** — En modo Rango, se muestran los campos fecha desde y fecha hasta.

**CA-07** — Si la fecha hasta es anterior a la fecha desde, el sistema impide la generación y muestra el mensaje correspondiente.

**CA-08** — Si no se selecciona periodo y se intenta generar, el sistema impide la generación y muestra el mensaje correspondiente.

### Generación en tiempo real

**CA-09** — Al presionar Generar reporte, el sistema consulta la API de Azure DevOps en ese momento y muestra un indicador de carga.

**CA-10** — Tras la generación, el sistema muestra la fecha y hora exacta de generación.

**CA-11** — Si la API de Azure falla durante la generación, el sistema muestra mensaje de error con opción de reintentar y no muestra resultados parciales sin aviso.

### Estructura de la tabla

**CA-12** — Al generarse, la tabla muestra una fila por combinación (usuario, proyecto, equipo) con las 13 columnas definidas: Proyecto, Equipo, Usuario, % Asignación, Días hábiles, Horas esperadas, Horas desarrollo, Horas bugs, Horas novedades, Horas totales, Cantidad de novedades, Detalle de novedades y % Cumplimiento.

**CA-13** — Al aplicar filtros de proyecto, equipo, persona o rol, la tabla muestra únicamente las filas que los cumplen.

### Cálculo de horas esperadas

**CA-14** — Para un periodo con 22 días hábiles en Colombia y un usuario con asignación vigente al 100%, sus horas esperadas son 176.

**CA-15** — Para el mismo periodo y un usuario con asignación vigente al 50%, sus horas esperadas son 88.

**CA-16** — Si la asignación cambió dentro del periodo (p. ej. 100% hasta el 14 y 50% desde el 15), las horas esperadas se calculan por tramos y la columna % Asignación muestra el promedio ponderado con detalle por tramos.

**CA-17** — Si un día del periodo es festivo en Colombia, no suma horas esperadas.

**CA-18 — Caso por defecto.** Si el usuario no tiene ninguna excepción activa en su (equipo, proyecto principal), la columna % Asignación muestra "100% (por defecto)" y las horas esperadas se calculan con 100%.

### Cálculo de horas discriminadas (D22)

**CA-19** — Las horas de tasks de work items que **no** son *Bug* y que **no** pertenecen a HUs de novedad se suman en **Horas desarrollo**.

**CA-20** — Las horas de tasks (y del work item si aplica) de tipo *Bug* se suman en **Horas bugs**, separadas de Desarrollo.

**CA-21** — Las horas de tasks cuyas historias padre están configuradas como novedad para el (Proyecto, Equipo) se suman en **Horas novedades**.

**CA-22** — **Horas totales** = Horas desarrollo + Horas bugs + Horas novedades.

### Detalle y cantidad de novedades (D21)

**CA-23** — Si la persona trabajó sobre tres HUs de novedad, **Cantidad de novedades = 3** y la celda **Detalle de novedades** muestra los tres textos concatenados.

**CA-24** — El formato del detalle concatenado es: `<tipo> - <título>` por cada novedad; las entradas se separan por un delimitador visible (p. ej. ". "). Si la HU no tiene tipo, se omite el prefijo y queda solo el título.

**CA-25** — Ejemplo: "VPN caída - No fue posible acceder al servidor. Permiso médico - Cita odontológica. Capacitación Scrum - Formación interna."

### Cumplimiento y semáforo

**CA-26** — Si las horas esperadas son 88 y la persona reportó 60 en desarrollo + 20 en bugs + 8 en novedades = 88, el % Cumplimiento es 100% con semáforo verde.

**CA-27** — % Cumplimiento ≥ 95 → semáforo verde; entre 80 y 94 → amarillo; < 80 → rojo.

**CA-28** — Si la persona tiene asignación (vigente o por defecto) y ningún trabajo reportado, debe aparecer con cumplimiento 0% y semáforo rojo.

### Casos especiales

**CA-29** — Si una persona reportó horas en el periodo pero no tiene asignación vigente ni asignación por defecto aplicable, debe aparecer con **"Sin configurar"** en % Asignación, sin horas esperadas y con alerta visual, sin bloquear el reporte.

**CA-30** — Si el (Proyecto, Equipo) no tiene HUs de novedades vinculadas, las filas correspondientes muestran 0 en **Horas novedades** y 0 en **Cantidad de novedades**, con la alerta "Novedades sin configurar" en **Detalle de novedades**.

**CA-31** — Si una HU de novedades vinculada fue eliminada en Azure, el reporte se genera ignorándola y muestra una alerta informativa.

### Exportación

**CA-32** — Tras generarse el reporte, se visualiza el botón **Exportar a Excel**.

**CA-33** — Al exportar, el archivo .xlsx contiene exactamente las filas, columnas y filtros visibles, incluida la columna **Detalle de novedades** concatenada, la **Cantidad de novedades** y el estado del semáforo (color o columna de estado), además de la fecha/hora de generación.

## Validaciones funcionales

- **Periodo:** obligatorio; en modo rango, hasta ≥ desde.
- **Proyectos/equipos:** al menos uno seleccionado (por defecto, todos los disponibles para el usuario).
- **Cálculos:** columna 10 = columna 7 + columna 8 + columna 9; columna 13 = columna 10 ÷ columna 6 × 100; la suma de tramos de esperadas coincide con el total.
- **Inferencia 100%:** si el usuario no tiene excepción activa en su (equipo, proyecto principal), las horas esperadas se calculan con 100%.
- **Novedades:** solo work items cuyo tipo padre es una Historia de Usuario vinculada como novedad para el (Proyecto, Equipo), y dentro del periodo (por fecha de la tarea).
- **Bugs:** solo work items de tipo *Bug*.
- **Detalle concatenado:** todas las novedades trabajadas aparecen en una sola celda, en el orden en que el sistema las resuelve (estable).

## Validaciones técnicas

- Validaciones en frontend y backend; el backend valida el rol antes de generar o exportar.
- Consultas a Azure DevOps vía WIQL/batch: tasks con *Completed Work* por proyecto y periodo, hijos de las HUs de novedades vinculadas y work items de tipo *Bug*, y definición del campo tipo de la HU. Las consultas por proyecto pueden ejecutarse en paralelo.
- Sin caché de datos del reporte (D8); cada generación consulta en vivo.
- Indicador de progreso durante la generación; si excede el umbral definido (propuesta: 30 segundos), informar al usuario y permitir cancelar.
- La exportación a Excel se genera en el backend con los mismos datos de la generación en pantalla (no se recalcula contra Azure para evitar diferencias entre pantalla y archivo).
- Códigos HTTP adecuados (200 generación, 400 validación, 403 permisos, 502/504 fallas de Azure con mensaje distinguible, 500 error interno).
- Registrar en log técnico la duración de cada generación para monitorear performance.

## Dependencias

- **HU-01** (asignaciones por excepción): fuente de los % y vigencias; o 100% por defecto si no hay excepción.
- **HU-02** (configuración de novedades por (Proyecto, Equipo)): fuente de las HUs donde buscar novedades.
- API de Azure DevOps: work items, WIQL, definición de campos.
- Calendario de festivos de Colombia (tabla administrable precargada por año).
- Servicio de autenticación y roles.
- Componente/librería de generación de archivos Excel.

## Diseño

- Mockup en Figma de: pantalla de filtros y periodo, tabla de resultados con semáforo, **Detalle de novedades** concatenado y alertas de novedades sin configurar y de HU eliminada.
- Diseño aprobado por UX.
- Componentes del sistema de diseño.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración (incluyendo el caso del cliente con horas 60 + 20 + 8 = 88 → 100% de cumplimiento, y los casos de prorrateo entre meses y de cambio de asignación a mitad de periodo); QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

---
---

## Orden de implementación

1. **HU-01** — Asignaciones por excepción (incluye casos 1–5 del cliente).
2. **HU-02** — Configuración de HUs de novedades por (Proyecto, Equipo) (incluye casos 6–7 y validación de duplicado en caso 8).
3. **HU-03** — Reporte de horas (incluye el caso 8 con cálculo 60 + 20 + 8 = 88 y cumplimiento 100%).

## Pendientes por confirmar antes de estimar

1. Regla de "equipo principal" y "proyecto principal" de cada usuario: ¿se toma tal cual de Azure DevOps (grupo / membership) o la plataforma lo administrará aparte?
2. Nombres exactos (reference names) de los campos del work item Historia de Usuario en Azure (tipo, etc.) que se usarán para componer el detalle de novedades.
3. Fuente y administración del calendario de festivos de Colombia (propuesta: tabla precargada por año, administrable por el Súper Administrador).
4. Umbral de tiempo máximo de generación antes de ofrecer cancelación (propuesta: 30 segundos).
5. Confirmar los umbrales del semáforo (propuesta: 95/80).
6. Definir el delimitador exacto del **Detalle de novedades concatenado** (propuesta: ". " entre entradas).
