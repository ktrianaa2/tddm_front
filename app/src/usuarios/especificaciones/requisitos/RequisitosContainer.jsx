import React, { useState } from 'react';
import { message } from 'antd';
import { getStoredToken, API_ENDPOINTS, getWithAuth } from '../../../../config';
import RequisitosForm from './RequisitosForm';

const RequisitosFormContainer = ({
    initialValues = {},
    onSubmit,
    onCancel,
    requisitosExistentes = [],
    proyectoId,
    loading = false,
    
    // Catálogos ya procesados desde RequisitosSection
    tiposRequisito = [],
    prioridades = [],
    estados = [],
    tiposRelacion = [],
    loadingCatalogos = false,
    errorCatalogos = null
}) => {
    // Estados de carga para operaciones específicas
    const [loadingRelaciones, setLoadingRelaciones] = useState(false);

    // Cargar relaciones existentes
    const cargarRelacionesExistentes = async (requisitoId) => {
        if (!requisitoId) {
            console.log('No hay requisitoId, saltando carga de relaciones');
            return [];
        }

        console.log('Cargando relaciones para requisito:', requisitoId);
        setLoadingRelaciones(true);

        try {
            const token = getStoredToken();
            if (!token) {
                console.warn('No hay token disponible');
                return [];
            }

            const endpoint = `${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}`;
            console.log('Llamando a:', endpoint);

            const response = await getWithAuth(endpoint, token);
            console.log('Respuesta completa relaciones:', response);

            if (!response) {
                console.log('No hay relaciones en la respuesta');
                return [];
            }

            let relacionesData = [];
            if (response.relaciones) {
                relacionesData = response.relaciones;
            } else if (response.data) {
                relacionesData = response.data;
            } else if (Array.isArray(response)) {
                relacionesData = response;
            } else {
                console.warn('Estructura de respuesta no reconocida:', response);
                relacionesData = [];
            }

            const relacionesProcesadas = relacionesData.map(rel => ({
                id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                requisito_id: rel.requisito_id || rel.requisito_relacionado_id,
                tipo_relacion: (rel.tipo_relacion_id || rel.tipo_relacion || '').toString(),
                descripcion: rel.descripcion || ''
            }));

            console.log('Relaciones procesadas:', relacionesProcesadas);
            return relacionesProcesadas;
        } catch (error) {
            console.error('Error detallado cargando relaciones existentes:', error);
            return [];
        } finally {
            setLoadingRelaciones(false);
        }
    };

    // Funciones de retry
    const retryFunctions = {
        cargarTodosCatalogos: () => {
            console.log('Retry no disponible en FormContainer - los catálogos se manejan en RequisitosSection');
        }
    };

    return (
        <RequisitosForm
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            requisitosExistentes={requisitosExistentes}
            proyectoId={proyectoId}
            loading={loading}

            // Datos de los catálogos ya procesados
            tiposRequisito={tiposRequisito}
            prioridades={prioridades}
            estados={estados}
            tiposRelacion={tiposRelacion}

            // Estados de carga
            loadingTipos={loadingCatalogos}
            loadingPrioridades={loadingCatalogos}
            loadingEstados={loadingCatalogos}
            loadingTiposRelacion={loadingCatalogos}
            loadingRelaciones={loadingRelaciones}

            // Estados de error
            errorTipos={errorCatalogos}
            errorPrioridades={errorCatalogos}
            errorEstados={errorCatalogos}
            errorTiposRelacion={errorCatalogos}

            // Funciones utilitarias
            cargarRelacionesExistentes={cargarRelacionesExistentes}
            retryFunctions={retryFunctions}
        />
    );
};

export default RequisitosFormContainer;