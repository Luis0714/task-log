# Épica: Reporte de horas trabajadas con asignaciones y novedades
## Documento de Historias de Usuario — v4 (definición final)

**Objetivo de la épica:** Permitir a los roles de gestión generar un reporte por periodo que muestre, por persona y proyecto, las horas esperadas según su asignación, las horas reportadas en desarrollo, las horas en novedades con su detalle y tipo, y el % de cumplimiento, como insumo para el proceso de pago.

**Alcance general:** Multi-proyecto (una persona puede estar, p. ej., 50% en un proyecto y 50% en otro). Un solo país: Colombia. Jornada de 8 horas por día hábil.

---

## Decisiones de negocio de la épica

| # | Decisión |
|---|---|
| D1 | Administran y consultan: Scrum Master, Product Manager, Product Owner y Súper Administrador de la plataforma |
| D2 | Jornada laboral: 8 horas por día hábil, igual para todos |
| D3 | Días hábiles según calendario de festivos de Colombia |
| D4 | Sobreasignación no permitida: la suma de asignaciones vigentes de una persona no supera 100%; el sistema bloquea el guardado |
| D5 | Asignaciones retroactivas no permitidas en esta fase |
| D6 | Cuando alguien sale de un proyecto o de la empresa se cierra la vigencia de su asignación |
| D7 | Modelo de cumplimiento: las novedades **suman** al cumplimiento. Esperadas 80h, desarrollo 70h + novedades 10h = 100% cumplido; el reporte discrimina el detalle |
| D8 | La novedad es un work item especial en Azure (no una task) con: título, asignado a, tipo de novedad (lista), tipo de novedad escrito (texto), fecha de inicio, fecha de fin y fecha de reintegro |
| D9 | Se pueden vincular **varias** HUs de novedades por proyecto; el reporte busca en todas |
| D10 | Las horas de una novedad se derivan del rango de fechas: días hábiles de la intersección con el periodo × 8 × % de asignación |
| D11 | **Novedades por proyecto:** una persona con asignación en varios proyectos registra la novedad en la HU de novedades de **cada** proyecto; cada registro suma según el % de ese proyecto, y la suma de todos equivale a su jornada completa. La vista consolidada alerta posibles novedades sin registrar en otros proyectos |
| D12 | Exportación: solo Excel (.xlsx) |
| D13 | Datos consultados en tiempo real a la API de Azure DevOps al generar el reporte |
| D14 | Semáforo de cumplimiento: verde ≥ 95%, amarillo 80–94%, rojo < 80% (umbrales parametrizables a futuro) |
| D15 | Fechas interpretadas como las almacena Azure DevOps |
| D16 | Sin histórico de reportes, sin auditoría y sin cierre de mes en esta fase |

**Fuera de alcance de la épica (fase 2):** sobreasignación con advertencia, asignaciones retroactivas, jornadas distintas de 8h, multi-país, histórico/congelamiento de reportes, propagación automática de novedades entre proyectos, exportación CSV/PDF, vista del reporte para el colaborador.

---
---

# HU-01 — Gestión de asignaciones por persona y proyecto

## Historia de Usuario

**Como** usuario con rol de gestión (Scrum Master, Product Manager, Product Owner o Súper Administrador)

**Quiero** configurar el porcentaje de asignación de cada persona en cada proyecto, con vigencia por fechas

**Para** que la plataforma pueda calcular las horas que cada persona debe reportar en cualquier periodo.

## Objetivo de negocio

Contar con la fuente oficial de asignaciones (persona, proyecto, %, vigencia) que alimenta el cálculo de horas esperadas del reporte de horas, garantizando que los cambios de asignación no alteren los cálculos de periodos pasados.

## Alcance

Esta historia incluye:

- Visualización del módulo de asignaciones y su listado.
- Filtros del listado (persona, proyecto, estado de vigencia).
- Creación de una asignación (formulario, validaciones, valores por defecto).
- Cambio de asignación (cierre automático de la vigencia anterior y creación de la nueva).
- Cierre manual de una vigencia (salida de proyecto/empresa).
- Mensajes de éxito y error.
- Actualización automática del listado.
- Control de acceso por rol.

No incluye:

- Asignaciones retroactivas.
- Sobreasignación (>100%) ni advertencias de sobreasignación.
- Edición o eliminación del histórico de vigencias.
- Auditoría de cambios.
- Jornadas distintas a 8 horas.
- Sincronización automática de salidas de personal desde Azure.

## Reglas de negocio

1. Solo los roles de gestión (D1) pueden acceder al módulo y crear/modificar asignaciones.
2. Una asignación pertenece siempre a una combinación persona–proyecto.
3. Una persona puede tener varias asignaciones vigentes simultáneas, máximo una por proyecto.
4. La suma de los porcentajes de las asignaciones de una persona cuyas vigencias se crucen en el tiempo no puede superar 100%. Si se supera, el sistema bloquea el guardado (D4).
5. No pueden existir dos vigencias de la misma persona en el mismo proyecto que se solapen en fechas.
6. El % de asignación es un entero entre 1 y 100. Valor por defecto: 100.
7. La fecha de inicio de vigencia no puede ser anterior a la fecha actual (D5). Valor por defecto: fecha actual.
8. La fecha fin de vigencia es opcional; vacía significa vigencia abierta. Si se diligencia, debe ser mayor o igual a la fecha de inicio.
9. El cambio de porcentaje de una asignación vigente no edita el registro: cierra la vigencia actual (fecha fin = día anterior al inicio de la nueva) y crea un registro nuevo. El histórico nunca se modifica.
10. El rol de la persona es obligatorio y se toma del catálogo de roles de la plataforma; por defecto se precarga el último rol conocido de la persona.
11. Las personas seleccionables son los usuarios de Azure DevOps miembros del proyecto elegido.
12. Las horas esperadas de un periodo se calculan como: días hábiles del periodo (calendario Colombia) × 8 × % de asignación, sumando por tramos si la vigencia cambió dentro del periodo. (Este cálculo lo consume la HU-03.)

## Flujo principal

1. El usuario con rol de gestión ingresa a la plataforma.
2. Ingresa al módulo **Asignaciones**.
3. Visualiza el listado de asignaciones con sus filtros.
4. Hace clic en **Nueva asignación**.
5. El sistema abre el formulario de creación.
6. El usuario selecciona el proyecto.
7. El sistema carga en el selector de persona los miembros del proyecto.
8. El usuario selecciona la persona.
9. El sistema precarga el rol (último conocido), el % en 100 y la fecha de inicio en la fecha actual.
10. El usuario ajusta % , rol y fechas si es necesario.
11. Presiona **Guardar**.
12. El sistema valida la información (rango del %, fechas, tope 100%, solapamientos).
13. El sistema crea la asignación.
14. El sistema muestra un mensaje de éxito.
15. La nueva asignación aparece inmediatamente en el listado como vigente.

## Flujos alternos

**FA-01 — Cancelar creación.** El usuario presiona Cancelar. Resultado: el formulario se cierra y no se almacena información.

**FA-02 — Cambio de asignación vigente.** El usuario selecciona una asignación vigente y elige **Cambiar asignación**; diligencia el nuevo % y la fecha de inicio del cambio (≥ hoy). Resultado: el sistema cierra la vigencia actual con fecha fin = día anterior a la nueva fecha de inicio, crea el nuevo registro y ambos quedan visibles (histórica y vigente).

**FA-03 — Cierre manual de vigencia (salida de proyecto/empresa).** El usuario selecciona una asignación vigente y elige **Cerrar vigencia**, indicando la fecha fin (≥ hoy). Resultado: la asignación queda histórica a partir de esa fecha y la persona deja de generar horas esperadas en periodos posteriores.

**FA-04 — Consulta con filtros.** El usuario filtra por persona, proyecto o estado (vigente/histórica). Resultado: el listado muestra solo los registros que cumplen los filtros.

## Flujos de excepción

**FE-01 — Tope de 100% excedido.** La suma de asignaciones vigentes de la persona en fechas que se cruzan supera 100%. Resultado: no se crea la asignación y el sistema muestra el mensaje con la distribución actual de la persona (proyecto y % de cada asignación vigente).

**FE-02 — Solapamiento en el mismo proyecto.** Ya existe una vigencia de la persona en ese proyecto que se cruza con las fechas ingresadas. Resultado: no se crea la asignación y se muestra el mensaje correspondiente.

**FE-03 — Fecha retroactiva.** La fecha de inicio es anterior a la fecha actual. Resultado: no se crea la asignación y se muestra el mensaje correspondiente.

**FE-04 — Error del servidor.** Resultado: no se crea/modifica la asignación y se informa el error al usuario.

**FE-05 — Sesión expirada.** Resultado: el usuario es redireccionado al inicio de sesión.

**FE-06 — Falla la consulta de miembros del proyecto a Azure.** Resultado: el selector de persona muestra el error y la opción de reintentar; no se puede guardar sin persona.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — Dado que el usuario tiene rol de gestión (D1), debe visualizar el módulo Asignaciones en el menú.

**CA-02** — Dado que el usuario no tiene rol de gestión, no debe visualizar el módulo Asignaciones ni poder acceder por URL directa.

**CA-03** — Dado que el usuario ingresa al módulo, debe visualizar el listado con las columnas: persona, proyecto, rol, % asignación, fecha inicio, fecha fin y estado (vigente/histórica).

**CA-04** — Dado que el usuario ingresa al módulo, debe visualizar los filtros por persona, proyecto y estado.

**CA-05** — Dado que el usuario aplica un filtro, el listado debe mostrar únicamente los registros que cumplen el criterio.

**CA-06** — Dado que el usuario tiene rol de gestión, debe visualizar el botón **Nueva asignación**.

### Apertura del formulario

**CA-07** — Dado que el usuario hace clic en Nueva asignación, el sistema debe abrir el formulario de creación.

**CA-08** — Dado que el formulario está abierto, el usuario debe visualizar los campos: Proyecto, Persona, Rol, % Asignación, Fecha inicio vigencia y Fecha fin vigencia.

**CA-09** — Dado que el usuario aún no selecciona proyecto, el selector de Persona debe estar deshabilitado.

### Campo Proyecto

**CA-10** — Dado que el usuario abre el selector de Proyecto, el sistema debe listar los proyectos de Azure DevOps disponibles en la plataforma.

**CA-11** — Dado que el usuario no selecciona proyecto e intenta guardar, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Campo Persona

**CA-12** — Dado que el usuario selecciona un proyecto, el selector de Persona debe listar únicamente los usuarios de Azure DevOps miembros de ese proyecto.

**CA-13** — Dado que el usuario no selecciona persona e intenta guardar, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Campo Rol

**CA-14** — Dado que el usuario selecciona una persona, el sistema debe precargar en Rol el último rol conocido de esa persona, si existe.

**CA-15** — Dado que el usuario abre el selector de Rol, el sistema debe listar los roles del catálogo de la plataforma.

**CA-16** — Dado que el usuario no selecciona rol e intenta guardar, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Campo % Asignación

**CA-17** — Dado que el formulario se abre, el campo % Asignación debe precargarse en 100.

**CA-18** — Dado que el usuario ingresa un valor menor a 1 o mayor a 100, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

**CA-19** — Dado que el usuario ingresa un valor no numérico o con decimales, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Campos de vigencia

**CA-20** — Dado que el formulario se abre, la Fecha inicio vigencia debe precargarse con la fecha actual.

**CA-21** — Dado que el usuario ingresa una fecha de inicio anterior a la fecha actual, el sistema debe impedir la creación indicando que no se permiten asignaciones retroactivas.

**CA-22** — Dado que el usuario deja vacía la Fecha fin vigencia, el sistema debe crear la asignación con vigencia abierta.

**CA-23** — Dado que el usuario ingresa una fecha fin anterior a la fecha de inicio, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Validaciones de negocio al guardar

**CA-24** — Dado que la persona ya tiene una vigencia en el mismo proyecto que se cruza con las fechas ingresadas, el sistema debe impedir la creación indicando el solapamiento.

**CA-25** — Dado que la suma del % ingresado más las asignaciones vigentes de la persona en fechas que se cruzan supera 100, el sistema debe impedir la creación y mostrar la distribución actual (proyecto y % de cada asignación vigente).

**CA-26** — Dado que la suma da exactamente 100, el sistema debe permitir la creación.

### Guardado

**CA-27** — Dado que toda la información es válida, cuando el usuario presiona Guardar, el sistema debe crear la asignación.

**CA-28** — Dado que la asignación fue creada correctamente, el sistema debe mostrar un mensaje indicando que la operación fue exitosa.

**CA-29** — Dado que la asignación fue creada correctamente, el sistema debe cerrar el formulario.

**CA-30** — Dado que la asignación fue creada correctamente, el sistema debe actualizar automáticamente el listado.

### Cambio de asignación

**CA-31** — Dado que el usuario selecciona una asignación vigente y elige Cambiar asignación, el sistema debe abrir el formulario con la persona y el proyecto bloqueados, solicitando nuevo %, rol y fecha de inicio del cambio.

**CA-32** — Dado que el usuario confirma el cambio con fecha de inicio X (≥ hoy), el sistema debe asignar a la vigencia anterior la fecha fin X−1 día y crear el nuevo registro desde X.

**CA-33** — Dado que se realizó un cambio de asignación, el listado debe mostrar el registro anterior como histórico y el nuevo como vigente.

**CA-34** — Dado que existe un cambio de asignación dentro de un mes, el cálculo de horas esperadas de ese mes debe realizarse por tramos (días hábiles de cada tramo × 8 × % del tramo) y su suma debe coincidir con lo mostrado en el reporte (HU-03).

### Cierre de vigencia

**CA-35** — Dado que el usuario selecciona una asignación vigente y elige Cerrar vigencia con fecha F (≥ hoy), el sistema debe registrar F como fecha fin y marcar la asignación como histórica a partir de esa fecha.

**CA-36** — Dado que la vigencia fue cerrada, la persona no debe generar horas esperadas en ese proyecto para periodos posteriores a F.

### Cancelación y errores

**CA-37** — Dado que el usuario presiona Cancelar, el sistema debe cerrar el formulario sin guardar cambios.

**CA-38** — Dado que ocurre un error inesperado durante el guardado, el sistema debe informar al usuario que la operación no pudo completarse, sin crear registros parciales.

## Validaciones funcionales

- **Proyecto:** obligatorio; solo proyectos disponibles en la plataforma.
- **Persona:** obligatoria; solo miembros del proyecto seleccionado.
- **Rol:** obligatorio; solo valores del catálogo.
- **% Asignación:** obligatorio; entero entre 1 y 100; por defecto 100.
- **Fecha inicio:** obligatoria; ≥ fecha actual; por defecto la fecha actual.
- **Fecha fin:** opcional; si se diligencia, ≥ fecha inicio.
- **Regla de tope:** suma de porcentajes de vigencias de la persona que se crucen en el tiempo ≤ 100.
- **Regla de solapamiento:** una sola vigencia por persona–proyecto en cualquier fecha.

## Validaciones técnicas

- Todas las validaciones deben ejecutarse tanto en frontend como en backend.
- El backend debe validar el rol de gestión antes de cualquier operación.
- El cambio de asignación (cierre + creación) debe ejecutarse dentro de una transacción: o se completan ambas operaciones o ninguna.
- Los miembros del proyecto se consultan a la API de Azure DevOps; el resultado puede cachearse durante la sesión del formulario.
- La API debe retornar códigos HTTP adecuados (201 creación exitosa, 400 errores de validación, 403 falta de permisos, 409 conflicto por tope o solapamiento, 500 errores internos).
- La respuesta del servicio de creación debe ser inferior a 2 segundos en condiciones normales.

## Dependencias

- Servicio de autenticación y de roles/permisos de la plataforma.
- API de Azure DevOps: proyectos y miembros de equipo.
- Catálogo de roles de la plataforma.
- Calendario de festivos de Colombia (tabla administrable, precargada por año).

## Diseño

- Mockup en Figma del listado, formulario de creación, cambio de asignación y cierre de vigencia.
- Diseño aprobado por UX.
- Componentes del sistema de diseño.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración; QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

---
---

# HU-02 — Configuración de historias de usuario de Novedades por proyecto

## Historia de Usuario

**Como** usuario con rol de gestión

**Quiero** vincular en cada proyecto una o varias historias de usuario del backlog como historias de "Novedades"

**Para** que el reporte de horas identifique las novedades por el ID de sus historias contenedoras y no dependa de sus nombres.

## Objetivo de negocio

Dar a la plataforma una forma confiable y administrable de saber dónde viven las novedades de cada proyecto en Azure DevOps, soportando que existan varias historias de novedades en el tiempo (por mes, por iteración, etc.), de modo que el reporte pueda consultar todas las que apliquen a un periodo.

## Alcance

Esta historia incluye:

- Sección de configuración de novedades dentro de la configuración de cada proyecto.
- Listado de HUs de novedades vinculadas al proyecto.
- Buscador de historias de usuario del backlog del proyecto (por título o ID) en tiempo real contra Azure.
- Vinculación de una HU (guardando su work item ID).
- Validación de duplicados.
- Desvinculación de una HU con confirmación.
- Control de acceso por rol.

No incluye:

- Creación o edición de historias de usuario en Azure DevOps.
- Creación o edición de work items de novedad.
- Configuración de los tipos de novedad (viven en Azure).
- Vinculación de work items que no sean historias de usuario.

## Reglas de negocio

1. Solo los roles de gestión (D1) pueden acceder a esta configuración.
2. La configuración es por proyecto: cada proyecto administra su propia lista de HUs de novedades.
3. Se pueden vincular N historias de usuario por proyecto (D9).
4. Solo se pueden vincular work items de tipo Historia de Usuario del backlog del proyecto.
5. No se puede vincular dos veces la misma HU en el mismo proyecto.
6. Lo que se persiste es el work item ID de la HU (no su título), para que renombrarla en Azure no rompa la configuración.
7. Desvincular una HU solo elimina la relación en la plataforma; no modifica nada en Azure.
8. Si una HU vinculada es eliminada en Azure, el reporte la ignora mostrando una alerta informativa, sin fallar.
9. Si un proyecto no tiene ninguna HU vinculada, el reporte de ese proyecto muestra 0 horas de novedades con la alerta "Novedades sin configurar".

## Flujo principal

1. El usuario con rol de gestión ingresa a la configuración del proyecto.
2. Ingresa a la sección **Novedades**.
3. Visualiza el listado de HUs de novedades vinculadas (ID, título, estado en Azure, fecha de vinculación).
4. Hace clic en **Vincular historia de novedades**.
5. El sistema abre el buscador.
6. El usuario escribe parte del título o el ID de la historia.
7. El sistema consulta en tiempo real el backlog del proyecto en Azure y muestra las coincidencias (ID, título, estado).
8. El usuario selecciona la historia.
9. Presiona **Vincular**.
10. El sistema valida que no esté duplicada.
11. El sistema guarda el work item ID.
12. El sistema muestra un mensaje de éxito.
13. La historia aparece inmediatamente en el listado de vinculadas.

## Flujos alternos

**FA-01 — Cancelar vinculación.** El usuario presiona Cancelar o cierra el buscador. Resultado: no se vincula nada.

**FA-02 — Desvincular una HU.** El usuario hace clic en Desvincular sobre una HU del listado; el sistema pide confirmación; el usuario confirma. Resultado: la HU se elimina de la lista; los reportes de periodos futuros dejan de considerarla; no se modifica nada en Azure.

**FA-03 — Búsqueda sin resultados.** El texto buscado no coincide con ninguna HU del backlog. Resultado: el sistema muestra "Sin resultados" y permite ajustar la búsqueda.

## Flujos de excepción

**FE-01 — HU duplicada.** La historia seleccionada ya está vinculada al proyecto. Resultado: no se vincula y se muestra el mensaje indicando el duplicado.

**FE-02 — Error de la API de Azure durante la búsqueda.** Resultado: el buscador muestra el error con opción de reintentar.

**FE-03 — Error del servidor al guardar.** Resultado: no se vincula la HU y se informa al usuario.

**FE-04 — Sesión expirada.** Resultado: el usuario es redireccionado al inicio de sesión.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — Dado que el usuario tiene rol de gestión, debe visualizar la sección Novedades dentro de la configuración del proyecto.

**CA-02** — Dado que el usuario no tiene rol de gestión, no debe visualizar la sección ni poder acceder por URL directa.

**CA-03** — Dado que el usuario ingresa a la sección, debe visualizar el listado de HUs vinculadas con las columnas: ID, título, estado en Azure y fecha de vinculación.

**CA-04** — Dado que el proyecto no tiene HUs vinculadas, el listado debe mostrar un estado vacío indicando que el reporte no calculará novedades hasta configurar al menos una.

**CA-05** — Dado que el usuario tiene rol de gestión, debe visualizar el botón **Vincular historia de novedades**.

### Buscador

**CA-06** — Dado que el usuario hace clic en Vincular historia de novedades, el sistema debe abrir el buscador.

**CA-07** — Dado que el usuario escribe al menos 3 caracteres o un ID, el sistema debe consultar en tiempo real el backlog del proyecto en Azure y mostrar las coincidencias con ID, título y estado.

**CA-08** — Dado que la búsqueda se realiza, el sistema debe listar únicamente work items de tipo Historia de Usuario del proyecto configurado.

**CA-09** — Dado que la búsqueda no arroja coincidencias, el sistema debe mostrar el mensaje "Sin resultados".

**CA-10** — Dado que la API de Azure falla durante la búsqueda, el sistema debe mostrar el error con la opción de reintentar.

### Vinculación

**CA-11** — Dado que el usuario selecciona una historia y presiona Vincular, el sistema debe guardar el work item ID de la historia.

**CA-12** — Dado que la historia ya está vinculada al proyecto, el sistema debe impedir la vinculación y mostrar el mensaje de duplicado.

**CA-13** — Dado que la vinculación fue exitosa, el sistema debe mostrar un mensaje de éxito, cerrar el buscador y actualizar el listado automáticamente.

**CA-14** — Dado que existen varias HUs vinculadas (p. ej. "Novedades Junio" y "Novedades Julio"), todas deben aparecer en el listado y todas deben ser consideradas por el reporte (verificado en HU-03).

### Desvinculación

**CA-15** — Dado que el usuario hace clic en Desvincular, el sistema debe solicitar confirmación antes de proceder.

**CA-16** — Dado que el usuario confirma, el sistema debe eliminar el vínculo, mostrar un mensaje de éxito y actualizar el listado.

**CA-17** — Dado que el usuario cancela la confirmación, el vínculo debe permanecer sin cambios.

**CA-18** — Dado que se desvinculó una HU, no debe producirse ningún cambio en Azure DevOps.

### Comportamiento ante inconsistencias

**CA-19** — Dado que una HU vinculada fue eliminada en Azure, cuando se consulte (en el listado o al generar el reporte), el sistema debe marcarla/ignorarla con una alerta informativa sin que la funcionalidad falle.

**CA-20** — Dado que una HU vinculada fue renombrada en Azure, el sistema debe seguir reconociéndola por su ID y mostrar el título actualizado.

## Validaciones funcionales

- **Búsqueda:** mínimo 3 caracteres para búsqueda por título; búsqueda directa por ID numérico.
- **Tipo de work item:** solo Historias de Usuario del backlog del proyecto.
- **Duplicados:** una HU solo puede estar vinculada una vez por proyecto.
- **Confirmación obligatoria** para desvincular.

## Validaciones técnicas

- Validaciones en frontend y backend; el backend valida el rol antes de vincular/desvincular.
- La búsqueda usa la API de Azure DevOps (WIQL o endpoint de work items) filtrando por tipo Historia de Usuario y proyecto.
- La búsqueda debe tener debounce (mínimo 300 ms) para no saturar la API.
- Persistencia del vínculo: proyecto, work item ID, fecha de vinculación, usuario que vinculó.
- Códigos HTTP adecuados (201 vinculación, 400 validación, 403 permisos, 409 duplicado, 500 error interno).

## Dependencias

- Servicio de autenticación y roles de la plataforma.
- API de Azure DevOps: consulta de work items del backlog (WIQL).
- HU-01 no es prerrequisito técnico de esta historia, pero ambas lo son de la HU-03.

## Diseño

- Mockup en Figma de la sección de configuración, buscador y confirmación de desvinculación.
- Diseño aprobado por UX.
- Componentes del sistema de diseño.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración; QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

---
---

# HU-03 — Generación del reporte de horas por periodo

## Historia de Usuario

**Como** usuario con rol de gestión

**Quiero** generar en tiempo real un reporte de horas por mes o por rango de fechas, por persona y proyecto

**Para** conocer qué se le está pagando a cada persona: horas esperadas según su asignación, horas trabajadas en desarrollo, horas en novedades y el detalle de esas novedades.

## Objetivo de negocio

Entregar el insumo oficial del proceso de pago: un reporte confiable, generado con datos en vivo de Azure DevOps, que compare lo esperado contra lo reportado por cada persona, discriminando desarrollo y novedades con su tipo y detalle.

## Alcance

Esta historia incluye:

- Pantalla del reporte con selección de periodo por mes o por rango de fechas.
- Filtros por proyecto(s), persona(s) y rol.
- Generación en tiempo real contra la API de Azure DevOps.
- Tabla de resultados con las columnas definidas y semáforo de cumplimiento.
- Cálculo de horas esperadas por tramos de asignación (HU-01).
- Cálculo de horas de novedades por intersección de fechas (D10) buscando en todas las HUs vinculadas (HU-02).
- Detalle expandible de novedades por persona.
- Vista consolidada por persona (multi-proyecto) con alerta de posible novedad sin registrar (D11).
- Exportación a Excel.
- Manejo de estados de carga y errores.

No incluye:

- Almacenamiento de reportes generados (histórico).
- Cierre o congelamiento de mes.
- Exportación a CSV o PDF.
- Vista del reporte para usuarios sin rol de gestión.
- Propagación automática de novedades entre proyectos.
- Edición de datos de Azure desde el reporte.

## Reglas de negocio

1. Solo los roles de gestión (D1) pueden generar y visualizar el reporte.
2. **Periodo:** por mes (selector mes + año → del día 1 al último día del mes) o por rango de fechas (hasta ≥ desde).
3. **Datos en tiempo real (D13):** al generar, la plataforma consulta la API de Azure DevOps en ese momento; el reporte muestra la fecha y hora de generación.
4. **Horas esperadas** = días hábiles del periodo (calendario de Colombia, excluye sábados, domingos y festivos) × 8 × % asignación, calculadas por tramos si la asignación cambió dentro del periodo.
5. **Horas desarrollo** = suma del *Completed Work* de las tasks de la persona en el proyecto con trabajo dentro del periodo (Completed Work > 0 o estado Done), excluyendo los work items hijos de las HUs de novedades vinculadas.
6. **Horas novedades** = por cada work item Novedad asignado a la persona, hijo de cualquiera de las HUs vinculadas al proyecto: días hábiles de la intersección entre [fecha inicio, fecha fin] de la novedad y el periodo del reporte × 8 × % de asignación (D10). El prorrateo entre meses es automático y sin doble conteo.
7. **Modelo de cumplimiento (D7):** % cumplimiento = (horas desarrollo + horas novedades) ÷ horas esperadas × 100.
8. **Semáforo (D14):** verde ≥ 95%, amarillo 80–94%, rojo < 80%.
9. **Novedades por proyecto (D11):** cada registro de novedad afecta únicamente el proyecto donde fue creado. Una persona multi-proyecto debe tener la novedad registrada en cada proyecto que aplique.
10. **Alerta de novedad posiblemente sin registrar (D11):** en la vista consolidada, si una persona tiene una novedad en un proyecto y en las mismas fechas tiene asignación vigente en otro proyecto donde no existe una novedad que se cruce con ese rango, el sistema muestra una alerta informativa (no bloqueante).
11. Persona con horas reportadas en el periodo pero sin asignación vigente: aparece en el reporte con asignación "Sin configurar", sin horas esperadas y con alerta visual.
12. Proyecto sin HUs de novedades vinculadas: la columna de novedades muestra 0 con la alerta "Novedades sin configurar".
13. Los tipos de novedad se leen dinámicamente de la definición del campo en Azure; la plataforma no los codifica.
14. Las fechas se interpretan tal como las almacena Azure DevOps (D15).
15. La exportación a Excel refleja exactamente las filas, columnas y filtros visibles, incluido el detalle de novedades y el estado del semáforo.

## Estructura del reporte

Una fila por combinación persona–proyecto:

| # | Columna | Fuente / cálculo |
|---|---|---|
| 1 | Persona | Usuario de Azure DevOps |
| 2 | Rol | De la asignación vigente en el periodo (HU-01) |
| 3 | Proyecto | Proyecto de Azure DevOps |
| 4 | % Asignación | Vigente en el periodo; si cambió, promedio ponderado con detalle por tramos |
| 5 | Horas esperadas | Regla 4 |
| 6 | Horas desarrollo | Regla 5 |
| 7 | Horas novedades | Regla 6 |
| 8 | Detalle de novedades | Por novedad: tipo (lista) + tipo escrito + título + fechas inicio–fin + fecha de reintegro + horas calculadas |
| 9 | Total reportado | Columna 6 + columna 7 |
| 10 | % Cumplimiento | Regla 7, con semáforo |

## Flujo principal

1. El usuario con rol de gestión ingresa al módulo **Reporte de horas**.
2. Visualiza los controles de periodo (mes o rango) y los filtros (proyectos, personas, rol).
3. Selecciona el periodo (p. ej. "Junio 2026") y los proyectos.
4. Presiona **Generar reporte**.
5. El sistema muestra el indicador de carga y consulta en tiempo real a Azure DevOps: asignaciones vigentes, tasks con Completed Work del periodo y novedades de las HUs vinculadas.
6. El sistema calcula horas esperadas, desarrollo, novedades y cumplimiento por persona–proyecto.
7. El sistema muestra la tabla con las 10 columnas, el semáforo y la fecha/hora de generación.
8. El usuario expande el detalle de novedades de una persona y visualiza cada novedad con tipo, fechas, reintegro y horas.
9. El usuario presiona **Exportar a Excel**.
10. El sistema genera y descarga el archivo .xlsx con el contenido visible.

## Flujos alternos

**FA-01 — Reporte por rango de fechas.** El usuario elige el modo rango e ingresa desde/hasta. Resultado: el reporte se calcula con los días hábiles de ese rango exacto.

**FA-02 — Vista consolidada por persona.** El usuario activa el toggle **Consolidar por persona**. Resultado: las filas de una misma persona en varios proyectos se agrupan en una sola, sumando % asignación, horas esperadas, desarrollo y novedades; el cumplimiento se calcula sobre los totales; se muestran las alertas de posible novedad sin registrar (regla 10).

**FA-03 — Cambio de filtros tras generar.** El usuario modifica filtros o periodo. Resultado: la tabla actual queda marcada como desactualizada y se solicita regenerar; los cálculos no se reutilizan.

**FA-04 — Persona sin actividad.** Una persona con asignación vigente no tiene tasks ni novedades en el periodo. Resultado: aparece con horas esperadas > 0, reportado 0 y cumplimiento 0% (rojo).

## Flujos de excepción

**FE-01 — Error de la API de Azure durante la generación.** Resultado: el sistema muestra un mensaje de error claro con opción de reintentar. Nunca se muestra un reporte parcial sin aviso.

**FE-02 — Proyecto sin HUs de novedades configuradas.** Resultado: el reporte se genera; la columna de novedades muestra 0 con la alerta "Novedades sin configurar" en las filas de ese proyecto.

**FE-03 — HU de novedades vinculada pero eliminada en Azure.** Resultado: esa HU se ignora, se muestra una alerta informativa y el reporte se genera con las demás.

**FE-04 — Novedad con datos incompletos** (sin fecha inicio o fin, o sin persona asignada). Resultado: la novedad se excluye del cálculo y se lista en una alerta de "Novedades con datos incompletos" con su ID, para corrección en Azure.

**FE-05 — Rango inválido.** Fecha hasta anterior a fecha desde. Resultado: no se genera el reporte y se muestra el mensaje de validación.

**FE-06 — Generación excede el tiempo máximo.** Resultado: el sistema informa que la consulta está tardando y mantiene el indicador de progreso o permite cancelar (ver validaciones técnicas).

**FE-07 — Sesión expirada.** Resultado: el usuario es redireccionado al inicio de sesión.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — Dado que el usuario tiene rol de gestión, debe visualizar el módulo Reporte de horas en el menú.

**CA-02** — Dado que el usuario no tiene rol de gestión, no debe visualizar el módulo ni poder acceder por URL directa.

**CA-03** — Dado que el usuario ingresa al módulo, debe visualizar el selector de modo de periodo (Mes / Rango de fechas), los filtros de proyecto(s), persona(s) y rol, y el botón Generar reporte.

### Selección de periodo

**CA-04** — Dado que el usuario elige el modo Mes, debe visualizar un selector de mes y año.

**CA-05** — Dado que el usuario selecciona un mes, el sistema debe tomar como periodo del día 1 al último día de ese mes.

**CA-06** — Dado que el usuario elige el modo Rango, debe visualizar los campos fecha desde y fecha hasta.

**CA-07** — Dado que el usuario ingresa fecha hasta anterior a fecha desde, el sistema debe impedir la generación y mostrar el mensaje correspondiente.

**CA-08** — Dado que el usuario no selecciona periodo e intenta generar, el sistema debe impedir la generación y mostrar el mensaje correspondiente.

### Generación en tiempo real

**CA-09** — Dado que el usuario presiona Generar reporte, el sistema debe consultar la API de Azure DevOps en ese momento y mostrar un indicador de carga durante la consulta.

**CA-10** — Dado que el reporte fue generado, el sistema debe mostrar la fecha y hora exacta de generación.

**CA-11** — Dado que la API de Azure falla durante la generación, el sistema debe mostrar un mensaje de error con opción de reintentar y no debe mostrar resultados parciales sin aviso.

### Estructura de la tabla

**CA-12** — Dado que el reporte fue generado, el sistema debe mostrar una fila por combinación persona–proyecto con las columnas: Persona, Rol, Proyecto, % Asignación, Horas esperadas, Horas desarrollo, Horas novedades, Detalle de novedades, Total reportado y % Cumplimiento.

**CA-13** — Dado que se aplicaron filtros de proyecto, persona o rol, la tabla debe mostrar únicamente las filas que los cumplen.

### Cálculo de horas esperadas

**CA-14** — Dado que el periodo es junio 2026 con 20 días hábiles en Colombia y la persona tiene asignación del 100%, sus horas esperadas deben ser 160.

**CA-15** — Dado que la persona tiene asignación del 50%, sus horas esperadas deben ser la mitad de las del 100% para el mismo periodo.

**CA-16** — Dado que la asignación cambió dentro del periodo (p. ej. 100% hasta el 14 y 50% desde el 15), las horas esperadas deben calcularse por tramos y la columna % Asignación debe mostrar el promedio ponderado con acceso al detalle por tramos.

**CA-17** — Dado que un día del periodo es festivo en Colombia, no debe sumar horas esperadas.

### Cálculo de horas de desarrollo

**CA-18** — Dado que la persona tiene tasks con Completed Work > 0 o en estado Done con trabajo dentro del periodo, la columna Horas desarrollo debe sumar su Completed Work.

**CA-19** — Dado que un work item con horas es hijo de una HU de novedades vinculada, sus horas no deben sumarse en Horas desarrollo.

### Cálculo de horas de novedades

**CA-20** — Dado que la persona tiene una novedad "Incapacidad" del 02/06 al 04/06 (3 días hábiles) y asignación del 100%, la columna Horas novedades debe sumar 24 horas.

**CA-21** — Dado que la persona tiene asignación del 50% en el proyecto, la misma novedad de 3 días hábiles debe sumar 12 horas en ese proyecto.

**CA-22** — Dado que una novedad va del 25/06 al 10/07 y el reporte es de junio, solo deben sumar los días hábiles del 25 al 30 de junio; al generar el reporte de julio, deben sumar los días hábiles de julio, sin doble conteo.

**CA-23** — Dado que el rango de la novedad incluye fines de semana o festivos, esos días no deben sumar horas.

**CA-24** — Dado que el proyecto tiene varias HUs de novedades vinculadas ("Novedades Junio" y "Novedades Julio") y el reporte va del 15/06 al 15/07, el sistema debe tomar las novedades de ambas historias.

**CA-25** — Dado que una novedad no tiene fecha de inicio, fecha de fin o persona asignada, debe excluirse del cálculo y listarse en la alerta "Novedades con datos incompletos" con su ID.

### Detalle de novedades

**CA-26** — Dado que la persona tiene novedades en el periodo, la columna/panel de detalle debe mostrar, por cada novedad: tipo (lista), tipo escrito, título, fecha inicio, fecha fin, fecha de reintegro y horas calculadas.

**CA-27** — Dado que los tipos de novedad cambian en Azure, el reporte debe mostrar los valores actuales sin requerir cambios en la plataforma.

### Cumplimiento y semáforo

**CA-28** — Dado que las horas esperadas son 160 y la persona reportó 136 en desarrollo y 24 en novedades, el % Cumplimiento debe ser 100% con semáforo verde.

**CA-29** — Dado que el % Cumplimiento es ≥ 95, el semáforo debe ser verde; entre 80 y 94, amarillo; menor a 80, rojo.

**CA-30** — Dado que la persona tiene asignación vigente y ninguna hora reportada, debe aparecer con cumplimiento 0% y semáforo rojo.

### Casos especiales

**CA-31** — Dado que una persona reportó horas en el periodo pero no tiene asignación vigente, debe aparecer con asignación "Sin configurar", sin horas esperadas y con alerta visual, sin bloquear el reporte.

**CA-32** — Dado que el proyecto no tiene HUs de novedades vinculadas, las filas de ese proyecto deben mostrar 0 en Horas novedades con la alerta "Novedades sin configurar".

**CA-33** — Dado que una HU de novedades vinculada fue eliminada en Azure, el reporte debe generarse ignorándola y mostrando una alerta informativa.

### Vista consolidada por persona

**CA-34** — Dado que el usuario activa Consolidar por persona, las filas de una persona en varios proyectos deben agruparse en una sola, sumando % asignación, horas esperadas, desarrollo y novedades, y recalculando el cumplimiento sobre los totales.

**CA-35** — Dado que Laura tiene 50% en A y 50% en B, la vista consolidada debe mostrarla con 100% y la suma de ambos proyectos.

**CA-36** — Dado que una persona tiene una novedad en el proyecto A y en las mismas fechas tiene asignación vigente en el proyecto B sin una novedad que se cruce con ese rango, la vista consolidada debe mostrar la alerta "Posible novedad sin registrar en [proyecto B]".

**CA-37** — Dado que la novedad está registrada en ambos proyectos con fechas que se cruzan, no debe mostrarse la alerta.

### Exportación

**CA-38** — Dado que el reporte está generado, el usuario debe visualizar el botón Exportar a Excel.

**CA-39** — Dado que el usuario exporta, el archivo .xlsx debe contener exactamente las filas, columnas y filtros visibles, incluido el detalle de novedades y el estado del semáforo (color o columna de estado), además de la fecha/hora de generación.

**CA-40** — Dado que la vista consolidada está activa al exportar, el Excel debe reflejar la vista consolidada.

## Validaciones funcionales

- **Periodo:** obligatorio; en modo rango, hasta ≥ desde.
- **Proyectos:** al menos uno seleccionado (por defecto, todos los disponibles para el usuario).
- **Cálculos:** columna 9 = columna 6 + columna 7; columna 10 = columna 9 ÷ columna 5 × 100; la suma de tramos de esperadas coincide con el total.
- **Consistencia de prorrateo:** la suma de las horas de una novedad a través de reportes de meses consecutivos equivale a sus días hábiles totales × 8 × %.
- **Novedades:** solo work items tipo Novedad, hijos de HUs vinculadas, asignados a la persona, con intersección de fechas con el periodo.

## Validaciones técnicas

- Validaciones en frontend y backend; el backend valida el rol antes de generar o exportar.
- Consultas a Azure DevOps vía WIQL/batch: asignaciones no (son de la plataforma), tasks con Completed Work por proyecto y periodo, hijos de las HUs de novedades vinculadas, y definición del campo tipo de novedad. Las consultas por proyecto pueden ejecutarse en paralelo.
- Sin caché de datos del reporte (D13); cada generación consulta en vivo.
- Indicador de progreso durante la generación; si excede el umbral definido (propuesta: 30 segundos), informar al usuario y permitir cancelar.
- La exportación a Excel se genera en el backend con los mismos datos de la generación en pantalla (no se recalcula contra Azure para evitar diferencias entre pantalla y archivo).
- Códigos HTTP adecuados (200 generación, 400 validación, 403 permisos, 502/504 fallas de Azure con mensaje distinguible, 500 error interno).
- Registrar en log técnico la duración de cada generación para monitorear performance.

## Dependencias

- **HU-01** (asignaciones): fuente de % y vigencias para horas esperadas.
- **HU-02** (configuración de novedades): fuente de las HUs donde buscar novedades.
- API de Azure DevOps: work items, WIQL, definición de campos.
- Calendario de festivos de Colombia (tabla administrable precargada por año).
- Servicio de autenticación y roles.
- Componente/librería de generación de archivos Excel.

## Diseño

- Mockup en Figma de: pantalla de filtros y periodo, tabla de resultados con semáforo, detalle expandible de novedades, vista consolidada con alertas y estados de carga/error.
- Diseño aprobado por UX.
- Componentes del sistema de diseño.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración (incluyendo los casos de prorrateo entre meses y cambio de asignación a mitad de periodo); QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

---
---

## Orden de implementación

1. **HU-01** — Asignaciones (prerrequisito de las horas esperadas).
2. **HU-02** — Configuración de HUs de novedades (prerrequisito de las columnas de novedades).
3. **HU-03** — Reporte de horas (consume las dos anteriores).

## Pendientes por confirmar antes de estimar

1. Nombres exactos (reference names) de los campos del work item Novedad en Azure: tipo de novedad, tipo escrito, fecha inicio, fecha fin, fecha de reintegro.
2. Confirmar que no existen novedades de medio día u horas sueltas; si existen, agregar un campo de horas al work item y ajustar la regla D10.
3. Fuente y administración del calendario de festivos de Colombia (propuesta: tabla precargada por año, administrable por el Súper Administrador).
4. Umbral de tiempo máximo de generación antes de ofrecer cancelación (propuesta: 30 segundos).
5. Confirmar los umbrales del semáforo (propuesta: 95/80).
