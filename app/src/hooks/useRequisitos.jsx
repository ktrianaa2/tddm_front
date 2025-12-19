import { useState, useEffect, useCallback, useMemo } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
    getStoredToken,
    API_ENDPOINTS,
    getWithAuth,
    postJSONAuth,
    putJSONAuth,
    deleteWithAuth
} from '../../config';

/**
 * Hook completamente refactorizado para gestionar requisitos
 * TODA la lógica de negocio está aquí
 */
export const useRequisitos = (proyectoId, autoLoad = true) => {
    // ============== ESTADOS ==============
    const [requisitos, setRequisitos] = useState([]);
    const [requisitoActual, setRequisitoActual] = useState(null);
    const [catalogosRaw, setCatalogosRaw] = useState(null);
    const [catalogosProcesados, setCatalogosProcesados] = useState(null);

    // Estados de UI - Ahora manejados por el hook
    const [modoEdicion, setModoEdicion] = useState(false); // true = editar, false = crear
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [valoresFormulario, setValoresFormulario] = useState(null);
    const [relacionesFormulario, setRelacionesFormulario] = useState([]);

    // Estados de carga
    const [loading, setLoading] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);
    const [loadingRelaciones, setLoadingRelaciones] = useState(false);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    // ============== CONSTANTES ==============
    const defaultColors = useMemo(() => ({
        tipos: {
            'funcional': '#1890ff',
            'no-funcional': '#52c41a',
            'negocio': '#fa8c16',
            'tecnico': '#722ed1',
            'sistema': '#13c2c2',
            'interfaz': '#eb2f96'
        },
        prioridades: {
            'critica': '#ff4d4f',
            'muy-alta': '#ff4d4f',
            'alta': '#fa8c16',
            'media': '#fadb14',
            'baja': '#52c41a',
            'muy-baja': '#d9d9d9'
        },
        estados: {
            'pendiente': '#d9d9d9',
            'aprobado': '#52c41a',
            'en-desarrollo': '#1890ff',
            'implementado': '#722ed1',
            'rechazado': '#ff4d4f',
            'postpuesto': '#fa8c16'
        }
    }), []);

    // ============== FUNCIONES DE TRANSFORMACIÓN ==============

    /**
     * Normalizar nombre a key
     */
    const normalizarKey = useCallback((nombre) => {
        if (!nombre) return '';
        return nombre.toLowerCase()
            .trim()
            .replace(/[\s_-]+/g, '-')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n');
    }, []);

    /**
     * Procesar items de catálogo raw a formato UI
     */
    const procesarItemsCatalogo = useCallback((items, tipoColor) => {
        if (!Array.isArray(items)) return [];

        return items
            .filter(item => item.id !== undefined && item.id !== null && item.activo !== false)
            .map(item => {
                const key = item.key || normalizarKey(item.nombre);

                return {
                    value: item.id.toString(),
                    label: item.nombre || 'Sin nombre',
                    key: key,
                    color: defaultColors[tipoColor]?.[key] || '#d9d9d9',
                    descripcion: item.descripcion || '',
                    nivel: item.nivel,
                    activo: item.activo !== false,
                    tipo: item.tipo,
                    orden: item.orden
                };
            });
    }, [defaultColors, normalizarKey]);

    /**
     * Buscar item por key o ID
     */
    const findByKeyOrId = useCallback((items, keyOrId) => {
        if (!keyOrId || !Array.isArray(items)) return null;

        const keyOrIdStr = keyOrId.toString().toLowerCase();

        // Buscar por ID exacto
        let found = items.find(item => item.value === keyOrId.toString());
        if (found) return found;

        // Buscar por key
        found = items.find(item => item.key === keyOrIdStr);
        if (found) return found;

        // Buscar por label normalizado
        found = items.find(item =>
            item.label && normalizarKey(item.label) === keyOrIdStr
        );

        return found;
    }, [normalizarKey]);

    /**
     * Obtener ID desde key o ID
     */
    const getIdByKeyOrId = useCallback((items, keyOrId) => {
        const found = findByKeyOrId(items, keyOrId);
        return found ? found.value : null;
    }, [findByKeyOrId]);

    /**
     * Mapear key a ID usando catálogos procesados
     */
    const mapearKeyAId = useCallback((key, tipoCatalogo) => {
        if (!key || !catalogosProcesados) return undefined;

        const catalogo = catalogosProcesados[tipoCatalogo];
        if (!catalogo) return undefined;

        const item = catalogo.find(item =>
            item.key === key ||
            item.label?.toLowerCase() === key.toLowerCase() ||
            item.value === key.toString()
        );

        return item ? item.value : undefined;
    }, [catalogosProcesados]);

    // ============== FUNCIONES DE CATÁLOGOS ==============

    /**
     * Cargar y procesar todos los catálogos
     */
    const cargarCatalogos = useCallback(async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

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
                        key: tipo.key || normalizarKey(tipo.nombre),
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
                        key: p.key || normalizarKey(p.nombre),
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
                        .filter(e => e.tipo === 'requisito' || !e.tipo)
                        .map(e => ({
                            id: e.id || e.estado_id,
                            nombre: e.nombre,
                            key: e.key || normalizarKey(e.nombre),
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
                        key: tr.key || normalizarKey(tr.nombre),
                        descripcion: tr.descripcion || '',
                        activo: tr.activo !== false
                    }));
                }
            }

            setCatalogosRaw(catalogosData);

            // Procesar catálogos para UI
            const procesados = {
                tipos_requisito: procesarItemsCatalogo(catalogosData.tipos_requisito, 'tipos'),
                prioridades: procesarItemsCatalogo(catalogosData.prioridades, 'prioridades'),
                estados: procesarItemsCatalogo(catalogosData.estados, 'estados'),
                tipos_relacion_requisito: procesarItemsCatalogo(catalogosData.tipos_relacion_requisito, 'general')
            };

            setCatalogosProcesados(procesados);
            return catalogosData;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            setErrorCatalogos(errorMsg);
            message.error(`Error al cargar catálogos: ${errorMsg}`);
            throw error;
        } finally {
            setLoadingCatalogos(false);
        }
    }, [normalizarKey, procesarItemsCatalogo]);

    // ============== FUNCIONES DE CARGA ==============

    /**
     * Cargar requisitos del proyecto
     */
    const cargarRequisitos = useCallback(async () => {
        if (!proyectoId) return;

        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_REQUISITOS}/${proyectoId}/`,
                token
            );

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
     * Obtener un requisito específico
     */
    const obtenerRequisito = useCallback(async (requisitoId) => {
        if (!requisitoId) return null;

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
     * Cargar relaciones de un requisito
     */
    const cargarRelaciones = useCallback(async (requisitoId) => {
        if (!requisitoId) return [];

        setLoadingRelaciones(true);
        try {
            const token = getStoredToken();
            if (!token) return [];

            const endpoint = `${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}/`;
            const response = await getWithAuth(endpoint, token);

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
                requisito_id: (rel.requisito_id || rel.requisito_relacionado_id || '').toString(),
                tipo_relacion: (rel.tipo_relacion_id || rel.tipo_relacion || '').toString(),
                descripcion: rel.descripcion || ''
            }));

            return relacionesProcesadas;

        } catch (error) {
            if (!error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
                console.error('Error cargando relaciones:', error);
            }
            return [];
        } finally {
            setLoadingRelaciones(false);
        }
    }, []);

    // ============== FUNCIONES DE FORMULARIO ==============

    /**
     * Abrir formulario para crear nuevo requisito
     */
    const abrirFormularioCrear = useCallback(() => {
        if (!catalogosProcesados) {
            message.error('Los catálogos no están disponibles');
            return;
        }

        const valoresPorDefecto = {
            estado: findByKeyOrId(catalogosProcesados.estados, 'pendiente')?.value ||
                catalogosProcesados.estados[0]?.value,
            prioridad: findByKeyOrId(catalogosProcesados.prioridades, 'media')?.value ||
                catalogosProcesados.prioridades[0]?.value
        };

        setModoEdicion(false);
        setValoresFormulario(valoresPorDefecto);
        setRelacionesFormulario([]);
        setFormularioAbierto(true);
    }, [catalogosProcesados, findByKeyOrId]);

    /**
     * Abrir formulario para editar requisito
     */
    const abrirFormularioEditar = useCallback(async (requisito) => {
        if (!catalogosProcesados) {
            message.error('Los catálogos no están disponibles');
            return;
        }

        setLoadingDetalle(true);
        try {
            // Obtener requisito completo
            const requisitoCompleto = await obtenerRequisito(requisito.id);
            if (!requisitoCompleto) {
                throw new Error('No se pudo obtener la información del requisito');
            }

            // Preparar valores para formulario
            const valores = {
                id: requisitoCompleto.id,
                nombre: requisitoCompleto.nombre || '',
                descripcion: requisitoCompleto.descripcion || '',
                criterios: requisitoCompleto.criterios || '',
                origen: requisitoCompleto.origen || '',
                condiciones_previas: requisitoCompleto.condiciones_previas || '',
                proyecto_id: requisitoCompleto.proyecto_id,
                tipo: mapearKeyAId(requisitoCompleto.tipo, 'tipos_requisito'),
                prioridad: mapearKeyAId(requisitoCompleto.prioridad, 'prioridades'),
                estado: mapearKeyAId(requisitoCompleto.estado, 'estados'),
            };

            // Cargar relaciones
            let relaciones = [];
            if (catalogosProcesados.tipos_relacion_requisito?.length > 0) {
                relaciones = await cargarRelaciones(requisito.id);
            }

            setModoEdicion(true);
            setValoresFormulario(valores);
            setRelacionesFormulario(relaciones);
            setFormularioAbierto(true);

        } catch (error) {
            message.error(`Error al cargar requisito: ${error.message}`);
        } finally {
            setLoadingDetalle(false);
        }
    }, [catalogosProcesados, obtenerRequisito, mapearKeyAId, cargarRelaciones]);

    /**
     * Cerrar formulario
     */
    const cerrarFormulario = useCallback(() => {
        setFormularioAbierto(false);
        setModoEdicion(false);
        setValoresFormulario(null);
        setRelacionesFormulario([]);
        setRequisitoActual(null);
    }, []);

    // ============== FUNCIONES DE RELACIONES ==============

    /**
     * Agregar relación
     */
    const agregarRelacion = useCallback(() => {
        const nuevaRelacion = {
            id: `temp_${Date.now()}_${Math.random()}`,
            requisito_id: '',
            tipo_relacion: '',
            descripcion: ''
        };
        setRelacionesFormulario(prev => [...prev, nuevaRelacion]);
    }, []);

    /**
     * Actualizar relación
     */
    const actualizarRelacion = useCallback((id, campo, valor) => {
        setRelacionesFormulario(prev => prev.map(r =>
            r.id === id ? { ...r, [campo]: valor } : r
        ));
    }, []);

    /**
     * Eliminar relación
     */
    const eliminarRelacion = useCallback((id) => {
        setRelacionesFormulario(prev => prev.filter(r => r.id !== id));
    }, []);

    // ============== FUNCIONES CRUD ==============

    /**
     * Guardar requisito (crear o actualizar)
     */
    const guardarRequisito = useCallback(async (values) => {
        if (!proyectoId) {
            message.error('No se ha especificado el ID del proyecto');
            return { success: false };
        }

        setLoadingAccion(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const dataToSend = {
                nombre: values.nombre,
                descripcion: values.descripcion,
                tipo_id: values.tipo ? parseInt(values.tipo) : null,
                criterios: values.criterios,
                prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
                estado_id: values.estado ? parseInt(values.estado) : null,
                origen: values.origen || '',
                condiciones_previas: values.condiciones_previas || '',
                relaciones_requisitos: relacionesFormulario
                    .filter(rel => rel.requisito_id && rel.tipo_relacion)
                    .map(rel => ({
                        requisito_id: parseInt(rel.requisito_id),
                        tipo_relacion_id: parseInt(rel.tipo_relacion),
                        descripcion: rel.descripcion || ''
                    }))
            };

            let response;
            if (modoEdicion && valoresFormulario?.id) {
                // Actualizar
                response = await putJSONAuth(
                    `${API_ENDPOINTS.ACTUALIZAR_REQUISITO}/${valoresFormulario.id}/`,
                    dataToSend,
                    token
                );
                message.success('Requisito actualizado exitosamente');
            } else {
                // Crear
                dataToSend.proyecto_id = proyectoId;
                response = await postJSONAuth(
                    API_ENDPOINTS.CREAR_REQUISITO,
                    dataToSend,
                    token
                );
                message.success('Requisito creado exitosamente');
            }

            await cargarRequisitos();
            cerrarFormulario();

            return {
                success: true,
                data: response,
                requisito_id: response.requisito_id
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al guardar requisito: ${errorMsg}`);
            return { success: false, error: errorMsg };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, modoEdicion, valoresFormulario, relacionesFormulario, cargarRequisitos, cerrarFormulario]);

    /**
     * Eliminar requisito con confirmación
     */
    const eliminarRequisito = useCallback((requisito, onSuccess) => {
        Modal.confirm({
            title: 'Confirmar Eliminación',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>¿Estás seguro de que deseas eliminar el requisito:</p>
                    <p><strong>"{requisito.nombre}"</strong></p>
                    <p style={{ color: '#ff4d4f', fontSize: '0.9em', marginTop: '0.5rem' }}>
                        Esta acción no se puede deshacer y eliminará todas las relaciones asociadas.
                    </p>
                </div>
            ),
            okText: 'Eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            async onOk() {
                setLoadingAccion(true);
                try {
                    const token = getStoredToken();
                    if (!token) throw new Error('No hay token de autenticación');

                    await deleteWithAuth(
                        `${API_ENDPOINTS.ELIMINAR_REQUISITO}/${requisito.id}/`,
                        token
                    );

                    message.success('Requisito eliminado exitosamente');
                    await cargarRequisitos();
                    if (onSuccess) onSuccess();

                    return { success: true };

                } catch (error) {
                    const errorMsg = error.message || 'Error desconocido';
                    message.error(`Error al eliminar requisito: ${errorMsg}`);
                    return { success: false, error: errorMsg };
                } finally {
                    setLoadingAccion(false);
                }
            },
        });
    }, [cargarRequisitos]);

    // ============== FUNCIONES AUXILIARES ==============

    /**
     * Obtener información de un requisito por ID
     */
    const getRequisitoInfo = useCallback((requisitoId) => {
        return requisitos.find(r => r.id.toString() === requisitoId.toString());
    }, [requisitos]);

    /**
     * Obtener item de catálogo por key
     */
    const getItemByKey = useCallback((tipoCatalogo, key) => {
        if (!catalogosProcesados || !catalogosProcesados[tipoCatalogo]) return null;
        return catalogosProcesados[tipoCatalogo].find(item => item.key === key);
    }, [catalogosProcesados]);

    /**
     * Estadísticas
     */
    const contadores = useMemo(() => {
        const stats = {
            total: requisitos.length,
            conRelaciones: 0,
            sinRelaciones: 0,
            totalRelaciones: 0
        };

        requisitos.forEach(req => {
            const numRelaciones = req.relaciones_requisitos?.length || 0;
            stats.totalRelaciones += numRelaciones;
            if (numRelaciones > 0) stats.conRelaciones++;
            else stats.sinRelaciones++;
        });

        return stats;
    }, [requisitos]);

    /**
     * Validar que catálogos estén disponibles
     */
    const catalogosDisponibles = useMemo(() => {
        return catalogosProcesados &&
            Array.isArray(catalogosProcesados.tipos_requisito) && catalogosProcesados.tipos_requisito.length > 0 &&
            Array.isArray(catalogosProcesados.prioridades) && catalogosProcesados.prioridades.length > 0 &&
            Array.isArray(catalogosProcesados.estados) && catalogosProcesados.estados.length > 0;
    }, [catalogosProcesados]);

    /**
     * Recargar todo
     */
    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([cargarCatalogos(), cargarRequisitos()]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarCatalogos, cargarRequisitos]);

    /**
     * Limpiar estado
     */
    const limpiarEstado = useCallback(() => {
        cerrarFormulario();
    }, [cerrarFormulario]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad && proyectoId) {
            if (!catalogosRaw) cargarCatalogos();
            cargarRequisitos();
        }
    }, [proyectoId, autoLoad]);

    // ============== RETURN ==============

    return {
        // Datos principales
        requisitos,
        requisitoActual,
        catalogos: catalogosRaw,
        contadores,

        // Datos del formulario
        formularioAbierto,
        modoEdicion,
        valoresFormulario,
        relacionesFormulario,

        // Catálogos procesados (para el formulario)
        tiposRequisito: catalogosProcesados?.tipos_requisito || [],
        prioridades: catalogosProcesados?.prioridades || [],
        estados: catalogosProcesados?.estados || [],
        tiposRelacion: catalogosProcesados?.tipos_relacion_requisito || [],

        // Estados de validación
        catalogosDisponibles,

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,
        loadingRelaciones,
        errorCatalogos,

        // Funciones de formulario
        abrirFormularioCrear,
        abrirFormularioEditar,
        cerrarFormulario,
        guardarRequisito,

        // Funciones de relaciones
        agregarRelacion,
        actualizarRelacion,
        eliminarRelacion,

        // Funciones CRUD
        eliminarRequisito,

        // Funciones auxiliares
        cargarRequisitos,
        cargarRelaciones,
        recargarTodo,
        limpiarEstado,
        getRequisitoInfo,
        getItemByKey,
        findByKeyOrId
    };
};