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
        console.log(`Procesando items para ${tipoColor}:`, items);

        if (!Array.isArray(items)) {
            console.warn(`Items no es array para ${tipoColor}:`, items);
            return [];
        }

        const itemsProcesados = items
            .filter(item => {
                // Buscar diferentes posibles campos de ID
                const id = item.id || item.tipo_id || item.prioridad_id || item.estado_id || item.relacion_id;
                const tieneId = id !== undefined && id !== null;
                const estaActivo = item.activo !== false; // Si no tiene campo activo, se considera activo
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
                    tipo: item.tipo || undefined, // Para estados_elemento
                    orden: item.orden || undefined, // Para estados_proyecto
                    ...item // Mantener propiedades originales, luego MANDAR ESTO A LAS CSS
                };

                console.log(`Item procesado:`, itemProcesado);
                return itemProcesado;
            });

        console.log(`Items finales procesados para ${tipoColor}:`, itemsProcesados);
        return itemsProcesados;
    };

    const procesarCatalogosExternos = (catalogosExternos) => {
        console.log('Procesando catálogos externos en FormContainer:', catalogosExternos);

        if (!catalogosExternos || typeof catalogosExternos !== 'object') {
            console.warn('catalogosExternos no válido:', catalogosExternos);
            return;
        }

        // Procesar tipos de requisito
        if (catalogosExternos.tipos_requisito && Array.isArray(catalogosExternos.tipos_requisito)) {
            const tiposProcesados = procesarItems(catalogosExternos.tipos_requisito, 'tipos');
            setTiposRequisito(tiposProcesados);
            console.log('Tipos de requisito procesados desde externos:', tiposProcesados);
        } else {
            console.warn('No se encontraron tipos_requisito válidos');
            setTiposRequisito([]);
        }

        // Procesar prioridades
        if (catalogosExternos.prioridades && Array.isArray(catalogosExternos.prioridades)) {
            const prioridadesProcesadas = procesarItems(catalogosExternos.prioridades, 'prioridades');
            setPrioridades(prioridadesProcesadas);
            console.log('Prioridades procesadas desde externos:', prioridadesProcesadas);
        } else {
            console.warn('No se encontraron prioridades válidas');
            setPrioridades([]);
        }

        // Procesar estados
        if (catalogosExternos.estados && Array.isArray(catalogosExternos.estados)) {
            const estadosProcesados = procesarItems(catalogosExternos.estados, 'estados');
            setEstados(estadosProcesados);
            console.log('Estados procesados desde externos:', estadosProcesados);
        } else {
            console.warn('No se encontraron estados válidos');
            setEstados([]);
        }

        // Procesar tipos de relación
        if (catalogosExternos.tipos_relacion && Array.isArray(catalogosExternos.tipos_relacion)) {
            const tiposRelacionProcesados = procesarItems(catalogosExternos.tipos_relacion, 'general');
            setTiposRelacion(tiposRelacionProcesados);
            console.log('Tipos de relación procesados desde externos:', tiposRelacionProcesados);
        } else {
            console.warn('No se encontraron tipos_relacion válidos');
            setTiposRelacion([]);
        }
    };

    useEffect(() => {
        console.log('useEffect principal - catalogosExternos recibidos:', catalogosExternos);

        if (catalogosExternos) {
            procesarCatalogosExternos(catalogosExternos);
        } else {
            // Si no hay catálogos externos, limpiar los estados
            console.warn('No se recibieron catálogos externos');
            setTiposRequisito([]);
            setPrioridades([]);
            setEstados([]);
            setTiposRelacion([]);
        }
    }, [catalogosExternos]);

    useEffect(() => {
        const estadoCatalogos = {
            tiposRequisito: tiposRequisito.length,
            prioridades: prioridades.length,
            estados: estados.length,
            tiposRelacion: tiposRelacion.length,
            requisitosExistentes: requisitosExistentes.length,
            tieneCatalogosExternos: !!catalogosExternos
        };

        console.log('Estado actual de los catálogos procesados:', estadoCatalogos);
    }, [tiposRequisito, prioridades, estados, tiposRelacion, requisitosExistentes, catalogosExternos]);

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

            const endpoint = `${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}/`;
            console.log('Llamando a:', endpoint);

            const response = await getWithAuth(endpoint, token);
            console.log('Respuesta completa relaciones:', response);

            if (!response) {
                console.log('No hay respuesta');
                return [];
            }

            let relacionesData = [];

            if (response.relaciones && Array.isArray(response.relaciones)) {
                relacionesData = response.relaciones;
                console.log('Relaciones encontradas en response.relaciones:', relacionesData);
            } else if (response.data && Array.isArray(response.data)) {
                relacionesData = response.data;
                console.log('Relaciones encontradas en response.data:', relacionesData);
            } else if (Array.isArray(response)) {
                relacionesData = response;
                console.log('Respuesta es array directo:', relacionesData);
            } else {
                console.warn('Estructura de respuesta no reconocida:', response);
                relacionesData = [];
            }

            const relacionesProcesadas = relacionesData.map(rel => {
                console.log('Procesando relación individual:', rel);

                return {
                    id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                    requisito_id: (rel.requisito_id || '').toString(),
                    tipo_relacion: (rel.tipo_relacion || '').toString(),
                    descripcion: rel.descripcion || ''
                };
            });

            console.log('Relaciones procesadas para el formulario:', relacionesProcesadas);
            return relacionesProcesadas;

        } catch (error) {
            console.error('Error detallado cargando relaciones existentes:', error);

            if (error.message.includes('CORS') ||
                error.message.includes('conexión') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('Access-Control-Allow-Origin')) {

                console.warn('Error de CORS/conexión al cargar relaciones. Continuando sin relaciones.', error.message);
                return [];
            }
            console.error('Error no relacionado con CORS:', error);
            return [];

        } finally {
            setLoadingRelaciones(false);
        }
    };

    // Función de reintento simplificada
    const retryFunctions = {
        cargarTodosCatalogos: () => {
            console.warn('Los catálogos deben ser proporcionados por el componente padre');
            message.warning('Los catálogos deben recargarse desde el componente principal');
        }
    };

    // VALIDACIÓN: Verificar que se hayan proporcionado los catálogos externos
    if (!catalogosExternos) {
        console.error('RequisitosFormContainer requiere catalogosExternos como prop');
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
            errorTipos={null} // Los errores se manejan en el componente padre
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