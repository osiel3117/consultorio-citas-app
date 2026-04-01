const express = require('express');
const router = express.Router();

const {
  crearPaciente,
  obtenerPacientes,
  buscarPacientes,
  actualizarPaciente,
  cambiarEstadoPaciente,
  eliminarPaciente,
} = require('../controllers/paciente.controller');

router.get('/pacientes/buscar', buscarPacientes);
router.get('/pacientes', obtenerPacientes);
router.post('/pacientes', crearPaciente);
router.put('/pacientes/:id', actualizarPaciente);
router.patch('/pacientes/:id/estado', cambiarEstadoPaciente);
router.delete('/pacientes/:id', eliminarPaciente);

module.exports = router;