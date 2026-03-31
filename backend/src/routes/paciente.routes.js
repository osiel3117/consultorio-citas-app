const express = require('express');
const router = express.Router();

const {
  crearPaciente,
  obtenerPacientes,
} = require('../controllers/paciente.controller');

router.post('/pacientes', crearPaciente);
router.get('/pacientes', obtenerPacientes);

module.exports = router;