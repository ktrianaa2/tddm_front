import React, { useState } from "react";
import { Typography, Button } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import Navbar from "../components/Navbar";
import ListaProyectos from "./proyectos/ListaProyectos";
import EditarProyecto from "./proyectos/EditarProyecto";
import CrearProyecto from "./proyectos/CrearProyecto";
import GestionProyecto from "./GestionProyecto";
import '../styles/dashboard.css'
import '../styles/buttons.css'

const { Title } = Typography;

const DashboardUsuario = ({ onLogout, userProfile }) => {
  const [view, setView] = useState("lista"); // lista | crear | editar | proyecto
  const [selectedProject, setSelectedProject] = useState(null);

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
            <div className="dashboard-header">
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Mis Proyectos
                </Title>
                <p style={{
                  color: 'var(--text-primary)',
                  margin: '4px 0 0 0',
                  fontSize: '0.9rem'
                }}>
                  Gestiona y organiza todos tus proyectos
                </p>
              </div>
              <Button
                icon={<PlusOutlined />}
                className="btn btn-primary btn-lg"
                onClick={openCrear}
              >
                Nuevo Proyecto
              </Button>
            </div>
            <ListaProyectos
              onEditar={openEditar}
              onVer={openProyecto}
            />
          </>
        )}

        {view === "crear" && (
          <div className="create-project-form">
            <CrearProyecto onCreado={backToLista} onBack={backToLista} />
          </div>
        )}

        {view === "editar" && selectedProject && (
          <div className="edit-project-form">
            <EditarProyecto 
              proyecto={selectedProject} 
              onEditado={view === "proyecto" ? backToProyecto : backToLista}
              onBack={view === "proyecto" ? backToProyecto : backToLista}
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