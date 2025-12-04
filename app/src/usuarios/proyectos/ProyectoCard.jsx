import React from "react";
import { Card, Button, Tag } from "antd";
import { EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import '../../styles/project-card.css';
import '../../styles/buttons.css';
import '../../styles/tags.css';

const ProyectoCard = ({ proyecto, onEditar, onEliminar, onVer }) => {
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

  // Determinar la clase del tag según el estado
  const getEstadoTagClass = (estado) => {
    const estadoMap = {
      "Requisitos": "tag-blue",
      "Análisis": "tag-purple",
      "Diseño": "tag-info",
      "Desarrollo": "tag-warning",
      "Pruebas": "tag-orange",
      "Completado": "tag-success",
      "En Pausa": "tag-secondary",
      "Cancelado": "tag-danger"
    };
    return estadoMap[estado] || "tag-blue";
  };

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
          <Tag className={`tag ${getEstadoTagClass(proyecto.estado)}`}>
            {proyecto.estado}
          </Tag>
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