import React, { useState, useMemo } from "react";
import { Row, Col, Spin, Input, Empty, Button } from "antd";
import { ProjectOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ProyectoCard from "./ProyectoCard";
import '../../styles/dashboard.css';
import '../../styles/buttons.css';

const { Search } = Input;

const ListaProyectos = ({ proyectos, estadosProyecto, loading, loadingEstados, onEditar, onVer, onEliminar, onCrear, onCambiarEstado }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos");

    // Helper function para obtener nombre del estado
    const getEstadoNombre = (estado) => {
        if (!estado) return "";
        return typeof estado === 'object' ? estado.nombre : estado;
    };

    // Helper para obtener el objeto estado completo (con color)
    const getEstadoObject = (nombreEstado) => {
        return estadosProyecto.find(e => e.nombre === nombreEstado);
    };

    // Calcular estadísticas basadas en los estados disponibles del backend
    const stats = useMemo(() => {
        // Filtrar proyectos NO cancelados para el total
        const proyectosActivos = proyectos.filter(p => {
            const nombreEstado = getEstadoNombre(p.estado);
            const estadoObj = getEstadoObject(nombreEstado);
            return !estadoObj || estadoObj.activo !== false;
        });

        const statsObj = {
            total: proyectosActivos.length
        };

        // Crear contadores dinámicos para cada estado activo del backend
        if (estadosProyecto && Array.isArray(estadosProyecto)) {
            estadosProyecto.forEach(estado => {
                const nombreEstado = estado.nombre;
                statsObj[nombreEstado] = proyectosActivos.filter(p =>
                    getEstadoNombre(p.estado) === nombreEstado
                ).length;
            });
        }

        return statsObj;
    }, [proyectos, estadosProyecto]);

    // Filtrar proyectos: mostrar solo activos en "todos", y cancelados en su filtro
    const proyectosFiltrados = useMemo(() => {
        return proyectos.filter(proyecto => {
            const proyectoEstadoNombre = getEstadoNombre(proyecto.estado);
            const estadoObj = getEstadoObject(proyectoEstadoNombre);
            const esEstadoCancelado = !estadoObj || estadoObj.activo === false;

            // Filtro por búsqueda
            const matchSearch = proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase());

            // Lógica de filtrado por estado:
            // - Si filtro es "todos": mostrar solo proyectos activos (no cancelados)
            // - Si filtro es un estado específico: mostrar solo ese estado
            let matchEstado = false;

            if (estadoFiltro === "todos") {
                // Mostrar solo los que NO estén cancelados
                matchEstado = !esEstadoCancelado;
            } else {
                // Mostrar proyectos del estado específico
                matchEstado = proyectoEstadoNombre === estadoFiltro;
            }

            return matchSearch && matchEstado;
        });
    }, [proyectos, searchTerm, estadoFiltro, estadosProyecto]);

    if (loading || loadingEstados) {
        return (
            <div className="dashboard-loading">
                <Spin size="large" />
                <div>Cargando proyectos...</div>
            </div>
        );
    }

    // Filtrar proyectos NO cancelados para el estado vacío
    const proyectosActivos = proyectos.filter(p => {
        const nombreEstado = getEstadoNombre(p.estado);
        const estadoObj = getEstadoObject(nombreEstado);
        return !estadoObj || estadoObj.activo !== false;
    });

    if (proyectosActivos.length === 0) {
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

                        {/* Renderizar cards dinámicamente basadas en estadosProyecto del backend */}
                        {estadosProyecto && Array.isArray(estadosProyecto) && estadosProyecto.length > 0 ? (
                            estadosProyecto.map((estado) => (
                                <div
                                    key={estado.id}
                                    className={`dashboard-stat-card ${estadoFiltro === estado.nombre ? "active" : ""}`}
                                    onClick={() => setEstadoFiltro(estado.nombre)}
                                    style={{
                                        borderLeft: `4px solid ${estado.color || '#1890ff'}`
                                    }}
                                >
                                    <div className="dashboard-stat-number">
                                        {stats[estado.nombre] || 0}
                                    </div>
                                    <div className="dashboard-stat-label">{estado.nombre}</div>
                                </div>
                            ))
                        ) : (
                            // Fallback si no hay estados del backend (no debería pasar)
                            <div className="dashboard-stat-card">
                                <div className="dashboard-stat-label">Sin estados disponibles</div>
                            </div>
                        )}
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
                                        estadosProyecto={estadosProyecto}
                                        onEditar={onEditar}
                                        onEliminar={onEliminar}
                                        onVer={onVer}
                                        onCambiarEstado={onCambiarEstado}
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