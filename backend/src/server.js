require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const pacienteRoutes = require('./routes/paciente.routes');
const citaRoutes = require('./routes/cita.routes');

app.use('/api', pacienteRoutes);
app.use('/api', citaRoutes);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API del consultorio funcionando'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});