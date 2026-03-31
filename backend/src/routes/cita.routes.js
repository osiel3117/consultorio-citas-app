const express = require('express');
const router = express.Router();

const {
  crearCita,
  obtenerCitas
} = require('../controllers/cita.controller');

router.post('/citas', crearCita);
router.get('/citas', obtenerCitas);

module.exports = router;