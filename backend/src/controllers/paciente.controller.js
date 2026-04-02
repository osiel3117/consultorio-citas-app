const prisma = require('../config/prisma');

const crearPaciente = async (req, res) => {
  try {
    const { nombre, telefono, email, notas, numeroSesiones } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const paciente = await prisma.paciente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        notas: notas?.trim() || null,
        numeroSesiones: Number(numeroSesiones) || 0,
        estadoPaciente: 'activo',
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
      include: { _count: { select: { citas: true } } },
      orderBy: { nombre: 'asc' },
    });

    res.json(pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

const buscarPacientes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const pacientes = await prisma.paciente.findMany({
      where: {
        nombre: { contains: q.trim(), mode: 'insensitive' },
      },
      orderBy: { nombre: 'asc' },
      take: 10,
    });

    res.json(pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar pacientes' });
  }
};

const actualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, notas, numeroSesiones } = req.body;

    const pacienteExistente = await prisma.paciente.findUnique({
      where: { id: Number(id) },
      select: { id: true },
    });

    if (!pacienteExistente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const paciente = await prisma.paciente.update({
      where: { id: Number(id) },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(notas !== undefined && { notas: notas?.trim() || null }),
        ...(numeroSesiones !== undefined && { numeroSesiones: Number(numeroSesiones) }),
      },
    });

    res.json(paciente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
};

const cambiarEstadoPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoPaciente } = req.body;

    const estadosValidos = ['activo', 'alta', 'reactivado'];
    if (!estadosValidos.includes(estadoPaciente)) {
      return res.status(400).json({ error: 'estadoPaciente no valido. Usa: activo, alta, reactivado' });
    }

    const pacienteExistente = await prisma.paciente.findUnique({
      where: { id: Number(id) },
      select: { id: true },
    });

    if (!pacienteExistente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const paciente = await prisma.paciente.update({
      where: { id: Number(id) },
      data: { estadoPaciente },
    });

    res.json(paciente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar estado del paciente' });
  }
};

const eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const paciente = await prisma.paciente.findUnique({
      where: { id: numId },
      include: { _count: { select: { citas: true } } },
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const teniaCitas = paciente._count.citas > 0;

    // onDelete: Cascade in schema removes all their citas automatically.
    await prisma.paciente.delete({ where: { id: numId } });

    res.json({
      ok: true,
      message: teniaCitas
        ? 'Paciente y sus citas relacionadas eliminados permanentemente.'
        : 'Paciente eliminado.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
  buscarPacientes,
  actualizarPaciente,
  cambiarEstadoPaciente,
  eliminarPaciente,
};
