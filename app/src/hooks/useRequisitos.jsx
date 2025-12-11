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
    // Estados para los requisitos
    const [requisitos, setRequisitos] = useState([]);
    const [requisitoActual, setRequisitoActual] = useState(null);
    const [relacionesActuales, setRelacionesActuales] = useState([]);

    // Estados para catálogos
    const [catalogos, setCatalogos] = useState(null);

    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    // ============== FUNCIONES DE CATÁLOGOS ==============

    /**
     * Carga todos los catálogos necesarios para requisitos
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

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

            // Procesar estados (filtrar solo para requisitos)
            if (estados.status === 'fulfilled' && estados.value) {
                const data = estados.value.estados_elemento || estados.value.estados ||
                    estados.value.data || estados.value;
                if (Array.isArray(data)) {
                    catalogosData.estados = data
                        .filter(e => e.tipo === 'requisito' || !e.tipo)
                        .map(e => ({
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
            const errorMsg = error.message || 'Error desconocido';
            setErrorCatalogos(errorMsg);
            message.error(`Error al cargar catálogos: ${errorMsg}`);
            throw error;
        } finally {
            setLoadingCatalogos(false);
        }
    }, []);

    // ============== FUNCIONES DE CARGA ==============

    /**
     * Listar todos los requisitos de un proyecto
     */
    const cargarRequisitos = useCallback(async () => {
        if (!proyectoId) {
            console.warn('No se puede cargar requisitos sin proyectoId');
            return;
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_REQUISITOS}/${proyectoId}/`,
                token
            );

            // Intentar diferentes estructuras de respuesta
            const requisitosData = response.requisitos || response.data || [];

            if (Array.isArray(requisitosData)) {
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
                    fecha_creacion: req.fecha_creacion,
                    relaciones_requisitos: req.relaciones_requisitos || []
                }));
                setRequisitos(requisitosProcessed);
            } else {
                setRequisitos([]);
            }

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al cargar requisitos: ${errorMsg}`);
            setRequisitos([]);
            throw error;
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

            const requisito = response.requisito || response;
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
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al obtener requisito: ${errorMsg}`);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

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
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al obtener relaciones: ${errorMsg}`);
            return [];
        }
    }, []);

    // ============== FUNCIONES CRUD ==============

    /**
     * Crear un nuevo requisito
     */
    const crearRequisito = useCallback(async (datosRequisito) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

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
            await cargarRequisitos();

            return {
                success: true,
                requisito_id: response.requisito_id,
                data: response
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al crear requisito: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, cargarRequisitos]);

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
            await cargarRequisitos();

            if (requisitoActual && requisitoActual.id === requisitoId) {
                await obtenerRequisito(requisitoId);
            }

            return {
                success: true,
                data: response
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al actualizar requisito: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarRequisitos, obtenerRequisito, requisitoActual]);

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
            await cargarRequisitos();

            if (requisitoActual && requisitoActual.id === requisitoId) {
                setRequisitoActual(null);
                setRelacionesActuales([]);
            }

            return { success: true };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al eliminar requisito: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarRequisitos, requisitoActual]);

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
            porEstado: {},
            conRelaciones: 0,
            sinRelaciones: 0,
            totalRelaciones: 0
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

            // Contar relaciones
            const numRelaciones = req.relaciones_requisitos?.length || 0;
            stats.totalRelaciones += numRelaciones;

            if (numRelaciones > 0) {
                stats.conRelaciones++;
            } else {
                stats.sinRelaciones++;
            }
        });

        return stats;
    }, [requisitos]);

    /**
     * Validar datos de requisito antes de crear/actualizar
     */
    const validarDatosRequisito = useCallback((datos) => {
        const errores = [];

        if (!datos.nombre || datos.nombre.trim() === '') {
            errores.push('El nombre es obligatorio');
        } else if (datos.nombre.trim().length > 100) {
            errores.push('El nombre no puede exceder 100 caracteres');
        }

        if (!datos.descripcion || datos.descripcion.trim() === '') {
            errores.push('La descripción es obligatoria');
        }

        if (!datos.tipo_id) {
            errores.push('El tipo de requisito es obligatorio');
        }

        if (!datos.criterios || datos.criterios.trim() === '') {
            errores.push('Los criterios de aceptación son obligatorios');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }, []);

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
                cargarRequisitos()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, cargarRequisitos]);

    // ============== EFECTOS ==============

    /**
     * Efecto para carga automática
     */
    useEffect(() => {
        if (autoLoad && proyectoId) {
            // Cargar catálogos solo si no están cargados
            if (!catalogos) {
                cargarCatalogos();
            }
            // Cargar requisitos cuando cambia el proyecto
            cargarRequisitos();
        }
    }, [proyectoId, autoLoad]);

    // ============== CONTADORES ==============
    const contadores = {
        total: requisitos.length,
        porTipo: obtenerEstadisticas().porTipo,
        porPrioridad: obtenerEstadisticas().porPrioridad,
        porEstado: obtenerEstadisticas().porEstado,
        conRelaciones: obtenerEstadisticas().conRelaciones,
        sinRelaciones: obtenerEstadisticas().sinRelaciones,
        totalRelaciones: obtenerEstadisticas().totalRelaciones
    };

    // ============== RETURN ==============

    return {
        // Datos
        requisitos,
        requisitoActual,
        relacionesActuales,
        catalogos,
        contadores,
        estadisticas: obtenerEstadisticas(),

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,
        errorCatalogos,

        // Funciones de carga
        cargarCatalogos,
        cargarRequisitos,

        // Funciones CRUD
        obtenerRequisito,
        crearRequisito,
        actualizarRequisito,
        eliminarRequisito,
        obtenerRelaciones,

        // Funciones auxiliares
        buscarRequisitos,
        filtrarRequisitos,
        validarDatosRequisito,
        limpiarEstado,
        recargarTodo,

        // Setters
        setRequisitos,
        setRequisitoActual,
        setRelacionesActuales
    };
};