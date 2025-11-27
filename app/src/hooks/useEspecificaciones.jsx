import { useState, useEffect } from 'react';
import { message } from 'antd';
import { getStoredToken, API_ENDPOINTS, getWithAuth } from '../../config';

export const useEspecificaciones = (proyectoId, autoLoad = true) => {
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

    /**
     * Carga todos los catálogos necesarios
     */
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
                const tiposData = tiposRequisitoResponse.value.tipos_requisito || 
                    tiposRequisitoResponse.value.data || tiposRequisitoResponse.value;
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
                const prioridadesData = prioridadesResponse.value.prioridades || 
                    prioridadesResponse.value.data || prioridadesResponse.value;
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
                const estadosData = estadosResponse.value.estados_elemento || 
                    estadosResponse.value.estados || estadosResponse.value.data || estadosResponse.value;
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
                    tiposRelacionRequisitoResponse.value.tipos_relacion || 
                    tiposRelacionRequisitoResponse.value.data || tiposRelacionRequisitoResponse.value;
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
                    tiposRelacionCuResponse.value.tipos_relacion || 
                    tiposRelacionCuResponse.value.data || tiposRelacionCuResponse.value;
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
            return catalogosData;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            setErrorCatalogos(errorMsg);
            message.error(`Error al cargar catálogos: ${errorMsg}`);
            throw error;
        } finally {
            setLoadingCatalogos(false);
        }
    };

    /**
     * Carga todas las especificaciones del proyecto
     */
    const cargarEspecificaciones = async () => {
        if (!proyectoId) {
            console.warn('No se puede cargar especificaciones sin proyectoId');
            return;
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

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
                const historiasData = historiasResponse.value.historias || 
                    historiasResponse.value.historias_usuario || 
                    historiasResponse.value.data || [];
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

            return {
                requisitos: requisitosResponse.status === 'fulfilled' ? requisitosResponse.value : null,
                casosUso: casosUsoResponse.status === 'fulfilled' ? casosUsoResponse.value : null,
                historias: historiasResponse.status === 'fulfilled' ? historiasResponse.value : null
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al cargar especificaciones: ${errorMsg}`);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Recarga todos los datos (catálogos y especificaciones)
     */
    const recargarTodo = async () => {
        try {
            await Promise.all([
                cargarCatalogos(),
                cargarEspecificaciones()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    };

    /**
     * Efecto para carga automática
     */
    useEffect(() => {
        if (autoLoad && proyectoId) {
            // Cargar catálogos solo si no están cargados
            if (!catalogos) {
                cargarCatalogos();
            }
            // cargar especificaciones cuando cambia el proyecto
            cargarEspecificaciones();
        }
    }, [proyectoId, autoLoad]);

    // Contadores
    const contadores = {
        requisitos: requisitos.length,
        casosUso: casosUso.length,
        historiasUsuario: historiasUsuario.length,
        total: requisitos.length + casosUso.length + historiasUsuario.length
    };

    return {
        // Datos
        requisitos,
        casosUso,
        historiasUsuario,
        catalogos,
        contadores,
        
        // Estados de carga
        loading,
        loadingCatalogos,
        errorCatalogos,
        
        // Funciones
        cargarCatalogos,
        cargarEspecificaciones,
        recargarTodo,
        
        // Setters
        setRequisitos,
        setCasosUso,
        setHistoriasUsuario
    };
};