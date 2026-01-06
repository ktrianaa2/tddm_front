import { useState, useCallback, useEffect, useMemo } from 'react';
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
 * Función auxiliar para parsear columnas desde el nuevo formato
 * Estructura: { "tipo": "VARCHAR(255)", "restricciones": "NOT NULL", "comentario": "..." }
 */
const parsearColumna = (nombreColumna, definicion) => {
    if (typeof definicion !== 'object' || !definicion) {
        return {
            name: nombreColumna,
            type: 'UNKNOWN',
            nullable: true,
            primaryKey: false,
            foreignKey: false,
            description: '',
            restrictions: ''
        };
    }

    const tipo = definicion.tipo || 'UNKNOWN';
    const restricciones = (definicion.restricciones || '').toUpperCase();
    const comentario = definicion.comentario || '';

    return {
        name: nombreColumna,
        type: tipo,
        nullable: !restricciones.includes('NOT NULL'),
        primaryKey: restricciones.includes('PRIMARY KEY'),
        foreignKey: !!definicion.referencia,
        autoIncrement: restricciones.includes('AUTO_INCREMENT'),
        unique: restricciones.includes('UNIQUE'),
        default: restricciones.includes('DEFAULT'),
        description: comentario,
        restrictions: restricciones,
        reference: definicion.referencia || null,
        onDelete: definicion.on_delete || null
    };
};

/**
 * Transforma el nuevo formato JSON a estructura de tablas con columnas parseadas
 * Nuevo formato: { "tablas": { "tabla1": { "columnas": {...}, "indices": [...], "relaciones": {...} }, ... }, "nombre_bd": "..." }
 */
const transformarEsquema = (esquemaJSON) => {
    console.log('🔍 transformarEsquema recibió:', esquemaJSON);
    
    if (!esquemaJSON || typeof esquemaJSON !== 'object') {
        console.warn('⚠️ esquemaJSON no es un objeto válido');
        return [];
    }

    // Caso 1: Nuevo formato con estructura "tablas" como objeto
    if (esquemaJSON.tablas && typeof esquemaJSON.tablas === 'object' && !Array.isArray(esquemaJSON.tablas)) {
        console.log('✅ Detectado nuevo formato con "tablas" como objeto');
        
        const tablasArray = Object.entries(esquemaJSON.tablas)
            .map(([nombreTabla, definicionTabla]) => {
                console.log(`  Procesando tabla: ${nombreTabla}`, definicionTabla);
                
                if (typeof definicionTabla !== 'object' || definicionTabla === null) {
                    return null;
                }

                // En el nuevo formato, las columnas están bajo "columnas"
                const columnasObj = definicionTabla.columnas || {};
                const indices = definicionTabla.indices || [];
                const relaciones = definicionTabla.relaciones || {};

                const columnas = Object.entries(columnasObj)
                    .map(([nombreCol, defCol]) => {
                        const col = parsearColumna(nombreCol, defCol);
                        console.log(`    Columna parseada: ${nombreCol} ->`, col);
                        return col;
                    })
                    .filter(col => col.name);

                return {
                    name: nombreTabla,
                    columns: columnas,
                    description: '',
                    indices: indices,
                    relaciones: relaciones
                };
            })
            .filter(tabla => tabla !== null);

        console.log('✅ tablasArray resultado:', tablasArray);
        return tablasArray;
    }

    // Caso 2: Formato antiguo - El esquema es directamente un array de tablas
    if (Array.isArray(esquemaJSON)) {
        console.log('✅ Detectado formato de array directo (antiguo)');
        return esquemaJSON
            .filter(tabla => tabla && typeof tabla === 'object')
            .map(tabla => ({
                name: tabla.name || tabla.nombre || '',
                columns: tabla.columns || tabla.columnas || [],
                description: tabla.description || tabla.descripcion || ''
            }))
            .filter(tabla => tabla.name);
    }

    // Caso 3: Formato antiguo - "tablas" como array
    if (Array.isArray(esquemaJSON.tablas)) {
        console.log('✅ Detectado "tablas" como array (antiguo)');
        return esquemaJSON.tablas
            .filter(tabla => tabla && typeof tabla === 'object')
            .map(tabla => ({
                name: tabla.name || tabla.nombre || '',
                columns: tabla.columns || tabla.columnas || [],
                description: tabla.description || tabla.descripcion || ''
            }))
            .filter(tabla => tabla.name);
    }

    console.warn('⚠️ No se pudo determinar el formato del esquema');
    return [];
};

/**
 * Extrae nombre_bd del esquema JSON
 */
const extraerNombreBD = (esquemaJSON) => {
    if (!esquemaJSON) return 'Sin especificar';
    
    try {
        if (typeof esquemaJSON === 'string') {
            const esquemaObj = JSON.parse(esquemaJSON);
            return esquemaObj.nombre_bd || 'Sin especificar';
        } else if (typeof esquemaJSON === 'object' && esquemaJSON.nombre_bd) {
            return esquemaJSON.nombre_bd;
        }
    } catch (e) {
        console.warn('Error al extraer nombre_bd:', e);
    }
    
    return 'Sin especificar';
};

/**
 * Hook para gestionar esquemas de BD con soporte para nuevo formato
 */
export const useEsquemaBD = (proyectoId, autoLoad = true) => {
    // ============== ESTADOS PRINCIPALES ==============
    const [esquemas, setEsquemas] = useState([]);
    const [esquemaActual, setEsquemaActual] = useState(null);
    const [motoresBD, setMotoresBD] = useState([]);

    // ============== ESTADOS DE GENERACIÓN CON IA ==============
    const [esquemaPreview, setEsquemaPreview] = useState(null);
    const [generandoConIA, setGenerandoConIA] = useState(false);
    const [tipoMotorSeleccionado, setTipoMotorSeleccionado] = useState(null);

    // ============== ESTADOS DE UI ==============
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [valoresFormulario, setValoresFormulario] = useState(null);

    // ============== ESTADOS DE CARGA ==============
    const [loading, setLoading] = useState(false);
    const [loadingMotores, setLoadingMotores] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    const [error, setError] = useState(null);
    const [errorMotores, setErrorMotores] = useState(null);

    // ============== FUNCIONES DE MOTORES BD ==============

    const cargarMotoresBD = useCallback(async () => {
        setLoadingMotores(true);
        setErrorMotores(null);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_MOTORES_BD}`,
                token
            );

            const motoresData = response.data || response.motores || [];

            if (Array.isArray(motoresData)) {
                const motoreProcesados = motoresData.map(motor => ({
                    id: motor.id,
                    nombre: motor.nombre,
                    descripcion: motor.descripcion || '',
                    extension_archivo: motor.extension_archivo || '',
                    sintaxis_especifica: motor.sintaxis_especifica || '',
                    color: motor.color || '#1890ff'
                }));
                setMotoresBD(motoreProcesados);
            }

            return motoresData;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            setErrorMotores(errorMsg);
            console.error('Error al cargar motores BD:', error);
            return [];
        } finally {
            setLoadingMotores(false);
        }
    }, []);

    const getMotorById = useCallback((motorId) => {
        return motoresBD.find(m => m.id.toString() === motorId.toString());
    }, [motoresBD]);

    // ============== FUNCIONES DE CARGA ==============

    const cargarEsquemas = useCallback(async () => {
        if (!proyectoId) return;

        setLoading(true);
        setError(null);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.LISTAR_ESQUEMAS_PROYECTO}/${proyectoId}/`,
                token
            );

            console.log('🔍 DEBUG - Response del backend:', response);

            const esquemasData = response.data || response.esquemas || [];

            if (Array.isArray(esquemasData)) {
                const esquemasProcesados = esquemasData.map(esquema => {
                    console.log('🔍 DEBUG - Procesando esquema:', esquema);
                    
                    // Parsear esquema (puede ser string o objeto)
                    let esquemaObj = esquema.esquema;
                    if (typeof esquemaObj === 'string') {
                        try {
                            esquemaObj = JSON.parse(esquemaObj);
                        } catch (e) {
                            console.error('Error al parsear esquema JSON:', e);
                            esquemaObj = {};
                        }
                    }
                    
                    console.log('🔍 DEBUG - esquemaObj parseado:', esquemaObj);
                    
                    const tablasTransformadas = transformarEsquema(esquemaObj);
                    const nombreBD = extraerNombreBD(esquemaObj);
                    
                    console.log('🔍 DEBUG - tablasTransformadas:', tablasTransformadas);
                    console.log('🔍 DEBUG - nombreBD extraído:', nombreBD);

                    return {
                        id: esquema.id,
                        proyecto_id: esquema.proyecto_id,
                        motor_bd_id: esquema.motor_bd_id,
                        motor_bd_nombre: esquema.motor_bd_nombre,
                        motor_bd_color: esquema.motor_bd_color || '#1890ff',
                        nombre_bd: nombreBD,
                        total_tablas: tablasTransformadas.length || 0,
                        tablas: tablasTransformadas,
                        fecha_creacion: esquema.fecha_creacion,
                        fecha_actualizacion: esquema.fecha_actualizacion
                    };
                });
                
                console.log('✅ DEBUG - esquemasProcesados finales:', esquemasProcesados);
                setEsquemas(esquemasProcesados);
            } else {
                setEsquemas([]);
            }

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            setError(errorMsg);
            console.error('Error al cargar esquemas:', error);
            setEsquemas([]);
        } finally {
            setLoading(false);
        }
    }, [proyectoId]);

    const obtenerEsquema = useCallback(async (esquemaId) => {
        if (!esquemaId) return null;

        setLoadingDetalle(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await getWithAuth(
                `${API_ENDPOINTS.OBTENER_ESQUEMA}/${esquemaId}/`,
                token
            );

            console.log('🔍 DEBUG - obtenerEsquema response:', response);

            const esquema = response;

            if (esquema) {
                let esquemaJSON = esquema.esquema || {};
                
                // Parsear si viene como string
                if (typeof esquemaJSON === 'string') {
                    try {
                        esquemaJSON = JSON.parse(esquemaJSON);
                    } catch (e) {
                        console.error('Error al parsear esquema JSON:', e);
                        esquemaJSON = {};
                    }
                }
                
                console.log('🔍 DEBUG - esquemaJSON:', esquemaJSON);
                
                const tablasConEstructura = transformarEsquema(esquemaJSON);
                const nombreBD = extraerNombreBD(esquemaJSON);
                
                console.log('🔍 DEBUG - tablasConEstructura:', tablasConEstructura);

                const esquemaProcesado = {
                    id: esquema.id,
                    proyecto_id: esquema.proyecto_id,
                    proyecto_nombre: esquema.proyecto_nombre,
                    motor_bd_id: esquema.motor_bd_id,
                    motor_bd_nombre: esquema.motor_bd_nombre,
                    motor_bd_extension: esquema.motor_bd_extension || '',
                    nombre_bd: nombreBD,
                    esquema: esquemaJSON,
                    tablas: tablasConEstructura,
                    total_tablas: tablasConEstructura.length,
                    fecha_creacion: esquema.fecha_creacion,
                    fecha_actualizacion: esquema.fecha_actualizacion
                };

                console.log('✅ DEBUG - esquemaProcesado:', esquemaProcesado);
                setEsquemaActual(esquemaProcesado);
                return esquemaProcesado;
            }

            return null;

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            console.error('Error al obtener esquema:', error);
            return null;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    // ============== FUNCIONES DE GENERACIÓN CON IA ==============

    const previewEsquemaIA = useCallback(async (tipoMotorId) => {
        if (!proyectoId) {
            message.error('No se ha especificado el ID del proyecto');
            return { success: false };
        }

        if (!tipoMotorId) {
            message.error('Debe seleccionar un motor de BD');
            return { success: false };
        }

        setGenerandoConIA(true);
        setTipoMotorSeleccionado(tipoMotorId);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            message.loading({
                content: 'Generando vista previa del esquema con IA...',
                duration: 0
            });

            const response = await postJSONAuth(
                `${API_ENDPOINTS.PREVISUALIZAR_ESQUEMA_BD_IA}/${proyectoId}/`,
                { tipo_motor_id: tipoMotorId },
                token
            );

            message.destroy();

            setEsquemaPreview(response);
            message.success('Vista previa generada exitosamente');

            return {
                success: true,
                data: response,
                esquema: response.esquema
            };

        } catch (error) {
            message.destroy();
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al generar vista previa: ${errorMsg}`);
            console.error('Error:', error);
            return { success: false, error: errorMsg };
        } finally {
            setGenerandoConIA(false);
        }
    }, [proyectoId]);

    const generarEsquemaIA = useCallback(async (tipoMotorId) => {
        if (!proyectoId) {
            message.error('No se ha especificado el ID del proyecto');
            return { success: false };
        }

        if (!tipoMotorId) {
            message.error('Debe seleccionar un motor de BD');
            return { success: false };
        }

        setLoadingAccion(true);
        setTipoMotorSeleccionado(tipoMotorId);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            message.loading({
                content: 'Generando esquema con IA...',
                duration: 0
            });

            const response = await postJSONAuth(
                `${API_ENDPOINTS.GENERAR_ESQUEMA_BD_IA}/${proyectoId}/`,
                { tipo_motor_id: tipoMotorId },
                token
            );

            message.destroy();

            await cargarEsquemas();

            setEsquemaPreview(null);
            message.success('Esquema generado y guardado exitosamente');

            return {
                success: true,
                data: response,
                esquema_id: response.esquema_id
            };

        } catch (error) {
            message.destroy();
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al generar esquema: ${errorMsg}`);
            console.error('Error:', error);
            return { success: false, error: errorMsg };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, cargarEsquemas]);

    const limpiarPreview = useCallback(() => {
        setEsquemaPreview(null);
        setTipoMotorSeleccionado(null);
    }, []);

    // ============== FUNCIONES DE FORMULARIO ==============

    const abrirFormularioCrear = useCallback(() => {
        if (!motoresBD || motoresBD.length === 0) {
            message.error('No hay motores de BD disponibles');
            return;
        }

        const valoresPorDefecto = {
            motor_bd_id: motoresBD[0]?.id,
            esquema: {
                tablas: {},
                nombre_bd: ''
            }
        };

        setModoEdicion(false);
        setValoresFormulario(valoresPorDefecto);
        setFormularioAbierto(true);
    }, [motoresBD]);

    const abrirFormularioEditar = useCallback(async (esquemaId) => {
        setLoadingDetalle(true);

        try {
            const esquemaCompleto = await obtenerEsquema(esquemaId);
            if (!esquemaCompleto) {
                throw new Error('No se pudo obtener el esquema');
            }

            const valores = {
                id: esquemaCompleto.id,
                motor_bd_id: esquemaCompleto.motor_bd_id,
                esquema: esquemaCompleto.esquema
            };

            setModoEdicion(true);
            setValoresFormulario(valores);
            setFormularioAbierto(true);

        } catch (error) {
            message.error(`Error al cargar esquema: ${error.message}`);
        } finally {
            setLoadingDetalle(false);
        }
    }, [obtenerEsquema]);

    const cerrarFormulario = useCallback(() => {
        setFormularioAbierto(false);
        setModoEdicion(false);
        setValoresFormulario(null);
        setEsquemaActual(null);
    }, []);

    // ============== FUNCIONES CRUD ==============

    const guardarEsquema = useCallback(async (values) => {
        if (!proyectoId) {
            message.error('No se ha especificado el ID del proyecto');
            return { success: false };
        }

        if (!values.motor_bd_id) {
            message.error('Debe seleccionar un motor de BD');
            return { success: false };
        }

        if (!values.esquema || !values.esquema.tablas || Object.keys(values.esquema.tablas).length === 0) {
            message.error('El esquema debe contener al menos una tabla');
            return { success: false };
        }

        setLoadingAccion(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const dataToSend = {
                proyecto_id: proyectoId,
                tipo_motor_bd_id: parseInt(values.motor_bd_id),
                esquema: values.esquema
            };

            let response;

            if (modoEdicion && valoresFormulario?.id) {
                response = await putJSONAuth(
                    `${API_ENDPOINTS.ACTUALIZAR_ESQUEMA}/${valoresFormulario.id}/`,
                    dataToSend,
                    token
                );
                message.success('Esquema actualizado exitosamente');
            } else {
                response = await postJSONAuth(
                    `${API_ENDPOINTS.CREAR_ESQUEMA}`,
                    dataToSend,
                    token
                );
                message.success('Esquema creado exitosamente');
            }

            await cargarEsquemas();
            cerrarFormulario();

            return {
                success: true,
                data: response,
                esquema_id: response.esquema_id
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al guardar esquema: ${errorMsg}`);
            return { success: false, error: errorMsg };
        } finally {
            setLoadingAccion(false);
        }
    }, [proyectoId, modoEdicion, valoresFormulario, cargarEsquemas, cerrarFormulario]);

    const eliminarEsquema = useCallback((esquemaId, onSuccess) => {
        Modal.confirm({
            title: 'Confirmar Eliminación',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>¿Estás seguro de que deseas eliminar este esquema de BD?</p>
                    <p style={{ color: '#ff4d4f', fontSize: '0.9em', marginTop: '0.5rem' }}>
                        Esta acción no se puede deshacer.
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
                        `${API_ENDPOINTS.ELIMINAR_ESQUEMA}/${esquemaId}/`,
                        token
                    );

                    message.success('Esquema eliminado exitosamente');
                    await cargarEsquemas();
                    if (onSuccess) onSuccess();

                    return { success: true };

                } catch (error) {
                    const errorMsg = error.message || 'Error desconocido';
                    message.error(`Error al eliminar esquema: ${errorMsg}`);
                    return { success: false, error: errorMsg };
                } finally {
                    setLoadingAccion(false);
                }
            }
        });
    }, [cargarEsquemas]);

    const duplicarEsquema = useCallback(async (esquemaId, proyectoDestinoId) => {
        if (!esquemaId || !proyectoDestinoId) {
            message.error('Faltan parámetros requeridos');
            return { success: false };
        }

        setLoadingAccion(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const response = await postJSONAuth(
                `${API_ENDPOINTS.DUPLICAR_ESQUEMA}/${esquemaId}/`,
                { proyecto_destino_id: proyectoDestinoId },
                token
            );

            message.success('Esquema duplicado exitosamente');
            await cargarEsquemas();

            return {
                success: true,
                data: response,
                esquema_id: response.esquema_id
            };

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            message.error(`Error al duplicar esquema: ${errorMsg}`);
            return { success: false, error: errorMsg };
        } finally {
            setLoadingAccion(false);
        }
    }, [cargarEsquemas]);

    // ============== FUNCIONES AUXILIARES ==============

    const tieneEsquema = useMemo(() => {
        return esquemas && esquemas.length > 0;
    }, [esquemas]);

    const getEsquemaPrincipal = useCallback(() => {
        return esquemas && esquemas.length > 0 ? esquemas[0] : null;
    }, [esquemas]);

    const estadisticas = useMemo(() => {
        const principal = getEsquemaPrincipal();

        const totalColumnas = principal?.tablas?.reduce((sum, tabla) => {
            return sum + (tabla.columns?.length || 0);
        }, 0) || 0;

        return {
            tieneEsquema: tieneEsquema,
            totalEsquemas: esquemas.length,
            esquemaPrincipal: principal,
            totalTablas: principal?.total_tablas || principal?.tablas?.length || 0,
            totalColumnas: totalColumnas,
            tablas: principal?.tablas || [],
            motorBD: principal ? getMotorById(principal.motor_bd_id) : null
        };
    }, [esquemas, tieneEsquema, getEsquemaPrincipal, getMotorById]);

    const recargarTodo = useCallback(async () => {
        try {
            await Promise.all([cargarMotoresBD(), cargarEsquemas()]);
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, [cargarMotoresBD, cargarEsquemas]);

    const limpiarEstado = useCallback(() => {
        cerrarFormulario();
        limpiarPreview();
        setError(null);
        setErrorMotores(null);
    }, [cerrarFormulario, limpiarPreview]);

    // ============== EFECTOS ==============

    useEffect(() => {
        if (autoLoad) {
            if (motoresBD.length === 0) {
                cargarMotoresBD();
            }
            if (proyectoId) {
                cargarEsquemas();
            }
        }
    }, [proyectoId, autoLoad, cargarMotoresBD, cargarEsquemas, motoresBD.length]);

    // ============== RETURN ==============

    return {
        esquemas,
        esquemaActual,
        motoresBD,
        estadisticas,
        esquemaPreview,
        tipoMotorSeleccionado,
        formularioAbierto,
        modoEdicion,
        valoresFormulario,
        loading,
        loadingMotores,
        loadingDetalle,
        loadingAccion,
        generandoConIA,
        error,
        errorMotores,
        tieneEsquema,
        cargarMotoresBD,
        getMotorById,
        cargarEsquemas,
        previewEsquemaIA,
        generarEsquemaIA,
        limpiarPreview,
        abrirFormularioCrear,
        abrirFormularioEditar,
        cerrarFormulario,
        guardarEsquema,
        eliminarEsquema,
        duplicarEsquema,
        obtenerEsquema,
        getEsquemaPrincipal,
        recargarTodo,
        limpiarEstado
    };
};