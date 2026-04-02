import { useEffect, useState } from "react";
import "./App.css";
import PacienteForm from "./components/PacienteForm";
import PacienteList from "./components/PacienteList";
import CitaList from "./components/CitaList";
import CalendarioCitas from "./CalendarioCitas";
import ModalNuevaCita from "./components/ModalNuevaCita";
import ModalDetalleCita from "./components/ModalDetalleCita";
import PopupDiaCitas from "./components/PopupDiaCitas";
import NotificacionesToast from "./components/NotificacionesToast";
import BtnNotificaciones from "./components/BtnNotificaciones";
import NotificationErrorBoundary from "./components/NotificationErrorBoundary";
import { useNotificacionesCitas } from "./hooks/useNotificacionesCitas";
import { API } from "./config/api";

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("calendario");
  const [mensaje, setMensaje] = useState(null);

  // Modal nueva cita
  const [modalCita, setModalCita] = useState(null); // { fecha, hora }
  // Popup dia
  const [popupDia, setPopupDia] = useState(null); // { fecha, posicion }
  // Modal detalle de cita existente
  const [modalDetalle, setModalDetalle] = useState(null); // cita object
  const [pacienteEditando, setPacienteEditando] = useState(null);

  // Notification toasts — watches citas and fires alerts 15 / 5 min before
  const { toasts, cerrar: cerrarToast } = useNotificacionesCitas(citas);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const cargarPacientes = () => {
    fetch(`${API}/pacientes`)
      .then((res) => res.json())
      .then(setPacientes)
      .catch(() => mostrarMensaje("error", "No se pudieron cargar los pacientes"));
  };

  const cargarCitas = () => {
    fetch(`${API}/citas`)
      .then((res) => res.json())
      .then((data) => {
        setCitas(data);
        setCargando(false);
      })
      .catch(() => {
        mostrarMensaje("error", "No se pudieron cargar las citas");
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPacientes();
    cargarCitas();
  }, []);

  const guardarPaciente = async (datos) => {
    if (pacienteEditando) {
      try {
        const res = await fetch(`${API}/pacientes/${pacienteEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        });
        if (!res.ok) throw new Error();
        setPacienteEditando(null);
        mostrarMensaje("exito", "Paciente actualizado correctamente");
        cargarPacientes();
      } catch {
        mostrarMensaje("error", "No se pudo actualizar el paciente");
      }
    } else {
      try {
        const res = await fetch(`${API}/pacientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        });
        if (!res.ok) throw new Error();
        mostrarMensaje("exito", "Paciente guardado correctamente");
        cargarPacientes();
      } catch {
        mostrarMensaje("error", "No se pudo guardar el paciente");
      }
    }
  };

  const eliminarPacienteHandler = async (id) => {
    try {
      const res = await fetch(`${API}/pacientes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        mostrarMensaje("error", data.error || "No se pudo eliminar el paciente");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (pacienteEditando?.id === id) {
        setPacienteEditando(null);
      }
      mostrarMensaje("exito", data.message || "Paciente eliminado");
      cargarPacientes();
    } catch {
      mostrarMensaje("error", "No se pudo eliminar el paciente");
    }
  };

  const cambiarEstadoPacienteHandler = async (id, estadoPaciente) => {
    try {
      const res = await fetch(`${API}/pacientes/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoPaciente }),
      });
      if (!res.ok) throw new Error();
      mostrarMensaje("exito", "Estado del paciente actualizado");
      cargarPacientes();
    } catch {
      mostrarMensaje("error", "No se pudo cambiar el estado del paciente");
    }
  };

  // Returns current local time as HH:MM string (no timezone conversion needed —
  // we just want what the clock shows in the room right now)
  const horaActual = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  // Calendar date click — check if there are citas on that day
  const handleDateClick = ({ fecha, hora, jsEvent }) => {
    const citasDelDia = citas.filter((c) => c.fecha === fecha);

    if (citasDelDia.length > 0) {
      // On mobile never try to position the popup near the click —
      // always center it so it stays fully on screen.
      const isMobile = window.innerWidth < 768;
      const posicion = isMobile
        ? null
        : (() => {
            const rect = jsEvent.target.getBoundingClientRect();
            return {
              top: `${rect.bottom + window.scrollY + 4}px`,
              left: `${Math.min(rect.left, window.innerWidth - 320)}px`,
            };
          })();
      setPopupDia({ fecha, posicion });
    } else {
      // No citas — open modal directly to create
      setModalCita({ fecha, hora: hora || horaActual() });
    }
  };

  // Calendar event click:
  // — Multiple citas that day → show popup so user picks which one
  // — Single cita → open detail directly (faster)
  const handleEventClick = ({ cita }) => {
    const citasDelDia = citas.filter((c) => c.fecha === cita.fecha);
    if (citasDelDia.length > 1) {
      setPopupDia({ fecha: cita.fecha, posicion: null });
    } else {
      setModalDetalle(cita);
    }
  };

  // Open detail modal from popup or list
  const abrirDetalle = (cita) => {
    setPopupDia(null);
    setModalDetalle(cita);
  };

  // Called when PATCH /citas/:id resolves
  const handleActualizarCita = (citaActualizada) => {
    setModalDetalle(null);
    mostrarMensaje("exito", "Cita actualizada");
    cargarCitas();
    cargarPacientes();
  };

  // Called when DELETE /citas/:id resolves (from modal or list)
  const handleEliminarCita = () => {
    setModalDetalle(null);
    mostrarMensaje("exito", "Cita cancelada y eliminada");
    cargarCitas();
    cargarPacientes();
  };

  // Called from day popup to open create modal — always pre-fill current time
  const abrirModalDesdePopup = (fecha) => {
    setPopupDia(null);
    setModalCita({ fecha, hora: horaActual() });
  };

  // Called when a cita is saved from modal
  const handleCitaGuardada = () => {
    setModalCita(null);
    mostrarMensaje("exito", "Cita agendada correctamente");
    cargarCitas();
    cargarPacientes(); // refresh to get updated sesiones count
  };

  return (
    <div className="app">
      <header className="header">
        <h1>CONSULTORIO DE ANGELA ADRIANA HERNÁNDEZ</h1>
        <p className="subtitulo">Agenda de citas — Reynosa, Tamps.</p>
        <NotificationErrorBoundary>
          <BtnNotificaciones />
        </NotificationErrorBoundary>
      </header>

      {mensaje && (
        <div className={`mensaje mensaje-${mensaje.tipo}`} role="alert">
          {mensaje.texto}
        </div>
      )}

      <nav className="tabs" aria-label="Secciones">
        <button
          className={`tab${tab === "calendario" ? " activo" : ""}`}
          onClick={() => setTab("calendario")}
        >
          Calendario
        </button>
        <button
          className={`tab${tab === "citas" ? " activo" : ""}`}
          onClick={() => setTab("citas")}
        >
          Citas
        </button>
        <button
          className={`tab${tab === "pacientes" ? " activo" : ""}`}
          onClick={() => setTab("pacientes")}
        >
          Pacientes
        </button>
      </nav>

      <main className="main">
        {tab === "calendario" && (
          <div className="seccion">
            <CalendarioCitas
              citas={citas}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </div>
        )}

        {tab === "citas" && (
          <div className="seccion">
            <CitaList
              citas={citas}
              cargando={cargando}
              onVerCita={abrirDetalle}
              onActualizar={handleActualizarCita}
              onEliminar={handleEliminarCita}
            />
          </div>
        )}

        {tab === "pacientes" && (
          <div className="seccion grid">
            <PacienteForm
              pacienteEditar={pacienteEditando}
              onGuardar={guardarPaciente}
              onCancelar={() => setPacienteEditando(null)}
            />
            <PacienteList
              pacientes={pacientes}
              onEditar={setPacienteEditando}
              onEliminar={eliminarPacienteHandler}
              onCambiarEstado={cambiarEstadoPacienteHandler}
            />
          </div>
        )}
      </main>

      {/* Modal for creating new cita */}
      {modalCita && (
        <ModalNuevaCita
          fecha={modalCita.fecha}
          hora={modalCita.hora}
          onGuardar={handleCitaGuardada}
          onCerrar={() => setModalCita(null)}
        />
      )}

      {/* Popup for day summary */}
      {popupDia && (
        <PopupDiaCitas
          fecha={popupDia.fecha}
          citas={citas}
          posicion={popupDia.posicion}
          onAgregarCita={abrirModalDesdePopup}
          onVerCita={abrirDetalle}
          onCerrar={() => setPopupDia(null)}
        />
      )}

      {/* Modal for cita detail / actions */}
      {modalDetalle && (
        <ModalDetalleCita
          cita={modalDetalle}
          onCerrar={() => setModalDetalle(null)}
          onActualizar={handleActualizarCita}
          onEliminar={handleEliminarCita}
        />
      )}

      {/* Notification toasts — positioned fixed top-right */}
      <NotificationErrorBoundary>
        <NotificacionesToast toasts={toasts} onCerrar={cerrarToast} />
      </NotificationErrorBoundary>

      <footer className="footer">
        <p>Zona horaria fija: America/Matamoros</p>
      </footer>
    </div>
  );
}

export default App;

