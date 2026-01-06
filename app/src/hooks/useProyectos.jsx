import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { getStoredToken, API_ENDPOINTS, getWithAuth, postFormDataAuth } from '../../config';

export const useProyectos = () => {
    const [proyectos, setProyectos] = useState([]);
    const [estadosProyecto, setEstadosProyecto] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingEstados, setLoadingEstados] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0);

    // Función para cargar los estados de proyecto
    const fetchEstadosProyecto = useCallback(async () => {
        setLoadingEstados(true);
        const token = getStoredToken();

        if (!API_ENDPOINTS.ESTADOS_PROYECTO) {
            message.error("Endpoint de estados de proyecto no definido");
            setEstadosProyecto([]);
            setLoadingEstados(false);
            return;
        }

        try {
            const response = await getWithAuth(API_ENDPOINTS.ESTADOS_PROYECTO, token);
            // ✅ El backend retorna 'estados_proyecto'
            const estados = response?.estados_proyecto || [];

            // Filtrar solo estados activos (excluyendo cancelados)
            const estadosActivos = estados.filter(estado => estado.activo !== false);

            setEstadosProyecto(estadosActivos);

            console.log("📊 Estados activos recibidos:", estadosActivos);
        } catch (error) {
            console.error("Error al cargar estados:", error);
            message.error("Error al cargar los estados de proyecto");
            setEstadosProyecto([]);
        } finally {
            setLoadingEstados(false);
        }
    }, []);

    // Función para cargar los proyectos
    const fetchProyectos = useCallback(async () => {
        setLoading(true);
        const token = getStoredToken();

        if (!API_ENDPOINTS.PROYECTOS) {
            message.error("Endpoint de proyectos no definido");
            setProyectos([]);
            setLoading(false);
            return;
        }

        try {
            const response = await getWithAuth(API_ENDPOINTS.PROYECTOS, token);
            const proyectosRecibidos = response?.proyectos || [];

            // Detectar IDs duplicados
            const ids = proyectosRecibidos.map(p => p.proyecto_id);
            const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
            if (duplicados.length > 0) {
                console.warn("⚠️ IDs duplicados detectados:", duplicados);
            }

            setProyectos(proyectosRecibidos);
        } catch (error) {
            console.error(error);
            message.error("Error al cargar los proyectos");
            setProyectos([]);
        } finally {
            setLoading(false);
        }
    }, []);
    // Cargar proyectos y estados al montar o cuando cambie refreshFlag
    useEffect(() => {
        fetchProyectos();
    }, [refreshFlag, fetchProyectos]);

    // Cargar estados solo una vez al montar
    useEffect(() => {
        fetchEstadosProyecto();
    }, [fetchEstadosProyecto]);

    const crearProyecto = async (values) => {
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("nombre", values.nombre);
        formData.append("descripcion", values.descripcion || "");

        try {
            const res = await postFormDataAuth(API_ENDPOINTS.CREAR_PROYECTO, formData, token);
            message.success(res.mensaje || "Proyecto creado exitosamente");
            setRefreshFlag(prev => prev + 1);
            return { success: true, data: res };
        } catch (error) {
            message.error(error.message);
            return { success: false, error };
        }
    };

    const editarProyecto = async (proyectoId, values) => {
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("nombre", values.nombre);
        formData.append("descripcion", values.descripcion || "");

        try {
            const res = await postFormDataAuth(
                `${API_ENDPOINTS.EDITAR_PROYECTO}/${proyectoId}/`,
                formData,
                token
            );
            message.success(res.mensaje || "Proyecto actualizado exitosamente");
            setRefreshFlag(prev => prev + 1);
            return { success: true };
        } catch (error) {
            message.error(error.message);
            return { success: false, error };
        }
    };

    const cambiarEstadoProyecto = async (proyectoId, nombreEstado) => {
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("estado", nombreEstado);

        try {
            const res = await postFormDataAuth(
                `${API_ENDPOINTS.CAMBIAR_ESTADO_PROYECTO}/${proyectoId}/`,
                formData,
                token
            );
            message.success(res.mensaje || "Estado actualizado exitosamente");
            setRefreshFlag(prev => prev + 1);
            return {
                success: true,
                estadoAnterior: res.estado_anterior,
                estadoActual: res.estado_actual
            };
        } catch (error) {
            message.error(error.message);
            return { success: false, error };
        }
    };

    const eliminarProyecto = async (proyectoId) => {
        const token = getStoredToken();
        const formData = new FormData();

        try {
            const res = await postFormDataAuth(
                `${API_ENDPOINTS.ELIMINAR_PROYECTO}/${proyectoId}/`,
                formData,
                token
            );
            message.success(res.mensaje || "Proyecto eliminado exitosamente");
            setRefreshFlag(prev => prev + 1);
            return { success: true };
        } catch (error) {
            console.error("Error al eliminar proyecto:", error);
            message.error(error.message || "Error al eliminar el proyecto");
            return { success: false, error };
        }
    };

    const refresh = () => {
        setRefreshFlag(prev => prev + 1);
    };

    const refreshEstados = () => {
        fetchEstadosProyecto();
    };

    return {
        proyectos,
        estadosProyecto,
        loading,
        loadingEstados,
        crearProyecto,
        editarProyecto,
        cambiarEstadoProyecto,
        eliminarProyecto,
        refresh,
        refreshEstados
    };
};