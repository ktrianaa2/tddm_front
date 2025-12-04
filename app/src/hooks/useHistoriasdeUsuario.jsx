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
 * Hook personalizado para gestionar historias de usuario
 * @param {number} proyectoId - ID del proyecto
 * @param {boolean} autoLoad - Si debe cargar automáticamente los datos
 * @returns {Object} Estado y funciones para gestionar historias de usuario
 */
export const useHistoriasUsuario = (proyectoId, autoLoad = true) => {
    // ============== ESTADOS ==============
    const [historiasUsuario, setHistoriasUsuario] = useState([]);
    const [historiaActual, setHistoriaActual] = useState(null);
    const [estimacionesActuales, setEstimacionesActuales] = useState([]);
    
    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    
    // Catálogos específicos para historias de usuario
    const [catalogos, setCatalogos] = useState({
        prioridades: [],
        estados: [],
        tipos_estimacion: []
    });
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);

    // ============== FUNCIONES DE CATÁLOGOS ==============
    
    /**
     * Carga todos los catálogos necesarios para historias de usuario
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const [prioridades, estados, tiposEst] = await Promise.allSettled([
                getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
                getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
                getWithAuth(API_ENDPOINTS.TIPOS_ESTIMACION, token)
            ]);

            const catalogosData = {
                prioridades: [],
                estados: [],
                tipos_estimacion: []
            };

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

            // Procesar estados (filtrar para historias de usuario)
            if (estados.status === 'fulfilled' && estados.value) {
                const data = estados.value.estados_elemento || estados.value.estados || 
                            estados.value.data || estados.value;
                if (Array.isArray(data)) {
                    catalogosData.estados = data
                        .filter(e => e.tipo === 'historia_usuario' || !e.tipo)
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

            // Procesar tipos de estimación
            if (tiposEst.status === 'fulfilled' && tiposEst.value) {
                const data = tiposEst.value.tipos_estimacion || 
                            tiposEst.value.data || tiposEst.value;
                if (Array.isArray(data)) {
                    catalogosData.tipos_estimacion = data.map(te => ({
                        id: te.id || te.estimacion_id,
                        nombre: te.nombre,
                        key: te.key || te.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: te.descripcion || '',
                        activo: te.activo !== false
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
     * Listar todas las historias de usuario de un proyecto
     */
    const listarHistoriasUsuario = useCallback(async (showMessage = false) => {
        if (!proyectoId) {
            console.warn('No se puede listar historias de usuario sin proyectoId');
            return [];
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_HISTORIAS_USUARIO}/${proyectoId}/`,
                token
            );

            const historiasData = response.historias || [];
            const historiasProcessed = historiasData.map(h => ({
                id: h.id,
                titulo: h.titulo,
                descripcion: h.descripcion || '',
                actor_rol: h.actor_rol || '',
                funcionalidad_accion: h.funcionalidad_accion || '',
                beneficio_razon: h.beneficio_razon || '',
                criterios_aceptacion: h.criterios_aceptacion,
                prioridad: h.prioridad,
                estado: h.estado,
                valor_negocio: h.valor_negocio,
                dependencias_relaciones: h.dependencias_relaciones || '',
                componentes_relacionados: h.componentes_relacionados || '',
                notas_adicionales: h.notas_adicionales || '',
                proyecto_id: h.proyecto_id,
                fecha_creacion: h.fecha_creacion,
                estimaciones: h.estimaciones || [],
                // Compatibilidad con formato antiguo
                estimacion_valor: h.estimacion_valor,
                unidad_estimacion: h.unidad_estimacion
            }));

            setHistoriasUsuario(historiasProcessed);
            if (showMessage) {
                message.success(`${historiasProcessed.length} historias de usuario cargadas`);
            }
            return historiasProcessed;

        } catch (error) {
            message.error(`Error al listar historias de usuario: ${error.message}`);
            setHistoriasUsuario([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [proyectoId]);

    /**
     * Obtener una historia de usuario específica con sus estimaciones
     */
    const obtenerHistoriaUsuario = useCallback(async (historiaId, showMessage = false) => {
        if (!historiaId) {
            console.warn('ID de historia de usuario requerido');
            return null;
        }

        setLoadingDetalle(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.OBTENER_HISTORIA_USUARIO}/${historiaId}/`,
                token
            );

            const historia = response.historia;
            if (historia) {
                const historiaProcessed = {
                    id: historia.id,
                    titulo: historia.titulo,
                    descripcion: historia.descripcion || '',
                    actor_rol: historia.actor_rol || '',
                    funcionalidad_accion: historia.funcionalidad_accion || '',
                    beneficio_razon: historia.beneficio_razon || '',
                    criterios_aceptacion: historia.criterios_aceptacion,
                    prioridad: historia.prioridad,
                    estado: historia.estado,
                    valor_negocio: historia.valor_negocio,
                    dependencias_relaciones: historia.dependencias_relaciones || '',
                    componentes_relacionados: historia.componentes_relacionados || '',
                    notas_adicionales: historia.notas_adicionales || '',
                    proyecto_id: historia.proyecto_id,
                    fecha_creacion: historia.fecha_creacion,
                    estimaciones: historia.estimaciones || [],
                    estimacion_valor: historia.estimacion_valor,
                    unidad_estimacion: historia.unidad_estimacion
                };

                setHistoriaActual(historiaProcessed);
                setEstimacionesActuales(historiaProcessed.estimaciones);
                
                if (showMessage) {
                    message.success('Historia de usuario cargada correctamente');
                }
                return historiaProcessed;
            }

            return null;

        } catch (error) {
            message.error(`Error al obtener historia de usuario: ${error.message}`);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    /**
     * Crear una nueva historia de usuario
     */
    const crearHistoriaUsuario = useCallback(async (datosHistoria) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            // Preparar datos para enviar
            const payload = {
                titulo: datosHistoria.titulo,
                descripcion: datosHistoria.descripcion || '',
                actor_rol: datosHistoria.actor_rol || '',
                funcionalidad_accion: datosHistoria.funcionalidad_accion || '',
                beneficio_razon: datosHistoria.beneficio_razon || '',
                criterios_aceptacion: datosHistoria.criterios_aceptacion,
                proyecto_id: proyectoId,
                prioridad_id: datosHistoria.prioridad_id || null,
                estado_id: datosHistoria.estado_id || 1,
                valor_negocio: datosHistoria.valor_negocio || null,
                dependencias_relaciones: datosHistoria.dependencias_relaciones || '',
                componentes_relacionados: datosHistoria.componentes_relacionados || '',
                notas_adicionales: datosHistoria.notas_adicionales || '',
                estimaciones: datosHistoria.estimaciones || []
            };

            const response = await postJSONAuth(
                API_ENDPOINTS.CREAR_HISTORIA_USUARIO,
                payload,
                token
            );

            message.success('Historia de usuario creada exitosamente');
            
            // Recargar la lista
            await listarHistoriasUsuario();
            
            return {
                success: true,
                historia_id: response.historia_id,
                estimaciones_creadas: response.estimaciones_creadas || [],
                data: response
            };

        } catch (error) {
            message.error(`Error al crear historia de usuario: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, listarHistoriasUsuario]);

    /**
     * Actualizar una historia de usuario existente
     */
    const actualizarHistoriaUsuario = useCallback(async (historiaId, datosActualizados) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await putJSONAuth(
                `${API_ENDPOINTS.ACTUALIZAR_HISTORIA_USUARIO}/${historiaId}/`,
                datosActualizados,
                token
            );

            message.success('Historia de usuario actualizada exitosamente');
            
            // Recargar la lista
            await listarHistoriasUsuario();
            
            // Si es la historia actual, recargarla
            if (historiaActual && historiaActual.id === historiaId) {
                await obtenerHistoriaUsuario(historiaId);
            }
            
            return {
                success: true,
                estimaciones_actualizadas: response.estimaciones_actualizadas || 0,
                data: response
            };

        } catch (error) {
            message.error(`Error al actualizar historia de usuario: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [listarHistoriasUsuario, obtenerHistoriaUsuario, historiaActual]);

    /**
     * Eliminar una historia de usuario (soft delete)
     */
    const eliminarHistoriaUsuario = useCallback(async (historiaId) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            await deleteWithAuth(
                `${API_ENDPOINTS.ELIMINAR_HISTORIA_USUARIO}/${historiaId}/`,
                token
            );

            message.success('Historia de usuario eliminada exitosamente');
            
            // Recargar la lista
            await listarHistoriasUsuario();
            
            // Limpiar historia actual si era la eliminada
            if (historiaActual && historiaActual.id === historiaId) {
                setHistoriaActual(null);
                setEstimacionesActuales([]);
            }
            
            return {
                success: true
            };

        } catch (error) {
            message.error(`Error al eliminar historia de usuario: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [listarHistoriasUsuario, historiaActual]);

    /**
     * Obtener las estimaciones de una historia específica
     */
    const obtenerEstimaciones = useCallback(async (historiaId) => {
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_HISTORIAS_USUARIO}/${historiaId}/estimaciones/`,
                token
            );

            const estimaciones = response.estimaciones || [];
            setEstimacionesActuales(estimaciones);
            return estimaciones;

        } catch (error) {
            message.error(`Error al obtener estimaciones: ${error.message}`);
            return [];
        }
    }, []);

    // ============== FUNCIONES AUXILIARES ==============

    /**
     * Buscar historias de usuario por texto
     */
    const buscarHistoriasUsuario = useCallback((texto) => {
        if (!texto || texto.trim() === '') {
            return historiasUsuario;
        }

        const textoLower = texto.toLowerCase();
        return historiasUsuario.filter(h => 
            h.titulo?.toLowerCase().includes(textoLower) ||
            h.descripcion?.toLowerCase().includes(textoLower) ||
            h.actor_rol?.toLowerCase().includes(textoLower) ||
            h.funcionalidad_accion?.toLowerCase().includes(textoLower) ||
            h.criterios_aceptacion?.toLowerCase().includes(textoLower)
        );
    }, [historiasUsuario]);

    /**
     * Filtrar historias de usuario por criterios
     */
    const filtrarHistoriasUsuario = useCallback((filtros = {}) => {
        let resultado = [...historiasUsuario];

        if (filtros.prioridad) {
            resultado = resultado.filter(h => h.prioridad === filtros.prioridad);
        }

        if (filtros.estado) {
            resultado = resultado.filter(h => h.estado === filtros.estado);
        }

        if (filtros.valorNegocioMin !== undefined) {
            resultado = resultado.filter(h => 
                h.valor_negocio && h.valor_negocio >= filtros.valorNegocioMin
            );
        }

        if (filtros.valorNegocioMax !== undefined) {
            resultado = resultado.filter(h => 
                h.valor_negocio && h.valor_negocio <= filtros.valorNegocioMax
            );
        }

        if (filtros.conEstimaciones !== undefined) {
            if (filtros.conEstimaciones) {
                resultado = resultado.filter(h => 
                    h.estimaciones && h.estimaciones.length > 0
                );
            } else {
                resultado = resultado.filter(h => 
                    !h.estimaciones || h.estimaciones.length === 0
                );
            }
        }

        return resultado;
    }, [historiasUsuario]);

    /**
     * Obtener estadísticas de historias de usuario
     */
    const obtenerEstadisticas = useCallback(() => {
        const stats = {
            total: historiasUsuario.length,
            porPrioridad: {},
            porEstado: {},
            conEstimaciones: 0,
            sinEstimaciones: 0,
            valorNegocioPromedio: 0,
            totalEstimaciones: 0,
            estimacionesPorTipo: {}
        };

        let sumaValorNegocio = 0;
        let countValorNegocio = 0;

        historiasUsuario.forEach(h => {
            // Por prioridad
            if (h.prioridad) {
                stats.porPrioridad[h.prioridad] = (stats.porPrioridad[h.prioridad] || 0) + 1;
            }

            // Por estado
            if (h.estado) {
                stats.porEstado[h.estado] = (stats.porEstado[h.estado] || 0) + 1;
            }

            // Valor de negocio
            if (h.valor_negocio) {
                sumaValorNegocio += h.valor_negocio;
                countValorNegocio++;
            }

            // Estimaciones
            if (h.estimaciones && h.estimaciones.length > 0) {
                stats.conEstimaciones++;
                stats.totalEstimaciones += h.estimaciones.length;

                h.estimaciones.forEach(est => {
                    const tipo = est.tipo_estimacion_nombre || 'Desconocido';
                    if (!stats.estimacionesPorTipo[tipo]) {
                        stats.estimacionesPorTipo[tipo] = {
                            count: 0,
                            suma: 0,
                            promedio: 0
                        };
                    }
                    stats.estimacionesPorTipo[tipo].count++;
                    stats.estimacionesPorTipo[tipo].suma += est.valor || 0;
                });
            } else {
                stats.sinEstimaciones++;
            }
        });

        // Calcular promedios
        if (countValorNegocio > 0) {
            stats.valorNegocioPromedio = Math.round(sumaValorNegocio / countValorNegocio);
        }

        Object.keys(stats.estimacionesPorTipo).forEach(tipo => {
            const info = stats.estimacionesPorTipo[tipo];
            info.promedio = info.count > 0 ? info.suma / info.count : 0;
        });

        return stats;
    }, [historiasUsuario]);

    /**
     * Generar formato de historia de usuario (As a... I want... So that...)
     */
    const generarFormatoHistoria = useCallback((historia) => {
        const partes = [];
        
        if (historia.actor_rol) {
            partes.push(`Como ${historia.actor_rol}`);
        }
        
        if (historia.funcionalidad_accion) {
            partes.push(`quiero ${historia.funcionalidad_accion}`);
        }
        
        if (historia.beneficio_razon) {
            partes.push(`para ${historia.beneficio_razon}`);
        }

        return partes.length > 0 ? partes.join(', ') : historia.titulo || '';
    }, []);

    /**
     * Validar datos de historia de usuario antes de crear/actualizar
     */
    const validarDatosHistoria = useCallback((datos) => {
        const errores = [];

        // Validaciones obligatorias según backend
        if (!datos.titulo || datos.titulo.trim() === '') {
            errores.push('El título es obligatorio');
        } else if (datos.titulo.trim().length < 5) {
            errores.push('El título debe tener al menos 5 caracteres');
        }

        if (!datos.criterios_aceptacion || datos.criterios_aceptacion.trim() === '') {
            errores.push('Los criterios de aceptación son obligatorios');
        } else if (datos.criterios_aceptacion.trim().length < 10) {
            errores.push('Los criterios de aceptación deben tener al menos 10 caracteres');
        }

        // Validar valor de negocio
        if (datos.valor_negocio !== null && datos.valor_negocio !== undefined) {
            const valor = parseInt(datos.valor_negocio);
            if (isNaN(valor)) {
                errores.push('El valor de negocio debe ser un número entero');
            } else if (valor < 1 || valor > 100) {
                errores.push('El valor de negocio debe estar entre 1 y 100');
            }
        }

        // Validar estimaciones
        if (datos.estimaciones && Array.isArray(datos.estimaciones)) {
            datos.estimaciones.forEach((est, index) => {
                if (!est.tipo_estimacion_id) {
                    errores.push(`La estimación ${index + 1} debe tener un tipo`);
                }
                if (est.valor === null || est.valor === undefined || est.valor <= 0) {
                    errores.push(`La estimación ${index + 1} debe tener un valor mayor a 0`);
                }
            });
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }, []);

    /**
     * Calcular total de estimaciones por tipo
     */
    const calcularTotalEstimaciones = useCallback((tipoEstimacionId) => {
        let total = 0;
        
        historiasUsuario.forEach(h => {
            if (h.estimaciones) {
                h.estimaciones.forEach(est => {
                    if (est.tipo_estimacion_id === tipoEstimacionId) {
                        total += est.valor || 0;
                    }
                });
            }
        });

        return total;
    }, [historiasUsuario]);

    /**
     * Obtener historias con alta prioridad de negocio
     */
    const obtenerHistoriasAltaPrioridad = useCallback((umbral = 70) => {
        return historiasUsuario.filter(h => 
            h.valor_negocio && h.valor_negocio >= umbral
        ).sort((a, b) => (b.valor_negocio || 0) - (a.valor_negocio || 0));
    }, [historiasUsuario]);

    /**
     * Limpiar estado
     */
    const limpiarEstado = useCallback(() => {
        setHistoriaActual(null);
        setEstimacionesActuales([]);
    }, []);

    /**
     * Recargar todo (catálogos y historias)
     */
    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([
                cargarCatalogos(),
                listarHistoriasUsuario()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, listarHistoriasUsuario]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad && proyectoId) {
            // Cargar catálogos solo si no están cargados
            if (catalogos.tipos_estimacion.length === 0) {
                cargarCatalogos();
            }
            // Cargar historias de usuario
            listarHistoriasUsuario();
        }
    }, [proyectoId, autoLoad]);

    // ============== RETURN ==============

    return {
        // Datos
        historiasUsuario,
        historiaActual,
        estimacionesActuales,
        catalogos,
        estadisticas: obtenerEstadisticas(),

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,

        // Funciones CRUD
        listarHistoriasUsuario,
        obtenerHistoriaUsuario,
        crearHistoriaUsuario,
        actualizarHistoriaUsuario,
        eliminarHistoriaUsuario,
        obtenerEstimaciones,

        // Funciones auxiliares
        buscarHistoriasUsuario,
        filtrarHistoriasUsuario,
        validarDatosHistoria,
        generarFormatoHistoria,
        calcularTotalEstimaciones,
        obtenerHistoriasAltaPrioridad,
        cargarCatalogos,
        limpiarEstado,
        recargarTodo,

        // Setters (por si se necesitan)
        setHistoriasUsuario,
        setHistoriaActual,
        setEstimacionesActuales
    };
};