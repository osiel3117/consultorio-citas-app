import { useEffect, useRef, useState } from "react";
import {
  leerPermisoNotificacionesSeguro,
  pedirPermisoNotificaciones,
} from "../hooks/useNotificacionesCitas";

function leerPermiso() {
  return leerPermisoNotificacionesSeguro();
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
    if (typeof document === "undefined") return;

    const handler = (e) => {
      try {
        if (
          panelRef.current &&
          !panelRef.current.contains(e.target) &&
          btnRef.current &&
          !btnRef.current.contains(e.target)
        ) {
          setAbierto(false);
        }
      } catch (error) {
        console.error("[notificaciones] fallo en listener de cierre del panel", error);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  // Also listen for permission changes via the Permissions API (supported in
  // modern browsers) so the UI updates if the user changes settings externally.
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!navigator?.permissions?.query) return;

    let descriptor;

    navigator.permissions
      .query({ name: "notifications" })
      .then((status) => {
        try {
          descriptor = status;
          status.onchange = () => {
            try {
              setPermiso(leerPermiso());
            } catch (error) {
              console.error("[notificaciones] fallo al sincronizar permiso desde listener", error);
            }
          };
        } catch (error) {
          console.error("[notificaciones] fallo al registrar listener de permissions", error);
        }
      })
      .catch((error) => {
        console.error("[notificaciones] fallo al consultar navigator.permissions.query", error);
      });

    return () => {
      try {
        if (descriptor) descriptor.onchange = null;
      } catch (error) {
        console.error("[notificaciones] fallo al limpiar listener de permissions", error);
      }
    };
  }, []);

  const handleSolicitar = async () => {
    try {
      setSolicitando(true);
      await pedirPermisoNotificaciones();
    } catch (error) {
      console.error("[notificaciones] fallo al pedir permiso desde el boton", error);
    } finally {
      try {
        setPermiso(leerPermiso());
      } catch (error) {
        console.error("[notificaciones] fallo al actualizar el estado del permiso despues de granted", error);
        setPermiso("unsupported");
      }
      setSolicitando(false);
    }
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
