ALTER TABLE "project_configurations"
  ADD COLUMN IF NOT EXISTS "remaining_work_field" text DEFAULT 'Microsoft.VSTS.Scheduling.RemainingWork';
