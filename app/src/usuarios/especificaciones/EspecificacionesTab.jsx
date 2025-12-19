import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button } from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    BookOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';

// Importar los hooks individuales refactorizados
import { useCasosUso } from '../../hooks/useCasosdeUso';
import { useRequisitos } from '../../hooks/useRequisitos';
import { useHistoriasUsuario } from '../../hooks/useHistoriasdeUsuario';

// Importar los componentes individuales
import RequisitosSection from './requisitos/RequisitosSection';
import CasosDeUsoSection from './casos_de_uso/CasosDeUsoSection';
import HistoriasDeUsuarioSection from './historias_de_usuario/HistoriasUsuarioSection';

import '../../styles/tabs.css';

const EspecificacionesTab = ({ proyecto }) => {
    const [activeSection, setActiveSection] = useState(null);

    const proyectoId = proyecto?.proyecto_id;

    // Usar autoLoad = true para cargar datos automáticamente
    const {
        contadores: contadoresCasosUso,
        loading: loadingCasosUso,
        casosUso
    } = useCasosUso(proyectoId, true);

    const {
        contadores: contadoresRequisitos,
        loading: loadingRequisitos,
        requisitos
    } = useRequisitos(proyectoId, true);

    const {
        contadores: contadoresHistorias,
        loading: loadingHistorias,
        historiasUsuario
    } = useHistoriasUsuario(proyectoId, true);

    // 🔧 FIX: Usar useMemo para calcular contadores consolidados
    // Esto evita recrear el objeto en cada render y previene el ciclo infinito
    const contadores = useMemo(() => {
        const requisitos = contadoresRequisitos?.total || 0;
        const casosUso = contadoresCasosUso?.total || 0;
        const historiasUsuario = contadoresHistorias?.total || 0;

        return {
            requisitos,
            casosUso,
            historiasUsuario,
            total: requisitos + casosUso + historiasUsuario
        };
    }, [
        contadoresRequisitos?.total,
        contadoresCasosUso?.total,
        contadoresHistorias?.total
    ]);

    const especificacionesCards = [
        {
            key: 'requisitos',
            title: 'Requisitos',
            icon: <FileTextOutlined />,
            count: contadores.requisitos,
            description: 'Gestiona los requisitos funcionales y no funcionales del proyecto',
            className: 'requisitos',
            loading: loadingRequisitos
        },
        {
            key: 'casos-uso',
            title: 'Casos de Uso',
            icon: <UserOutlined />,
            count: contadores.casosUso,
            description: 'Define los casos de uso y escenarios de interacción',
            className: 'casos-uso',
            loading: loadingCasosUso
        },
        {
            key: 'historias-usuario',
            title: 'Historias de Usuario',
            icon: <BookOutlined />,
            count: contadores.historiasUsuario,
            description: 'Crea historias de usuario para metodologías ágiles',
            className: 'historias-usuario',
            loading: loadingHistorias
        }
    ];

    const handleCardClick = (key) => {
        setActiveSection(key);
    };

    const handleBackToOverview = () => {
        setActiveSection(null);
    };

    // Si hay una sección activa, mostrar solo ese componente
    if (activeSection) {
        return (
            <div className="tab-main-content">
                <div className="tab-back-navigation">
                    <Button
                        onClick={handleBackToOverview}
                        className="tab-back-btn"
                        icon={<ArrowLeftOutlined />}
                    >
                        Volver a Especificaciones
                    </Button>
                </div>

                {activeSection === 'requisitos' && (
                    <RequisitosSection proyectoId={proyectoId} />
                )}
                {activeSection === 'casos-uso' && (
                    <CasosDeUsoSection proyectoId={proyectoId} />
                )}
                {activeSection === 'historias-usuario' && (
                    <HistoriasDeUsuarioSection proyectoId={proyectoId} />
                )}
            </div>
        );
    }

    // Vista general con cards de navegación
    return (
        <div className="tab-main-content">
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: '2px solid var(--border-color)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1.5rem'
                }}>
                    <div>
                        <h3 className="tab-title" style={{ marginBottom: '0.5rem' }}>
                            Gestión de Especificaciones
                        </h3>
                        <p className="tab-subtitle" style={{ margin: 0 }}>
                            Organiza y gestiona todos los elementos de especificación de tu proyecto
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards de navegación */}
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
                                    {card.loading ? '...' : card.count}
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
                                    {card.loading ? '...' : card.count}
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
                                <span className="tab-summary-item-value">
                                    {loadingRequisitos ? '...' : contadores.requisitos}
                                </span>
                            </div>
                            <div className="tab-summary-item">
                                <span className="tab-summary-item-label">Casos de Uso:</span>
                                <span className="tab-summary-item-value">
                                    {loadingCasosUso ? '...' : contadores.casosUso}
                                </span>
                            </div>
                            <div className="tab-summary-item">
                                <span className="tab-summary-item-label">Historias de Usuario:</span>
                                <span className="tab-summary-item-value">
                                    {loadingHistorias ? '...' : contadores.historiasUsuario}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default EspecificacionesTab;