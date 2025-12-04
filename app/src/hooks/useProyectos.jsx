import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { getStoredToken, API_ENDPOINTS, getWithAuth, postFormDataAuth } from '../../config';

export const useProyectos = () => {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0);

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
            setProyectos(response?.proyectos || []);
        } catch (error) {
            console.error(error);
            message.error("Error al cargar los proyectos");
            setProyectos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProyectos();
    }, [refreshFlag, fetchProyectos]);

    const crearProyecto = async (values) => {
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("nombre", values.nombre);
        formData.append("descripcion", values.descripcion || "");
        // Ya no se envía el estado, se asigna por defecto en el backend

        try {
            const res = await postFormDataAuth(API_ENDPOINTS.CREAR_PROYECTO, formData, token);
            message.success(res.mensaje || "Proyecto creado exitosamente");
            setRefreshFlag(prev => prev + 1);
            return { success: true };
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
        // Ya no se envía el estado en la edición

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

    const cambiarEstadoProyecto = async (proyectoId, nuevoEstado) => {
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("estado", nuevoEstado);

        try {
            const res = await postFormDataAuth(
                `${API_ENDPOINTS.CAMBIAR_ESTADO_PROYECTO}/${proyectoId}/`,
                formData,
                token
            );
            message.success(res.mensaje || "Estado actualizado exitosamente");
            setRefreshFlag(prev => prev + 1);
            return { success: true, estado: res.estado };
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
                `${API_ENDPOINTS.ELIMINAR_PROYECTO}/${proyectoId}`,
                formData,
                token
            );
            message.success(res.mensaje || "Proyecto eliminado");
            setRefreshFlag(prev => prev + 1);
            return { success: true };
        } catch (error) {
            message.error(error.message);
            return { success: false, error };
        }
    };

    const refresh = () => {
        setRefreshFlag(prev => prev + 1);
    };

    return {
        proyectos,
        loading,
        crearProyecto,
        editarProyecto,
        cambiarEstadoProyecto,
        eliminarProyecto,
        refresh
    };
};