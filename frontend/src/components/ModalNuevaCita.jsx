import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3000/api";

const TIPO_OPCIONES = [
  { valor: "individual", etiqueta: "Individual" },
  { valor: "pareja",     etiqueta: "Pareja" },
  { valor: "familiar",   etiqueta: "Familiar" },
];

function ModalNuevaCita({ fecha, hora, onGuardar, onCerrar }) {
  const [tipoCita, setTipoCita] = useState("individual");

  // Individual: patient autocomplete
  const [nombre, setNombre] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  // Pareja / familiar: free-text title
  const [tituloCita, setTituloCita] = useState("");

  const [horaVal, setHoraVal] = useState(hora || "");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const sugerenciasRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [tipoCita]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(e.target) &&
        e.target !== inputRef.current
      ) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buscarPacientes = async (q) => {
    if (q.length < 2) { setSugerencias([]); setMostrarSugerencias(false); return; }
    try {
      const res = await fetch(`${API}/pacientes/buscar?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSugerencias(data);
      setMostrarSugerencias(data.length > 0);
    } catch {
      setSugerencias([]);
    }
  };

  const handleNombreChange = (e) => {
    const val = e.target.value;
    setNombre(val);
    setPacienteSeleccionado(null);
    buscarPacientes(val);
  };

  const seleccionarPaciente = (p) => {
    setNombre(p.nombre);
    setPacienteSeleccionado(p);
    setMostrarSugerencias(false);
  };

  const cambiarTipo = (tipo) => {
    setTipoCita(tipo);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!horaVal) { setError("Selecciona una hora"); return; }

    let body;
    if (tipoCita === "individual") {
      if (!nombre.trim()) { setError("Escribe el nombre del paciente"); return; }
      body = { nombrePaciente: nombre.trim(), tipoCita, fecha, hora: horaVal, motivo: motivo.trim() || null };
    } else {
      if (!tituloCita.trim()) { setError("Escribe el nombre de la cita"); return; }
      body = { tituloCita: tituloCita.trim(), tipoCita, fecha, hora: horaVal, motivo: motivo.trim() || null };
    }

    setError("");
    setEnviando(true);

    try {
      const res = await fetch(`${API}/citas/rapida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }
      const cita = await res.json();
      onGuardar(cita);
    } catch (err) {
      setError(err.message || "No se pudo guardar la cita");
      setEnviando(false);
    }
  };

  const fechaDisplay = (() => {
    if (!fecha) return "";
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}`;
  })();

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nueva cita</h3>
          <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className="modal-fecha-info">
          <span className="modal-fecha-badge">{fechaDisplay}</span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Tipo de cita selector */}
          <label>Tipo de cita</label>
          <div className="tipo-selector">
            {TIPO_OPCIONES.map((op) => (
              <button
                key={op.valor}
                type="button"
                className={`tipo-btn${tipoCita === op.valor ? " tipo-btn-activo" : ""}`}
                onClick={() => cambiarTipo(op.valor)}
              >
                {op.etiqueta}
              </button>
            ))}
          </div>

          {/* Individual â€” patient autocomplete */}
          {tipoCita === "individual" && (
            <div className="campo-autocomplete">
              <label htmlFor="modal-nombre">Paciente *</label>
              <input
                ref={inputRef}
                id="modal-nombre"
                type="text"
                value={nombre}
                onChange={handleNombreChange}
                placeholder="Escribe el nombre del paciente..."
                autoComplete="off"
              />
              {mostrarSugerencias && (
                <ul className="sugerencias" ref={sugerenciasRef}>
                  {sugerencias.map((p) => (
                    <li key={p.id} onClick={() => seleccionarPaciente(p)}>
                      <span className="sug-nombre">{p.nombre}</span>
                      {p.telefono && <span className="sug-detalle">{p.telefono}</span>}
                      <span className="sug-sesiones">
                        {p.numeroSesiones} sesion{p.numeroSesiones !== 1 ? "es" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {nombre.trim().length >= 2 && !pacienteSeleccionado && sugerencias.length === 0 && (
                <div className="nuevo-paciente-aviso">
                  Se creara un nuevo paciente: <strong>{nombre.trim()}</strong>
                </div>
              )}
            </div>
          )}

          {/* Pareja / Familiar â€” free-text title */}
          {(tipoCita === "pareja" || tipoCita === "familiar") && (
            <div>
              <label htmlFor="modal-titulo">
                {tipoCita === "pareja" ? "Nombres de la pareja *" : "Nombre familiar *"}
              </label>
              <input
                ref={inputRef}
                id="modal-titulo"
                type="text"
                value={tituloCita}
                onChange={(e) => setTituloCita(e.target.value)}
                placeholder={tipoCita === "pareja" ? "Ej: Juan y MarÃ­a" : "Ej: Familia PÃ©rez"}
                autoComplete="off"
              />
            </div>
          )}

          <label htmlFor="modal-hora">Hora *</label>
          <input
            id="modal-hora"
            type="time"
            value={horaVal}
            onChange={(e) => setHoraVal(e.target.value)}
          />

          <label htmlFor="modal-motivo">Motivo</label>
          <input
            id="modal-motivo"
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de consulta (opcional)"
          />

          {error && <div className="modal-error">{error}</div>}

          <button type="submit" disabled={enviando}>
            {enviando ? "Guardando..." : "Agendar cita"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModalNuevaCita;

