-- Migration: replace soft-delete with hard-delete for Paciente,
--            change Cita FK to CASCADE, fix numeroSesiones to count tomadas.

-- Step 1: Hard-delete any patients that were previously soft-deleted.
--         Delete their citas first to avoid FK violation (SET NULL still active).
DELETE FROM "Cita" WHERE "pacienteId" IN (
  SELECT "id" FROM "Paciente" WHERE "eliminado" = true
);
DELETE FROM "Paciente" WHERE "eliminado" = true;

-- Step 2: Also hard-delete any remaining 'cancelada' citas so the DB is clean.
DELETE FROM "Cita" WHERE "estado" = 'cancelada';

-- Step 3: Reset numeroSesiones = actual count of 'tomada' citas per patient.
UPDATE "Paciente"
SET "numeroSesiones" = (
  SELECT COUNT(*) FROM "Cita"
  WHERE "Cita"."pacienteId" = "Paciente"."id"
    AND "Cita"."estado" = 'tomada'
);

-- Step 4: Drop the eliminado column.
ALTER TABLE "Paciente" DROP COLUMN "eliminado";

-- Step 5: Upgrade FK constraint from SET NULL → CASCADE.
ALTER TABLE "Cita" DROP CONSTRAINT "Cita_pacienteId_fkey";
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_pacienteId_fkey"
  FOREIGN KEY ("pacienteId")
  REFERENCES "Paciente"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
