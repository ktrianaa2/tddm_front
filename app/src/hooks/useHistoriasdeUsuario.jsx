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

    // Estados para catálogos
    const [catalogos, setCatalogos] = useState(null);

    // Catálogos procesados para formularios
    const [catalogosFormulario, setCatalogosFormulario] = useState({
        prioridades: [],
        estados: [],
        unidadesEstimacion: []
    });

    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    // ============== FUNCIONES AUXILIARES DE CATÁLOGOS ==============

    /**
     * Procesa items de catálogo para uso en formularios
     */
    const procesarItemsCatalogo = useCallback((items, tipoColor) => {
        if (!Array.isArray(items)) return [];

        const defaultColors = {
            prioridades: {
                'muy-alta': '#ff4d4f',
                'critica': '#ff4d4f',
                'alta': '#fa8c16',
                'media': '#fadb14',
                'baja': '#52c41a',
                'muy-baja': '#d9d9d9'
            },
            estados: {
                'pendiente': '#d9d9d9',
                'en-progreso': '#1890ff',
                'en-desarrollo': '#1890ff',
                'en-revision': '#fa8c16',
                'completada': '#52c41a',
                'completado': '#52c41a',
                'cancelada': '#ff4d4f',
                'cancelado': '#ff4d4f',
                'bloqueada': '#ff4d4f'
            },
            estimaciones: {
                'story-points': '#1890ff',
                'horas': '#52c41a',
                'dias': '#fa8c16',
                'costo': '#722ed1'
            }
        };

        return items
            .filter(item => {
                const id = item.id || item.prioridad_id || item.estado_id || item.estimacion_id;
                return id !== undefined && id !== null && item.activo !== false;
            })
            .map(item => {
                let id;
                if (tipoColor === 'prioridades') {
                    id = item.prioridad_id || item.id;
                } else if (tipoColor === 'estados') {
                    id = item.estado_id || item.id;
                } else if (tipoColor === 'estimaciones') {
                    id = item.estimacion_id || item.id;
                } else {
                    id = item.id || item.prioridad_id || item.estado_id || item.estimacion_id;
                }

                let key = item.key || item.nombre || 'unknown';
                if (typeof key === 'string' && key !== item.key) {
                    key = key.toLowerCase()
                        .trim()
                        .replace(/[\s_-]+/g, '-')
                        .replace(/[áàäâ]/g, 'a')
                        .replace(/[éèëê]/g, 'e')
                        .replace(/[íìïî]/g, 'i')
                        .replace(/[óòöô]/g, 'o')
                        .replace(/[úùüû]/g, 'u')
                        .replace(/ñ/g, 'n');
                }

                return {
                    value: id.toString(),
                    label: item.nombre || 'Sin nombre',
                    key: key,
                    color: defaultColors[tipoColor]?.[key] || '#d9d9d9',
                    descripcion: item.descripcion || '',
                    nivel: item.nivel || undefined,
                    activo: item.activo !== false,
                    tipo: item.tipo || undefined,
                    orden: item.orden || undefined,
                    ...item
                };
            });
    }, []);

    /**
     * Busca item por key o ID
     */
    const findByKeyOrId = useCallback((items, keyOrId) => {
        if (!keyOrId || !Array.isArray(items)) return null;

        const keyOrIdStr = keyOrId.toString().toLowerCase();

        let found = items.find(item => item.value === keyOrId.toString());
        if (found) return found;

        found = items.find(item => item.key === keyOrIdStr);
        if (found) return found;

        found = items.find(item =>
            item.label && item.label.toLowerCase().replace(/\s+/g, '-') === keyOrIdStr
        );

        return found;
    }, []);

    /**
     * Obtiene ID por key o ID
     */
    const getIdByKeyOrId = useCallback((items, keyOrId) => {
        const found = findByKeyOrId(items, keyOrId);
        return found ? found.value : null;
    }, [findByKeyOrId]);

    /**
     * Mapea key a ID en catálogo crudo
     */
    const mapearKeyAId = useCallback((keyOrId, catalogo) => {
        if (!keyOrId || !catalogo || !Array.isArray(catalogo)) return null;

        const keyOrIdStr = keyOrId.toString();

        let found = catalogo.find(item => item.id?.toString() === keyOrIdStr);
        if (found) return found.id.toString();

        const normalizedKey = keyOrIdStr.toLowerCase();
        found = catalogo.find(item => item.key === normalizedKey);
        if (found) return found.id.toString();

        found = catalogo.find(item => {
            if (!item.nombre) return false;
            const nombreNormalizado = item.nombre.toLowerCase()
                .replace(/[\s_-]+/g, '-')
                .replace(/[áàäâ]/g, 'a')
                .replace(/[éèëê]/g, 'e')
                .replace(/[íìïî]/g, 'i')
                .replace(/[óòöô]/g, 'o')
                .replace(/[úùüû]/g, 'u')
                .replace(/ñ/g, 'n');
            return nombreNormalizado === normalizedKey;
        });

        if (found) return found.id.toString();
        return null;
    }, []);

    // ============== FUNCIONES DE CATÁLOGOS ==============

    /**
     * Carga todos los catálogos necesarios para historias de usuario
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

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

            // Procesar estados
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

            // Procesar catálogos para formulario
            const catalogosProc = {
                prioridades: procesarItemsCatalogo(catalogosData.prioridades, 'prioridades'),
                estados: procesarItemsCatalogo(catalogosData.estados, 'estados'),
                unidadesEstimacion: procesarItemsCatalogo(catalogosData.tipos_estimacion, 'estimaciones')
            };

            setCatalogosFormulario(catalogosProc);
            return catalogosData;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            setErrorCatalogos(errorMsg);
            message.error(`Error al cargar catálogos: ${errorMsg}`);
            throw error;
        } finally {
            setLoadingCatalogos(false);
        }
    }, [procesarItemsCatalogo]);

    // ============== FUNCIONES DE CARGA ==============

    /**
     * Listar todas las historias de usuario de un proyecto
     */
    const cargarHistoriasUsuario = useCallback(async () => {
        if (!proyectoId) {
            console.warn('No se puede cargar historias de usuario sin proyectoId');
            return;
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_HISTORIAS_USUARIO}/${proyectoId}/`,
                token
            );

            const historiasData = response.historias || response.historias_usuario || response.data || [];

            if (Array.isArray(historiasData)) {
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
                    estimacion_valor: h.estimacion_valor,
                    unidad_estimacion: h.unidad_estimacion
                }));
                setHistoriasUsuario(historiasProcessed);
            } else {
                setHistoriasUsuario([]);
            }

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al cargar historias de usuario: ${errorMsg}`);
            setHistoriasUsuario([]);
            throw error;
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

            const historia = response.historia || response;
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
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al obtener historia de usuario: ${errorMsg}`);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    /**
     * Prepara historia para edición en formulario
     */
    const prepararHistoriaParaEdicion = useCallback(async (historiaId) => {
        try {
            const historiaBackend = await obtenerHistoriaUsuario(historiaId);

            if (!historiaBackend) {
                throw new Error('No se pudo obtener la información de la historia de usuario');
            }

            if (!catalogos) {
                throw new Error('Los catálogos no están disponibles');
            }

            const historiaParaEditar = {
                id: historiaBackend.id,
                descripcion_historia: historiaBackend.descripcion || historiaBackend.titulo || '',
                actor_rol: historiaBackend.actor_rol || '',
                funcionalidad_accion: historiaBackend.funcionalidad_accion || '',
                beneficio_razon: historiaBackend.beneficio_razon || '',
                criterios_aceptacion: historiaBackend.criterios_aceptacion || '',
                dependencias_relaciones: historiaBackend.dependencias_relaciones || '',
                componentes_relacionados: historiaBackend.componentes_relacionados || '',
                valor_negocio: historiaBackend.valor_negocio || '',
                notas_adicionales: historiaBackend.notas_adicionales || '',
                proyecto_id: historiaBackend.proyecto_id,
                prioridad: null,
                estado: null,
                estimaciones: []
            };

            // Mapear prioridad
            if (historiaBackend.prioridad && catalogos.prioridades) {
                const prioridadId = mapearKeyAId(historiaBackend.prioridad, catalogos.prioridades);
                if (prioridadId) historiaParaEditar.prioridad = prioridadId;
            }

            // Mapear estado  
            if (historiaBackend.estado && catalogos.estados) {
                const estadoId = mapearKeyAId(historiaBackend.estado, catalogos.estados);
                if (estadoId) historiaParaEditar.estado = estadoId;
            }

            const estimacionesParaFormulario = [];

            // Procesar múltiples estimaciones
            if (historiaBackend.estimaciones && Array.isArray(historiaBackend.estimaciones) && historiaBackend.estimaciones.length > 0) {
                historiaBackend.estimaciones.forEach((est, index) => {
                    let tipoEstimacionId = null;

                    if (est.tipo_estimacion_id) {
                        const tipoExiste = catalogos.tipos_estimacion?.find(
                            t => t.id.toString() === est.tipo_estimacion_id.toString()
                        );
                        if (tipoExiste) {
                            tipoEstimacionId = est.tipo_estimacion_id.toString();
                        }
                    } else if (est.tipo_estimacion_nombre) {
                        tipoEstimacionId = mapearKeyAId(
                            est.tipo_estimacion_nombre,
                            catalogos.tipos_estimacion
                        );
                    }

                    if (tipoEstimacionId && (est.valor !== null && est.valor !== undefined)) {
                        estimacionesParaFormulario.push({
                            id: est.id || `existing_${Date.now()}_${index}`,
                            tipo_estimacion_id: tipoEstimacionId,
                            valor: est.valor
                        });
                    }
                });
            }
            // Procesar estimación única (formato legacy)
            else if (historiaBackend.estimacion_valor && historiaBackend.unidad_estimacion) {
                const tipoEstimacionId = mapearKeyAId(
                    historiaBackend.unidad_estimacion,
                    catalogos.tipos_estimacion
                );

                if (tipoEstimacionId) {
                    estimacionesParaFormulario.push({
                        id: `existing_single_${Date.now()}`,
                        tipo_estimacion_id: tipoEstimacionId,
                        valor: historiaBackend.estimacion_valor
                    });
                }
            }

            historiaParaEditar.estimaciones = estimacionesParaFormulario;
            return historiaParaEditar;

        } catch (error) {
            message.error(`Error al preparar historia para edición: ${error.message}`);
            throw error;
        }
    }, [obtenerHistoriaUsuario, catalogos, mapearKeyAId]);

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
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al obtener estimaciones: ${errorMsg}`);
            return [];
        }
    }, []);

    // ============== FUNCIONES CRUD ==============

    /**
     * Crear una nueva historia de usuario
     */
    const crearHistoriaUsuario = useCallback(async (datosHistoria) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

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
            await cargarHistoriasUsuario();

            return {
                success: true,
                historia_id: response.historia_id,
                estimaciones_creadas: response.estimaciones_creadas || [],
                data: response
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al crear historia de usuario: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, cargarHistoriasUsuario]);

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
            await cargarHistoriasUsuario();

            if (historiaActual && historiaActual.id === historiaId) {
                await obtenerHistoriaUsuario(historiaId);
            }

            return {
                success: true,
                estimaciones_actualizadas: response.estimaciones_actualizadas || 0,
                data: response
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al actualizar historia de usuario: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarHistoriasUsuario, obtenerHistoriaUsuario, historiaActual]);

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
            await cargarHistoriasUsuario();

            if (historiaActual && historiaActual.id === historiaId) {
                setHistoriaActual(null);
                setEstimacionesActuales([]);
            }

            return { success: true };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al eliminar historia de usuario: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarHistoriasUsuario, historiaActual]);

    // ============== FUNCIONES AUXILIARES ==============

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
            if (h.prioridad) {
                stats.porPrioridad[h.prioridad] = (stats.porPrioridad[h.prioridad] || 0) + 1;
            }

            if (h.estado) {
                stats.porEstado[h.estado] = (stats.porEstado[h.estado] || 0) + 1;
            }

            if (h.valor_negocio) {
                sumaValorNegocio += h.valor_negocio;
                countValorNegocio++;
            }

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

        if (countValorNegocio > 0) {
            stats.valorNegocioPromedio = Math.round(sumaValorNegocio / countValorNegocio);
        }

        Object.keys(stats.estimacionesPorTipo).forEach(tipo => {
            const info = stats.estimacionesPorTipo[tipo];
            info.promedio = info.count > 0 ? info.suma / info.count : 0;
        });

        return stats;
    }, [historiasUsuario]);

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

    const validarDatosHistoria = useCallback((datos) => {
        const errores = [];

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

        if (datos.valor_negocio !== null && datos.valor_negocio !== undefined) {
            const valor = parseInt(datos.valor_negocio);
            if (isNaN(valor)) {
                errores.push('El valor de negocio debe ser un número entero');
            } else if (valor < 1 || valor > 100) {
                errores.push('El valor de negocio debe estar entre 1 y 100');
            }
        }

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

    const obtenerHistoriasAltaPrioridad = useCallback((umbral = 70) => {
        return historiasUsuario.filter(h =>
            h.valor_negocio && h.valor_negocio >= umbral
        ).sort((a, b) => (b.valor_negocio || 0) - (a.valor_negocio || 0));
    }, [historiasUsuario]);

    const limpiarEstado = useCallback(() => {
        setHistoriaActual(null);
        setEstimacionesActuales([]);
    }, []);

    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([
                cargarCatalogos(),
                cargarHistoriasUsuario()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, cargarHistoriasUsuario]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad && proyectoId) {
            if (!catalogos) {
                cargarCatalogos();
            }
            cargarHistoriasUsuario();
        }
    }, [proyectoId, autoLoad]);

    // ============== CONTADORES ==============
    const contadores = {
        total: historiasUsuario.length,
        porPrioridad: obtenerEstadisticas().porPrioridad,
        porEstado: obtenerEstadisticas().porEstado,
        conEstimaciones: obtenerEstadisticas().conEstimaciones,
        sinEstimaciones: obtenerEstadisticas().sinEstimaciones,
        totalEstimaciones: obtenerEstadisticas().totalEstimaciones,
        valorNegocioPromedio: obtenerEstadisticas().valorNegocioPromedio
    };

    // ============== RETURN ==============

    return {
        // Datos
        historiasUsuario,
        historiaActual,
        estimacionesActuales,
        catalogos,
        catalogosFormulario, // Catálogos procesados para formularios
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
        cargarHistoriasUsuario,

        // Funciones CRUD
        obtenerHistoriaUsuario,
        prepararHistoriaParaEdicion,
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
        limpiarEstado,
        recargarTodo,

        // Funciones de mapeo para formularios
        findByKeyOrId,
        getIdByKeyOrId,
        mapearKeyAId,

        // Setters
        setHistoriasUsuario,
        setHistoriaActual,
        setEstimacionesActuales
    };
};