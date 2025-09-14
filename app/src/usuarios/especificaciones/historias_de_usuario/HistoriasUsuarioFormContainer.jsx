import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import HistoriasUsuarioForm from './HistoriasUsuarioForm';

const HistoriasUsuarioFormContainer = ({
    initialValues = {},
    onSubmit,
    onCancel,
    historiasExistentes = [],
    proyectoId,
    loading = false,
    catalogosExternos = null
}) => {
    // Estados para cada catálogo procesado desde los externos
    const [prioridades, setPrioridades] = useState([]);
    const [estados, setEstados] = useState([]);
    const [unidadesEstimacion, setUnidadesEstimacion] = useState([]);

    // Función helper para procesar items de catálogo
    const procesarItems = (items, tipoColor) => {
        if (!Array.isArray(items)) {
            return [];
        }

        const itemsProcesados = items
            .filter(item => {
                // Buscar diferentes posibles campos de ID
                const id = item.id || item.prioridad_id || item.estado_id || item.estimacion_id;
                const tieneId = id !== undefined && id !== null;
                const estaActivo = item.activo !== false; // Si no tiene campo activo, se considera activo
                return tieneId && estaActivo;
            })
            .map(item => {
                // Obtener el ID correcto según el tipo de catálogo
                let id;
                if (tipoColor === 'prioridades') {
                    id = item.prioridad_id || item.id;
                } else if (tipoColor === 'estados') {
                    id = item.estado_id || item.id;
                } else if (tipoColor === 'estimaciones') {
                    id = item.estimacion_id || item.id;
                } else {
                    id = item.id || item.prioridad_id || item.estado_id || item.estimacion_id;
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
                        'critica': '#ff4d4f',
                        'alta': '#fa8c16',
                        'media': '#fadb14',
                        'baja': '#52c41a',
                        'muy-baja': '#d9d9d9'
                    },
                    estados: {
                        'pendiente': '#d9d9d9',
                        'en-progreso': '#1890ff',
                        'en-desarrollo': '#1890ff',
                        'en-revision': '#fa8c16',
                        'completada': '#52c41a',
                        'completado': '#52c41a',
                        'cancelada': '#ff4d4f',
                        'cancelado': '#ff4d4f',
                        'bloqueada': '#ff4d4f'
                    },
                    estimaciones: {
                        'story-points': '#1890ff',
                        'horas': '#52c41a',
                        'dias': '#fa8c16',
                        'costo': '#722ed1'
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

        // Procesar estados
        if (catalogosExternos.estados && Array.isArray(catalogosExternos.estados)) {
            const estadosProcesados = procesarItems(catalogosExternos.estados, 'estados');
            setEstados(estadosProcesados);
        } else {
            setEstados([]);
        }

        // Procesar unidades de estimación
        if (catalogosExternos.unidades_estimacion && Array.isArray(catalogosExternos.unidades_estimacion)) {
            const unidadesProcesadas = procesarItems(catalogosExternos.unidades_estimacion, 'estimaciones');
            setUnidadesEstimacion(unidadesProcesadas);
        } else {
            setUnidadesEstimacion([]);
        }
    };

    useEffect(() => {
        if (catalogosExternos) {
            procesarCatalogosExternos(catalogosExternos);
        } else {
            // Si no hay catálogos externos, limpiar los estados
            setPrioridades([]);
            setEstados([]);
            setUnidadesEstimacion([]);
        }
    }, [catalogosExternos]);

    useEffect(() => {
        const estadoCatalogos = {
            prioridades: prioridades.length,
            estados: estados.length,
            unidadesEstimacion: unidadesEstimacion.length,
            historiasExistentes: historiasExistentes.length,
            tieneCatalogosExternos: !!catalogosExternos
        };
    }, [prioridades, estados, unidadesEstimacion, historiasExistentes, catalogosExternos]);

    // Función de reintento
    const retryFunctions = {
        cargarTodosCatalogos: () => {
            message.warning('Los catálogos deben recargarse desde el componente principal');
        }
    };

    // Verificar que se hayan proporcionado los catálogos externos
    if (!catalogosExternos) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#ff4d4f' }}>Error: No se han proporcionado los catálogos necesarios</p>
                <p style={{ color: '#666' }}>Los catálogos deben ser cargados por el componente padre</p>
            </div>
        );
    }

    return (
        <HistoriasUsuarioForm
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            historiasExistentes={historiasExistentes}
            proyectoId={proyectoId}
            loading={loading}

            // Datos de los catálogos (ya procesados)
            prioridades={prioridades}
            estados={estados}
            unidadesEstimacion={unidadesEstimacion}

            // Estados de carga 
            loadingPrioridades={false}
            loadingEstados={false}
            loadingUnidadesEstimacion={false}

            // Estados de error 
            errorPrioridades={null} // Los errores se manejan en el componente padre
            errorEstados={null}
            errorUnidadesEstimacion={null}

            // Funciones utilitarias
            retryFunctions={retryFunctions}
        />
    );
};

export default HistoriasUsuarioFormContainer;