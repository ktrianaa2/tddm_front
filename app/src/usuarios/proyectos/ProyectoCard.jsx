import React, { useMemo } from "react";
import { Card, Button, Tag } from "antd";
import { EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import '../../styles/project-card.css';
import '../../styles/buttons.css';
import '../../styles/tags.css';

const ProyectoCard = ({ proyecto, estadosProyecto = [], onEditar, onEliminar, onVer, onCambiarEstado }) => {
  const handleCardClick = () => {
    onVer(proyecto);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEditar(proyecto);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onEliminar(proyecto.proyecto_id);
  };

  // Obtener el estado completo desde el array de estados disponibles
  const estadoCompleto = useMemo(() => {
    if (!proyecto.estado) return null;

    // El estado puede venir como string o como objeto
    const estadoNombre = typeof proyecto.estado === 'object'
      ? proyecto.estado.nombre
      : proyecto.estado;

    // Buscar en el array de estados disponibles (con validación)
    if (Array.isArray(estadosProyecto) && estadosProyecto.length > 0) {
      return estadosProyecto.find(e => e.nombre === estadoNombre);
    }

    // Si no encuentra en el array, usar el estado del proyecto si es un objeto
    if (typeof proyecto.estado === 'object' && proyecto.estado.color) {
      return proyecto.estado;
    }

    return null;
  }, [proyecto.estado, estadosProyecto]);

  // Si no encuentra el estado, usar datos del objeto si los tiene
  const estadoFinal = estadoCompleto || proyecto.estado;

  // Extraer nombre y color de forma segura
  const getEstadoNombre = () => {
    if (!estadoFinal) return "Sin estado";
    if (typeof estadoFinal === 'object') {
      return estadoFinal.nombre || "Sin estado";
    }
    return estadoFinal;
  };

  const getEstadoColor = () => {
    if (!estadoFinal) return undefined;
    if (typeof estadoFinal === 'object' && estadoFinal.color) {
      return estadoFinal.color;
    }
    return undefined;
  };

  // Función para calcular el contraste de texto (blanco o negro)
  const getTextColor = (hexColor) => {
    if (!hexColor) return '#000000';
    
    // Remover el # si existe
    const hex = hexColor.replace('#', '');
    
    // Convertir a RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calcular luminancia
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retornar blanco si es oscuro, negro si es claro
    return luminancia > 0.5 ? '#000000' : '#ffffff';
  };

  const estadoNombre = getEstadoNombre();
  const estadoColor = getEstadoColor();

  // CSS variables para máximo control
  const customVars = estadoColor ? {
    '--estado-color': estadoColor,
    '--estado-text-color': getTextColor(estadoColor)
  } : {};

  return (
    <Card
      title={proyecto.nombre}
      variant="outlined"
      className="project-card"
      tabIndex={0}
      hoverable
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="project-card-content">
        {proyecto.descripcion && (
          <div className="project-card-description">{proyecto.descripcion}</div>
        )}
        <div className="project-card-field">
          <span className="project-card-label">Estado:</span>
          {estadoColor ? (
            // Opción 1: Span con estilos inline + CSS variables
            <span 
              className="estado-tag-custom"
              style={{
                backgroundColor: estadoColor,
                color: getTextColor(estadoColor),
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'default',
                display: 'inline-block'
              }}
            >
              {estadoNombre}
            </span>
          ) : (
            <Tag>{estadoNombre}</Tag>
          )}
        </div>
        <div className="project-card-field">
          <CalendarOutlined className="project-card-icon" />
          <span className="project-card-label">Actualizado:</span>
          <span className="project-card-date">{proyecto.fecha_actualizacion}</span>
        </div>
      </div>
      <div className="project-card-actions">
        <Button
          icon={<EditOutlined />}
          className="btn btn-primary btn-card"
          onClick={handleEditClick}
        >
          Editar
        </Button>
        <Button
          icon={<DeleteOutlined />}
          className="btn btn-danger btn-card"
          onClick={handleDeleteClick}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  );
};

export default ProyectoCard;