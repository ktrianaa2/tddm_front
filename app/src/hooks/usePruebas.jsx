import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import {
    getStoredToken,
    API_ENDPOINTS,
    getWithAuth,
    postJSONAuth,
    putJSONAuth,
    deleteWithAuth
} from '../../config';

// Mapeo de endpoints por tipo de prueba
const ENDPOINTS_GENERACION = {
    unitaria: 'GENERAR_PRUEBAS_UNITARIAS_IA',
    componente: 'GENERAR_PRUEBAS_COMPONENTE_IA',
    sistema: 'GENERAR_PRUEBAS_SISTEMA_IA',
    multiple: 'GENERAR_PRUEBAS_MULTIPLE_IA',
};

const ENDPOINTS_PREVISION = {
    unitaria: 'PREVISUALIZAR_PRUEBAS_UNITARIAS_IA',
    componente: 'PREVISUALIZAR_PRUEBAS_COMPONENTE_IA',
    sistema: 'PREVISUALIZAR_PRUEBAS_SISTEMA_IA',
};

// ── Helper: normalizar campo prueba a dict ────────────────────────────────────
// El campo puede llegar como dict, string JSON, o string doblemente escapado.
// Siempre devuelve un objeto plano {} listo para usar.
const normalizarPruebaJson = (valor) => {
    if (valor === null || valor === undefined) return {};
    if (typeof valor === 'object' && !Array.isArray(valor)) return valor;
    if (typeof valor === 'string') {
        let parsed = valor;
        for (let i = 0; i < 3; i++) {
            try {
                parsed = JSON.parse(parsed);
                if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                    return parsed;
                }
            } catch {
                return {};
            }
        }
    }
    return {};
};

export const usePruebas = (proyectoId) => {
    const [loading, setLoading] = useState(false);
    const [pruebas, setPruebas] = useState([]);
    const [pruebaGenerada, setPruebaGenerada] = useState(null);
    const [pruebasCargadas, setPruebasCargadas] = useState(false);

    // ── Estados de progreso ───────────────────────────────────────────────────
    const [estadosProgreso, setEstadosProgreso] = useState({});
    const [mensajesPorTipo, setMensajesPorTipo] = useState({});
    const [pruebasPorTipo, setPruebasPorTipo] = useState({});
    const [progresoInfo, setProgresoInfo] = useState({
        proyectoNombre: '',
        totalGeneradas: 0,
        mensajeGlobal: '',
    });

    const resetProgreso = useCallback(() => {
        setEstadosProgreso({});
        setMensajesPorTipo({});
        setPruebasPorTipo({});
        setProgresoInfo({ proyectoNombre: '', totalGeneradas: 0, mensajeGlobal: '' });
    }, []);

    // ── Helpers internos ──────────────────────────────────────────────────────
    const setEstadoTipo = (tipo, estado) =>
        setEstadosProgreso(prev => ({ ...prev, [tipo]: estado }));

    const setMensajeTipo = (tipo, mensaje) =>
        setMensajesPorTipo(prev => ({ ...prev, [tipo]: mensaje }));

    const setPruebasTipo = (tipo, cantidad) =>
        setPruebasPorTipo(prev => ({ ...prev, [tipo]: cantidad }));

    const extraerTipoDeMensaje = (msg) => {
        if (!msg) return null;
        const upper = msg.toUpperCase();
        if (upper.includes('UNITARIA')) return 'unitaria';
        if (upper.includes('COMPONENTE')) return 'componente';
        if (upper.includes('SISTEMA')) return 'sistema';
        return null;
    };

    const procesarLineaProgreso = useCallback((linea, tipos) => {
        if (!linea || !linea.includes('[PROGRESO]')) return;

        const tipo = extraerTipoDeMensaje(linea);

        if (tipo && tipos.includes(tipo)) {
            const msgLower = linea.toLowerCase();

            if (msgLower.includes('iniciando generación')) {
                setEstadoTipo(tipo, 'cargando');
                setMensajeTipo(tipo, linea);
                return;
            }

            if (msgLower.includes('guardadas exitosamente') || msgLower.includes('guardados exitosamente')) {
                const match = linea.match(/(\d+)\s+pruebas?/i);
                if (match) {
                    const cantidad = parseInt(match[1]);
                    setPruebasTipo(tipo, cantidad);
                    setProgresoInfo(prev => ({
                        ...prev,
                        totalGeneradas: prev.totalGeneradas + cantidad,
                    }));
                }
                setEstadoTipo(tipo, 'ok');
                setMensajeTipo(tipo, linea);
                return;
            }

            if (msgLower.includes('error')) {
                setEstadoTipo(tipo, 'error');
                setMensajeTipo(tipo, linea);
                return;
            }

            setMensajeTipo(tipo, linea);
        }
    }, []);

    /**
     * Genera pruebas de un tipo específico usando IA.
     */
    const generarPrueba = async (tipoPrueba = 'unitaria') => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);
        setPruebaGenerada(null);
        setEstadoTipo(tipoPrueba, 'cargando');
        setMensajeTipo(tipoPrueba, `Iniciando generación de pruebas de ${tipoPrueba.toUpperCase()}...`);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpointKey = ENDPOINTS_GENERACION[tipoPrueba];
            if (!endpointKey || !API_ENDPOINTS[endpointKey]) {
                throw new Error(`Tipo de prueba no soportado: ${tipoPrueba}`);
            }

            const endpoint = `${API_ENDPOINTS[endpointKey]}/${proyectoId}/`;
            const data = await postJSONAuth(endpoint, {}, token);

            if (data.progreso && Array.isArray(data.progreso)) {
                for (const linea of data.progreso) {
                    procesarLineaProgreso(linea, [tipoPrueba]);
                }
            }

            if (data.pruebas_creadas && data.pruebas_creadas.length > 0) {
                const cantidad = data.total_pruebas || data.pruebas_creadas.length;
                setPruebasTipo(tipoPrueba, cantidad);
                setEstadoTipo(tipoPrueba, 'ok');
                setProgresoInfo(prev => ({
                    ...prev,
                    totalGeneradas: prev.totalGeneradas + cantidad,
                }));
                await recargarPruebas();
                return data;
            } else {
                setEstadoTipo(tipoPrueba, 'error');
                message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones.');
                return null;
            }
        } catch (error) {
            setEstadoTipo(tipoPrueba, 'error');
            setMensajeTipo(tipoPrueba, `Error: ${error.message}`);
            const errorMsg = error.message || 'Error al generar las pruebas';
            message.error(errorMsg);
            console.error(`Error generando pruebas de ${tipoPrueba}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Genera pruebas de múltiples tipos de forma SECUENCIAL.
     */
    const generarPruebasMultiple = async (tipos = ['unitaria', 'componente', 'sistema'], nombreProyecto = '') => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);
        setPruebaGenerada(null);

        const estadosIniciales = {};
        tipos.forEach(t => { estadosIniciales[t] = 'pendiente'; });
        setEstadosProgreso(estadosIniciales);
        setMensajesPorTipo({});
        setPruebasPorTipo({});
        setProgresoInfo({ proyectoNombre: nombreProyecto, totalGeneradas: 0, mensajeGlobal: '' });

        let totalGlobal = 0;
        const resultadosFinales = { resultados: {} };

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            for (let i = 0; i < tipos.length; i++) {
                const tipo = tipos[i];

                setEstadoTipo(tipo, 'cargando');
                setMensajeTipo(tipo, `[${i + 1}/${tipos.length}] Iniciando generación de pruebas de ${tipo.toUpperCase()}...`);

                try {
                    const endpointKey = ENDPOINTS_GENERACION[tipo];
                    if (!endpointKey || !API_ENDPOINTS[endpointKey]) {
                        throw new Error(`Tipo no soportado: ${tipo}`);
                    }

                    const endpoint = `${API_ENDPOINTS[endpointKey]}/${proyectoId}/`;

                    setMensajeTipo(tipo, `[${i + 1}/${tipos.length}] Cargando prompt para ${tipo}...`);
                    await new Promise(r => setTimeout(r, 100));

                    setMensajeTipo(tipo, `[${i + 1}/${tipos.length}] Enviando especificaciones a IA para pruebas de ${tipo}...`);

                    const data = await postJSONAuth(endpoint, {}, token);

                    if (data.progreso && Array.isArray(data.progreso)) {
                        for (const linea of data.progreso) {
                            procesarLineaProgreso(linea, [tipo]);
                            await new Promise(r => setTimeout(r, 50));
                        }
                    } else {
                        setMensajeTipo(tipo, `[${i + 1}/${tipos.length}] Respuesta recibida. Procesando JSON...`);
                        await new Promise(r => setTimeout(r, 150));
                    }

                    if (data.pruebas_creadas && data.pruebas_creadas.length > 0) {
                        const cantidad = data.total_pruebas || data.pruebas_creadas.length;
                        setMensajeTipo(tipo, `[${i + 1}/${tipos.length}] ${cantidad} pruebas de ${tipo} parseadas. Guardando en BD...`);
                        await new Promise(r => setTimeout(r, 200));

                        setPruebasTipo(tipo, cantidad);
                        totalGlobal += cantidad;
                        setProgresoInfo(prev => ({
                            ...prev,
                            totalGeneradas: totalGlobal,
                        }));

                        setEstadoTipo(tipo, 'ok');
                        setMensajeTipo(tipo, `[${i + 1}/${tipos.length}] ✓ ${cantidad} pruebas de ${tipo} guardadas exitosamente.`);
                        resultadosFinales.resultados[tipo] = { total: cantidad };
                    } else {
                        setEstadoTipo(tipo, 'error');
                        setMensajeTipo(tipo, `No se generaron pruebas de ${tipo}`);
                        resultadosFinales.resultados[tipo] = { error: 'Sin pruebas generadas' };
                    }

                } catch (tipoError) {
                    console.error(`Error en tipo ${tipo}:`, tipoError);
                    setEstadoTipo(tipo, 'error');
                    setMensajeTipo(tipo, `Error al generar pruebas de ${tipo}: ${tipoError.message}`);
                    resultadosFinales.resultados[tipo] = { error: tipoError.message };
                }
            }

            resultadosFinales.total_pruebas = totalGlobal;

            if (totalGlobal > 0) {
                await recargarPruebas();
                return resultadosFinales;
            } else {
                setProgresoInfo(prev => ({
                    ...prev,
                    mensajeGlobal: 'No se pudieron generar pruebas. Verifica las especificaciones.',
                }));
                message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones.');
                return null;
            }

        } catch (error) {
            tipos.forEach(t => {
                if (estadosProgreso[t] !== 'ok') {
                    setEstadoTipo(t, 'error');
                }
            });
            const errorMsg = error.message || 'Error al generar las pruebas';
            message.error(errorMsg);
            console.error('Error generando pruebas múltiples:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Previsualiza las pruebas que se generarían (sin guardarlas)
     */
    const previsualizarPruebas = async (tipoPrueba = 'unitaria') => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpointKey = ENDPOINTS_PREVISION[tipoPrueba];
            if (!endpointKey || !API_ENDPOINTS[endpointKey]) {
                throw new Error(`Tipo de prueba no soportado: ${tipoPrueba}`);
            }

            const endpoint = `${API_ENDPOINTS[endpointKey]}/${proyectoId}/`;

            message.loading({ content: 'Generando vista previa...', key: 'previewLoading' });

            const data = await postJSONAuth(endpoint, {}, token);

            message.destroy('previewLoading');

            if (data.pruebas && data.pruebas.length > 0) {
                message.success(`Vista previa: ${data.total_pruebas} prueba(s) de ${tipoPrueba}`);
                return data;
            } else {
                message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones.');
                return null;
            }
        } catch (error) {
            message.destroy('previewLoading');
            const errorMsg = error.message || 'Error al previsualizar las pruebas';
            message.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Guarda/actualiza una prueba en la base de datos.
     *
     * Cuando viene del editor (_soloCodigoEditado === true), enviamos ÚNICAMENTE
     * { prueba: { codigo_editado, fecha_ultima_edicion } }.
     * El backend fusiona solo esas dos claves con el JSON original y guarda
     * siempre como string JSON (evitando el bug de JSONField + psycopg2).
     */
    const guardarPrueba = async (prueba) => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const pruebaId = prueba.id_prueba || prueba.id;

            // ── Caso 1: guardado desde el editor (solo codigo_editado) ────────
            if (prueba._soloCodigoEditado && pruebaId) {
                const endpoint = `${API_ENDPOINTS.ACTUALIZAR_PRUEBA}/${pruebaId}/`;
                const data = await putJSONAuth(endpoint, { prueba: prueba.prueba }, token);
                message.success('Prueba actualizada exitosamente');

                // Actualizar en memoria: fusionar codigo_editado sobre el JSON normalizado
                setPruebas(prev => prev.map(p => {
                    if (p.id_prueba !== pruebaId && p.id !== pruebaId) return p;
                    const pruebaActual = normalizarPruebaJson(p.prueba);
                    return {
                        ...p,
                        prueba: { ...pruebaActual, ...prueba.prueba }
                    };
                }));
                return data;
            }

            // ── Caso 2: guardado completo (creación o edición manual) ────────
            const datosEnviar = {
                proyecto_id: proyectoId,
                tipo_prueba_id: prueba.tipo_prueba_id || 1,
                nombre: prueba.nombre,
                descripcion: prueba.descripcion || '',
                estado: prueba.estado || 'Pendiente',
                especificacion_relacionada: prueba.especificacion_relacionada || '',
            };

            if (prueba.prueba !== undefined) {
                datosEnviar.prueba = prueba.prueba;
            }

            let endpoint;
            let method;

            if (pruebaId) {
                endpoint = `${API_ENDPOINTS.ACTUALIZAR_PRUEBA}/${pruebaId}/`;
                method = 'PUT';
                if (prueba.codigo) datosEnviar.codigo = prueba.codigo;
            } else {
                endpoint = `${API_ENDPOINTS.CREAR_PRUEBA}`;
                method = 'POST';
            }

            const data = pruebaId
                ? await putJSONAuth(endpoint, datosEnviar, token)
                : await postJSONAuth(endpoint, datosEnviar, token);

            message.success(
                pruebaId
                    ? 'Prueba actualizada exitosamente'
                    : `Prueba creada con código: ${data.codigo || ''}`
            );

            await recargarPruebas();
            return data;

        } catch (error) {
            const errorMsg = error.message || 'Error al guardar la prueba';
            message.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Aprueba una prueba: SOLO cambia el estado a 'Aprobada'.
     */
    const aprobarPrueba = async (prueba) => {
        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const pruebaId = prueba.id_prueba || prueba.id;
            if (!pruebaId) throw new Error('ID de prueba no encontrado');

            const endpoint = `${API_ENDPOINTS.APROBAR_PRUEBA}/${pruebaId}/`;
            const data = await postJSONAuth(endpoint, {}, token);
            message.success('Prueba aprobada exitosamente');

            setPruebas(prev => prev.map(p =>
                (p.id_prueba === pruebaId || p.id === pruebaId)
                    ? { ...p, estado: 'Aprobada' }
                    : p
            ));

            return data;

        } catch (error) {
            const errorMsg = error.message || 'Error al aprobar la prueba';
            message.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // ── Helper interno: transformar prueba del backend al formato del hook ────
    const _transformarPrueba = (p) => ({
        id_prueba: p.id,
        id_proyecto: p.proyecto_id,
        tipo_prueba_id: p.tipo_prueba?.id,
        tipo_prueba: p.tipo_prueba?.nombre,
        tipo: p.tipo_prueba?.nombre,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        estado: p.estado,
        especificacion_relacionada: p.especificacion_relacionada,
        fecha_creacion: p.fecha_creacion,
        fecha_actualizacion: p.fecha_actualizacion,
        // Normalizar siempre a objeto para consistencia en toda la app
        prueba: normalizarPruebaJson(p.prueba),
    });

    /**
     * Carga todas las pruebas del proyecto (solo si no están cargadas aún)
     */
    const cargarPruebas = useCallback(async () => {
        if (!proyectoId || pruebasCargadas) return;

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.LISTAR_PRUEBAS}/${proyectoId}/`;
            const data = await getWithAuth(endpoint, token);

            setPruebas((data.pruebas || []).map(_transformarPrueba));
            setPruebasCargadas(true);

        } catch (error) {
            message.error(error.message || 'Error al cargar pruebas');
            console.error('Error cargando pruebas:', error);
        } finally {
            setLoading(false);
        }
    }, [proyectoId, pruebasCargadas]);

    /**
     * Recarga las pruebas forzando una nueva consulta al servidor
     */
    const recargarPruebas = useCallback(async () => {
        setPruebasCargadas(false);
        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.LISTAR_PRUEBAS}/${proyectoId}/`;
            const data = await getWithAuth(endpoint, token);

            setPruebas((data.pruebas || []).map(_transformarPrueba));
            setPruebasCargadas(true);
        } catch (error) {
            message.error(error.message || 'Error al recargar pruebas');
        } finally {
            setLoading(false);
        }
    }, [proyectoId]);

    /**
     * Elimina una prueba (soft-delete)
     */
    const eliminarPrueba = async (pruebaId) => {
        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.ELIMINAR_PRUEBA}/${pruebaId}/`;
            await deleteWithAuth(endpoint, token);

            message.success('Prueba eliminada exitosamente');
            setPruebas(prev => prev.filter(p => p.id_prueba !== pruebaId));

        } catch (error) {
            message.error(error.message || 'Error al eliminar la prueba');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Obtiene una prueba específica por ID
     */
    const obtenerPrueba = async (pruebaId) => {
        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.OBTENER_PRUEBA}/${pruebaId}/`;
            const data = await getWithAuth(endpoint, token);

            return _transformarPrueba(data);

        } catch (error) {
            message.error(error.message || 'Error al obtener la prueba');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Contadores de pruebas por tipo
     */
    const contadores = useMemo(() => {
        const normalizar = (str) => (str || '').toLowerCase().trim();

        const unitarias = pruebas.filter(p =>
            normalizar(p.tipo_prueba) === 'unitaria' || normalizar(p.tipo) === 'unitaria'
        ).length;

        const componente = pruebas.filter(p =>
            normalizar(p.tipo_prueba) === 'componente' || normalizar(p.tipo) === 'componente'
        ).length;

        const sistema = pruebas.filter(p =>
            normalizar(p.tipo_prueba) === 'sistema' || normalizar(p.tipo) === 'sistema'
        ).length;

        const integracion = pruebas.filter(p =>
            normalizar(p.tipo_prueba) === 'integracion' || normalizar(p.tipo) === 'integracion' ||
            normalizar(p.tipo_prueba) === 'integración' || normalizar(p.tipo) === 'integración'
        ).length;

        return { total: pruebas.length, unitarias, componente, sistema, integracion };
    }, [pruebas]);

    const limpiarPruebaGenerada = () => setPruebaGenerada(null);

    return {
        loading,
        pruebas,
        pruebaGenerada,
        contadores,
        // ── Progreso ──
        estadosProgreso,
        mensajesPorTipo,
        pruebasPorTipo,
        progresoInfo,
        resetProgreso,
        // ── Acciones ──
        generarPrueba,
        generarPruebasMultiple,
        previsualizarPruebas,
        guardarPrueba,
        aprobarPrueba,
        cargarPruebas,
        recargarPruebas,
        limpiarPruebaGenerada,
        eliminarPrueba,
        obtenerPrueba,
        setPruebas
    };
};

export default usePruebas;