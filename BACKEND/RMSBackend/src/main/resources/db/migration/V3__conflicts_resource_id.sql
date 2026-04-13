-- Optional resource id for overlap conflicts (dedupe / display)
ALTER TABLE conflicts ADD COLUMN IF NOT EXISTS resource_id text;
