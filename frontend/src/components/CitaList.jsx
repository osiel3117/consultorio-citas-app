import { useState } from "react";
import { API } from "../config/api";

function formatearFecha(fecha) {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function formatearHora(hora) {
  if (!hora) return "";
  const [h, min] = hora.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${hr12}:${min} ${ampm}`;
}

const BADGE_ESTADO = {
  pendiente: "badge-pendiente",
  tomada: "badge-tomada",
  cancelada: "badge-cancelada",
  reagendada: "badge-reagendada",
};

const TIPO_ETIQUETA = { individual: "Individual", pareja: "Pareja", familiar: "Familiar" };

function getNombreVisible(cita) {
  if (cita.tituloCita) return cita.tituloCita;
  if (cita.paciente?.nombre) return cita.paciente.nombre;
  return "Cita";
}

function CitaList({ citas, cargando, onVerCita, onActualizar }) {
  const [actualizando, setActualizando] = useState(null); // id of cita being updated

  const cambiarEstado = async (e, cita, estado) => {
    e.stopPropagation();
    setActualizando(cita.id);
    try {
      const res = await fetch(`${API}/citas/${cita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onActualizar && onActualizar(updated);
    } catch {
      // Error is surfaced by App.jsx after cargarCitas fails
    } finally {
      setActualizando(null);
    }
  };

  if (cargando) {
    return (
      <div className="card">
        <h2>Citas</h2>
        <p className="vacio">Cargando citas...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Citas programadas ({citas.length})</h2>
      {citas.length === 0 ? (
        <p className="vacio">No hay citas registradas aún</p>
      ) : (
        <ul className="lista">
          {citas.map((c) => {
            const editable = c.estado === "pendiente" || c.estado === "reagendada";
            const ocupado = actualizando === c.id;
            return (
              <li
                key={c.id}
                className={`item-lista${onVerCita ? " item-lista-clickable" : ""}`}
                onClick={() => onVerCita && onVerCita(c)}
              >
                <div className="item-lista-row">
                  <div className="item-principal">
                    {getNombreVisible(c)}
                  </div>
                  <div className="item-badges">
                    <span className={`badge badge-sm badge-tipo-${c.tipoCita || "individual"}`}>
                      {TIPO_ETIQUETA[c.tipoCita] || "Individual"}
                    </span>
                    <span className={`badge ${BADGE_ESTADO[c.estado] || "badge-pendiente"}`}>
                      {c.estado}
                    </span>
                  </div>
                </div>

                <div className="item-secundario">
                  📅 {formatearFecha(c.fecha)} — 🕐 {formatearHora(c.hora)}
                </div>
                {c.motivo && (
                  <div className="item-secundario">📝 {c.motivo}</div>
                )}

                {/* Inline quick actions for actionable states */}
                {editable && (
                  <div className="item-acciones" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-mini btn-mini-tomada"
                      disabled={ocupado}
                      onClick={(e) => cambiarEstado(e, c, "tomada")}
                    >
                      Tomada
                    </button>
                    <button
                      className="btn-mini btn-mini-cancelar"
                      disabled={ocupado}
                      onClick={(e) => cambiarEstado(e, c, "cancelada")}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-mini btn-mini-reagendar"
                      disabled={ocupado}
                      onClick={(e) => { e.stopPropagation(); onVerCita && onVerCita(c); }}
                    >
                      Reagendar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CitaList;

