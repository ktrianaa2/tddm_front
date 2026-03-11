import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import {
    getStoredToken,
    API_ENDPOINTS,
    getWithAuth,
    postJSONAuth,
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

export const usePruebas = (proyectoId) => {
    const [loading, setLoading] = useState(false);
    const [pruebas, setPruebas] = useState([]);
    const [pruebaGenerada, setPruebaGenerada] = useState(null);
    const [pruebasCargadas, setPruebasCargadas] = useState(false);

    // ── Estados para el componente ProgresoGeneracion ──────────────────────────
    const [estadosProgreso, setEstadosProgreso] = useState({});
    const [progresoInfo, setProgresoInfo] = useState({
        proyectoNombre: '',
        totalGeneradas: 0,
        mensajeGlobal: '',
    });

    const resetProgreso = useCallback(() => {
        setEstadosProgreso({});
        setProgresoInfo({ proyectoNombre: '', totalGeneradas: 0, mensajeGlobal: '' });
    }, []);

    // ── Helpers de progreso ────────────────────────────────────────────────────
    const setEstadoTipo = (tipo, estado) =>
        setEstadosProgreso(prev => ({ ...prev, [tipo]: estado }));

    /**
     * Genera pruebas de un tipo específico usando IA.
     * @param {string} tipoPrueba - 'unitaria' | 'componente' | 'sistema'
     */
    const generarPrueba = async (tipoPrueba = 'unitaria') => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);
        setPruebaGenerada(null);
        setEstadoTipo(tipoPrueba, 'cargando');

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpointKey = ENDPOINTS_GENERACION[tipoPrueba];
            if (!endpointKey || !API_ENDPOINTS[endpointKey]) {
                throw new Error(`Tipo de prueba no soportado: ${tipoPrueba}`);
            }

            const endpoint = `${API_ENDPOINTS[endpointKey]}/${proyectoId}/`;

            const data = await postJSONAuth(endpoint, {}, token);

            if (data.pruebas_creadas && data.pruebas_creadas.length > 0) {
                setEstadoTipo(tipoPrueba, 'ok');
                setProgresoInfo(prev => ({
                    ...prev,
                    totalGeneradas: prev.totalGeneradas + (data.total_pruebas || 0),
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
            const errorMsg = error.message || 'Error al generar las pruebas';
            message.error(errorMsg);
            console.error(`Error generando pruebas de ${tipoPrueba}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Genera pruebas de múltiples tipos en una sola llamada.
     * Actualiza estadosProgreso por tipo conforme avanza.
     * @param {string[]} tipos - Array de tipos: ['unitaria', 'componente', 'sistema']
     * @param {string} nombreProyecto - Nombre del proyecto (para ProgresoGeneracion)
     */
    const generarPruebasMultiple = async (tipos = ['unitaria', 'componente', 'sistema'], nombreProyecto = '') => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);
        setPruebaGenerada(null);

        // Inicializar todos como pendiente
        const estadosIniciales = {};
        tipos.forEach(t => { estadosIniciales[t] = 'pendiente'; });
        setEstadosProgreso(estadosIniciales);
        setProgresoInfo({ proyectoNombre: nombreProyecto, totalGeneradas: 0, mensajeGlobal: '' });

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            if (!API_ENDPOINTS.GENERAR_PRUEBAS_MULTIPLE_IA) {
                throw new Error('Endpoint de generación múltiple no configurado');
            }

            // Marcar todos como cargando al iniciar
            const estadosCargando = {};
            tipos.forEach(t => { estadosCargando[t] = 'cargando'; });
            setEstadosProgreso(estadosCargando);

            const endpoint = `${API_ENDPOINTS.GENERAR_PRUEBAS_MULTIPLE_IA}/${proyectoId}/`;
            const data = await postJSONAuth(endpoint, { tipos }, token);

            // Actualizar estados individuales según respuesta del backend
            const nuevosEstados = {};
            tipos.forEach(tipo => {
                const resultadoTipo = data.resultados?.[tipo];
                if (resultadoTipo?.error) {
                    nuevosEstados[tipo] = 'error';
                } else {
                    nuevosEstados[tipo] = 'ok';
                }
            });
            setEstadosProgreso(nuevosEstados);

            if (data.total_pruebas > 0) {
                setProgresoInfo(prev => ({
                    ...prev,
                    totalGeneradas: data.total_pruebas,
                    mensajeGlobal: '',
                }));
                await recargarPruebas();
                return data;
            } else {
                setProgresoInfo(prev => ({
                    ...prev,
                    mensajeGlobal: 'No se pudieron generar pruebas. Verifica las especificaciones.',
                }));
                message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones.');
                return null;
            }
        } catch (error) {
            // En caso de error general, marcar todos como error
            const estadosError = {};
            tipos.forEach(t => { estadosError[t] = 'error'; });
            setEstadosProgreso(estadosError);

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
     * @param {string} tipoPrueba - 'unitaria' | 'componente' | 'sistema'
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
     * Guarda/actualiza una prueba en la base de datos
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

            const datosEnviar = {
                proyecto_id: proyectoId,
                tipo_prueba_id: prueba.tipo_prueba_id || 1,
                nombre: prueba.nombre,
                descripcion: prueba.descripcion || '',
                estado: prueba.estado || 'Pendiente',
                especificacion_relacionada: prueba.especificacion_relacionada || '',
                prueba: prueba.prueba
            };

            let endpoint;
            let method;

            if (prueba.id_prueba || prueba.id) {
                const pruebaId = prueba.id_prueba || prueba.id;
                endpoint = `${API_ENDPOINTS.ACTUALIZAR_PRUEBA}/${pruebaId}/`;
                method = 'PUT';
                if (prueba.codigo) datosEnviar.codigo = prueba.codigo;
            } else {
                endpoint = `${API_ENDPOINTS.CREAR_PRUEBA}`;
                method = 'POST';
            }

            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(datosEnviar)
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.mensaje || errorMessage;
                } catch (e) { /* no-op */ }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            message.success(
                prueba.id_prueba || prueba.id
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
     * Carga todas las pruebas del proyecto
     */
    const cargarPruebas = useCallback(async () => {
        if (!proyectoId || pruebasCargadas) return;

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.LISTAR_PRUEBAS}/${proyectoId}/`;
            const data = await getWithAuth(endpoint, token);

            const pruebasTransformadas = (data.pruebas || []).map(p => ({
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
                prueba: p.prueba
            }));

            setPruebas(pruebasTransformadas);
            setPruebasCargadas(true);

        } catch (error) {
            message.error(error.message || 'Error al cargar pruebas');
            console.error('Error cargando pruebas:', error);
        } finally {
            setLoading(false);
        }
    }, [proyectoId, pruebasCargadas]);

    /**
     * Recarga las pruebas forzando una nueva consulta
     */
    const recargarPruebas = useCallback(async () => {
        setPruebasCargadas(false);
        await cargarPruebas();
    }, [cargarPruebas]);

    /**
     * Elimina una prueba
     */
    const eliminarPrueba = async (pruebaId) => {
        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.ELIMINAR_PRUEBA}/${pruebaId}/`;

            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.mensaje || errorMessage;
                } catch (e) { /* no-op */ }
                throw new Error(errorMessage);
            }

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
     * Obtiene una prueba específica
     */
    const obtenerPrueba = async (pruebaId) => {
        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) throw new Error('No hay token de autenticación');

            const endpoint = `${API_ENDPOINTS.OBTENER_PRUEBA}/${pruebaId}/`;
            const data = await getWithAuth(endpoint, token);

            return {
                id_prueba: data.id,
                id_proyecto: data.proyecto_id,
                tipo_prueba_id: data.tipo_prueba?.id,
                tipo_prueba: data.tipo_prueba?.nombre,
                tipo: data.tipo_prueba?.nombre,
                codigo: data.codigo,
                nombre: data.nombre,
                descripcion: data.descripcion,
                estado: data.estado,
                especificacion_relacionada: data.especificacion_relacionada,
                fecha_creacion: data.fecha_creacion,
                fecha_actualizacion: data.fecha_actualizacion,
                prueba: data.prueba
            };

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

        return {
            total: pruebas.length,
            unitarias,
            componente,
            sistema,
            integracion,
        };
    }, [pruebas]);

    const limpiarPruebaGenerada = () => setPruebaGenerada(null);

    return {
        loading,
        pruebas,
        pruebaGenerada,
        contadores,
        // ── Progreso ──
        estadosProgreso,
        progresoInfo,
        resetProgreso,
        // ── Acciones ──
        generarPrueba,
        generarPruebasMultiple,
        previsualizarPruebas,
        guardarPrueba,
        cargarPruebas,
        recargarPruebas,
        limpiarPruebaGenerada,
        eliminarPrueba,
        obtenerPrueba,
        setPruebas
    };
};

export default usePruebas;