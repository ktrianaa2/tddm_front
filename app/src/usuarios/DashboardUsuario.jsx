import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ListaProyectos from "./proyectos/ListaProyectos";
import EditarProyecto from "./proyectos/EditarProyecto";
import CrearProyecto from "./proyectos/CrearProyecto";
import GestionProyecto from "./GestionProyecto";
import { useProyectos } from '../hooks/useProyectos';
import '../styles/dashboard.css';
import '../styles/buttons.css';

const DashboardUsuario = ({ onLogout, userProfile }) => {
  const [view, setView] = useState("lista");
  const [selectedProject, setSelectedProject] = useState(null);

  const {
    proyectos,
    loading,
    crearProyecto,
    editarProyecto,
    eliminarProyecto
  } = useProyectos();

  const openCrear = () => setView("crear");

  const openEditar = (proyecto) => {
    setSelectedProject(proyecto);
    setView("editar");
  };

  const openProyecto = (proyecto) => {
    setSelectedProject(proyecto);
    setView("proyecto");
  };

  const backToLista = () => {
    setSelectedProject(null);
    setView("lista");
  };

  const editarFromProyecto = (proyecto) => {
    setSelectedProject(proyecto);
    setView("editar");
  };

  const backToProyecto = () => {
    setView("proyecto");
  };

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} userProfile={userProfile} />
      <div className="dashboard-content">
        {view === "lista" && (
          <>
            <ListaProyectos
              proyectos={proyectos}
              loading={loading}
              onEditar={openEditar}
              onVer={openProyecto}
              onEliminar={eliminarProyecto}
              onCrear={openCrear}
            />
          </>
        )}

        {view === "crear" && (
          <div className="create-project-form">
            <CrearProyecto
              onCreado={backToLista}
              onBack={backToLista}
              crearProyecto={crearProyecto}
            />
          </div>
        )}

        {view === "editar" && selectedProject && (
          <div className="edit-project-form">
            <EditarProyecto
              proyecto={selectedProject}
              onEditado={view === "proyecto" ? backToProyecto : backToLista}
              onBack={view === "proyecto" ? backToProyecto : backToLista}
              editarProyecto={editarProyecto}
            />
          </div>
        )}

        {view === "proyecto" && selectedProject && (
          <GestionProyecto
            proyecto={selectedProject}
            onBack={backToLista}
            onEditar={editarFromProyecto}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardUsuario;