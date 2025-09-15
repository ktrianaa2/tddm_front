import React, { useState, useEffect } from 'react';
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
    catalogosExternos = null
}) => {
    // Estados para cada catálogo procesado desde los externos
    const [tiposRequisito, setTiposRequisito] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [estados, setEstados] = useState([]);
    const [tiposRelacion, setTiposRelacion] = useState([]);
    const [loadingRelaciones, setLoadingRelaciones] = useState(false);

    // Función helper para procesar items de catálogo
    const procesarItems = (items, tipoColor) => {

        if (!Array.isArray(items)) {
            return [];
        }

        const itemsProcesados = items
            .filter(item => {
                // Buscar diferentes posibles campos de ID
                const id = item.id || item.tipo_id || item.prioridad_id || item.estado_id || item.relacion_id;
                const tieneId = id !== undefined && id !== null;
                const estaActivo = item.activo !== false;
                return tieneId && estaActivo;
            })
            .map(item => {
                // Obtener el ID correcto según el tipo de catálogo
                let id;
                if (tipoColor === 'tipos') {
                    id = item.tipo_id || item.id;
                } else if (tipoColor === 'prioridades') {
                    id = item.prioridad_id || item.id;
                } else if (tipoColor === 'estados') {
                    id = item.estado_id || item.id;
                } else {
                    id = item.id || item.tipo_id || item.prioridad_id || item.estado_id || item.relacion_id;
                }

                // Generar key normalizada a partir del nombre
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

                // Mapeo de colores por defecto
                const defaultColors = {
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
                };

                const itemProcesado = {
                    value: id.toString(),
                    label: item.nombre || 'Sin nombre',
                    key: key,
                    color: defaultColors[tipoColor]?.[key] || '#d9d9d9',
                    descripcion: item.descripcion || '',
                    nivel: item.nivel || undefined,
                    activo: item.activo !== false,
                    tipo: item.tipo || undefined,
                    orden: item.orden || undefined,
                    ...item // Mantener propiedades originales
                };
                return itemProcesado;
            });

        return itemsProcesados;
    };

    const procesarCatalogosExternos = (catalogosExternos) => {

        if (!catalogosExternos || typeof catalogosExternos !== 'object') {
            return;
        }

        // Procesar tipos de requisito - CORREGIR LA REFERENCIA
        if (catalogosExternos.tipos_requisito && Array.isArray(catalogosExternos.tipos_requisito)) {
            const tiposProcesados = procesarItems(catalogosExternos.tipos_requisito, 'tipos');
            setTiposRequisito(tiposProcesados);
        } else {
            setTiposRequisito([]);
        }

        // Procesar prioridades
        if (catalogosExternos.prioridades && Array.isArray(catalogosExternos.prioridades)) {
            const prioridadesProcesadas = procesarItems(catalogosExternos.prioridades, 'prioridades');
            setPrioridades(prioridadesProcesadas);
        } else {
            setPrioridades([]);
        }

        // Procesar estados
        if (catalogosExternos.estados && Array.isArray(catalogosExternos.estados)) {
            const estadosProcesados = procesarItems(catalogosExternos.estados, 'estados');
            setEstados(estadosProcesados);
        } else {
            setEstados([]);
        }

        // Procesar tipos de relación - CORREGIR LA REFERENCIA
        if (catalogosExternos.tipos_relacion_requisito && Array.isArray(catalogosExternos.tipos_relacion_requisito)) {
            const tiposRelacionProcesados = procesarItems(catalogosExternos.tipos_relacion_requisito, 'general');
            setTiposRelacion(tiposRelacionProcesados);
        } else {
            setTiposRelacion([]);
        }
    };

    useEffect(() => {
        if (catalogosExternos) {
            procesarCatalogosExternos(catalogosExternos);
        } else {
            // Si no hay catálogos externos, limpiar los estados
            setTiposRequisito([]);
            setPrioridades([]);
            setEstados([]);
            setTiposRelacion([]);
        }
    }, [catalogosExternos]);

    const cargarRelacionesExistentes = async (requisitoId) => {
        if (!requisitoId) {
            return [];
        }

        setLoadingRelaciones(true);

        try {
            const token = getStoredToken();
            if (!token) {
                return [];
            }

            const endpoint = `${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}/`;
            const response = await getWithAuth(endpoint, token);

            if (!response) {
                return [];
            }

            let relacionesData = [];

            if (response.relaciones && Array.isArray(response.relaciones)) {
                relacionesData = response.relaciones;
            } else if (response.data && Array.isArray(response.data)) {
                relacionesData = response.data;
            } else if (Array.isArray(response)) {
                relacionesData = response;
            } else {
                relacionesData = [];
            }

            const relacionesProcesadas = relacionesData.map(rel => {
                return {
                    id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                    requisito_id: (rel.requisito_id || '').toString(),
                    tipo_relacion: (rel.tipo_relacion || '').toString(),
                    descripcion: rel.descripcion || ''
                };
            });

            return relacionesProcesadas;

        } catch (error) {
            if (error.message.includes('CORS') ||
                error.message.includes('conexión') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('Access-Control-Allow-Origin')) {
                return [];
            }
            return [];

        } finally {
            setLoadingRelaciones(false);
        }
    };

    // Función de reintento simplificada
    const retryFunctions = {
        cargarTodosCatalogos: () => {
            message.warning('Los catálogos deben recargarse desde el componente principal');
        }
    };

    // VALIDACIÓN: Verificar que se hayan proporcionado los catálogos externos
    if (!catalogosExternos) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#ff4d4f' }}>Error: No se han proporcionado los catálogos necesarios</p>
                <p style={{ color: '#666' }}>Los catálogos deben ser cargados por el componente padre</p>
            </div>
        );
    }

    return (
        <RequisitosForm
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            requisitosExistentes={requisitosExistentes}
            proyectoId={proyectoId}
            loading={loading}

            // Datos de los catálogos (ya procesados)
            tiposRequisito={tiposRequisito}
            prioridades={prioridades}
            estados={estados}
            tiposRelacion={tiposRelacion}

            // Estados de carga 
            loadingTipos={false}
            loadingPrioridades={false}
            loadingEstados={false}
            loadingTiposRelacion={false}
            loadingRelaciones={loadingRelaciones}

            // Estados de error 
            errorTipos={null}
            errorPrioridades={null}
            errorEstados={null}
            errorTiposRelacion={null}

            // Funciones utilitarias
            cargarRelacionesExistentes={cargarRelacionesExistentes}
            retryFunctions={retryFunctions}
        />
    );
};

export default RequisitosFormContainer;