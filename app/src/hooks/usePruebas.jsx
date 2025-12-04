import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import {
    getStoredToken,
    API_ENDPOINTS,
    getWithAuth,
    postJSONAuth,
    deleteWithAuth
} from '../../config';

export const usePruebas = (proyectoId) => {
    const [loading, setLoading] = useState(false);
    const [pruebas, setPruebas] = useState([]);
    const [pruebaGenerada, setPruebaGenerada] = useState(null);
    const [pruebasCargadas, setPruebasCargadas] = useState(false);

    /**
     * Genera pruebas mediante IA usando el backend real
     */
    const generarPrueba = async (datos) => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);
        setPruebaGenerada(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            // Llamar al endpoint real de generación con IA
            const endpoint = `${API_ENDPOINTS.GENERAR_PRUEBAS_IA}/${proyectoId}/`;
            
            message.loading('Generando pruebas con IA...', 0);
            
            const data = await postJSONAuth(endpoint, {}, token);
            
            message.destroy(); // Cerrar el mensaje de loading
            
            if (data.pruebas_creadas && data.pruebas_creadas.length > 0) {
                message.success(`${data.total_pruebas} prueba(s) generada(s) exitosamente con códigos automáticos`);
                
                // Recargar las pruebas para mostrar las nuevas
                await recargarPruebas();
                
                return data;
            } else {
                message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones.');
                return null;
            }

        } catch (error) {
            message.destroy();
            const errorMsg = error.message || 'Error al generar las pruebas';
            message.error(errorMsg);
            console.error('Error generando pruebas con IA:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Previsualiza las pruebas que se generarían (sin guardarlas)
     */
    const previsualizarPruebas = async () => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const endpoint = `${API_ENDPOINTS.PREVISUALIZAR_PRUEBAS_IA}/${proyectoId}/`;
            
            message.loading('Generando vista previa de pruebas...', 0);
            
            const data = await postJSONAuth(endpoint, {}, token);
            
            message.destroy();
            
            if (data.pruebas && data.pruebas.length > 0) {
                message.success(`Vista previa: ${data.total_pruebas} prueba(s) con códigos provisionales`);
                return data;
            } else {
                message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones.');
                return null;
            }

        } catch (error) {
            message.destroy();
            const errorMsg = error.message || 'Error al previsualizar las pruebas';
            message.error(errorMsg);
            console.error('Error previsualizando pruebas:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Guarda una prueba en la base de datos (crear o actualizar)
     * IMPORTANTE: NO se debe enviar el campo 'codigo' al crear, se genera automáticamente
     */
    const guardarPrueba = async (prueba) => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            // Preparar datos para el backend
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

            // Si tiene ID, es actualización, si no, es creación
            if (prueba.id_prueba || prueba.id) {
                const pruebaId = prueba.id_prueba || prueba.id;
                endpoint = `${API_ENDPOINTS.ACTUALIZAR_PRUEBA}/${pruebaId}/`;
                method = 'PUT';
                
                // IMPORTANTE: Solo en actualización se puede enviar el código
                // (aunque normalmente no debería cambiar)
                if (prueba.codigo) {
                    datosEnviar.codigo = prueba.codigo;
                }
            } else {
                endpoint = `${API_ENDPOINTS.CREAR_PRUEBA}`;
                method = 'POST';
                
                // NO enviar código en creación, se genera automáticamente en el backend
                // Si el usuario intenta crear manualmente, el código se asignará automáticamente
            }

            // Hacer la petición
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: method,
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
                } catch (e) {
                    console.error('No se pudo parsear error:', e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            message.success(
                prueba.id_prueba || prueba.id
                    ? 'Prueba actualizada exitosamente'
                    : `Prueba creada exitosamente con código: ${data.codigo || ''}`
            );

            // Recargar lista de pruebas
            await recargarPruebas();

            return data;

        } catch (error) {
            const errorMsg = error.message || 'Error al guardar la prueba';
            message.error(errorMsg);
            console.error('Error guardando prueba:', error);
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
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const endpoint = `${API_ENDPOINTS.LISTAR_PRUEBAS}/${proyectoId}/`;
            const data = await getWithAuth(endpoint, token);

            // Transformar los datos para que coincidan con el formato esperado
            const pruebasTransformadas = (data.pruebas || []).map(p => ({
                id_prueba: p.id,
                id_proyecto: p.proyecto_id,
                tipo_prueba_id: p.tipo_prueba_id,
                tipo_prueba: p.tipo_prueba_nombre,
                codigo: p.codigo, // El código ya viene generado del backend
                tipo: p.tipo_prueba_nombre,
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
            const errorMsg = error.message || 'Error al cargar pruebas';
            message.error(errorMsg);
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
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

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
                } catch (e) {
                    console.error('No se pudo parsear error:', e);
                }
                throw new Error(errorMessage);
            }

            message.success('Prueba eliminada exitosamente');

            // Actualizar lista local
            setPruebas(prev => prev.filter(p => p.id_prueba !== pruebaId));

        } catch (error) {
            const errorMsg = error.message || 'Error al eliminar la prueba';
            message.error(errorMsg);
            console.error('Error eliminando prueba:', error);
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
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const endpoint = `${API_ENDPOINTS.OBTENER_PRUEBA}/${pruebaId}/`;
            const data = await getWithAuth(endpoint, token);

            // Transformar datos
            const pruebaTransformada = {
                id_prueba: data.id,
                id_proyecto: data.proyecto_id,
                tipo_prueba_id: data.tipo_prueba_id,
                tipo_prueba: data.tipo_prueba_nombre,
                codigo: data.codigo,
                tipo: data.tipo_prueba_nombre,
                nombre: data.nombre,
                descripcion: data.descripcion,
                estado: data.estado,
                especificacion_relacionada: data.especificacion_relacionada,
                fecha_creacion: data.fecha_creacion,
                fecha_actualizacion: data.fecha_actualizacion,
                prueba: data.prueba
            };

            return pruebaTransformada;

        } catch (error) {
            const errorMsg = error.message || 'Error al obtener la prueba';
            message.error(errorMsg);
            console.error('Error obteniendo prueba:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calcula contadores de pruebas por tipo usando useMemo para optimizar
     */
    const contadores = useMemo(() => {
        const unitarias = pruebas.filter(p =>
            p.tipo_prueba?.toLowerCase() === 'unitaria' ||
            p.tipo?.toLowerCase() === 'unitaria'
        ).length;

        const integracion = pruebas.filter(p =>
            p.tipo_prueba?.toLowerCase() === 'integracion' ||
            p.tipo?.toLowerCase() === 'integracion' ||
            p.tipo_prueba?.toLowerCase() === 'integración' ||
            p.tipo?.toLowerCase() === 'integración'
        ).length;

        const sistema = pruebas.filter(p =>
            p.tipo_prueba?.toLowerCase() === 'sistema' ||
            p.tipo?.toLowerCase() === 'sistema'
        ).length;

        const aceptacion = pruebas.filter(p =>
            p.tipo_prueba?.toLowerCase() === 'aceptacion' ||
            p.tipo?.toLowerCase() === 'aceptacion' ||
            p.tipo_prueba?.toLowerCase() === 'aceptación' ||
            p.tipo?.toLowerCase() === 'aceptación'
        ).length;

        const componentes = pruebas.filter(p =>
            p.tipo_prueba?.toLowerCase() === 'componente' ||
            p.tipo?.toLowerCase() === 'componente'
        ).length;

        return {
            total: pruebas.length,
            unitarias,
            integracion,
            sistema,
            aceptacion,
            componentes
        };
    }, [pruebas]);

    const limpiarPruebaGenerada = () => {
        setPruebaGenerada(null);
    };

    return {
        // Estado
        loading,
        pruebas,
        pruebaGenerada,
        contadores,

        // Funciones
        generarPrueba, // Ahora usa IA real del backend con códigos automáticos
        previsualizarPruebas, // Muestra códigos provisionales
        guardarPrueba, // Actualizado: NO envía código en creación
        cargarPruebas,
        recargarPruebas,
        limpiarPruebaGenerada,
        eliminarPrueba,
        obtenerPrueba,

        // Setters
        setPruebas
    };
};

export default usePruebas;