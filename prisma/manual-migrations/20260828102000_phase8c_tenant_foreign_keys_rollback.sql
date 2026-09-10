-- Run only after reverting Phase 8E nullability. Drops only Phase 8 constraints.
DO $rollback$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE conname LIKE 'fk\_%\_club' ESCAPE '\'
       OR conname LIKE 'fk\_%\_tenant\_%' ESCAPE '\'
       OR conname LIKE 'ck\_%\_club\_id\_nn' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.table_name, item.conname);
  END LOOP;
END
$rollback$;
