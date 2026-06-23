-- Las plantillas del sistema pasan a ser singleton por (seed_key, name)
-- con user_id = null. Las plantillas personalizadas del usuario conservan
-- su user_id. Esto permite que las plantillas por defecto sean compartidas
-- entre todos los usuarios de un mismo rol.

DELETE FROM time_log_templates;--> statement-breakpoint
ALTER TABLE "time_log_templates" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "time_log_templates_user_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "time_log_templates_user_name_unique"
  ON "time_log_templates" ("user_id", "name")
  WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "time_log_templates_seed_name_unique"
  ON "time_log_templates" ("seed_key", "name")
  WHERE "user_id" IS NULL;--> statement-breakpoint

-- Sembrar las 10 plantillas del sistema
INSERT INTO "time_log_templates" ("user_id", "name", "default_title", "default_description", "is_system", "seed_key") VALUES
  (NULL, 'Desarrollo',               'Desarrollo de funcionalidad',     'Implementación, ajuste o mejora de funcionalidades asignadas dentro del sprint.',                       true, 'developer'),
  (NULL, 'Corrección de Bug',        'Corrección de incidencia',         'Análisis, corrección y validación de errores reportados en el sistema.',                                   true, 'developer'),
  (NULL, 'Code review',              'Revisión de código',               'Revisión de pull requests de otros miembros del equipo y retroalimentación técnica.',                    true, 'developer'),
  (NULL, 'Ejecución de Pruebas',     'Ejecución de pruebas funcionales', 'Validación de funcionalidades desarrolladas y verificación de criterios de aceptación.',                true, 'qa'),
  (NULL, 'Reporte de Bug',           'Análisis y reporte de incidencia', 'Identificación, documentación y seguimiento de errores encontrados durante las pruebas.',                true, 'qa'),
  (NULL, 'Diseño de Interfaz',       'Diseño de experiencia e interfaz', 'Creación o ajuste de diseños, flujos y componentes visuales de la aplicación.',                         true, 'designer'),
  (NULL, 'Revisión de Diseño',       'Revisión y validación de propuesta visual', 'Análisis de experiencia de usuario, consistencia visual y validación de requerimientos de diseño.', true, 'designer'),
  (NULL, 'Refinamiento de Backlog',  'Refinamiento de backlog',          'Análisis, definición y ajuste de historias de usuario para próximas iteraciones.',                       true, 'product-owner'),
  (NULL, 'Gestión Funcional',        'Gestión y seguimiento funcional',  'Revisión de avances, validación funcional y coordinación de requerimientos con el equipo.',              true, 'product-owner'),
  (NULL, 'Reunión',                  'Participación en reunión',         'Participación en sesiones de seguimiento, planeación, refinamiento, retrospectiva o coordinación del proyecto.', true, 'global');
