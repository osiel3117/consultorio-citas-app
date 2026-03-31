const prisma = require('../config/prisma');

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

    if (!pacienteExiste) {
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
      }
    });

    res.json(cita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
};

const obtenerCitas = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        paciente: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    res.json(citas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

module.exports = {
  crearCita,
  obtenerCitas
};