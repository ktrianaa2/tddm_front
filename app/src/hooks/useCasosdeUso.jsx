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
 * Hook personalizado para gestionar casos de uso
 * @param {number} proyectoId - ID del proyecto
 * @param {boolean} autoLoad - Si debe cargar automáticamente los datos
 * @returns {Object} Estado y funciones para gestionar casos de uso
 */
export const useCasosUso = (proyectoId, autoLoad = true) => {
    // ============== ESTADOS ==============
    const [casosUso, setCasosUso] = useState([]);
    const [casoUsoActual, setCasoUsoActual] = useState(null);
    const [relacionesActuales, setRelacionesActuales] = useState([]);
    
    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    
    // Catálogos específicos para casos de uso
    const [catalogos, setCatalogos] = useState({
        prioridades: [],
        estados: [],
        tipos_relacion_cu: []
    });
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);

    // ============== FUNCIONES DE CATÁLOGOS ==============
    
    /**
     * Carga todos los catálogos necesarios para casos de uso
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const [prioridades, estados, tiposRel] = await Promise.allSettled([
                getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
                getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
                getWithAuth(API_ENDPOINTS.TIPOS_RELACION_CU, token)
            ]);

            const catalogosData = {
                prioridades: [],
                estados: [],
                tipos_relacion_cu: []
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

            // Procesar estados (filtrar solo para casos de uso)
            if (estados.status === 'fulfilled' && estados.value) {
                const data = estados.value.estados_elemento || estados.value.estados || 
                            estados.value.data || estados.value;
                if (Array.isArray(data)) {
                    catalogosData.estados = data
                        .filter(e => e.tipo === 'caso_uso' || !e.tipo) // Filtrar solo estados de caso de uso
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

            // Procesar tipos de relación para casos de uso
            if (tiposRel.status === 'fulfilled' && tiposRel.value) {
                const data = tiposRel.value.tipos_relacion_cu || 
                            tiposRel.value.tipos_relacion || 
                            tiposRel.value.data || tiposRel.value;
                if (Array.isArray(data)) {
                    catalogosData.tipos_relacion_cu = data.map(tr => ({
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
     * Listar todos los casos de uso de un proyecto
     */
    const listarCasosUso = useCallback(async (showMessage = false) => {
        if (!proyectoId) {
            console.warn('No se puede listar casos de uso sin proyectoId');
            return [];
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_CASOS_USO}/${proyectoId}/`,
                token
            );

            const casosUsoData = response.data || [];
            const casosUsoProcessed = casosUsoData.map(cu => ({
                id: cu.id,
                nombre: cu.nombre,
                descripcion: cu.descripcion || '',
                actores: cu.actores,
                precondiciones: cu.precondiciones,
                flujo_principal: cu.flujo_principal || [],
                flujos_alternativos: cu.flujos_alternativos || [],
                postcondiciones: cu.postcondiciones || '',
                requisitos_especiales: cu.requisitos_especiales || '',
                riesgos_consideraciones: cu.riesgos_consideraciones || '',
                prioridad: cu.prioridad,
                estado: cu.estado,
                proyecto_id: cu.proyecto_id,
                fecha_creacion: cu.fecha_creacion,
                relaciones: cu.relaciones || []
            }));

            setCasosUso(casosUsoProcessed);
            if (showMessage) {
                message.success(`${casosUsoProcessed.length} casos de uso cargados`);
            }
            return casosUsoProcessed;

        } catch (error) {
            message.error(`Error al listar casos de uso: ${error.message}`);
            setCasosUso([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [proyectoId]);

    /**
     * Obtener un caso de uso específico con sus relaciones
     */
    const obtenerCasoUso = useCallback(async (casoUsoId, showMessage = false) => {
        if (!casoUsoId) {
            console.warn('ID de caso de uso requerido');
            return null;
        }

        setLoadingDetalle(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const casoUso = await getWithAuth(
                `${API_ENDPOINTS.OBTENER_CASO_USO}/${casoUsoId}/`,
                token
            );

            if (casoUso) {
                const casoUsoProcessed = {
                    id: casoUso.id,
                    nombre: casoUso.nombre,
                    descripcion: casoUso.descripcion || '',
                    actores: casoUso.actores,
                    precondiciones: casoUso.precondiciones,
                    flujo_principal: casoUso.flujo_principal || [],
                    flujos_alternativos: casoUso.flujos_alternativos || [],
                    postcondiciones: casoUso.postcondiciones || '',
                    requisitos_especiales: casoUso.requisitos_especiales || '',
                    riesgos_consideraciones: casoUso.riesgos_consideraciones || '',
                    prioridad: casoUso.prioridad,
                    estado: casoUso.estado,
                    proyecto_id: casoUso.proyecto_id,
                    fecha_creacion: casoUso.fecha_creacion,
                    relaciones: casoUso.relaciones || []
                };

                setCasoUsoActual(casoUsoProcessed);
                setRelacionesActuales(casoUsoProcessed.relaciones);
                
                if (showMessage) {
                    message.success('Caso de uso cargado correctamente');
                }
                return casoUsoProcessed;
            }

            return null;

        } catch (error) {
            message.error(`Error al obtener caso de uso: ${error.message}`);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    /**
     * Crear un nuevo caso de uso
     */
    const crearCasoUso = useCallback(async (datosCasoUso) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            // Preparar datos para enviar
            const payload = {
                nombre: datosCasoUso.nombre,
                descripcion: datosCasoUso.descripcion || '',
                actores: datosCasoUso.actores,
                precondiciones: datosCasoUso.precondiciones,
                flujo_principal: datosCasoUso.flujo_principal || [],
                flujos_alternativos: datosCasoUso.flujos_alternativos || [],
                postcondiciones: datosCasoUso.postcondiciones || '',
                requisitos_especiales: datosCasoUso.requisitos_especiales || '',
                riesgos_consideraciones: datosCasoUso.riesgos_consideraciones || '',
                proyecto_id: proyectoId,
                prioridad_id: datosCasoUso.prioridad_id || null,
                estado_id: datosCasoUso.estado_id || 1,
                relaciones: datosCasoUso.relaciones || []
            };

            const response = await postJSONAuth(
                API_ENDPOINTS.CREAR_CASO_USO,
                payload,
                token
            );

            message.success('Caso de uso creado exitosamente');
            
            // Recargar la lista
            await listarCasosUso();
            
            return {
                success: true,
                caso_uso_id: response.caso_uso_id,
                data: response
            };

        } catch (error) {
            message.error(`Error al crear caso de uso: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, listarCasosUso]);

    /**
     * Actualizar un caso de uso existente
     */
    const actualizarCasoUso = useCallback(async (casoUsoId, datosActualizados) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await putJSONAuth(
                `${API_ENDPOINTS.ACTUALIZAR_CASO_USO}/${casoUsoId}/`,
                datosActualizados,
                token
            );

            message.success('Caso de uso actualizado exitosamente');
            
            // Recargar la lista
            await listarCasosUso();
            
            // Si es el caso de uso actual, recargarlo
            if (casoUsoActual && casoUsoActual.id === casoUsoId) {
                await obtenerCasoUso(casoUsoId);
            }
            
            return {
                success: true,
                data: response
            };

        } catch (error) {
            message.error(`Error al actualizar caso de uso: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [listarCasosUso, obtenerCasoUso, casoUsoActual]);

    /**
     * Eliminar un caso de uso (soft delete)
     */
    const eliminarCasoUso = useCallback(async (casoUsoId) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            await deleteWithAuth(
                `${API_ENDPOINTS.ELIMINAR_CASO_USO}/${casoUsoId}/`,
                token
            );

            message.success('Caso de uso eliminado exitosamente');
            
            // Recargar la lista
            await listarCasosUso();
            
            // Limpiar caso de uso actual si era el eliminado
            if (casoUsoActual && casoUsoActual.id === casoUsoId) {
                setCasoUsoActual(null);
                setRelacionesActuales([]);
            }
            
            return {
                success: true
            };

        } catch (error) {
            message.error(`Error al eliminar caso de uso: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [listarCasosUso, casoUsoActual]);

    /**
     * Obtener las relaciones de un caso de uso específico
     */
    const obtenerRelaciones = useCallback(async (casoUsoId) => {
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.RELACIONES_CASO_USO}/${casoUsoId}/`,
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
     * Buscar casos de uso por texto
     */
    const buscarCasosUso = useCallback((texto) => {
        if (!texto || texto.trim() === '') {
            return casosUso;
        }

        const textoLower = texto.toLowerCase();
        return casosUso.filter(cu => 
            cu.nombre?.toLowerCase().includes(textoLower) ||
            cu.descripcion?.toLowerCase().includes(textoLower) ||
            cu.actores?.toLowerCase().includes(textoLower) ||
            cu.precondiciones?.toLowerCase().includes(textoLower)
        );
    }, [casosUso]);

    /**
     * Filtrar casos de uso por criterios
     */
    const filtrarCasosUso = useCallback((filtros = {}) => {
        let resultado = [...casosUso];

        if (filtros.prioridad) {
            resultado = resultado.filter(cu => cu.prioridad === filtros.prioridad);
        }

        if (filtros.estado) {
            resultado = resultado.filter(cu => cu.estado === filtros.estado);
        }

        if (filtros.actor) {
            const actorLower = filtros.actor.toLowerCase();
            resultado = resultado.filter(cu => 
                cu.actores?.toLowerCase().includes(actorLower)
            );
        }

        return resultado;
    }, [casosUso]);

    /**
     * Obtener estadísticas de casos de uso
     */
    const obtenerEstadisticas = useCallback(() => {
        const stats = {
            total: casosUso.length,
            porPrioridad: {},
            porEstado: {},
            conRelaciones: 0,
            sinRelaciones: 0,
            totalRelaciones: 0
        };

        casosUso.forEach(cu => {
            // Por prioridad
            if (cu.prioridad) {
                stats.porPrioridad[cu.prioridad] = (stats.porPrioridad[cu.prioridad] || 0) + 1;
            }

            // Por estado
            if (cu.estado) {
                stats.porEstado[cu.estado] = (stats.porEstado[cu.estado] || 0) + 1;
            }

            // Relaciones
            const numRelaciones = cu.relaciones?.length || 0;
            stats.totalRelaciones += numRelaciones;
            
            if (numRelaciones > 0) {
                stats.conRelaciones++;
            } else {
                stats.sinRelaciones++;
            }
        });

        return stats;
    }, [casosUso]);

    /**
     * Obtener actores únicos de todos los casos de uso
     */
    const obtenerActoresUnicos = useCallback(() => {
        const actoresSet = new Set();
        
        casosUso.forEach(cu => {
            if (cu.actores) {
                // Separar por comas y limpiar espacios
                const actores = cu.actores.split(',').map(a => a.trim());
                actores.forEach(actor => {
                    if (actor) actoresSet.add(actor);
                });
            }
        });

        return Array.from(actoresSet).sort();
    }, [casosUso]);

    /**
     * Validar flujos (principal y alternativos)
     */
    const validarFlujos = useCallback((flujos, tipo = 'principal') => {
        const errores = [];

        if (!Array.isArray(flujos)) {
            errores.push(`El flujo ${tipo} debe ser un array`);
            return errores;
        }

        flujos.forEach((paso, index) => {
            if (!paso.paso || paso.paso.trim() === '') {
                errores.push(`El paso ${index + 1} del flujo ${tipo} está vacío`);
            }
            if (!paso.descripcion || paso.descripcion.trim() === '') {
                errores.push(`La descripción del paso ${index + 1} del flujo ${tipo} está vacía`);
            }
        });

        return errores;
    }, []);

    /**
     * Validar datos de caso de uso antes de crear/actualizar
     */
    const validarDatosCasoUso = useCallback((datos) => {
        const errores = [];

        // Validaciones obligatorias según backend
        if (!datos.nombre || datos.nombre.trim() === '') {
            errores.push('El nombre es obligatorio');
        } else if (datos.nombre.trim().length > 100) {
            errores.push('El nombre no puede exceder 100 caracteres');
        }

        if (!datos.actores || datos.actores.trim() === '') {
            errores.push('Los actores son obligatorios');
        }

        if (!datos.precondiciones || datos.precondiciones.trim() === '') {
            errores.push('Las precondiciones son obligatorias');
        }

        // Validar flujos si existen
        if (datos.flujo_principal && datos.flujo_principal.length > 0) {
            const erroresFlujo = validarFlujos(datos.flujo_principal, 'principal');
            errores.push(...erroresFlujo);
        }

        if (datos.flujos_alternativos && datos.flujos_alternativos.length > 0) {
            const erroresFlujos = validarFlujos(datos.flujos_alternativos, 'alternativos');
            errores.push(...erroresFlujos);
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }, [validarFlujos]);

    /**
     * Limpiar estado
     */
    const limpiarEstado = useCallback(() => {
        setCasoUsoActual(null);
        setRelacionesActuales([]);
    }, []);

    /**
     * Recargar todo (catálogos y casos de uso)
     */
    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([
                cargarCatalogos(),
                listarCasosUso()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, listarCasosUso]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad && proyectoId) {
            // Cargar catálogos solo si no están cargados
            if (catalogos.prioridades.length === 0) {
                cargarCatalogos();
            }
            // Cargar casos de uso
            listarCasosUso();
        }
    }, [proyectoId, autoLoad]);

    // ============== RETURN ==============

    return {
        // Datos
        casosUso,
        casoUsoActual,
        relacionesActuales,
        catalogos,
        estadisticas: obtenerEstadisticas(),
        actoresUnicos: obtenerActoresUnicos(),

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,

        // Funciones CRUD
        listarCasosUso,
        obtenerCasoUso,
        crearCasoUso,
        actualizarCasoUso,
        eliminarCasoUso,
        obtenerRelaciones,

        // Funciones auxiliares
        buscarCasosUso,
        filtrarCasosUso,
        validarDatosCasoUso,
        validarFlujos,
        cargarCatalogos,
        limpiarEstado,
        recargarTodo,

        // Setters (por si se necesitan)
        setCasosUso,
        setCasoUsoActual,
        setRelacionesActuales
    };
};