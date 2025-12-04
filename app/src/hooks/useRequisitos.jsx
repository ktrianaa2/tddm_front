import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
    getStoredToken, 
    API_ENDPOINTS, 
    getWithAuth, 
    postJSONAuth, 
    putJSONAuth, 
    deleteWithAuth 
} from '../../config';

/**
 * Hook personalizado para gestionar requisitos
 * @param {number} proyectoId - ID del proyecto
 * @param {boolean} autoLoad - Si debe cargar automáticamente los datos
 * @returns {Object} Estado y funciones para gestionar requisitos
 */
export const useRequisitos = (proyectoId, autoLoad = true) => {
    // ============== ESTADOS ==============
    const [requisitos, setRequisitos] = useState([]);
    const [requisitoActual, setRequisitoActual] = useState(null);
    const [relacionesActuales, setRelacionesActuales] = useState([]);
    
    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    
    // Catálogos específicos para requisitos
    const [catalogos, setCatalogos] = useState({
        tipos_requisito: [],
        prioridades: [],
        estados: [],
        tipos_relacion_requisito: []
    });
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);

    // ============== FUNCIONES DE CATÁLOGOS ==============
    
    /**
     * Carga todos los catálogos necesarios para requisitos
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const [tiposReq, prioridades, estados, tiposRel] = await Promise.allSettled([
                getWithAuth(API_ENDPOINTS.TIPOS_REQUISITO, token),
                getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
                getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
                getWithAuth(API_ENDPOINTS.TIPOS_RELACION_REQUISITO, token)
            ]);

            const catalogosData = {
                tipos_requisito: [],
                prioridades: [],
                estados: [],
                tipos_relacion_requisito: []
            };

            // Procesar tipos de requisito
            if (tiposReq.status === 'fulfilled' && tiposReq.value) {
                const data = tiposReq.value.tipos_requisito || tiposReq.value.data || tiposReq.value;
                if (Array.isArray(data)) {
                    catalogosData.tipos_requisito = data.map(tipo => ({
                        id: tipo.id || tipo.tipo_id,
                        nombre: tipo.nombre,
                        key: tipo.key || tipo.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tipo.descripcion || '',
                        activo: tipo.activo !== false
                    }));
                }
            }

            // Procesar prioridades
            if (prioridades.status === 'fulfilled' && prioridades.value) {
                const data = prioridades.value.prioridades || prioridades.value.data || prioridades.value;
                if (Array.isArray(data)) {
                    catalogosData.prioridades = data.map(p => ({
                        id: p.id || p.prioridad_id,
                        nombre: p.nombre,
                        key: p.key || p.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: p.descripcion || '',
                        nivel: p.nivel,
                        activo: p.activo !== false
                    }));
                }
            }

            // Procesar estados
            if (estados.status === 'fulfilled' && estados.value) {
                const data = estados.value.estados_elemento || estados.value.estados || 
                            estados.value.data || estados.value;
                if (Array.isArray(data)) {
                    catalogosData.estados = data.map(e => ({
                        id: e.id || e.estado_id,
                        nombre: e.nombre,
                        key: e.key || e.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: e.descripcion || '',
                        tipo: e.tipo,
                        activo: e.activo !== false
                    }));
                }
            }

            // Procesar tipos de relación
            if (tiposRel.status === 'fulfilled' && tiposRel.value) {
                const data = tiposRel.value.tipos_relacion_requisito || 
                            tiposRel.value.tipos_relacion || 
                            tiposRel.value.data || tiposRel.value;
                if (Array.isArray(data)) {
                    catalogosData.tipos_relacion_requisito = data.map(tr => ({
                        id: tr.id || tr.relacion_id,
                        nombre: tr.nombre,
                        key: tr.key || tr.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tr.descripcion || '',
                        activo: tr.activo !== false
                    }));
                }
            }

            setCatalogos(catalogosData);
            return catalogosData;

        } catch (error) {
            message.error(`Error al cargar catálogos: ${error.message}`);
            throw error;
        } finally {
            setLoadingCatalogos(false);
        }
    }, []);

    // ============== FUNCIONES CRUD ==============

    /**
     * Listar todos los requisitos de un proyecto
     */
    const listarRequisitos = useCallback(async (showMessage = false) => {
        if (!proyectoId) {
            console.warn('No se puede listar requisitos sin proyectoId');
            return [];
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_REQUISITOS}/${proyectoId}/`,
                token
            );

            const requisitosData = response.requisitos || [];
            const requisitosProcessed = requisitosData.map(req => ({
                id: req.id,
                nombre: req.nombre,
                descripcion: req.descripcion,
                tipo: req.tipo,
                criterios: req.criterios,
                prioridad: req.prioridad,
                estado: req.estado,
                origen: req.origen || '',
                condiciones_previas: req.condiciones_previas || '',
                proyecto_id: req.proyecto_id,
                fecha_creacion: req.fecha_creacion
            }));

            setRequisitos(requisitosProcessed);
            if (showMessage) {
                message.success(`${requisitosProcessed.length} requisitos cargados`);
            }
            return requisitosProcessed;

        } catch (error) {
            message.error(`Error al listar requisitos: ${error.message}`);
            setRequisitos([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [proyectoId]);

    /**
     * Obtener un requisito específico con sus relaciones
     */
    const obtenerRequisito = useCallback(async (requisitoId, showMessage = false) => {
        if (!requisitoId) {
            console.warn('ID de requisito requerido');
            return null;
        }

        setLoadingDetalle(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.OBTENER_REQUISITO}/${requisitoId}/`,
                token
            );

            const requisito = response.requisito;
            if (requisito) {
                const requisitoProcessed = {
                    id: requisito.id,
                    nombre: requisito.nombre,
                    descripcion: requisito.descripcion,
                    tipo: requisito.tipo,
                    criterios: requisito.criterios,
                    prioridad: requisito.prioridad,
                    estado: requisito.estado,
                    origen: requisito.origen || '',
                    condiciones_previas: requisito.condiciones_previas || '',
                    proyecto_id: requisito.proyecto_id,
                    fecha_creacion: requisito.fecha_creacion,
                    relaciones_requisitos: requisito.relaciones_requisitos || []
                };

                setRequisitoActual(requisitoProcessed);
                setRelacionesActuales(requisitoProcessed.relaciones_requisitos);
                
                if (showMessage) {
                    message.success('Requisito cargado correctamente');
                }
                return requisitoProcessed;
            }

            return null;

        } catch (error) {
            message.error(`Error al obtener requisito: ${error.message}`);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    /**
     * Crear un nuevo requisito
     */
    const crearRequisito = useCallback(async (datosRequisito) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            // Preparar datos para enviar
            const payload = {
                nombre: datosRequisito.nombre,
                descripcion: datosRequisito.descripcion,
                tipo_id: datosRequisito.tipo_id,
                criterios: datosRequisito.criterios,
                proyecto_id: proyectoId,
                prioridad_id: datosRequisito.prioridad_id || null,
                estado_id: datosRequisito.estado_id || 1,
                origen: datosRequisito.origen || '',
                condiciones_previas: datosRequisito.condiciones_previas || '',
                relaciones_requisitos: datosRequisito.relaciones_requisitos || []
            };

            const response = await postJSONAuth(
                API_ENDPOINTS.CREAR_REQUISITO,
                payload,
                token
            );

            message.success('Requisito creado exitosamente');
            
            // Recargar la lista
            await listarRequisitos();
            
            return {
                success: true,
                requisito_id: response.requisito_id,
                data: response
            };

        } catch (error) {
            message.error(`Error al crear requisito: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, listarRequisitos]);

    /**
     * Actualizar un requisito existente
     */
    const actualizarRequisito = useCallback(async (requisitoId, datosActualizados) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await putJSONAuth(
                `${API_ENDPOINTS.ACTUALIZAR_REQUISITO}/${requisitoId}/`,
                datosActualizados,
                token
            );

            message.success('Requisito actualizado exitosamente');
            
            // Recargar la lista
            await listarRequisitos();
            
            // Si es el requisito actual, recargarlo
            if (requisitoActual && requisitoActual.id === requisitoId) {
                await obtenerRequisito(requisitoId);
            }
            
            return {
                success: true,
                data: response
            };

        } catch (error) {
            message.error(`Error al actualizar requisito: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [listarRequisitos, obtenerRequisito, requisitoActual]);

    /**
     * Eliminar un requisito (soft delete)
     */
    const eliminarRequisito = useCallback(async (requisitoId) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            await deleteWithAuth(
                `${API_ENDPOINTS.ELIMINAR_REQUISITO}/${requisitoId}/`,
                token
            );

            message.success('Requisito eliminado exitosamente');
            
            // Recargar la lista
            await listarRequisitos();
            
            // Limpiar requisito actual si era el eliminado
            if (requisitoActual && requisitoActual.id === requisitoId) {
                setRequisitoActual(null);
                setRelacionesActuales([]);
            }
            
            return {
                success: true
            };

        } catch (error) {
            message.error(`Error al eliminar requisito: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [listarRequisitos, requisitoActual]);

    /**
     * Obtener las relaciones de un requisito específico
     */
    const obtenerRelaciones = useCallback(async (requisitoId) => {
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}/`,
                token
            );

            const relaciones = response.relaciones || [];
            setRelacionesActuales(relaciones);
            return relaciones;

        } catch (error) {
            message.error(`Error al obtener relaciones: ${error.message}`);
            return [];
        }
    }, []);

    // ============== FUNCIONES AUXILIARES ==============

    /**
     * Buscar requisitos por texto
     */
    const buscarRequisitos = useCallback((texto) => {
        if (!texto || texto.trim() === '') {
            return requisitos;
        }

        const textoLower = texto.toLowerCase();
        return requisitos.filter(req => 
            req.nombre?.toLowerCase().includes(textoLower) ||
            req.descripcion?.toLowerCase().includes(textoLower) ||
            req.criterios?.toLowerCase().includes(textoLower)
        );
    }, [requisitos]);

    /**
     * Filtrar requisitos por criterios
     */
    const filtrarRequisitos = useCallback((filtros = {}) => {
        let resultado = [...requisitos];

        if (filtros.tipo) {
            resultado = resultado.filter(r => r.tipo === filtros.tipo);
        }

        if (filtros.prioridad) {
            resultado = resultado.filter(r => r.prioridad === filtros.prioridad);
        }

        if (filtros.estado) {
            resultado = resultado.filter(r => r.estado === filtros.estado);
        }

        return resultado;
    }, [requisitos]);

    /**
     * Obtener estadísticas de requisitos
     */
    const obtenerEstadisticas = useCallback(() => {
        const stats = {
            total: requisitos.length,
            porTipo: {},
            porPrioridad: {},
            porEstado: {}
        };

        requisitos.forEach(req => {
            // Por tipo
            if (req.tipo) {
                stats.porTipo[req.tipo] = (stats.porTipo[req.tipo] || 0) + 1;
            }

            // Por prioridad
            if (req.prioridad) {
                stats.porPrioridad[req.prioridad] = (stats.porPrioridad[req.prioridad] || 0) + 1;
            }

            // Por estado
            if (req.estado) {
                stats.porEstado[req.estado] = (stats.porEstado[req.estado] || 0) + 1;
            }
        });

        return stats;
    }, [requisitos]);

    /**
     * Limpiar estado
     */
    const limpiarEstado = useCallback(() => {
        setRequisitoActual(null);
        setRelacionesActuales([]);
    }, []);

    /**
     * Recargar todo (catálogos y requisitos)
     */
    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([
                cargarCatalogos(),
                listarRequisitos()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, listarRequisitos]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad && proyectoId) {
            // Cargar catálogos solo si no están cargados
            if (catalogos.tipos_requisito.length === 0) {
                cargarCatalogos();
            }
            // Cargar requisitos
            listarRequisitos();
        }
    }, [proyectoId, autoLoad]);

    // ============== RETURN ==============

    return {
        // Datos
        requisitos,
        requisitoActual,
        relacionesActuales,
        catalogos,
        estadisticas: obtenerEstadisticas(),

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,

        // Funciones CRUD
        listarRequisitos,
        obtenerRequisito,
        crearRequisito,
        actualizarRequisito,
        eliminarRequisito,
        obtenerRelaciones,

        // Funciones auxiliares
        buscarRequisitos,
        filtrarRequisitos,
        cargarCatalogos,
        limpiarEstado,
        recargarTodo,

        // Setters (por si se necesitan)
        setRequisitos,
        setRequisitoActual,
        setRelacionesActuales
    };
};