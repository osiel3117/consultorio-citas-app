import { useState } from "react";

const FORM_INICIAL = { pacienteId: "", fecha: "", hora: "", motivo: "" };

function CitaForm({ pacientes, onGuardar }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});

  const validar = () => {
    const e = {};
    if (!form.pacienteId) e.pacienteId = "Selecciona un paciente";
    if (!form.fecha) e.fecha = "La fecha es obligatoria";
    if (!form.hora) e.hora = "La hora es obligatoria";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errores[name]) setErrores({ ...errores, [name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e_ = validar();
    if (Object.keys(e_).length > 0) { setErrores(e_); return; }
    setEnviando(true);
    await onGuardar({ ...form, pacienteId: Number(form.pacienteId) });
    setForm(FORM_INICIAL);
    setErrores({});
    setEnviando(false);
  };

  return (
    <div className="card">
      <h2>Nueva cita</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="cita-paciente">Paciente *</label>
        <select
          id="cita-paciente"
          name="pacienteId"
          value={form.pacienteId}
          onChange={handleChange}
          className={errores.pacienteId ? "input-error" : ""}
        >
          <option value="">-- Selecciona un paciente --</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errores.pacienteId && <span className="error-texto">{errores.pacienteId}</span>}

        <label htmlFor="cita-fecha">Fecha *</label>
        <input
          id="cita-fecha"
          type="date"
          name="fecha"
          value={form.fecha}
          onChange={handleChange}
          className={errores.fecha ? "input-error" : ""}
        />
        {errores.fecha && <span className="error-texto">{errores.fecha}</span>}

        <label htmlFor="cita-hora">Hora *</label>
        <input
          id="cita-hora"
          type="time"
          name="hora"
          value={form.hora}
          onChange={handleChange}
          className={errores.hora ? "input-error" : ""}
        />
        {errores.hora && <span className="error-texto">{errores.hora}</span>}

        <label htmlFor="cita-motivo">Motivo de consulta</label>
        <input
          id="cita-motivo"
          type="text"
          name="motivo"
          value={form.motivo}
          onChange={handleChange}
          placeholder="Describe brevemente el motivo"
        />

        <button type="submit" disabled={enviando || pacientes.length === 0}>
          {enviando ? "Guardando..." : "Guardar cita"}
        </button>

        {pacientes.length === 0 && (
          <p className="aviso">Registra al menos un paciente antes de crear citas</p>
        )}
      </form>
    </div>
  );
}

export default CitaForm;
