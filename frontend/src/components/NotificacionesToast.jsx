import { useEffect, useState } from "react";

function formatHora12(hora) {
  if (!hora) return "";
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Individual toast card with auto-dismiss and exit animation
function ToastItem({ toast, onCerrar }) {
  const [saliendo, setSaliendo] = useState(false);

  const iniciarCierre = () => {
    if (saliendo) return;
    setSaliendo(true);
    setTimeout(() => onCerrar(toast.id), 280);
  };

  // Auto-dismiss after 12 s
  useEffect(() => {
    const t = setTimeout(iniciarCierre, 12000);
    return () => clearTimeout(t);
    // intentionally not listing iniciarCierre — we want it captured once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textoTiempo =
    toast.minutos <= 0
      ? "iniciando ahora"
      : `inicia en ${toast.etiqueta}`;

  return (
    <div
      className={`toast-cita${saliendo ? " toast-cita-saliendo" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-cita-icono" aria-hidden="true">🔔</div>

      <div className="toast-cita-cuerpo">
        <div className="toast-cita-titulo">Cita próxima</div>
        <div className="toast-cita-nombre">{toast.nombre}</div>
        <div className="toast-cita-subtitulo">
          {textoTiempo} · {formatHora12(toast.hora)}
        </div>
      </div>

      <button
        className="toast-cita-cerrar"
        aria-label="Cerrar notificación"
        onClick={iniciarCierre}
      >
        &times;
      </button>
    </div>
  );
}

// Container — renders all active toasts stacked top-right
function NotificacionesToast({ toasts, onCerrar }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toasts-container" aria-label="Notificaciones">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onCerrar={onCerrar} />
      ))}
    </div>
  );
}

export default NotificacionesToast;
