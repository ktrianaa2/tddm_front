import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { getStoredToken, API_ENDPOINTS, getWithAuth } from '../../../../config';
import CasosUsoForm from './CasosUsoForm';

const CasosUsoFormContainer = ({
    initialValues = {},
    onSubmit,
    onCancel,
    casosUsoExistentes = [],
    proyectoId,
    loading = false,
    catalogosExternos = null
}) => {
    // Estados para cada catálogo procesado desde los externos
    const [prioridades, setPrioridades] = useState([]);
    const [tiposRelacion, setTiposRelacion] = useState([]);
    const [loadingRelaciones, setLoadingRelaciones] = useState(false);
    const [estados, setEstados] = useState([]);


    // Función helper para procesar items de catálogo
    const procesarItems = (items, tipoColor) => {
        if (!Array.isArray(items)) {
            return [];
        }

        const itemsProcesados = items
            .filter(item => {
                // Buscar diferentes posibles campos de ID
                const id = item.id || item.prioridad_id || item.estado_id || item.relacion_id;
                const tieneId = id !== undefined && id !== null;
                const estaActivo = item.activo !== false;
                return tieneId && estaActivo;
            })
            .map(item => {
                // Obtener el ID correcto según el tipo de catálogo
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

        // Procesar prioridades
        if (catalogosExternos.prioridades && Array.isArray(catalogosExternos.prioridades)) {
            const prioridadesProcesadas = procesarItems(catalogosExternos.prioridades, 'prioridades');
            setPrioridades(prioridadesProcesadas);
        } else {
            setPrioridades([]);
        }

        // Procesar tipos de relación para casos de uso
        if (catalogosExternos.tipos_relacion_cu && Array.isArray(catalogosExternos.tipos_relacion_cu)) {
            const tiposRelacionProcesados = procesarItems(catalogosExternos.tipos_relacion_cu, 'tipos-relacion');
            setTiposRelacion(tiposRelacionProcesados);
        } else {
            setTiposRelacion([]);
        }

        // Procesar estados
        if (catalogosExternos.estados && Array.isArray(catalogosExternos.estados)) {
            const estadosProcesados = procesarItems(catalogosExternos.estados, 'estados');
            setEstados(estadosProcesados);
        } else {
            setEstados([]);
        }
    };

    useEffect(() => {
        if (catalogosExternos) {
            procesarCatalogosExternos(catalogosExternos);
        } else {
            // Si no hay catálogos externos, limpiar los estados
            setPrioridades([]);
            setTiposRelacion([]);
            setEstados([]);
        }
    }, [catalogosExternos]);

    useEffect(() => {
        const estadoCatalogos = {
            prioridades: prioridades.length,
            tiposRelacion: tiposRelacion.length,
            casosUsoExistentes: casosUsoExistentes.length,
            tieneCatalogosExternos: !!catalogosExternos,
            estados: estados.length
        };

    }, [prioridades, tiposRelacion, casosUsoExistentes, catalogosExternos, estados]);

    // Cargar relaciones existentes para un caso de uso
    const cargarRelacionesExistentes = async (casoUsoId) => {
        if (!casoUsoId) {
            return [];
        }

        setLoadingRelaciones(true);

        try {
            const token = getStoredToken();
            if (!token) {
                return [];
            }

            const endpoint = `${API_ENDPOINTS.RELACIONES_CASO_USO}/${casoUsoId}/`;
            const response = await getWithAuth(endpoint, token);
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
                    casoUsoRelacionado: (rel.casoUsoRelacionado || rel.caso_uso_destino_id || rel.caso_uso_relacionado_id || '').toString(),
                    tipo: (rel.tipo || rel.tipo_relacion_id || rel.tipo_relacion || '').toString(),
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
        <CasosUsoForm
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            casosUsoExistentes={casosUsoExistentes}
            proyectoId={proyectoId}
            loading={loading}

            // Datos de los catálogos (ya procesados)
            prioridades={prioridades}
            tiposRelacion={tiposRelacion}
            estados={estados}

            // Estados de carga 
            loadingPrioridades={false}
            loadingTiposRelacion={false}
            loadingRelaciones={loadingRelaciones}

            // Estados de error 
            errorPrioridades={null} // Los errores se manejan en el componente padre
            errorTiposRelacion={null}

            // Funciones utilitarias
            cargarRelacionesExistentes={cargarRelacionesExistentes}
            retryFunctions={retryFunctions}
        />
    );
};

export default CasosUsoFormContainer;