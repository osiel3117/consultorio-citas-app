import { useState } from "react";
import { API } from "../config/api";

function formatearFechaLarga(fecha) {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
}

function formatearHora(hora) {
  if (!hora) return "";
  const [h, min] = hora.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${hr12}:${min} ${ampm}`;
}

const ETIQUETA_ESTADO = {
  pendiente: "Pendiente",
  tomada: "Tomada",
  reagendada: "Reagendada",
};

const ETIQUETA_TIPO = { individual: "Individual", pareja: "Pareja", familiar: "Familiar" };

function getNombreVisible(cita) {
  if (cita.tituloCita) return cita.tituloCita;
  if (cita.paciente?.nombre) return cita.paciente.nombre;
  return "Cita";
}

// Returns "11:00 a. m." or "12:00 p. m." from a "HH:MM" string.
// Uses literal a. m. / p. m. punctuation as per Spanish orthography.
function formatearHoraWA(hora) {
  if (!hora) return "";
  const [h, min] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const hr12 = h % 12 || 12;
  return `${hr12}:${String(min).padStart(2, "0")} ${ampm}`;
}

// Adds 1 hour to a "HH:MM" string, clamping at 23:59.
function horaFin(hora) {
  if (!hora) return "";
  const [h, min] = hora.split(":").map(Number);
  const hFin = Math.min(h + 1, 23);
  return `${String(hFin).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// Returns "sábado, 28 de junio" from a "YYYY-MM-DD" string.
// Uses Intl with the stored date interpreted in America/Matamoros so the
// displayed weekday/day/month always matches the scheduled date — not a UTC drift.
function formatearFechaWA(fecha) {
  if (!fecha) return "";
  // Append T12:00:00 in Matamoros time so the date never shifts across midnight.
  const dt = new Date(`${fecha}T12:00:00`);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Matamoros",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dt);
}

function compartirWhatsApp(cita) {
  const nombre = getNombreVisible(cita);
  const inicio = formatearHoraWA(cita.hora);
  const fin = formatearHoraWA(horaFin(cita.hora));
  const fecha = formatearFechaWA(cita.fecha);
  const texto = `*Datos de la cita*\n${inicio} - ${fin} ${fecha}: ${nombre}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
}

function ModalDetalleCita({ cita, onCerrar, onActualizar, onEliminar }) {
  const [reagendando, setReagendando] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(cita.fecha);
  const [nuevaHora, setNuevaHora] = useState(cita.hora);
  const [nuevoMotivo, setNuevoMotivo] = useState(cita.motivo || "");
  const [nuevoTipo, setNuevoTipo] = useState(cita.tipoCita || "individual");
  const [nuevoTitulo, setNuevoTitulo] = useState(cita.tituloCita || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const accionarEstado = async (estado, extra = {}) => {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(`${API}/citas/${cita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar");
      }
      const updated = await res.json();
      onActualizar(updated);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cita");
      setGuardando(false);
    }
  };

  const handleConfirmarCancelar = async () => {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(`${API}/citas/${cita.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar");
      }
      onEliminar();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la cita");
      setGuardando(false);
      setConfirmandoCancelar(false);
    }
  };

  const handleReagendar = () => {
    if (!nuevaFecha || !nuevaHora) {
      setError("Ingresa fecha y hora para reagendar");
      return;
    }
    accionarEstado("reagendada", {
      fecha: nuevaFecha,
      hora: nuevaHora,
      motivo: nuevoMotivo.trim() || null,
      tipoCita: nuevoTipo,
      tituloCita: (nuevoTipo !== "individual" && nuevoTitulo.trim()) ? nuevoTitulo.trim() : undefined,
    });
  };

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalle de cita</h3>
          <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className="detalle-cuerpo">
          <div className="detalle-paciente">
            {getNombreVisible(cita)}
          </div>

          <div className="detalle-fila">
            <span className="detalle-etiqueta">Tipo</span>
            <span className={`badge badge-tipo-${cita.tipoCita || "individual"}`}>
              {ETIQUETA_TIPO[cita.tipoCita] || "Individual"}
            </span>
          </div>

          {cita.paciente?.nombre && cita.tipoCita === "individual" && (
            <div className="detalle-fila">
              <span className="detalle-etiqueta">Paciente</span>
              <span className="detalle-valor">{cita.paciente.nombre}</span>
            </div>
          )}

          <div className="detalle-fila">
            <span className="detalle-etiqueta">Fecha</span>
            <span className="detalle-valor">{formatearFechaLarga(cita.fecha)}</span>
          </div>

          <div className="detalle-fila">
            <span className="detalle-etiqueta">Hora</span>
            <span className="detalle-valor">{formatearHora(cita.hora)}</span>
          </div>

          {cita.motivo && (
            <div className="detalle-fila">
              <span className="detalle-etiqueta">Motivo</span>
              <span className="detalle-valor">{cita.motivo}</span>
            </div>
          )}

          <div className="detalle-fila">
            <span className="detalle-etiqueta">Estado</span>
            <span className={`badge badge-${cita.estado}`}>
              {ETIQUETA_ESTADO[cita.estado] || cita.estado}
            </span>
          </div>

          {error && <p className="modal-error">{error}</p>}

          {/* Note for tomada citas */}
          {cita.estado === "tomada" && !reagendando && !confirmandoCancelar && (
            <p className="detalle-cerrado">
              Esta cita ya fue tomada. Puedes corregirla aquí si fue un error.
            </p>
          )}

          {/* Inline cancel confirmation */}
          {confirmandoCancelar && (
            <div className="confirmar-cancelar-cita">
              <p className="confirmar-cancelar-texto">
                ¿Seguro que deseas cancelar esta cita? Esta acción la eliminará por completo y no se puede deshacer.
              </p>
              <div className="confirmar-cancelar-botones">
                <button
                  className="btn-accion btn-cancelar"
                  disabled={guardando}
                  onClick={handleConfirmarCancelar}
                >
                  Sí, eliminar
                </button>
                <button
                  className="btn-accion btn-secundario"
                  disabled={guardando}
                  onClick={() => setConfirmandoCancelar(false)}
                >
                  Volver
                </button>
              </div>
            </div>
          )}

          {/* Action buttons — available for all states */}
          {!reagendando && !confirmandoCancelar && (
            <div className="detalle-acciones">
              {cita.estado !== "tomada" && (
                <button
                  className="btn-accion btn-tomada"
                  disabled={guardando}
                  onClick={() => accionarEstado("tomada")}
                >
                  Marcar como tomada
                </button>
              )}
              {cita.estado === "tomada" && (
                <button
                  className="btn-accion btn-reagendar"
                  disabled={guardando}
                  onClick={() => accionarEstado("pendiente")}
                >
                  Revertir a pendiente
                </button>
              )}
              <button
                className="btn-accion btn-reagendar"
                disabled={guardando}
                onClick={() => setReagendando(true)}
              >
                Reagendar
              </button>
              <button
                className="btn-accion btn-cancelar"
                disabled={guardando}
                onClick={() => setConfirmandoCancelar(true)}
              >
                Cancelar cita
              </button>
              <button
                className="btn-accion btn-whatsapp"
                onClick={() => compartirWhatsApp(cita)}
              >
                Compartir por WhatsApp
              </button>
            </div>
          )}

          {/* Reschedule inline form */}
          {reagendando && (
            <div className="reagendar-form">
              <h4 className="reagendar-titulo">Nueva fecha y hora</h4>

              <label htmlFor="det-fecha">Fecha</label>
              <input
                id="det-fecha"
                type="date"
                value={nuevaFecha}
                min={hoy}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />

              <label htmlFor="det-hora">Hora</label>
              <input
                id="det-hora"
                type="time"
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
              />

              <label htmlFor="det-motivo">Motivo (opcional)</label>
              <input
                id="det-motivo"
                type="text"
                value={nuevoMotivo}
                placeholder="Motivo de la consulta..."
                onChange={(e) => setNuevoMotivo(e.target.value)}
              />

              <label>Tipo de cita</label>
              <div className="tipo-selector tipo-selector-sm">
                {["individual","pareja","familiar"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tipo-btn${nuevoTipo === t ? " tipo-btn-activo" : ""}`}
                    onClick={() => setNuevoTipo(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {(nuevoTipo === "pareja" || nuevoTipo === "familiar") && (
                <>
                  <label htmlFor="det-titulo">
                    {nuevoTipo === "pareja" ? "Nombres de la pareja" : "Nombre familiar"}
                  </label>
                  <input
                    id="det-titulo"
                    type="text"
                    value={nuevoTitulo}
                    placeholder={nuevoTipo === "pareja" ? "Ej: Juan y María" : "Ej: Familia Pérez"}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                  />
                </>
              )}

              <div className="reagendar-botones">
                <button
                  className="btn-accion btn-tomada"
                  disabled={guardando}
                  onClick={handleReagendar}
                >
                  Confirmar reagendado
                </button>
                <button
                  className="btn-accion btn-secundario"
                  disabled={guardando}
                  onClick={() => {
                    setReagendando(false);
                    setNuevaFecha(cita.fecha);
                    setNuevaHora(cita.hora);
                    setNuevoMotivo(cita.motivo || "");
                    setNuevoTipo(cita.tipoCita || "individual");
                    setNuevoTitulo(cita.tituloCita || "");
                    setError("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

export default ModalDetalleCita;
