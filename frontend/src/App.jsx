import { useEffect, useState } from "react";

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [formPaciente, setFormPaciente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    notas: "",
  });

  const [formCita, setFormCita] = useState({
    pacienteId: "",
    fecha: "",
    hora: "",
    motivo: "",
  });

  const cargarPacientes = () => {
    fetch("http://localhost:3000/api/pacientes")
      .then((res) => res.json())
      .then((data) => {
        setPacientes(data);
      })
      .catch((err) => {
        console.error("Error al cargar pacientes:", err);
        setError("No se pudieron cargar los pacientes");
      });
  };

  const cargarCitas = () => {
    fetch("http://localhost:3000/api/citas")
      .then((res) => res.json())
      .then((data) => {
        setCitas(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar citas:", err);
        setError("No se pudieron cargar las citas");
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPacientes();
    cargarCitas();
  }, []);

  const manejarCambioPaciente = (e) => {
    const { name, value } = e.target;
    setFormPaciente({
      ...formPaciente,
      [name]: value,
    });
  };

  const guardarPaciente = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/api/pacientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formPaciente),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el paciente");
      }

      setFormPaciente({
        nombre: "",
        telefono: "",
        email: "",
        notas: "",
      });

      cargarPacientes();
    } catch (err) {
      console.error("Error al guardar paciente:", err);
      alert("Hubo un error al guardar el paciente");
    }
  };

  const manejarCambioCita = (e) => {
    const { name, value } = e.target;
    setFormCita({
      ...formCita,
      [name]: value,
    });
  };

  const guardarCita = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formCita,
          pacienteId: Number(formCita.pacienteId),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la cita");
      }

      setFormCita({
        pacienteId: "",
        fecha: "",
        hora: "",
        motivo: "",
      });

      cargarCitas();
    } catch (err) {
      console.error("Error al guardar cita:", err);
      alert("Hubo un error al guardar la cita");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Gestión de Pacientes y Citas</h1>

      <h2>Agregar Paciente</h2>
      <form
        onSubmit={guardarPaciente}
        style={{
          marginBottom: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formPaciente.nombre}
          onChange={manejarCambioPaciente}
          required
        />

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={formPaciente.telefono}
          onChange={manejarCambioPaciente}
        />

        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={formPaciente.email}
          onChange={manejarCambioPaciente}
        />

        <textarea
          name="notas"
          placeholder="Notas"
          value={formPaciente.notas}
          onChange={manejarCambioPaciente}
        />

        <button type="submit">Guardar paciente</button>
      </form>

      <h2>Lista de pacientes</h2>
      {pacientes.length === 0 ? (
        <p>No hay pacientes</p>
      ) : (
        <ul>
          {pacientes.map((p) => (
            <li key={p.id}>
              <strong>{p.nombre}</strong> - {p.telefono} - {p.email}
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>Agregar Cita</h2>
      <form
        onSubmit={guardarCita}
        style={{
          marginBottom: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        <select
          name="pacienteId"
          value={formCita.pacienteId}
          onChange={manejarCambioCita}
          required
        >
          <option value="">Selecciona un paciente</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="fecha"
          value={formCita.fecha}
          onChange={manejarCambioCita}
          required
        />

        <input
          type="time"
          name="hora"
          value={formCita.hora}
          onChange={manejarCambioCita}
          required
        />

        <input
          type="text"
          name="motivo"
          placeholder="Motivo"
          value={formCita.motivo}
          onChange={manejarCambioCita}
        />

        <button type="submit">Guardar cita</button>
      </form>

      <h2>Lista de citas</h2>
      {cargando ? (
        <p>Cargando...</p>
      ) : error ? (
        <p>{error}</p>
      ) : citas.length === 0 ? (
        <p>No hay citas</p>
      ) : (
        <ul>
          {citas.map((c) => (
            <li key={c.id}>
              <strong>{c.fecha}</strong> {c.hora} - {c.paciente?.nombre} - {c.motivo} - {c.zonaHoraria}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;