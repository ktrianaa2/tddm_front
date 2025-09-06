import React from "react";
import { Card, Button, Tag, Typography } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import '../../styles/project-card.css';
import '../../styles/buttons.css';


const { Text } = Typography;

const ProyectoCard = ({ proyecto, onEditar, onEliminar }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Evitar navegación si se hace clic en los botones
    if (e.target.closest('.project-card-actions')) {
      return;
    }
    // Navegar a GestionProyecto.jsx
    navigate(`/dashboard/proyecto/${proyecto.proyecto_id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEditar(proyecto);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onEliminar(proyecto.proyecto_id);
  };

  const handleView = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/proyecto/${proyecto.proyecto_id}`);
  };

  return (
    <Card
      title={proyecto.nombre}
      bordered={false}
      className="project-card"
      onClick={handleCardClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick(e);
        }
      }}
    >
      <div className="project-card-id">
        ID: {proyecto.proyecto_id}
      </div>

      <div className="project-card-content">
        {proyecto.descripcion && (
          <div className="project-card-description">
            {proyecto.descripcion}
          </div>
        )}

        <div className="project-card-field">
          <span className="project-card-label">Estado:</span>
          <div className="project-card-status">
            <Tag color={proyecto.estado === "Requisitos" ? "blue" : "green"}>
              {proyecto.estado}
            </Tag>
          </div>
        </div>

        <div className="project-card-field">
          <CalendarOutlined className="project-card-icon" />
          <span className="project-card-label">Actualizado:</span>
          <span className="project-card-date">
            {proyecto.fecha_actualizacion}
          </span>
        </div>
      </div>

      <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
        <Button
          icon={<EyeOutlined />}
          className="btn btn-info btn-card"
          onClick={handleView}
        >
          Ver
        </Button>
        <Button
          icon={<EditOutlined />}
          className="btn btn-primary btn-card"
          onClick={handleEdit}
        >
          Editar
        </Button>
        <Button
          icon={<DeleteOutlined />}
          className="btn btn-danger btn-card"
          onClick={handleDelete}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  );
};

export default ProyectoCard;