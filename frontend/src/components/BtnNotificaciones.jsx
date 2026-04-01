import { useEffect, useRef, useState } from "react";
import { pedirPermisoNotificaciones } from "../hooks/useNotificacionesCitas";

// Reads the live Notification.permission value.
// Returns "unsupported" when the API isn't available (older browser, HTTP, etc.).
function leerPermiso() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

function BtnNotificaciones() {
  const [permiso, setPermiso] = useState(leerPermiso);
  const [abierto, setAbierto] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  // Also listen for permission changes via the Permissions API (supported in
  // modern browsers) so the UI updates if the user changes settings externally.
  useEffect(() => {
    if (!("permissions" in navigator)) return;
    let descriptor;
    navigator.permissions
      .query({ name: "notifications" })
      .then((status) => {
        descriptor = status;
        status.onchange = () => setPermiso(leerPermiso());
      })
      .catch(() => {}); // silently ignore if unsupported
    return () => {
      if (descriptor) descriptor.onchange = null;
    };
  }, []);

  const handleSolicitar = async () => {
    setSolicitando(true);
    await pedirPermisoNotificaciones();
    setPermiso(leerPermiso());
    setSolicitando(false);
    // Keep panel open so user can see the result
  };

  // Don't render the button at all if the browser doesn't support the API
  if (permiso === "unsupported") return null;

  const esActivo = permiso === "granted";
  const esBloqueado = permiso === "denied";

  return (
    <div className="btn-notif-container">
      <button
        ref={btnRef}
        className={[
          "btn-notif",
          esActivo ? "btn-notif-activa" : "",
          esBloqueado ? "btn-notif-bloqueada" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={
          esActivo
            ? "Notificaciones del navegador activas"
            : esBloqueado
            ? "Notificaciones bloqueadas"
            : "Activar notificaciones del navegador"
        }
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        title={
          esActivo
            ? "Notificaciones activas"
            : esBloqueado
            ? "Notificaciones bloqueadas"
            : "Activar notificaciones"
        }
      >
        {esBloqueado ? "🔕" : "🔔"}
        {esActivo && <span className="btn-notif-punto" aria-hidden="true" />}
      </button>

      {abierto && (
        <div ref={panelRef} className="btn-notif-panel" role="dialog" aria-label="Estado de notificaciones">
          {esActivo && (
            <>
              <p className="btn-notif-estado btn-notif-estado-ok">
                ✓ Notificaciones activas
              </p>
              <p className="btn-notif-desc">
                Recibirás avisos del sistema cuando una cita esté próxima, incluso si la pestaña está en segundo plano.
              </p>
            </>
          )}

          {permiso === "default" && (
            <>
              <p className="btn-notif-estado">Notificaciones del sistema</p>
              <p className="btn-notif-desc">
                Recibe avisos del navegador para citas próximas, aunque la app esté minimizada.
              </p>
              <button
                className="btn-notif-accion"
                disabled={solicitando}
                onClick={handleSolicitar}
              >
                {solicitando ? "Solicitando…" : "Activar notificaciones"}
              </button>
            </>
          )}

          {esBloqueado && (
            <>
              <p className="btn-notif-estado btn-notif-estado-err">
                ✗ Notificaciones bloqueadas
              </p>
              <p className="btn-notif-desc">
                Para activarlas, haz clic en el candado o ícono de información en la barra de tu navegador y permite las notificaciones de este sitio.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BtnNotificaciones;
