import { useState } from "react";

const ETIQUETA_ESTADO = {
  activo: "Activo",
  alta: "Alta",
  reactivado: "Reactivado",
};

function PacienteList({ pacientes, onEditar, onEliminar, onCambiarEstado }) {
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  return (
    <div className="card">
      <h2>Pacientes ({pacientes.length})</h2>
      {pacientes.length === 0 ? (
        <p className="vacio">No hay pacientes registrados</p>
      ) : (
        <ul className="lista">
          {pacientes.map((p) => (
            
            <li
              key={p.id}
              className={`item-lista${p.estadoPaciente === "alta" ? " item-alta" : ""}`}
            >
              <div className="item-lista-row">
                <div className="item-principal item-principal-flex">
                  <span>{p.nombre}</span>
                  <span className={`badge badge-estado badge-${p.estadoPaciente || "activo"}`}>
                    {ETIQUETA_ESTADO[p.estadoPaciente] || "Activo"}
                  </span>
                </div>
                <span className="badge badge-sesiones">
                  {p.numeroSesiones || 0} sesion{p.numeroSesiones !== 1 ? "es" : ""}
                </span>
              </div>

              {p.telefono && (
                <div className="item-secundario">{p.telefono}</div>
              )}

              {(p._count?.citas > 0 || (p.numeroSesiones || 0) > 0) && (
                <div className="item-secundario">
                  Historial: {p._count?.citas || 0} cita{(p._count?.citas || 0) !== 1 ? "s" : ""} registradas
                </div>
              )}

              {confirmandoEliminar === p.id ? (
                <div className="confirmar-eliminar">
                  <span className="confirmar-texto">
                    {p._count?.citas > 0 || (p.numeroSesiones || 0) > 0
                      ? `Este paciente tiene ${p._count?.citas || 0} cita(s) registrada(s). Si continúas, el paciente y todas sus citas relacionadas se eliminarán permanentemente. Esta acción no se puede deshacer.`
                      : "¿Eliminar este paciente? Esta acción no se puede deshacer."}
                  </span>
                  <button
                    className="btn-mini btn-mini-peligro"
                    onClick={() => {
                      onEliminar(p.id);
                      setConfirmandoEliminar(null);
                    }}
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn-mini btn-mini-secundario"
                    onClick={() => setConfirmandoEliminar(null)}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="item-acciones">
                  <button
                    className="btn-mini btn-mini-editar"
                    onClick={() => onEditar(p)}
                  >
                    Editar
                  </button>

                  {(p.estadoPaciente === "activo" ||
                    p.estadoPaciente === "reactivado") && (
                    <button
                      className="btn-mini btn-mini-alta"
                      onClick={() => onCambiarEstado(p.id, "alta")}
                    >
                      Dar de alta
                    </button>
                  )}

                  {p.estadoPaciente === "alta" && (
                    <button
                      className="btn-mini btn-mini-reactivar"
                      onClick={() => onCambiarEstado(p.id, "reactivado")}
                    >
                      Reactivar
                    </button>
                  )}

                  <button
                    className="btn-mini btn-mini-eliminar"
                    onClick={() => setConfirmandoEliminar(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PacienteList;