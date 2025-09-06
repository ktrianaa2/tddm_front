import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Spin,
  message,
  Tabs
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  BugOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { getStoredToken, API_ENDPOINTS, getWithAuth } from "../../config";
import '../styles/dashboard.css';
import '../styles/forms.css';
import '../styles/buttons.css';

// Importar los componentes de las pestañas
import InfoTab from './proyectos/InfoTab';
import EspecificacionesTab from './especificaciones/EspecificacionesTab';
import PruebasTab from './pruebas/crear_pruebas/PruebasTab';
import EjecutarPruebasTab from './pruebas/ejecutar_pruebas/EjecutarPruebasTab';

const { Title } = Typography;

const GestionProyecto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchProyecto = async () => {
      try {
        setLoading(true);
        const token = getStoredToken();
        const response = await getWithAuth(`${API_ENDPOINTS.OBTENER_PROYECTO}/${id}/`, token);
        setProyecto(response);
      } catch (error) {
        message.error("Error al cargar el proyecto");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProyecto();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <div>Cargando proyecto...</div>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="dashboard-empty-state">
        <div className="dashboard-empty-icon">
          <FileTextOutlined />
        </div>
        <div className="dashboard-empty-title">
          Proyecto no encontrado
        </div>
        <div className="dashboard-empty-description">
          El proyecto que buscas no existe o no tienes permisos para verlo
        </div>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <InfoCircleOutlined />
          Información
        </span>
      ),
      children: <InfoTab proyecto={proyecto} navigate={navigate} />,
    },
    {
      key: 'especificaciones',
      label: (
        <span>
          <FileTextOutlined />
          Especificaciones
        </span>
      ),
      children: <EspecificacionesTab proyecto={proyecto} />,
    },
    {
      key: 'pruebas',
      label: (
        <span>
          <BugOutlined />
          Pruebas
        </span>
      ),
      children: <PruebasTab proyecto={proyecto} />,
    },
    {
      key: 'ejecutar',
      label: (
        <span>
          <PlayCircleOutlined />
          Ejecutar Pruebas
        </span>
      ),
      children: <EjecutarPruebasTab proyecto={proyecto} />,
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        {/* Botón regresar */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          Regresar
        </Button>

        {/* Título centrado */}
        <Title
          level={2}
          style={{
            margin: 0,
            textAlign: 'center',
            flex: 1,
            color: 'var(--text-primary)'
          }}
        >
          {proyecto.nombre}
        </Title>
      </div>


      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{
          backgroundColor: 'var(--bg-white)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1rem'
        }}
      />
    </div>
  );
};

export default GestionProyecto;