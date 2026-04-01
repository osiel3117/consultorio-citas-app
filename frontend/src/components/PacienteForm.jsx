import { useState, useEffect } from "react";

function PacienteForm({ pacienteEditar, onGuardar, onCancelar }) {
  const [form, setForm] = useState({ nombre: "", telefono: "" });
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (pacienteEditar) {
      setForm({
        nombre: pacienteEditar.nombre || "",
        telefono: pacienteEditar.telefono || "",
      });
      setErrores({});
    } else {
      setForm({ nombre: "", telefono: "" });
      setErrores({});
    }
  }, [pacienteEditar]);

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
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
    await onGuardar(form);
    if (!pacienteEditar) {
      setForm({ nombre: "", telefono: "" });
    }
    setErrores({});
    setEnviando(false);
  };

  return (
    <div className="card">
      <h2>
        {pacienteEditar ? `Editar: ${pacienteEditar.nombre}` : "Nuevo paciente"}
      </h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="pac-nombre">Nombre *</label>
        <input
          id="pac-nombre"
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre completo"
          className={errores.nombre ? "input-error" : ""}
        />
        {errores.nombre && <span className="error-texto">{errores.nombre}</span>}

        <label htmlFor="pac-telefono">Teléfono</label>
        <input
          id="pac-telefono"
          type="tel"
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          placeholder="Ej: 868-123-4567"
        />

        <div className="form-botones">
          <button type="submit" disabled={enviando}>
            {enviando
              ? "Guardando..."
              : pacienteEditar
              ? "Actualizar"
              : "Guardar paciente"}
          </button>
          {pacienteEditar && (
            <button
              type="button"
              className="btn-secundario"
              onClick={onCancelar}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default PacienteForm;