import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Timezone helper — mirrors cita.controller.js exactly (en-CA, h23)
// ---------------------------------------------------------------------------
function nowEnMatamoros() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Matamoros",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return {
    fecha: `${parts.year}-${parts.month}-${parts.day}`,
    hora: `${parts.hour}:${parts.minute}`,
  };
}

// ---------------------------------------------------------------------------
// Returns how many whole minutes remain until the cita starts.
// Positive  = still in the future
// Zero      = starting right now
// Negative  = already started / past
// Uses string comparison only — consistent with the rest of the app.
// ---------------------------------------------------------------------------
function minutosHasta(fechaCita, horaCita, ahora) {
  if (fechaCita > ahora.fecha) return Infinity;   // future day
  if (fechaCita < ahora.fecha) return -Infinity;  // past day

  // Same calendar day — direct minute arithmetic
  const [h1, m1] = horaCita.split(":").map(Number);
  const [h2, m2] = ahora.hora.split(":").map(Number);
  return h1 * 60 + m1 - (h2 * 60 + m2);
}

function getNombreVisible(cita) {
  if (cita.tituloCita) return cita.tituloCita;
  if (cita.paciente?.nombre) return cita.paciente.nombre;
  return "Cita";
}

// ---------------------------------------------------------------------------
// Thresholds — add / remove entries here to change when alerts fire.
// "umbral": fire the first time remaining minutes drop to <= this value.
// ---------------------------------------------------------------------------
const ALERTAS = [
  { umbral: 15, etiqueta: "15 min" },
  { umbral: 5,  etiqueta: "5 min"  },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotificacionesCitas(citas) {
  const [toasts, setToasts] = useState([]);

  // Set of "citaId-umbral" keys already fired in this session.
  // useRef so it survives re-renders without causing them.
  const disparadas = useRef(new Set());

  const revisar = useCallback(() => {
    const ahora = nowEnMatamoros();
    const nuevos = [];

    citas.forEach((cita) => {
      // Only alert for upcoming pending citas
      if (cita.estado !== "pendiente") return;

      const minutos = minutosHasta(cita.fecha, cita.hora, ahora);

      ALERTAS.forEach(({ umbral, etiqueta }) => {
        const key = `${cita.id}-${umbral}`;

        // Skip if already fired, or too far in the future, or already past
        if (disparadas.current.has(key)) return;
        if (minutos > umbral) return;
        if (minutos < -2) return; // cita ended > 2 min ago — ignore

        disparadas.current.add(key);

        nuevos.push({
          id: `${key}-${Date.now()}`,
          citaId: cita.id,
          nombre: getNombreVisible(cita),
          hora: cita.hora,
          etiqueta,
          minutos: Math.max(0, minutos),
        });
      });
    });

    if (nuevos.length === 0) return;

    setToasts((prev) => [...prev, ...nuevos]);

    // Browser notifications (no-op if permission not granted — see below)
    nuevos.forEach(enviarNotificacionNavegador);
  }, [citas]);

  useEffect(() => {
    revisar();                                    // immediate check on mount / citas change
    const id = setInterval(revisar, 30_000);      // then every 30 s
    return () => clearInterval(id);
  }, [revisar]);

  const cerrar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, cerrar };
}

// ---------------------------------------------------------------------------
// Browser Notification API — prepared but opt-in
// Call pedirPermisoNotificaciones() from a user gesture to enable.
// ---------------------------------------------------------------------------
export async function pedirPermisoNotificaciones() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function formatHora12(hora) {
  if (!hora) return "";
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function enviarNotificacionNavegador({ nombre, etiqueta, hora }) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification("Cita próxima", {
    body: `${nombre} — inicia en ${etiqueta} (${formatHora12(hora)})`,
    icon: "/favicon.ico",
    tag: `cita-${nombre}-${etiqueta}`, // browser deduplicates by tag
    silent: false,
  });
}
