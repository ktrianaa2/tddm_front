import React, { useState, useMemo } from "react";
import { Row, Col, Spin, Input, Empty, Button } from "antd";
import { ProjectOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ProyectoCard from "./ProyectoCard";
import '../../styles/dashboard.css';
import '../../styles/buttons.css';


const { Search } = Input;

const ListaProyectos = ({ proyectos, loading, onEditar, onVer, onEliminar, onCrear }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos"); // todos | Especificaciones | Generación | Ejecución

    // Calcular estadísticas
    const stats = useMemo(() => ({
        total: proyectos.length,
        especificaciones: proyectos.filter(p => p.estado === "Especificaciones").length,
        generacion: proyectos.filter(p => p.estado === "Generación").length,
        ejecucion: proyectos.filter(p => p.estado === "Ejecución").length
    }), [proyectos]);

    // Filtrar proyectos
    const proyectosFiltrados = useMemo(() => {
        return proyectos.filter(proyecto => {
            // Filtro por búsqueda
            const matchSearch = proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtro por estado
            const matchEstado = estadoFiltro === "todos" || proyecto.estado === estadoFiltro;

            return matchSearch && matchEstado;
        });
    }, [proyectos, searchTerm, estadoFiltro]);

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
                    icon={<PlusOutlined />}
                    className="btn btn-primary btn-lg"
                    onClick={onCrear}
                    style={{ marginTop: '24px' }}
                >
                    Crear mi primer proyecto
                </Button>
            </div>
        );
    }

    return (

        <div className="dashboard-proyectos-container">
            <Row gutter={[24, 24]}>
                {/* Columna izquierda - Estadísticas/Filtros */}
                <Col xs={24} lg={6}>
                    <div className="dashboard-stats-vertical">
                        {/* Card de Total */}
                        <div
                            className={`dashboard-stat-card ${estadoFiltro === "todos" ? "active" : ""}`}
                            onClick={() => setEstadoFiltro("todos")}
                        >
                            <div className="dashboard-stat-number">{stats.total}</div>
                            <div className="dashboard-stat-label">Total Proyectos</div>
                        </div>

                        {/* Card de Requisitos */}
                        <div
                            className={`dashboard-stat-card ${estadoFiltro === "Especificaciones" ? "active" : ""}`}
                            onClick={() => setEstadoFiltro("Especificaciones")}
                        >
                            <div className="dashboard-stat-number">{stats.especificaciones}</div>
                            <div className="dashboard-stat-label">Fase de especificaciones</div>
                        </div>

                        {/* Card de Generación */}
                        <div
                            className={`dashboard-stat-card ${estadoFiltro === "Generación" ? "active" : ""}`}
                            onClick={() => setEstadoFiltro("Generación")}
                        >
                            <div className="dashboard-stat-number">{stats.generacion}</div>
                            <div className="dashboard-stat-label">Fase de generación</div>
                        </div>

                                                {/* Card de Ejecucion */}
                        <div
                            className={`dashboard-stat-card ${estadoFiltro === "Ejecución" ? "active" : ""}`}
                            onClick={() => setEstadoFiltro("Ejecución")}
                        >
                            <div className="dashboard-stat-number">{stats.ejecucion}</div>
                            <div className="dashboard-stat-label">Fase de ejecución</div>
                        </div>
                    </div>
                </Col>

                {/* Columna derecha - Búsqueda y proyectos */}
                <Col xs={24} lg={18}>
                    <div className="dashboard-header">
                        <h2 style={{ margin: 0 }}>Mis Proyectos</h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            margin: '4px 0 0 0',
                            fontSize: '0.9rem'
                        }}>
                            Gestiona y organiza todos tus proyectos
                        </p>
                    </div>
                    {/* Barra de búsqueda y botón crear */}
                    <div className="dashboard-search-section">
                        <Search
                            placeholder="Buscar proyectos..."
                            allowClear
                            size="large"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="dashboard-search-input"
                            prefix={<SearchOutlined />}
                        />
                        <Button
                            icon={<PlusOutlined />}
                            className="btn btn-primary btn-lg"
                            onClick={onCrear}
                        >
                            Nuevo Proyecto
                        </Button>
                    </div>

                    {/* Grid de proyectos */}
                    {proyectosFiltrados.length === 0 ? (
                        <Empty
                            description={
                                searchTerm
                                    ? `No se encontraron proyectos con "${searchTerm}"`
                                    : "No hay proyectos en esta categoría"
                            }
                            style={{ marginTop: '3rem' }}
                        />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {proyectosFiltrados.map((proyecto, index) => (
                                <Col
                                    key={proyecto.proyecto_id}
                                    xs={24}
                                    md={12}
                                    xl={8}
                                    style={{
                                        animationDelay: `${index * 0.05}s`
                                    }}
                                >
                                    <ProyectoCard
                                        proyecto={proyecto}
                                        onEditar={onEditar}
                                        onEliminar={onEliminar}
                                        onVer={onVer}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default ListaProyectos;