import React, { useState, useEffect } from 'react';
import { message, Spin, Alert } from 'antd';
import RequisitosSection from './RequisitosSection';
import { getStoredToken, API_ENDPOINTS, getWithAuth } from '../../../config';

const RequisitosContainer = ({ proyectoId, proyectoNombre }) => {
    const [catalogos, setCatalogos] = useState(null); // Iniciamos en null para distinguir entre "cargando" y "error"
    const [loadingCatalogos, setLoadingCatalogos] = useState(true);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    // Función para cargar catálogos desde la API
    const cargarCatalogos = async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación disponible');
            }

            console.log('Cargando catálogos desde:', API_ENDPOINTS.CATALOGOS_REQUISITOS);

            const response = await getWithAuth(API_ENDPOINTS.CATALOGOS_REQUISITOS, token);

            console.log('Respuesta de catálogos:', response);

            // Validar que la respuesta tenga la estructura esperada
            if (!response || typeof response !== 'object') {
                throw new Error('Respuesta de API inválida');
            }

            // Validar que todos los catálogos necesarios estén presentes
            const catalogosRequeridos = ['tipos_requisito', 'prioridades', 'estados', 'tipos_relacion'];
            const catalogosFaltantes = catalogosRequeridos.filter(catalogo =>
                !response[catalogo] || !Array.isArray(response[catalogo])
            );

            if (catalogosFaltantes.length > 0) {
                throw new Error(`Faltan catálogos: ${catalogosFaltantes.join(', ')}`);
            }

            // Procesar los catálogos para asegurar que tengan la estructura correcta
            const catalogosProcessed = {
                tipos_requisito: response.tipos_requisito.map(tipo => ({
                    id: tipo.id,
                    nombre: tipo.nombre,
                    key: tipo.key || tipo.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (match) => {
                        const acentos = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
                        return acentos[match];
                    }),
                    descripcion: tipo.descripcion || '',
                    activo: tipo.activo !== false
                })),

                prioridades: response.prioridades.map(prioridad => ({
                    id: prioridad.id,
                    nombre: prioridad.nombre,
                    key: prioridad.key || prioridad.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (match) => {
                        const acentos = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
                        return acentos[match];
                    }),
                    descripcion: prioridad.descripcion || '',
                    nivel: prioridad.nivel || 1,
                    activo: prioridad.activo !== false
                })),

                estados: response.estados.map(estado => ({
                    id: estado.id,
                    nombre: estado.nombre,
                    key: estado.key || estado.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (match) => {
                        const acentos = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
                        return acentos[match];
                    }),
                    descripcion: estado.descripcion || '',
                    tipo: estado.tipo || 'requisito',
                    activo: estado.activo !== false
                })),

                tipos_relacion: response.tipos_relacion.map(relacion => ({
                    id: relacion.id,
                    nombre: relacion.nombre,
                    key: relacion.key || relacion.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (match) => {
                        const acentos = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
                        return acentos[match];
                    }),
                    descripcion: relacion.descripcion || '',
                    activo: relacion.activo !== false
                }))
            };

            console.log('Catálogos procesados:', catalogosProcessed);
            setCatalogos(catalogosProcessed);

        } catch (error) {
            console.error('Error cargando catálogos:', error);
            setErrorCatalogos(error.message);
            message.error(`Error al cargar catálogos: ${error.message}`);
        } finally {
            setLoadingCatalogos(false);
        }
    };

    // Cargar catálogos al montar el componente
    useEffect(() => {
        cargarCatalogos();
    }, []);

    // Función para reintentar la carga
    const reintentarCarga = () => {
        cargarCatalogos();
    };

    // Mostrar loading mientras se cargan los catálogos
    if (loadingCatalogos) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Spin size="large" />
                <div style={{ marginTop: '1rem' }}>
                    Cargando catálogos del sistema...
                </div>
            </div>
        );
    }

    // Mostrar error si falló la carga
    if (errorCatalogos || !catalogos) {
        return (
            <div style={{ padding: '2rem' }}>
                <Alert
                    message="Error al cargar catálogos"
                    description={
                        <div>
                            <p>No se pudieron cargar los catálogos necesarios para el sistema de requisitos.</p>
                            <p><strong>Error:</strong> {errorCatalogos || 'Error desconocido'}</p>
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    onClick={reintentarCarga}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#1890ff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    }
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    // Validación final antes de renderizar
    const catalogosValidos = catalogos &&
        catalogos.tipos_requisito &&
        catalogos.prioridades &&
        catalogos.estados &&
        catalogos.tipos_relacion;

    if (!catalogosValidos) {
        return (
            <div style={{ padding: '2rem' }}>
                <Alert
                    message="Catálogos incompletos"
                    description="Los catálogos no se cargaron correctamente. Por favor, recarga la página."
                    type="warning"
                    showIcon
                    action={
                        <button
                            onClick={reintentarCarga}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#fa8c16',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Reintentar
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <RequisitosSection
            proyectoId={proyectoId}
            proyectoNombre={proyectoNombre}
            catalogos={catalogos}
        />
    );
};

export default RequisitosContainer;