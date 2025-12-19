import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ListaProyectos from "./proyectos/ListaProyectos";
import EditarProyecto from "./proyectos/EditarProyecto";
import CrearProyecto from "./proyectos/CrearProyecto";
import GestionProyecto from "./GestionProyecto";
import ModalEliminarProyecto from "./modales/ModalEliminarProyecto";
import { useProyectos } from '../hooks/useProyectos';
import '../styles/dashboard.css';
import '../styles/buttons.css';

const DashboardUsuario = ({ onLogout, userProfile }) => {
  const [view, setView] = useState("lista");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalEliminar, setModalEliminar] = useState({
    visible: false,
    proyectoId: null,
    nombreProyecto: ''
  });

  const {
    proyectos,
    estadosProyecto,
    loading,
    loadingEstados,
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

  // Handler para abrir modal de eliminación
  const handleEliminar = (proyectoId) => {
    const proyecto = proyectos.find(p => p.proyecto_id === proyectoId);

    setModalEliminar({
      visible: true,
      proyectoId: proyectoId,
      nombreProyecto: proyecto?.nombre || 'Sin nombre'
    });
  };

  // Handler para cancelar eliminación
  const handleCancelarEliminar = () => {
    setModalEliminar({
      visible: false,
      proyectoId: null,
      nombreProyecto: ''
    });
  };

  // Handler para confirmar eliminación
  const handleConfirmarEliminar = async () => {
    const { proyectoId } = modalEliminar;

    const result = await eliminarProyecto(proyectoId);

    if (result.success) {
      // Cerrar modal
      setModalEliminar({
        visible: false,
        proyectoId: null,
        nombreProyecto: ''
      });

      // Si estamos viendo el proyecto que se eliminó, volver a la lista
      if (view === "proyecto" && selectedProject?.proyecto_id === proyectoId) {
        backToLista();
      }
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} userProfile={userProfile} />
      <div className="dashboard-content">
        {view === "lista" && (
          <>
            <ListaProyectos
              proyectos={proyectos}
              estadosProyecto={estadosProyecto}
              loading={loading}
              loadingEstados={loadingEstados}
              onEditar={openEditar}
              onVer={openProyecto}
              onEliminar={handleEliminar}
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

      <ModalEliminarProyecto
        visible={modalEliminar.visible}
        onCancel={handleCancelarEliminar}
        onConfirm={handleConfirmarEliminar}
        loading={loading}
        nombreProyecto={modalEliminar.nombreProyecto}
      />
    </div>
  );
};

export default DashboardUsuario;