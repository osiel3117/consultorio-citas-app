const express = require('express');
const router = express.Router();

const {
  crearCita,
  crearCitaRapida,
  obtenerCitas,
  actualizarCita
} = require('../controllers/cita.controller');

router.post('/citas', crearCita);
router.post('/citas/rapida', crearCitaRapida);
router.get('/citas', obtenerCitas);
router.patch('/citas/:id', actualizarCita);

module.exports = router;