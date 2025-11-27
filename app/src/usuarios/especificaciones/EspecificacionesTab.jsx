import React, { useState } from 'react';
import { Card, Button, Spin } from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    BookOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';

import { useEspecificaciones } from '../../hooks/useEspecificaciones';

// Importar los componentes individuales
import RequisitosSection from './requisitos/RequisitosSection';
import CasosDeUsoSection from './casos_de_uso/CasosDeUsoSection';
import HistoriasDeUsuarioSection from './historias_de_usuario/HistoriasUsuarioSection';

import '../../styles/tabs.css';

const EspecificacionesTab = ({ proyecto }) => {
    const [activeSection, setActiveSection] = useState(null);

    const proyectoId = proyecto?.proyecto_id;

    // Usar el custom hook para toda la lógica de datos
    const {
        requisitos,
        casosUso,
        historiasUsuario,
        catalogos,
        contadores,
        loading,
        loadingCatalogos,
        errorCatalogos,
        cargarEspecificaciones,
        recargarTodo
    } = useEspecificaciones(proyectoId);

    // Callbacks para actualizar después de operaciones CRUD
    const handleActualizarRequisitos = () => cargarEspecificaciones();
    const handleActualizarCasosUso = () => cargarEspecificaciones();
    const handleActualizarHistorias = () => cargarEspecificaciones();

    const especificacionesCards = [
        {
            key: 'requisitos',
            title: 'Requisitos',
            icon: <FileTextOutlined />,
            count: contadores.requisitos,
            description: 'Gestiona los requisitos funcionales y no funcionales del proyecto',
            className: 'requisitos'
        },
        {
            key: 'casos-uso',
            title: 'Casos de Uso',
            icon: <UserOutlined />,
            count: contadores.casosUso,
            description: 'Define los casos de uso y escenarios de interacción',
            className: 'casos-uso'
        },
        {
            key: 'historias-usuario',
            title: 'Historias de Usuario',
            icon: <BookOutlined />,
            count: contadores.historiasUsuario,
            description: 'Crea historias de usuario para metodologías ágiles',
            className: 'historias-usuario'
        }
    ];

    const handleCardClick = (key) => {
        setActiveSection(key);
    };

    const handleBackToOverview = () => {
        setActiveSection(null);
    };

    // Mostrar error si no se pudieron cargar los catálogos
    if (errorCatalogos && !catalogos) {
        return (
            <div className="tabs-container">
                <div className="tabs-content-wrapper">
                    <div className="tab-error-state">
                        <ExclamationCircleOutlined className="tab-error-icon" />
                        <div className="tab-error-title">Error al cargar catálogos</div>
                        <div className="tab-error-description">{errorCatalogos}</div>
                        <Button
                            onClick={recargarTodo}
                            loading={loadingCatalogos}
                            className="tab-error-retry-btn"
                        >
                            Reintentar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (activeSection) {
        return (
            <div className="tabs-container">
                <div className="tabs-content-wrapper">
                    <div className="tab-active-section">
                        <div className="tab-back-navigation">
                            <Button
                                onClick={handleBackToOverview}
                                className="tab-back-btn"
                                icon={<ArrowLeftOutlined />}
                            >
                                Volver a Especificaciones
                            </Button>

                            <Button
                                icon={<ReloadOutlined />}
                                onClick={recargarTodo}
                                loading={loading || loadingCatalogos}
                                className="tab-refresh-btn"
                            >
                                Actualizar
                            </Button>
                        </div>

                        {activeSection === 'requisitos' && (
                            <RequisitosSection
                                proyectoId={proyectoId}
                                requisitos={requisitos}
                                catalogos={catalogos}
                                loading={loading}
                                loadingCatalogos={loadingCatalogos}
                                onActualizar={handleActualizarRequisitos}
                            />
                        )}
                        {activeSection === 'casos-uso' && (
                            <CasosDeUsoSection
                                proyectoId={proyectoId}
                                casosUso={casosUso}
                                catalogos={catalogos}
                                loading={loading}
                                loadingCatalogos={loadingCatalogos}
                                onActualizar={handleActualizarCasosUso}
                            />
                        )}
                        {activeSection === 'historias-usuario' && (
                            <HistoriasDeUsuarioSection
                                proyectoId={proyectoId}
                                historiasUsuario={historiasUsuario}
                                catalogos={catalogos}
                                loading={loading}
                                loadingCatalogos={loadingCatalogos}
                                onActualizar={handleActualizarHistorias}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tabs-container">
            <div className="tabs-content-wrapper">
                <div className="tab-header">
                    <div className="tab-header-content">
                        <h3 className="tab-title">Gestión de Especificaciones</h3>
                        <p className="tab-subtitle">
                            Organiza y gestiona todos los elementos de especificación de tu proyecto
                        </p>
                    </div>
                    <div className="tab-header-actions">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={recargarTodo}
                            loading={loading || loadingCatalogos}
                            className="tab-refresh-btn"
                        >
                            Actualizar Todo
                        </Button>
                    </div>
                </div>

                <div className="tab-main-content">
                    {/* Loading inicial */}
                    {(loadingCatalogos && !catalogos) || (loading && !proyectoId) ? (
                        <div className="tab-loading-state">
                            <Spin size="large" className="tab-loading-spinner" />
                            <div className="tab-loading-text">
                                Cargando especificaciones...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="tab-navigation-grid">
                                {especificacionesCards.map((card) => (
                                    <div
                                        key={card.key}
                                        className={`tab-nav-card ${card.className}`}
                                        onClick={() => handleCardClick(card.key)}
                                    >
                                        <div className="tab-nav-card-body">
                                            <div className="tab-nav-card-icon-wrapper">
                                                <div className="tab-nav-card-icon">
                                                    {card.icon}
                                                </div>
                                                <div className="tab-nav-card-count">
                                                    {card.count}
                                                </div>
                                            </div>

                                            <h4 className="tab-nav-card-title">
                                                {card.title}
                                            </h4>

                                            <p className="tab-nav-card-description">
                                                {card.description}
                                            </p>

                                            <div className="tab-nav-card-divider"></div>

                                            <div className="tab-nav-card-stats">
                                                <span className="tab-nav-card-stats-number">
                                                    {card.count}
                                                </span>
                                                <span className="tab-nav-card-stats-label">
                                                    elementos
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Resumen General */}
                            <div className="tab-summary-card">
                                <Card
                                    title="Resumen de Especificaciones"
                                    className="tab-summary-card"
                                >
                                    <div className="tab-summary-row">
                                        <div className="tab-summary-total">
                                            <div className="tab-summary-total-number">
                                                {contadores.total}
                                            </div>
                                            <div className="tab-summary-total-label">
                                                Total de Especificaciones
                                            </div>
                                        </div>
                                        <div className="tab-summary-breakdown">
                                            <div className="tab-summary-item">
                                                <span className="tab-summary-item-label">Requisitos:</span>
                                                <span className="tab-summary-item-value">{contadores.requisitos}</span>
                                            </div>
                                            <div className="tab-summary-item">
                                                <span className="tab-summary-item-label">Casos de Uso:</span>
                                                <span className="tab-summary-item-value">{contadores.casosUso}</span>
                                            </div>
                                            <div className="tab-summary-item">
                                                <span className="tab-summary-item-label">Historias de Usuario:</span>
                                                <span className="tab-summary-item-value">{contadores.historiasUsuario}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EspecificacionesTab;