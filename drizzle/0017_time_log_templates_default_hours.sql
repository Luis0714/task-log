-- Add optional `default_hours` column to time_log_templates.
-- When set, applying a template in /time-log auto-fills the hours field.
-- Nullable: existing rows keep NULL (no default hours), new templates
-- without a value also keep NULL.
--
-- IF NOT EXISTS para que sea idempotente: si la columna ya existe (porque
-- se aplicó vía db:push o manualmente), la migración no falla.

ALTER TABLE "time_log_templates" ADD COLUMN IF NOT EXISTS "default_hours" real;
