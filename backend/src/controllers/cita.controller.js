const prisma = require('../config/prisma');

// ---------------------------------------------------------------------------
// Helpers — timezone-safe expiry check using America/Matamoros as reference
// ---------------------------------------------------------------------------

/**
 * Returns the current date and time strings in America/Matamoros.
 * Uses Intl.DateTimeFormat with hourCycle 'h23' so midnight is "00", not "24".
 * @returns {{ fecha: string, hora: string }}  e.g. { fecha: "2026-03-31", hora: "14:05" }
 */
function nowEnMatamoros() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Matamoros',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return {
    fecha: `${parts.year}-${parts.month}-${parts.day}`,
    hora: `${parts.hour}:${parts.minute}`,
  };
}

/**
 * Returns true when the appointment's fecha+hora has already passed
 * compared to the current moment in America/Matamoros.
 * Both fecha and hora are stored as plain strings (YYYY-MM-DD / HH:MM)
 * so lexicographic comparison is valid and avoids any UTC conversion.
 */
function citaYaPaso(fechaCita, horaCita) {
  const { fecha: hoy, hora: ahora } = nowEnMatamoros();
  if (fechaCita < hoy) return true;
  if (fechaCita === hoy && horaCita < ahora) return true;
  return false;
}

// ---------------------------------------------------------------------------

const crearCita = async (req, res) => {
  try {
    const { pacienteId, fecha, hora, motivo } = req.body;

    if (!pacienteId || !fecha || !hora) {
      return res.status(400).json({
        error: 'pacienteId, fecha y hora son obligatorios'
      });
    }

    const pacienteExiste = await prisma.paciente.findUnique({
      where: { id: Number(pacienteId) }
    });

    if (!pacienteExiste || pacienteExiste.eliminado) {
      return res.status(404).json({
        error: 'El paciente no existe'
      });
    }

    const cita = await prisma.cita.create({
      data: {
        pacienteId: Number(pacienteId),
        fecha,
        hora,
        motivo,
        zonaHoraria: 'America/Matamoros',
        estado: 'pendiente'
      },
      include: { paciente: true }
    });

    // Incrementar numero de sesiones del paciente
    await prisma.paciente.update({
      where: { id: Number(pacienteId) },
      data: { numeroSesiones: { increment: 1 } }
    });

    res.json(cita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
};

// Crear cita directamente por nombre de paciente — busca o crea el paciente
// Para pareja/familiar: solo tituloCita, sin pacienteId
const crearCitaRapida = async (req, res) => {
  try {
    const { nombrePaciente, tituloCita, tipoCita = 'individual', fecha, hora, motivo } = req.body;

    if (!fecha || !hora) {
      return res.status(400).json({ error: 'fecha y hora son obligatorios' });
    }

    const tiposValidos = ['individual', 'pareja', 'familiar'];
    if (!tiposValidos.includes(tipoCita)) {
      return res.status(400).json({ error: 'tipoCita no valido. Usa: individual, pareja, familiar' });
    }

    // --- Cita de pareja o familiar ---
    if (tipoCita === 'pareja' || tipoCita === 'familiar') {
      if (!tituloCita?.trim()) {
        return res.status(400).json({ error: 'tituloCita es obligatorio para citas de pareja o familiar' });
      }

      const cita = await prisma.cita.create({
        data: {
          tipoCita,
          tituloCita: tituloCita.trim(),
          fecha,
          hora,
          motivo: motivo?.trim() || null,
          zonaHoraria: 'America/Matamoros',
          estado: 'pendiente',
        },
        include: { paciente: true },
      });

      return res.json(cita);
    }

    // --- Cita individual ---
    const nombre = nombrePaciente?.trim();
    if (!nombre) {
      return res.status(400).json({ error: 'nombrePaciente es obligatorio para citas individuales' });
    }

    // Buscar paciente existente (coincidencia exacta insensible a mayusculas)
    let paciente = await prisma.paciente.findFirst({
      where: {
        eliminado: false,
        nombre: { equals: nombre, mode: 'insensitive' },
      }
    });

    // Si no existe, crear uno nuevo
    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: { nombre, eliminado: false },
      });
    }

    const cita = await prisma.cita.create({
      data: {
        pacienteId: paciente.id,
        tipoCita: 'individual',
        fecha,
        hora,
        motivo: motivo?.trim() || null,
        zonaHoraria: 'America/Matamoros',
        estado: 'pendiente',
      },
      include: { paciente: true },
    });

    // Incrementar sesiones
    await prisma.paciente.update({
      where: { id: paciente.id },
      data: { numeroSesiones: { increment: 1 } },
    });

    res.json(cita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cita rapida' });
  }
};

const obtenerCitas = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({
      where: { estado: { not: 'cancelada' } },
      include: { paciente: true },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    });

    // Auto-transition: pendiente or reagendada citas whose fecha+hora has
    // already passed in America/Matamoros → mark as tomada.
    // cancelada is never touched. reagendada that hasn't passed yet is kept.
    const vencidas = citas.filter(
      (c) =>
        (c.estado === 'pendiente' || c.estado === 'reagendada') &&
        citaYaPaso(c.fecha, c.hora)
    );

    if (vencidas.length > 0) {
      await prisma.cita.updateMany({
        where: { id: { in: vencidas.map((c) => c.id) } },
        data: { estado: 'tomada' },
      });
      // Patch in memory so this response is already correct
      vencidas.forEach((c) => {
        c.estado = 'tomada';
      });
    }

    res.json(citas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

const actualizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha, hora, motivo, tipoCita, tituloCita } = req.body;

    const estadosValidos = ['pendiente', 'tomada', 'cancelada', 'reagendada'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no valido' });
    }

    const tiposValidos = ['individual', 'pareja', 'familiar'];
    if (tipoCita && !tiposValidos.includes(tipoCita)) {
      return res.status(400).json({ error: 'tipoCita no valido' });
    }

    const data = {};
    if (estado !== undefined) data.estado = estado;
    if (fecha !== undefined) data.fecha = fecha;
    if (hora !== undefined) data.hora = hora;
    if (motivo !== undefined) data.motivo = motivo?.trim() || null;
    if (tipoCita !== undefined) data.tipoCita = tipoCita;
    if (tituloCita !== undefined) data.tituloCita = tituloCita?.trim() || null;

    const cita = await prisma.cita.update({
      where: { id: Number(id) },
      data,
      include: { paciente: true }
    });

    res.json(cita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};

module.exports = {
  crearCita,
  crearCitaRapida,
  obtenerCitas,
  actualizarCita
};