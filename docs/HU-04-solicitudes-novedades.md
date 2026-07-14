# HU-04 — Módulo de Solicitudes: registro de novedades desde la plataforma

*(Complemento de la épica "Reporte de horas trabajadas con asignaciones y novedades". Depende de la HU-02.)*

## Historia de Usuario

**Como** usuario de la plataforma con cualquier rol (Product Manager, Scrum Master, Product Owner, Desarrollador, QA, Diseñador)

**Quiero** registrar mis solicitudes (novedades) desde una pantalla de la plataforma, diligenciando un formulario simple

**Para** que la novedad se cree automáticamente como work item tipo Novedad en la historia de usuario de novedades vinculada al proyecto en Azure DevOps, sin tener que entrar a Azure.

## Objetivo de negocio

Centralizar el registro de novedades en la plataforma, reduciendo errores de digitación en Azure (novedades en la HU equivocada, campos faltantes, horas mal calculadas) y garantizando que el reporte de horas (HU-03) reciba novedades completas y consistentes.

## Alcance

Esta historia incluye:

- Pantalla **Solicitudes** accesible para todos los roles autenticados.
- Listado "Mis solicitudes" (las creadas por el usuario o asignadas a él).
- Formulario de creación de solicitud con: proyecto, HU de novedades destino, persona asignada, tipo de solicitud, tipo escrito, tiempo (en horas o días), fecha/hora inicio, fecha/hora fin y fecha de reintegro.
- Carga dinámica de los tipos de solicitud desde la definición del campo en Azure.
- Cálculo automático bidireccional entre tiempo y fechas.
- Conversión de días a horas hacia Azure (1 día = 8 horas).
- Creación del work item tipo Novedad (custom) como hijo de la HU de novedades seleccionada.
- Mensajes de éxito y error, y actualización del listado.

No incluye:

- Edición o eliminación de solicitudes ya creadas en Azure (fase 2).
- Flujo de aprobación de solicitudes (fase 2).
- Registro simultáneo en la aplicación externa de Power Apps (análisis aparte).
- Configuración de las HUs de novedades (eso es HU-02).
- Notificaciones por correo o Teams.

## Reglas de negocio

1. Todos los roles autenticados de la plataforma pueden acceder al módulo Solicitudes y crear solicitudes.
2. **Proyecto:** el usuario solo puede seleccionar proyectos donde es miembro. Si es miembro de uno solo, se preselecciona.
3. **HU de novedades destino:** se listan las HUs vinculadas al proyecto (HU-02). Si hay una sola, se preselecciona; si hay varias, la selección es obligatoria; si no hay ninguna, no se puede crear la solicitud y se informa que el proyecto no tiene novedades configuradas.
4. **Persona asignada:** por defecto, el usuario logueado. Los roles de gestión (D1) pueden cambiarla a otro miembro del proyecto (caso: el Scrum Master registra la solicitud de otra persona). Para los demás roles, el campo queda bloqueado en sí mismos. *(Propuesta a validar.)*
5. **Tipo de solicitud:** los valores se consultan dinámicamente de la definición del campo "tipo de novedad" en Azure; la plataforma no los codifica.
6. **Tipo escrito:** campo de texto complementario, opcional.
7. **Tiempo:** valor numérico > 0 con unidad seleccionable: **horas** o **días**. Hacia Azure siempre se envía en horas (1 día = 8 horas). Ej.: 2 días → 16 horas.
8. **Cálculo automático bidireccional:**
   - Si el usuario diligencia fecha/hora de inicio + tiempo → el sistema calcula la fecha/hora de fin. En días, avanza solo días hábiles (calendario Colombia). En horas, suma sobre la hora de inicio dentro del mismo día.
   - Si el usuario diligencia fecha/hora de inicio + fecha/hora de fin → el sistema calcula el tiempo (días hábiles × 8, o diferencia de horas si es el mismo día).
   - El último campo editado manda: modificar el tiempo recalcula la fecha fin, y modificar las fechas recalcula el tiempo. Los campos calculados quedan editables.
9. **Fecha de reintegro:** se autocalcula como el siguiente día hábil después de la fecha fin; editable.
10. La fecha fin no puede ser anterior a la fecha de inicio; el reintegro no puede ser anterior a la fecha fin.
11. Al guardar, la plataforma crea en Azure el work item custom **Novedad**, hijo de la HU seleccionada, con: título, asignado, tipo de solicitud, tipo escrito, fecha inicio, fecha fin, fecha reintegro y tiempo en horas.
12. El título del work item se genera automáticamente con el formato "[Tipo] – [Persona] – [fecha inicio]", editable antes de guardar.
13. Si la creación en Azure falla, la solicitud no queda registrada en ningún lado y se informa el error con opción de reintentar (sin duplicar si el usuario reintenta).
14. Las solicitudes creadas quedan visibles en el listado con: título, tipo, asignado, fechas, horas y enlace al work item en Azure.

## Flujo principal

1. El usuario ingresa al módulo **Solicitudes**.
2. Visualiza el listado "Mis solicitudes".
3. Hace clic en **Nueva solicitud**.
4. El sistema abre el formulario y precarga: la persona asignada (usuario logueado), el proyecto (si es único) y la HU de novedades (si es única).
5. El usuario selecciona el proyecto; el sistema carga las HUs de novedades vinculadas y los tipos de solicitud desde Azure.
6. El usuario selecciona el tipo de solicitud (ej. "Permiso").
7. Ingresa fecha/hora de inicio (ej. 13/06/2026 8:00 a. m.) y el tiempo (ej. 2 horas).
8. El sistema calcula automáticamente la fecha/hora de fin (13/06/2026 10:00 a. m.) y la fecha de reintegro.
9. El usuario revisa el título autogenerado y presiona **Guardar**.
10. El sistema valida la información y crea el work item Novedad en Azure, hijo de la HU seleccionada.
11. El sistema muestra el mensaje de éxito con el ID del work item creado.
12. La solicitud aparece inmediatamente en el listado.

## Flujos alternos

**FA-01 — Cálculo inverso.** El usuario diligencia fecha/hora de inicio y fecha/hora de fin. Resultado: el sistema calcula el tiempo automáticamente (días hábiles × 8 h, u horas si es el mismo día) y lo muestra en el campo tiempo.

**FA-02 — Tiempo en días.** El usuario ingresa inicio 15/06/2026 y tiempo = 3 días. Resultado: la fecha fin se calcula avanzando 3 días hábiles (si hay festivo o fin de semana en el medio, se salta) y hacia Azure se enviarán 24 horas.

**FA-03 — Solicitud para otra persona (rol de gestión).** Un Scrum Master cambia la persona asignada a otro miembro del proyecto. Resultado: la novedad se crea asignada a esa persona; el listado muestra quién la creó.

**FA-04 — Proyecto con varias HUs de novedades.** El sistema exige seleccionar la HU destino de la lista de vinculadas.

**FA-05 — Cancelar.** El usuario presiona Cancelar o cierra el modal. Resultado: no se crea nada.

## Flujos de excepción

**FE-01 — Proyecto sin HUs de novedades vinculadas.** Resultado: el formulario informa "Este proyecto no tiene historias de novedades configuradas" y no permite guardar; si el usuario tiene rol de gestión, se le ofrece el enlace a la configuración (HU-02).

**FE-02 — Falla la carga de tipos de solicitud desde Azure.** Resultado: el formulario muestra el error con opción de reintentar; no se puede guardar sin tipo.

**FE-03 — Falla la creación del work item en Azure.** Resultado: no queda solicitud registrada; se muestra el error con opción de reintentar; el reintento no debe generar duplicados.

**FE-04 — Fechas inválidas.** Fin anterior a inicio, o reintegro anterior a fin. Resultado: no se guarda y se muestra el mensaje de validación.

**FE-05 — Sesión expirada.** Resultado: redirección al inicio de sesión.

## Criterios de aceptación

### Visualización y acceso

**CA-01** — Dado que el usuario está autenticado con cualquier rol, debe visualizar el módulo Solicitudes en el menú.

**CA-02** — Dado que el usuario ingresa al módulo, debe visualizar el listado "Mis solicitudes" con: título, tipo, persona asignada, fecha inicio, fecha fin, horas y enlace al work item en Azure.

**CA-03** — Dado que el usuario ingresa al módulo, debe visualizar el botón **Nueva solicitud**.

### Apertura y precarga del formulario

**CA-04** — Dado que el usuario hace clic en Nueva solicitud, el sistema debe abrir el formulario con los campos: Proyecto, HU de novedades, Persona asignada, Tipo de solicitud, Tipo escrito, Tiempo (valor + unidad horas/días), Fecha/hora inicio, Fecha/hora fin, Fecha de reintegro y Título.

**CA-05** — Dado que el formulario se abre, la Persona asignada debe precargarse con el usuario logueado.

**CA-06** — Dado que el usuario es miembro de un solo proyecto, el Proyecto debe precargarse.

**CA-07** — Dado que el proyecto seleccionado tiene una sola HU de novedades vinculada, esta debe preseleccionarse.

**CA-08** — Dado que el proyecto tiene varias HUs vinculadas, el usuario debe seleccionar obligatoriamente una de la lista.

**CA-09** — Dado que el proyecto no tiene HUs de novedades vinculadas, el sistema debe impedir la creación e informar que el proyecto no tiene novedades configuradas.

### Persona asignada

**CA-10** — Dado que el usuario NO tiene rol de gestión, el campo Persona asignada debe estar bloqueado con su propio nombre.

**CA-11** — Dado que el usuario tiene rol de gestión, el campo Persona asignada debe ser un selector con los miembros del proyecto.

**CA-12** — Dado que un rol de gestión crea una solicitud para otra persona, la novedad debe quedar asignada a esa persona en Azure.

### Tipo de solicitud

**CA-13** — Dado que el usuario selecciona un proyecto, el selector Tipo de solicitud debe cargar los valores actuales del campo tipo de novedad definido en Azure.

**CA-14** — Dado que los valores del campo cambian en Azure, el formulario debe reflejarlos sin cambios en la plataforma.

**CA-15** — Dado que el usuario no selecciona tipo e intenta guardar, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Tiempo y cálculo automático

**CA-16** — Dado que el campo Tiempo está visible, debe permitir un valor numérico mayor a 0 y la unidad Horas o Días.

**CA-17** — Dado que el usuario ingresa inicio 13/06/2026 8:00 a. m. y tiempo = 2 horas, el sistema debe autocompletar la fecha/hora fin con 13/06/2026 10:00 a. m.

**CA-18** — Dado que el usuario ingresa inicio 15/06/2026 y tiempo = 3 días, el sistema debe autocompletar la fecha fin avanzando 3 días hábiles del calendario de Colombia (saltando fines de semana y festivos).

**CA-19** — Dado que el usuario ingresa fecha inicio y fecha fin sin tiempo, el sistema debe autocompletar el tiempo: días hábiles entre ambas × 8 horas, u horas de diferencia si es el mismo día.

**CA-20** — Dado que el usuario modifica el tiempo después del cálculo, el sistema debe recalcular la fecha fin; y dado que modifica las fechas, debe recalcular el tiempo (el último campo editado manda).

**CA-21** — Dado que la unidad es Días, al guardar el sistema debe convertir a horas multiplicando por 8 (ej. 2 días → 16 horas hacia Azure).

**CA-22** — Dado que el usuario ingresa un tiempo ≤ 0 o no numérico, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Fechas y reintegro

**CA-23** — Dado que la fecha fin quedó calculada o diligenciada, la Fecha de reintegro debe autocompletarse con el siguiente día hábil posterior a la fecha fin, permitiendo editarla.

**CA-24** — Dado que la fecha fin es anterior a la fecha de inicio, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

**CA-25** — Dado que la fecha de reintegro es anterior a la fecha fin, el sistema debe impedir la creación y mostrar el mensaje correspondiente.

### Título

**CA-26** — Dado que el usuario diligenció tipo, persona y fecha inicio, el Título debe autogenerarse con el formato "[Tipo] – [Persona] – [fecha inicio]" y permitir edición.

**CA-27** — Dado que el título queda vacío, el sistema debe impedir la creación.

### Creación en Azure

**CA-28** — Dado que toda la información es válida, cuando el usuario presiona Guardar, el sistema debe crear en Azure un work item del tipo custom **Novedad**, hijo de la HU de novedades seleccionada, con todos los campos diligenciados y el tiempo en horas.

**CA-29** — Dado que la creación fue exitosa, el sistema debe mostrar el mensaje de éxito con el ID del work item, cerrar el formulario y actualizar el listado.

**CA-30** — Dado que la creación en Azure falla, el sistema no debe registrar la solicitud en ningún lado y debe mostrar el error con opción de reintentar.

**CA-31** — Dado que el usuario reintenta tras un error, el sistema no debe crear work items duplicados en Azure.

**CA-32** — Dado que la novedad fue creada por este módulo, debe aparecer en el reporte de horas (HU-03) del periodo correspondiente, con sus horas y detalle.

## Validaciones funcionales

- **Proyecto:** obligatorio; solo proyectos donde el usuario es miembro.
- **HU de novedades:** obligatoria; solo las vinculadas al proyecto (HU-02).
- **Persona asignada:** obligatoria; miembros del proyecto; editable solo por roles de gestión.
- **Tipo de solicitud:** obligatorio; solo valores vigentes del campo en Azure.
- **Tipo escrito:** opcional; máximo 500 caracteres.
- **Tiempo:** obligatorio; numérico > 0; unidad horas o días; conversión 1 día = 8 horas.
- **Fechas:** inicio obligatoria; fin ≥ inicio; reintegro ≥ fin.
- **Título:** obligatorio; máximo 150 caracteres; autogenerado editable.

## Validaciones técnicas

- Validaciones en frontend y backend; el backend valida membresía del proyecto y, para asignar a terceros, el rol de gestión.
- Los tipos de solicitud se consultan a la API de Azure (definición del campo del work item type Novedad); cachear por sesión del formulario.
- La creación del work item usa la API de Azure DevOps (create work item + relación parent con la HU seleccionada) y debe ser idempotente ante reintentos (clave de idempotencia por intento de creación).
- El cálculo de días hábiles usa el mismo calendario de festivos de Colombia que HU-01 y HU-03 (una sola fuente).
- Códigos HTTP adecuados (201 creación, 400 validación, 403 permisos, 409 conflicto/duplicado, 502/504 fallas de Azure distinguibles, 500 error interno).
- Respuesta objetivo < 3 segundos incluida la creación en Azure.

## Dependencias

- **HU-02** — Configuración de HUs de novedades (obligatoria: define el destino).
- API de Azure DevOps: creación de work items, relaciones parent-child, definición de campos, miembros de equipo.
- Calendario de festivos de Colombia (compartido con HU-01 y HU-03).
- Servicio de autenticación y roles.

## Impacto en historias existentes

- **HU-03 (Reporte):** el work item Novedad ahora lleva el **tiempo en horas** como campo explícito. El reporte debe usar ese campo como fuente de la columna Horas novedades cuando exista, en lugar de derivar las horas solo del rango de fechas (regla D10). Esto además resuelve el pendiente de las novedades de horas sueltas (ej. permiso de 2 horas). Las novedades creadas manualmente en Azure sin el campo de horas se seguirán calculando por rango de fechas (comportamiento de respaldo).
- **HU-02:** sin cambios; este módulo consume su configuración.

## Diseño

- Mockup en Figma de: listado de solicitudes, formulario con la agrupación tiempo/fechas y su comportamiento de autocálculo, y estados de error.
- Diseño aprobado por UX.
- Componentes del sistema de diseño.

## Definition of Done

La historia se considera terminada cuando: todos los criterios de aceptación se cumplen; las validaciones funcionales y técnicas están implementadas; se desarrollaron pruebas unitarias y de integración (incluyendo el autocálculo en ambas direcciones y la conversión días→horas); QA aprobó la funcionalidad; el Product Owner aprobó la funcionalidad; no existen errores críticos o bloqueantes; la documentación fue actualizada; la funcionalidad fue desplegada en el ambiente de pruebas.

## Preguntas por validar con el cliente

1. ¿Confirmamos que solo los roles de gestión pueden crear solicitudes a nombre de otra persona? (Regla 4.)
2. Para tiempo en horas que cruza la jornada (ej. inicio 4 p. m. + 4 horas): ¿la fecha fin pasa al día siguiente hábil (2 horas hoy + 2 mañana) o se mantiene el cálculo simple dentro del mismo día? Propuesta MVP: cálculo simple mismo día, con validación de que inicio + horas no exceda las 11:59 p. m.
3. ¿El work item Novedad en Azure tiene hoy un campo para las horas? Si no existe, hay que crearlo en el proceso del proyecto (custom field) antes de esta HU.
4. ¿Se requiere algún estado inicial del work item (ej. "Nueva", "Aprobada") al crearse desde la plataforma?
