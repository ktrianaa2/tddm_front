import React, { useState } from "react";
import {
  Button,
  Tabs
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  BugOutlined,
  PlayCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import '../styles/gestion-tabs.css';

// Importar los componentes de las pestañas
import InfoTab from './proyectos/InfoTab';
import EspecificacionesTab from './especificaciones/EspecificacionesTab';
import EsquemaTab from './base_datos/EsquemaTab';
import PruebasTab from './pruebas/crear_pruebas/PruebasTab';
import EjecutarPruebasTab from './pruebas/ejecutar_pruebas/EjecutarPruebasTab';


const GestionProyecto = ({ proyecto, onBack, onEditar, onCambiarEstado }) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!proyecto) {
    return (
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
    );
  }

  // Definir los tabs sin children
  const tabItems = [
    {
      key: 'info',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <InfoCircleOutlined />
          Información
        </span>
      ),
    },
    {
      key: 'especificaciones',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined />
          Especificaciones
        </span>
      ),
    },
    {
      key: 'esquema',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DatabaseOutlined />
          Base de Datos
        </span>
      ),
    },
    {
      key: 'pruebas',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BugOutlined />
          Pruebas
        </span>
      ),
    },
    {
      key: 'ejecutar',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircleOutlined />
          Ejecutar Pruebas
        </span>
      ),
    },
  ];

  // Función para renderizar el contenido según el tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <InfoTab proyecto={proyecto} onBack={onBack} onEditar={onEditar} />;
      case 'especificaciones':
        return <EspecificacionesTab proyecto={proyecto} />;
      case 'esquema':
        return <EsquemaTab proyecto={proyecto} />;
      case 'pruebas':
        return <PruebasTab proyecto={proyecto} />;
      case 'ejecutar':
        return <EjecutarPruebasTab proyecto={proyecto} />;
      default:
        return null;
    }
  };

  return (
    <div className="tabs-content-wrapper" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      maxHeight: '100%',
      overflow: 'hidden',
      background: 'var(--bg-card)'
    }}>
      {/* Header Fijo */}
      <div className="tab-header" style={{
        flexShrink: 0
      }}>
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
        </div>
      </div>

      {/* Tabs Fijos (solo navegación) */}
      <div className="gestion-tabs-nav" style={{
        flexShrink: 0
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          type="card"
        />
      </div>

      {/* Contenido con Scroll Independiente */}
      <div className="gestion-tabs-content-scroll" style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        background: 'var(--bg-card)'
      }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GestionProyecto;