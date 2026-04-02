const express = require('express');
const router = express.Router();

const {
  crearCita,
  crearCitaRapida,
  obtenerCitas,
  actualizarCita,
  eliminarCita,
} = require('../controllers/cita.controller');

router.post('/citas', crearCita);
router.post('/citas/rapida', crearCitaRapida);
router.get('/citas', obtenerCitas);
router.patch('/citas/:id', actualizarCita);
router.delete('/citas/:id', eliminarCita);

module.exports = router;