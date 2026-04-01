function getNombreVisible(cita) {
  if (cita.tituloCita) return cita.tituloCita;
  if (cita.paciente?.nombre) return cita.paciente.nombre;
  return "Cita";
}

const TIPO_ETIQUETA = { individual: "Individual", pareja: "Pareja", familiar: "Familiar" };

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

function PopupDiaCitas({ fecha, citas, posicion, onAgregarCita, onVerCita, onCerrar }) {
  const citasDelDia = citas.filter((c) => c.fecha === fecha);

  // Format for display
  const fechaDisplay = (() => {
    if (!fecha) return "";
    const [y, m, d] = fecha.split("-");
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ];
    return `${parseInt(d)} de ${meses[parseInt(m) - 1]} ${y}`;
  })();

  return (
    <div className="popup-overlay" onClick={onCerrar}>
      <div
        className="popup-dia"
        style={posicion ? { top: posicion.top, left: posicion.left } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <h4>{fechaDisplay}</h4>
          <button className="popup-cerrar" onClick={onCerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        {citasDelDia.length === 0 ? (
          <p className="popup-vacio">Sin citas este dia</p>
        ) : (
          <>
            <div className="popup-count">
              {citasDelDia.length} cita{citasDelDia.length !== 1 ? "s" : ""}
            </div>
            <ul className="popup-lista">
              {citasDelDia
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((c) => (
                  <li
                    key={c.id}
                    className="popup-cita popup-cita-clickable"
                    onClick={() => onVerCita && onVerCita(c)}
                    title="Ver detalle"
                  >
                    <div className="popup-cita-main">
                      <span className="popup-hora">{formatearHora(c.hora)}</span>
                      <span className="popup-nombre">{getNombreVisible(c)}</span>
                    </div>
                    <div className="popup-cita-sub">
                      {c.motivo && <span className="popup-motivo">{c.motivo}</span>}
                      <span className={`badge badge-sm badge-tipo-${c.tipoCita || "individual"}`}>
                        {TIPO_ETIQUETA[c.tipoCita] || "Individual"}
                      </span>
                      <span className={`badge badge-sm ${BADGE_ESTADO[c.estado] || "badge-pendiente"}`}>
                        {c.estado}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </>
        )}

        <button
          className="popup-btn-agregar"
          onClick={() => onAgregarCita(fecha)}
        >
          + Agregar cita
        </button>
      </div>
    </div>
  );
}

export default PopupDiaCitas;
