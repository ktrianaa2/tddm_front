import React, { useState } from "react";
import {
  Typography,
  Button,
  Tabs
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  BugOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import '../styles/dashboard.css';
import '../styles/forms.css';
import '../styles/buttons.css';
import '../styles/tabs.css';
import '../styles/gestion-tabs.css';

// Importar los componentes de las pestañas
import InfoTab from './proyectos/InfoTab';
import EspecificacionesTab from './especificaciones/EspecificacionesTab';
import PruebasTab from './pruebas/crear_pruebas/PruebasTab';
import EjecutarPruebasTab from './pruebas/ejecutar_pruebas/EjecutarPruebasTab';

const { Title } = Typography;

const GestionProyecto = ({ proyecto, onBack, onEditar }) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!proyecto) {
    return (
      <div className="tabs-container">
        <div className="tab-empty-state">
          <div className="tab-empty-icon">
            <FileTextOutlined />
          </div>
          <h3 className="tab-empty-title">
            Proyecto no encontrado
          </h3>
          <p className="tab-empty-description">
            No se pudo cargar la información del proyecto
          </p>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="btn btn-primary"
            size="large"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'info',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <InfoCircleOutlined />
          Información
        </span>
      ),
      children: <InfoTab proyecto={proyecto} onBack={onBack} onEditar={onEditar} />,
    },
    {
      key: 'especificaciones',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined />
          Especificaciones
        </span>
      ),
      children: <EspecificacionesTab proyecto={proyecto} />,
    },
    {
      key: 'pruebas',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BugOutlined />
          Pruebas
        </span>
      ),
      children: <PruebasTab proyecto={proyecto} />,
    },
    {
      key: 'ejecutar',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircleOutlined />
          Ejecutar Pruebas
        </span>
      ),
      children: <EjecutarPruebasTab proyecto={proyecto} />,
    },
  ];

  return (
    <div className="tabs-container">
      <div className="tabs-content-wrapper">
        {/* Header */}
        <div className="tab-header">
          {/* Botón regresar */}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="btn btn-secondary"
            size="large"
          >
            Regresar
          </Button>

          {/* Título */}
          <div className="tab-header-content">
            <h1 className="tab-title">
              {proyecto.nombre}
            </h1>
            <p className="tab-subtitle">
              Gestiona todos los aspectos de tu proyecto
            </p>
          </div>

          {/* Espacio para acciones adicionales si las necesitas */}
          <div className="tab-header-actions">
            {/* agregar más botones en el futuro */}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          type="card"
          className="gestion-tabs"
          style={{
            padding: '0'
          }}
        />
      </div>
    </div>
  );
};

export default GestionProyecto;