import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Space,
    Badge,
    Divider,
    Spin,
    message
} from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    BookOutlined,
    PlusOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';

// Importar los componentes individuales
import RequisitosSection from './requisitos/RequisitosSection';
import CasosDeUsoSection from './casos_de_uso/CasosDeUsoSection';
import HistoriasDeUsuarioSection from './historias_de_usuario/HistoriasUsuarioSection';

// Importar configuración de API
import { getStoredToken, API_ENDPOINTS, getWithAuth } from '../../../config';
import '../../styles/tabs.css'

const { Title, Text } = Typography;

const EspecificacionesTab = ({ proyecto }) => {
    const [activeSection, setActiveSection] = useState(null);

    // Estados para las especificaciones
    const [requisitos, setRequisitos] = useState([]);
    const [casosUso, setCasosUso] = useState([]);
    const [historiasUsuario, setHistoriasUsuario] = useState([]);

    // Estados para catálogos
    const [catalogos, setCatalogos] = useState(null);

    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    const proyectoId = proyecto?.proyecto_id;

    // Cargar todos los catálogos necesarios
    const cargarCatalogos = async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            // Cargar todos los catálogos en paralelo
            const [
                tiposRequisitoResponse,
                prioridadesResponse,
                estadosResponse,
                tiposRelacionRequisitoResponse,
                tiposRelacionCuResponse,
                tiposEstimacionResponse
            ] = await Promise.allSettled([
                getWithAuth(API_ENDPOINTS.TIPOS_REQUISITO, token),
                getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
                getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
                getWithAuth(API_ENDPOINTS.TIPOS_RELACION_REQUISITO, token),
                getWithAuth(API_ENDPOINTS.TIPOS_RELACION_CU, token),
                getWithAuth(API_ENDPOINTS.TIPOS_ESTIMACION, token)
            ]);

            const catalogosData = {
                tipos_requisito: [],
                prioridades: [],
                estados: [],
                tipos_relacion_requisito: [],
                tipos_relacion_cu: [],
                unidades_estimacion: []
            };

            // Procesar tipos de requisito
            if (tiposRequisitoResponse.status === 'fulfilled' && tiposRequisitoResponse.value) {
                const tiposData = tiposRequisitoResponse.value.tipos_requisito || tiposRequisitoResponse.value.data || tiposRequisitoResponse.value;
                if (Array.isArray(tiposData)) {
                    catalogosData.tipos_requisito = tiposData.map(tipo => ({
                        id: tipo.id || tipo.tipo_id,
                        nombre: tipo.nombre,
                        key: tipo.key || tipo.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tipo.descripcion || '',
                        activo: tipo.activo !== false
                    }));
                }
            }

            // Procesar prioridades
            if (prioridadesResponse.status === 'fulfilled' && prioridadesResponse.value) {
                const prioridadesData = prioridadesResponse.value.prioridades || prioridadesResponse.value.data || prioridadesResponse.value;
                if (Array.isArray(prioridadesData)) {
                    catalogosData.prioridades = prioridadesData.map(prioridad => ({
                        id: prioridad.id || prioridad.prioridad_id,
                        nombre: prioridad.nombre,
                        key: prioridad.key || prioridad.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: prioridad.descripcion || '',
                        nivel: prioridad.nivel,
                        activo: prioridad.activo !== false
                    }));
                }
            }

            // Procesar estados
            if (estadosResponse.status === 'fulfilled' && estadosResponse.value) {
                const estadosData = estadosResponse.value.estados_elemento || estadosResponse.value.estados || estadosResponse.value.data || estadosResponse.value;
                if (Array.isArray(estadosData)) {
                    catalogosData.estados = estadosData.map(estado => ({
                        id: estado.id || estado.estado_id,
                        nombre: estado.nombre,
                        key: estado.key || estado.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: estado.descripcion || '',
                        tipo: estado.tipo,
                        activo: estado.activo !== false
                    }));
                }
            }

            // Procesar tipos de relación para requisitos
            if (tiposRelacionRequisitoResponse.status === 'fulfilled' && tiposRelacionRequisitoResponse.value) {
                const tiposRelacionData = tiposRelacionRequisitoResponse.value.tipos_relacion_requisito ||
                    tiposRelacionRequisitoResponse.value.tipos_relacion || tiposRelacionRequisitoResponse.value.data ||
                    tiposRelacionRequisitoResponse.value;
                if (Array.isArray(tiposRelacionData)) {
                    catalogosData.tipos_relacion_requisito = tiposRelacionData.map(tipoRelacion => ({
                        id: tipoRelacion.id || tipoRelacion.relacion_id,
                        nombre: tipoRelacion.nombre,
                        key: tipoRelacion.key || tipoRelacion.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tipoRelacion.descripcion || '',
                        activo: tipoRelacion.activo !== false
                    }));
                }
            }

            // Procesar tipos de relación para casos de uso
            if (tiposRelacionCuResponse.status === 'fulfilled' && tiposRelacionCuResponse.value) {
                const tiposRelacionData = tiposRelacionCuResponse.value.tipos_relacion_cu ||
                    tiposRelacionCuResponse.value.tipos_relacion || tiposRelacionCuResponse.value.data ||
                    tiposRelacionCuResponse.value;
                if (Array.isArray(tiposRelacionData)) {
                    catalogosData.tipos_relacion_cu = tiposRelacionData.map(tipoRelacion => ({
                        id: tipoRelacion.id || tipoRelacion.relacion_id,
                        nombre: tipoRelacion.nombre,
                        key: tipoRelacion.key || tipoRelacion.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tipoRelacion.descripcion || '',
                        activo: tipoRelacion.activo !== false
                    }));
                }
            }

            // Procesar tipos de estimación
            if (tiposEstimacionResponse.status === 'fulfilled' && tiposEstimacionResponse.value) {
                const estimacionData = tiposEstimacionResponse.value.tipos_estimacion ||
                    tiposEstimacionResponse.value.data || tiposEstimacionResponse.value;
                if (Array.isArray(estimacionData)) {
                    catalogosData.unidades_estimacion = estimacionData.map(estimacion => ({
                        id: estimacion.id || estimacion.estimacion_id,
                        nombre: estimacion.nombre,
                        key: estimacion.key || estimacion.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: estimacion.descripcion || '',
                        activo: estimacion.activo !== false
                    }));
                }
            }

            setCatalogos(catalogosData);

        } catch (error) {
            setErrorCatalogos(error.message);
            message.error(`Error al cargar catálogos: ${error.message}`);
        } finally {
            setLoadingCatalogos(false);
        }
    };

    // Cargar todas las especificaciones
    const cargarEspecificaciones = async () => {
        if (!proyectoId) return;

        setLoading(true);
        try {
            const token = getStoredToken();

            // Cargar todas las especificaciones en paralelo
            const [requisitosResponse, casosUsoResponse, historiasResponse] = await Promise.allSettled([
                getWithAuth(`${API_ENDPOINTS.LISTAR_REQUISITOS}/${proyectoId}/`, token),
                getWithAuth(`${API_ENDPOINTS.LISTAR_CASOS_USO}/${proyectoId}/`, token),
                getWithAuth(`${API_ENDPOINTS.LISTAR_HISTORIAS_USUARIO}/${proyectoId}/`, token)
            ]);

            // Procesar requisitos
            if (requisitosResponse.status === 'fulfilled' && requisitosResponse.value) {
                const requisitosData = requisitosResponse.value.requisitos || [];
                const requisitosProcessed = requisitosData.map(req => ({
                    id: req.id,
                    nombre: req.nombre,
                    descripcion: req.descripcion,
                    tipo: req.tipo,
                    criterios: req.criterios,
                    prioridad: req.prioridad,
                    estado: req.estado,
                    origen: req.origen,
                    condiciones_previas: req.condiciones_previas,
                    proyecto_id: req.proyecto_id,
                    fecha_creacion: req.fecha_creacion
                }));
                setRequisitos(requisitosProcessed);
            } else {
                setRequisitos([]);
            }

            // Procesar casos de uso
            if (casosUsoResponse.status === 'fulfilled' && casosUsoResponse.value) {
                const casosUsoData = casosUsoResponse.value.data || [];
                const casosUsoProcessed = casosUsoData.map(cu => ({
                    id: cu.id,
                    nombre: cu.nombre,
                    descripcion: cu.descripcion,
                    actores: cu.actores,
                    precondiciones: cu.precondiciones,
                    flujo_principal: cu.flujo_principal,
                    flujos_alternativos: cu.flujos_alternativos,
                    postcondiciones: cu.postcondiciones,
                    prioridad: cu.prioridad,
                    estado: cu.estado,
                    proyecto_id: cu.proyecto_id,
                    fecha_creacion: cu.fecha_creacion,
                    relaciones: cu.relaciones || []
                }));
                setCasosUso(casosUsoProcessed);
            } else {
                setCasosUso([]);
            }

            // Procesar historias de usuario
            if (historiasResponse.status === 'fulfilled' && historiasResponse.value) {
                const historiasData = historiasResponse.value.historias || historiasResponse.value.historias_usuario || historiasResponse.value.data || [];
                const historiasProcessed = historiasData.map(historia => ({
                    id: historia.id,
                    descripcion_historia: historia.descripcion || historia.titulo || '',
                    actor_rol: historia.actor_rol || '',
                    funcionalidad_accion: historia.funcionalidad_accion || '',
                    beneficio_razon: historia.beneficio_razon || '',
                    criterios_aceptacion: historia.criterios_aceptacion || '',
                    dependencias_relaciones: historia.dependencias_relaciones || '',
                    componentes_relacionados: historia.componentes_relacionados || '',
                    valor_negocio: historia.valor_negocio,
                    notas_adicionales: historia.notas_adicionales || '',
                    proyecto_id: historia.proyecto_id,
                    fecha_creacion: historia.fecha_creacion,
                    prioridad: historia.prioridad,
                    estado: historia.estado,
                    estimacion_valor: historia.estimacion_valor,
                    unidad_estimacion: historia.unidad_estimacion,
                    estimaciones: historia.estimaciones || []
                }));
                setHistoriasUsuario(historiasProcessed);
            } else {
                setHistoriasUsuario([]);
            }

        } catch (error) {
            message.error(`Error al cargar especificaciones: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Recargar todo
    const handleRecargarTodo = async () => {
        await Promise.all([
            cargarCatalogos(),
            cargarEspecificaciones()
        ]);
    };

    // Efectos
    useEffect(() => {
        if (proyectoId) {
            if (!catalogos) {
                cargarCatalogos();
            }
            cargarEspecificaciones();
        }
    }, [proyectoId]);

    // Callback para actualizar listas después de operaciones CRUD
    const handleActualizarRequisitos = () => cargarEspecificaciones();
    const handleActualizarCasosUso = () => cargarEspecificaciones();
    const handleActualizarHistorias = () => cargarEspecificaciones();

    const contadores = {
        requisitos: requisitos.length,
        casosUso: casosUso.length,
        historiasUsuario: historiasUsuario.length
    };

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
                            onClick={cargarCatalogos}
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
                                onClick={handleRecargarTodo}
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
                            onClick={handleRecargarTodo}
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
                                                {contadores.requisitos + contadores.casosUso + contadores.historiasUsuario}
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