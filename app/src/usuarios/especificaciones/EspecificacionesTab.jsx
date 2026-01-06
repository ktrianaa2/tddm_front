import React, { useState, useMemo } from 'react';
import { Spin } from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    BookOutlined,
    BarChartOutlined
} from '@ant-design/icons';

// Importar los hooks
import { useCasosUso } from '../../hooks/useCasosdeUso';
import { useRequisitos } from '../../hooks/useRequisitos';
import { useHistoriasUsuario } from '../../hooks/useHistoriasdeUsuario';

// Importar los componentes de sección
import RequisitosSection from './requisitos/RequisitosSection';
import CasosDeUsoSection from './casos_de_uso/CasosDeUsoSection';
import HistoriasDeUsuarioSection from './historias_de_usuario/HistoriasUsuarioSection';
import DiagramasUMLSection from './DiagramasUMLSection';

import '../../styles/tabs.css';

const EspecificacionesTab = ({ proyecto }) => {
    const [activeSection, setActiveSection] = useState('diagramas');
    const [refreshKey, setRefreshKey] = useState(0);

    const proyectoId = proyecto?.proyecto_id;

    // Cargar datos de todos los hooks (con autoLoad basado en refreshKey)
    const {
        contadores: contadoresCasosUso,
        loading: loadingCasosUso,
        casosUso,
        cargarCasosUso
    } = useCasosUso(proyectoId, true);

    const {
        contadores: contadoresRequisitos,
        loading: loadingRequisitos,
        requisitos,
        cargarRequisitos
    } = useRequisitos(proyectoId, true);

    const {
        contadores: contadoresHistorias,
        loading: loadingHistorias,
        historiasUsuario,
        cargarHistoriasUsuario
    } = useHistoriasUsuario(proyectoId, true);

    // Recargar datos cuando cambias de sección o agregas elementos
    const recargarDatos = async () => {
        try {
            await Promise.all([
                cargarCasosUso(),
                cargarRequisitos(),
                cargarHistoriasUsuario()
            ]);
        } catch (error) {
            console.error('Error recargando datos:', error);
        }
    };

    // Recargar cuando cambias de sección hacia diagramas
    React.useEffect(() => {
        if (activeSection === 'diagramas') {
            recargarDatos();
        }
    }, [activeSection]);

    // Calcular contadores consolidados
    const contadores = useMemo(() => {
        const requisitosTotal = contadoresRequisitos?.total || 0;
        const casosUsoTotal = contadoresCasosUso?.total || 0;
        const historiasUsuarioTotal = contadoresHistorias?.total || 0;

        return {
            requisitos: requisitosTotal,
            casosUso: casosUsoTotal,
            historiasUsuario: historiasUsuarioTotal,
            total: requisitosTotal + casosUsoTotal + historiasUsuarioTotal
        };
    }, [
        contadoresRequisitos?.total,
        contadoresCasosUso?.total,
        contadoresHistorias?.total
    ]);

    const isLoading = loadingRequisitos || loadingCasosUso || loadingHistorias;

    // Definir las tarjetas de navegación
    const navigationCards = [
        {
            key: 'diagramas',
            label: 'Diagramas UML',
            icon: <BarChartOutlined />,
            count: contadores.total,
            classColor: 'arquitectura',
            showCount: false
        },
        {
            key: 'casos-uso',
            label: 'Casos de Uso',
            icon: <UserOutlined />,
            count: contadores.casosUso,
            classColor: 'casos-uso',
            showCount: true
        },
        {
            key: 'requisitos',
            label: 'Requisitos',
            icon: <FileTextOutlined />,
            count: contadores.requisitos,
            classColor: 'requisitos',
            showCount: true
        },
        {
            key: 'historias-usuario',
            label: 'Historias de Usuario',
            icon: <BookOutlined />,
            count: contadores.historiasUsuario,
            classColor: 'historias-usuario',
            showCount: true
        }
    ];

    return (
        <div className="tab-main-content">
            {/* Header */}
            <div className="tab-back-navigation">
                <h3 className="tab-title">Gestión de Especificaciones</h3>
            </div>

            {/* Layout: Sidebar izquierda + Content derecha */}
            <div className="tab-sidebar-layout">
                {/* Sidebar con cards verticales */}
                <div className="tab-sidebar-cards">
                    {navigationCards.map((card) => (
                        <div
                            key={card.key}
                            className={`tab-sidebar-card ${card.classColor} ${activeSection === card.key ? 'active' : ''}`}
                            onClick={() => setActiveSection(card.key)}
                        >
                            <div className="tab-sidebar-card-icon-wrapper">
                                <span className="tab-sidebar-card-icon">
                                    {card.icon}
                                </span>
                                {card.showCount && card.count > 0 && (
                                    <span className="tab-sidebar-card-count">
                                        {card.count}
                                    </span>
                                )}
                            </div>
                            <div className="tab-sidebar-card-content">
                                <h4 className="tab-sidebar-card-title">
                                    {card.label}
                                </h4>
                                <p className="tab-sidebar-card-description">
                                    {isLoading ? (
                                        <Spin size="small" />
                                    ) : card.showCount ? (
                                        <>
                                            {card.count}{' '}
                                            {card.count === 1 ? 'elemento' : 'elementos'}
                                        </>
                                    ) : (
                                        'Ver diagrama'
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Area a la derecha */}
                <div className="tab-content-area">
                    {activeSection === 'diagramas' && (
                        <DiagramasUMLSection
                            proyectoId={proyectoId}
                            requisitos={requisitos}
                            casosUso={casosUso}
                            historiasUsuario={historiasUsuario}
                            loading={isLoading}
                        />
                    )}
                    {activeSection === 'casos-uso' && (
                        <CasosDeUsoSection proyectoId={proyectoId} />
                    )}
                    {activeSection === 'requisitos' && (
                        <RequisitosSection proyectoId={proyectoId} />
                    )}
                    {activeSection === 'historias-usuario' && (
                        <HistoriasDeUsuarioSection proyectoId={proyectoId} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EspecificacionesTab;