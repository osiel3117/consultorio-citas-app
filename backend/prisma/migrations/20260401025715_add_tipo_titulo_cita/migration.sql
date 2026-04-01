-- DropForeignKey
ALTER TABLE "Cita" DROP CONSTRAINT "Cita_pacienteId_fkey";

-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "tipoCita" TEXT NOT NULL DEFAULT 'individual',
ADD COLUMN     "tituloCita" TEXT,
ALTER COLUMN "pacienteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
