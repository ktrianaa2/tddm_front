import React from "react";
import { Typography, Button } from "antd";
import { Routes, Route, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} userProfile={userProfile} />
      <div className="dashboard-content">
        <Routes>
          {/* Vista principal: lista de proyectos */}
          <Route
            path="/"
            element={
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
                    onClick={() => navigate("crear")}
                  >
                    Nuevo Proyecto
                  </Button>

                </div>
                <ListaProyectos onEditar={(p) => navigate(`editar/${p.proyecto_id}`)} />
              </>
            }
          />

          {/* Vista de crear */}
          <Route
            path="crear"
            element={
              <div className="create-project-form">
                <CrearProyecto onCreado={() => navigate("/dashboard")} />
              </div>
            }
          />

          {/* Vista de editar */}
          <Route
            path="editar/:id"
            element={
              <div className="edit-project-form">
                <EditarProyecto onEditado={() => navigate("/dashboard")} />
              </div>
            }
          />

          {/* Vista de gestión de proyecto */}
          <Route
            path="proyecto/:id"
            element={<GestionProyecto />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default DashboardUsuario;