import React, { useEffect, useState } from "react";
import { Row, Col, Spin, message, Button, Empty } from "antd";
import { PlusOutlined, ProjectOutlined } from '@ant-design/icons';
import ProyectoCard from "./ProyectoCard";
import { getStoredToken, API_ENDPOINTS, getWithAuth, postFormDataAuth } from "../../../config";
import '../../styles/dashboard.css';

const ListaProyectos = ({ onEditar, onEliminar, refreshFlag }) => {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProyectos = async () => {
        setLoading(true);
        const token = getStoredToken();
        if (!API_ENDPOINTS.PROYECTOS) {
            message.error("Endpoint de proyectos no definido");
            setProyectos([]);
            setLoading(false);
            return;
        }
        try {
            const response = await getWithAuth(API_ENDPOINTS.PROYECTOS, token);
            setProyectos(response?.proyectos || []);
        } catch (error) {
            console.error(error);
            message.error("Error al cargar los proyectos");
            setProyectos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProyectos();
    }, [refreshFlag]);

    const handleEliminar = async (id) => {
        const token = getStoredToken();
        const formData = new FormData();
        try {
            const res = await postFormDataAuth(`${API_ENDPOINTS.ELIMINAR_PROYECTO}/${id}`, formData, token);
            message.success(res.mensaje || "Proyecto eliminado");
            fetchProyectos();
        } catch (error) {
            message.error(error.message);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Spin size="large" />
                <div>Cargando proyectos...</div>
            </div>
        );
    }

    if (proyectos.length === 0) {
        return (
            <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon">
                    <ProjectOutlined />
                </div>
                <div className="dashboard-empty-title">
                    No tienes proyectos aún
                </div>
                <div className="dashboard-empty-description">
                    Comienza creando tu primer proyecto para gestionar tus requisitos
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    className="dashboard-create-btn"
                    onClick={() => onEditar(null)}
                    size="large"
                >
                    Crear tu primer proyecto
                </Button>
            </div>
        );
    }

    return (
        <>
            {/* Estadísticas rápidas */}
            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-number">{proyectos.length}</div>
                    <div className="dashboard-stat-label">Total Proyectos</div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-number">
                        {proyectos.filter(p => p.estado === "Requisitos").length}
                    </div>
                    <div className="dashboard-stat-label">En Requisitos</div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-number">
                        {proyectos.filter(p => p.estado === "Generación").length}
                    </div>
                    <div className="dashboard-stat-label">En Generación</div>
                </div>
            </div>

            {/* Grid de proyectos */}
            <Row gutter={[24, 24]} style={{ marginTop: '2rem' }}>
                {proyectos.map((proyecto, index) => (
                    <Col 
                        key={proyecto.proyecto_id} 
                        xs={24} 
                        sm={12} 
                        lg={8} 
                        xl={6}
                        style={{ 
                            animationDelay: `${index * 0.1}s`
                        }}
                    >
                        <ProyectoCard 
                            proyecto={proyecto} 
                            onEditar={onEditar} 
                            onEliminar={handleEliminar} 
                        />
                    </Col>
                ))}
            </Row>
        </>
    );
};

export default ListaProyectos;