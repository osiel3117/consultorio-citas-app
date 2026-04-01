import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function CalendarioCitas({ citas, onDateClick, onEventClick }) {
  // Returns the visible name for a cita in this priority order:
  // 1. tituloCita (pareja / familiar free-text title)
  // 2. paciente.nombre (individual with patient)
  // 3. "Cita" as safe fallback
  const getNombreVisible = (cita) => {
    if (cita.tituloCita) return cita.tituloCita;
    if (cita.paciente?.nombre) return cita.paciente.nombre;
    return "Cita";
  };

  const eventos = citas.map((cita) => ({
    id: String(cita.id),
    title: `${getNombreVisible(cita)}${cita.motivo ? " · " + cita.motivo : ""}`,
    start: `${cita.fecha}T${cita.hora}`,
    allDay: false,
    extendedProps: { citaData: cita },
  }));

  const handleDateClick = (info) => {
    // info.dateStr = "YYYY-MM-DD" in month view, or "YYYY-MM-DDTHH:MM:SS" in week/day view
    const dateStr = info.dateStr;
    let fecha, hora;
    if (dateStr.includes("T")) {
      // Week or day view — has exact time slot
      fecha = dateStr.slice(0, 10);
      hora = dateStr.slice(11, 16);
    } else {
      // Month view — only date, no time. Use current local time.
      fecha = dateStr;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      hora = `${hh}:${mm}`;
    }
    onDateClick?.({ fecha, hora, jsEvent: info.jsEvent });
  };

  const handleEventClick = (info) => {
    const cita = info.event.extendedProps.citaData;
    onEventClick?.({ cita, jsEvent: info.jsEvent });
  };

  return (
    <div className="calendario-contenedor">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Dia",
        }}
        events={eventos}
        height="auto"
        locale="es"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        selectable={false}
        editable={false}
        dayMaxEvents={3}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }}
        nowIndicator={true}
      />
    </div>
  );
}

export default CalendarioCitas;