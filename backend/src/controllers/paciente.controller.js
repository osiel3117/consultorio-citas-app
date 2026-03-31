const prisma = require('../config/prisma');

const crearPaciente = async (req, res) => {
  try {
    const { nombre, telefono, email, notas } = req.body;

    const paciente = await prisma.paciente.create({
      data: {
        nombre,
        telefono,
        email,
        notas,
      },
    });

    res.json(paciente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
};

const obtenerPacientes = async (req, res) => {
  try {
    const pacientes = await prisma.paciente.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    res.json(pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
};