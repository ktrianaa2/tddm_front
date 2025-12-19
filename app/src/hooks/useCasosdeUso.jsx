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
    const [catalogos, setCatalogos] = useState(null);

    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);
    const [loadingRelaciones, setLoadingRelaciones] = useState(false);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    // ============== FUNCIONES DE PROCESAMIENTO ==============

    /**
     * Procesa items de catálogo y normaliza los datos
     */
    const procesarItemsCatalogo = useCallback((items, tipoColor) => {
        if (!Array.isArray(items)) return [];

        const defaultColors = {
            prioridades: {
                'muy-alta': '#ff4d4f',
                'alta': '#fa8c16',
                'media': '#1890ff',
                'baja': '#52c41a',
                'muy-baja': '#d9d9d9'
            },
            'tipos-relacion': {
                'include': '#1890ff',
                'extend': '#52c41a',
                'generalization': '#722ed1',
                'generalizacion': '#722ed1',
                'association': '#fa8c16',
                'dependency': '#13c2c2',
                'dependencia': '#13c2c2'
            },
            'estados': {
                'pendiente': '#d9d9d9',
                'aprobado': '#52c41a',
                'en-analisis': '#1890ff',
                'desarrollado': '#722ed1',
                'rechazado': '#ff4d4f',
                'probado': '#fa8c16'
            }
        };

        return items
            .filter(item => {
                const id = item.id || item.prioridad_id || item.estado_id || item.relacion_id;
                return id !== undefined && id !== null && item.activo !== false;
            })
            .map(item => {
                let id;
                if (tipoColor === 'prioridades') {
                    id = item.prioridad_id || item.id;
                } else if (tipoColor === 'tipos-relacion') {
                    id = item.relacion_id || item.id;
                } else if (tipoColor === 'estados') {
                    id = item.estado_id || item.id;
                } else {
                    id = item.id || item.prioridad_id || item.relacion_id || item.estado_id;
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
     * Encuentra un item por key o ID
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
     * Obtiene el ID por key o ID
     */
    const getIdByKeyOrId = useCallback((items, keyOrId) => {
        const found = findByKeyOrId(items, keyOrId);
        return found ? found.value : null;
    }, [findByKeyOrId]);

    /**
     * Mapea key a ID usando el catálogo
     */
    const mapearKeyAId = useCallback((key, catalogo) => {
        if (!key || !catalogo) return undefined;
        const item = catalogo.find(item =>
            item.key === key ||
            item.label?.toLowerCase() === key.toLowerCase() ||
            item.value?.toString() === key.toString()
        );
        return item ? item.value : undefined;
    }, []);

    /**
     * Prepara valores iniciales para el formulario
     */
    const prepararValoresIniciales = useCallback((casoUso) => {
        if (!casoUso || !catalogos) return {};

        const prioridadesProcesadas = procesarItemsCatalogo(catalogos.prioridades, 'prioridades');
        const estadosProcesados = procesarItemsCatalogo(catalogos.estados, 'estados');

        const formValues = {
            id: casoUso.id,
            nombre: casoUso.nombre || '',
            descripcion: casoUso.descripcion || '',
            actores: casoUso.actores || '',
            precondiciones: casoUso.precondiciones || '',
            flujo_principal: casoUso.flujo_principal || [],
            flujos_alternativos: casoUso.flujos_alternativos || [],
            postcondiciones: casoUso.postcondiciones || '',
            requisitos_especiales: casoUso.requisitos_especiales || '',
            riesgos_consideraciones: casoUso.riesgos_consideraciones || '',
            proyecto_id: casoUso.proyecto_id,
        };

        if (casoUso.prioridad) {
            const prioridadId = getIdByKeyOrId(prioridadesProcesadas, casoUso.prioridad);
            if (prioridadId) formValues.prioridad = prioridadId;
        }

        if (casoUso.estado) {
            const estadoId = getIdByKeyOrId(estadosProcesados, casoUso.estado);
            if (estadoId) formValues.estado = estadoId;
        }

        if (casoUso.relaciones && Array.isArray(casoUso.relaciones)) {
            formValues.relaciones = casoUso.relaciones.map(rel => ({
                id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                casoUsoRelacionado: (rel.casoUsoRelacionado || rel.caso_uso_destino_id || '').toString(),
                tipo: (rel.tipo || rel.tipo_relacion_id || '').toString(),
                descripcion: rel.descripcion || ''
            }));
        }

        return formValues;
    }, [catalogos, procesarItemsCatalogo, getIdByKeyOrId]);

    /**
     * Prepara datos para enviar al servidor
     */
    const prepararDatosParaEnvio = useCallback((values, esEdicion = false, casoUsoId = null) => {
        const dataToSend = {
            nombre: values.nombre,
            descripcion: values.descripcion,
            actores: Array.isArray(values.actores) ? values.actores.join(', ') : values.actores,
            precondiciones: values.precondiciones || '',
            flujo_principal: values.flujo_principal || [],
            flujos_alternativos: values.flujos_alternativos || [],
            postcondiciones: values.postcondiciones || '',
            requisitos_especiales: values.requisitos_especiales || '',
            riesgos_consideraciones: values.riesgos_consideraciones || '',
            prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
            estado_id: values.estado ? parseInt(values.estado) : null,
            relaciones: (values.relaciones || [])
                .filter(rel => rel.casoUsoRelacionado && rel.tipo)
                .map(rel => ({
                    casoUsoRelacionado: parseInt(rel.casoUsoRelacionado),
                    tipo: parseInt(rel.tipo),
                    descripcion: rel.descripcion || ''
                }))
        };

        if (esEdicion && casoUsoId) {
            dataToSend.id = casoUsoId;
        }

        return dataToSend;
    }, []);

    /**
     * Procesa catálogos y retorna versión normalizada
     */
    const procesarCatalogos = useCallback((catalogosData) => {
        if (!catalogosData) return null;

        const catalogosProcesados = {
            prioridades: [],
            estados: [],
            tipos_relacion_cu: []
        };

        if (catalogosData.prioridades && Array.isArray(catalogosData.prioridades)) {
            catalogosProcesados.prioridades = procesarItemsCatalogo(catalogosData.prioridades, 'prioridades');
        }

        if (catalogosData.estados && Array.isArray(catalogosData.estados)) {
            catalogosProcesados.estados = procesarItemsCatalogo(catalogosData.estados, 'estados');
        }

        if (catalogosData.tipos_relacion_cu && Array.isArray(catalogosData.tipos_relacion_cu)) {
            catalogosProcesados.tipos_relacion_cu = procesarItemsCatalogo(catalogosData.tipos_relacion_cu, 'tipos-relacion');
        }

        return catalogosProcesados;
    }, [procesarItemsCatalogo]);

    // ============== FUNCIONES DE CATÁLOGOS ==============

    /**
     * Carga todos los catálogos necesarios para casos de uso
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

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

            if (estados.status === 'fulfilled' && estados.value) {
                const data = estados.value.estados_elemento || estados.value.estados ||
                    estados.value.data || estados.value;
                if (Array.isArray(data)) {
                    catalogosData.estados = data
                        .filter(e => e.tipo === 'caso_uso' || !e.tipo)
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

            const catalogosProcesados = procesarCatalogos(catalogosData);
            setCatalogos(catalogosProcesados);
            return catalogosProcesados;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            setErrorCatalogos(errorMsg);
            message.error(`Error al cargar catálogos: ${errorMsg}`);
            throw error;
        } finally {
            setLoadingCatalogos(false);
        }
    }, [procesarCatalogos]);

    // ============== FUNCIONES DE CARGA ==============

    /**
     * Listar todos los casos de uso de un proyecto
     */
    const cargarCasosUso = useCallback(async () => {
        if (!proyectoId) {
            console.warn('No se puede cargar casos de uso sin proyectoId');
            return;
        }

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_CASOS_USO}/${proyectoId}/`,
                token
            );

            const casosUsoData = response.casos_uso || response.data || [];

            if (Array.isArray(casosUsoData)) {
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
            } else {
                setCasosUso([]);
            }

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al cargar casos de uso: ${errorMsg}`);
            setCasosUso([]);
            throw error;
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
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al obtener caso de uso: ${errorMsg}`);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    /**
     * Obtener las relaciones de un caso de uso específico
     */
    const obtenerRelaciones = useCallback(async (casoUsoId) => {
        if (!casoUsoId) return [];

        setLoadingRelaciones(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.RELACIONES_CASO_USO}/${casoUsoId}/`,
                token
            );

            let relacionesData = [];
            if (response.relaciones && Array.isArray(response.relaciones)) {
                relacionesData = response.relaciones;
            } else if (response.data && Array.isArray(response.data)) {
                relacionesData = response.data;
            } else if (Array.isArray(response)) {
                relacionesData = response;
            }

            const relacionesProcesadas = relacionesData.map(rel => ({
                id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                casoUsoRelacionado: (rel.casoUsoRelacionado || rel.caso_uso_destino_id || '').toString(),
                tipo: (rel.tipo || rel.tipo_relacion_id || '').toString(),
                descripcion: rel.descripcion || ''
            }));

            setRelacionesActuales(relacionesProcesadas);
            return relacionesProcesadas;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al obtener relaciones: ${errorMsg}`);
            return [];
        } finally {
            setLoadingRelaciones(false);
        }
    }, []);

    // ============== FUNCIONES CRUD ==============

    /**
     * Crear un nuevo caso de uso
     */
    const crearCasoUso = useCallback(async (datosCasoUso) => {
        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

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
            await cargarCasosUso();

            return {
                success: true,
                caso_uso_id: response.caso_uso_id,
                data: response
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al crear caso de uso: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, cargarCasosUso]);

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
            await cargarCasosUso();

            if (casoUsoActual && casoUsoActual.id === casoUsoId) {
                await obtenerCasoUso(casoUsoId);
            }

            return {
                success: true,
                data: response
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al actualizar caso de uso: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarCasosUso, obtenerCasoUso, casoUsoActual]);

    /**
     * Eliminar un caso de uso
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
            await cargarCasosUso();

            if (casoUsoActual && casoUsoActual.id === casoUsoId) {
                setCasoUsoActual(null);
                setRelacionesActuales([]);
            }

            return { success: true };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al eliminar caso de uso: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarCasosUso, casoUsoActual]);

    // ============== FUNCIONES AUXILIARES ==============

    const buscarCasosUso = useCallback((texto) => {
        if (!texto || texto.trim() === '') return casosUso;
        const textoLower = texto.toLowerCase();
        return casosUso.filter(cu =>
            cu.nombre?.toLowerCase().includes(textoLower) ||
            cu.descripcion?.toLowerCase().includes(textoLower) ||
            cu.actores?.toLowerCase().includes(textoLower) ||
            cu.precondiciones?.toLowerCase().includes(textoLower)
        );
    }, [casosUso]);

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
            if (cu.prioridad) {
                stats.porPrioridad[cu.prioridad] = (stats.porPrioridad[cu.prioridad] || 0) + 1;
            }
            if (cu.estado) {
                stats.porEstado[cu.estado] = (stats.porEstado[cu.estado] || 0) + 1;
            }
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

    const obtenerActoresUnicos = useCallback(() => {
        const actoresSet = new Set();
        casosUso.forEach(cu => {
            if (cu.actores) {
                const actores = cu.actores.split(',').map(a => a.trim());
                actores.forEach(actor => {
                    if (actor) actoresSet.add(actor);
                });
            }
        });
        return Array.from(actoresSet).sort();
    }, [casosUso]);

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

    const validarDatosCasoUso = useCallback((datos) => {
        const errores = [];
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

    const limpiarEstado = useCallback(() => {
        setCasoUsoActual(null);
        setRelacionesActuales([]);
    }, []);

    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([
                cargarCatalogos(),
                cargarCasosUso()
            ]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, cargarCasosUso]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad && proyectoId) {
            if (!catalogos) {
                cargarCatalogos();
            }
            cargarCasosUso();
        }
    }, [proyectoId, autoLoad]);

    // ============== CONTADORES ==============
    const contadores = {
        total: casosUso.length,
        porPrioridad: obtenerEstadisticas().porPrioridad,
        porEstado: obtenerEstadisticas().porEstado,
        conRelaciones: obtenerEstadisticas().conRelaciones,
        sinRelaciones: obtenerEstadisticas().sinRelaciones,
        totalRelaciones: obtenerEstadisticas().totalRelaciones
    };

    // ============== RETURN ==============

    return {
        // Datos
        casosUso,
        casoUsoActual,
        relacionesActuales,
        catalogos,
        contadores,
        actoresUnicos: obtenerActoresUnicos(),

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,
        loadingRelaciones,
        errorCatalogos,

        // Funciones de carga
        cargarCatalogos,
        cargarCasosUso,

        // Funciones CRUD
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
        limpiarEstado,
        recargarTodo,

        // Funciones de procesamiento
        procesarItemsCatalogo,
        findByKeyOrId,
        getIdByKeyOrId,
        mapearKeyAId,
        prepararValoresIniciales,
        prepararDatosParaEnvio,
        procesarCatalogos,

        // Setters
        setCasosUso,
        setCasoUsoActual,
        setRelacionesActuales
    };
};