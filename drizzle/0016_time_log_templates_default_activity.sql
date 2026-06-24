-- Agrega la columna opcional `default_activity` para que las plantillas
-- puedan autocompletar también la actividad del formulario al aplicarse.
-- NULL = la plantilla no fuerza una actividad; el campo queda con el
-- valor que el usuario haya seleccionado o con el default del form.

ALTER TABLE "time_log_templates" ADD COLUMN IF NOT EXISTS "default_activity" text;
