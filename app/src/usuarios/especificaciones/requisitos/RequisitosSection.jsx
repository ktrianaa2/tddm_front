import React, { useState, useEffect } from "react";
import { Card, Button, List, Typography, Tag, message, Spin, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import RequisitosFormContainer from "./RequisitosFormContainer";
import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from "../../../../config";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const RequisitosSection = ({ proyectoId }) => {
    const [requisitos, setRequisitos] = useState([]);
    const [editing, setEditing] = useState(null); // null = lista, {} = creando, {datos} = editando
    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    // NUEVOS ESTADOS PARA CATÁLOGOS
    const [catalogos, setCatalogos] = useState(null);
    const [loadingCatalogos, setLoadingCatalogos] = useState(false);
    const [errorCatalogos, setErrorCatalogos] = useState(null);

    // Mapeo de colores para tipos de requisito
    const tipoColors = {
        'funcional': '#1890ff',
        'no-funcional': '#52c41a',
        'negocio': '#fa8c16',
        'tecnico': '#722ed1',
        'sistema': '#13c2c2',
        'interfaz': '#eb2f96'
    };

    // Mapeo de colores para prioridades
    const prioridadColors = {
        'critica': '#ff4d4f',
        'alta': '#fa8c16',
        'media': '#fadb14',
        'baja': '#52c41a'
    };

    // Mapeo de colores para estados
    const estadoColors = {
        'pendiente': '#d9d9d9',
        'en-desarrollo': '#1890ff',
        'en-revision': '#fa8c16',
        'completado': '#52c41a',
        'cancelado': '#ff4d4f'
    };

    const cargarCatalogos = async () => {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }
            const [tiposResponse, prioridadesResponse, estadosResponse, tiposRelacionResponse] = await Promise.allSettled([
                getWithAuth(API_ENDPOINTS.TIPOS_REQUISITO, token),
                getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
                getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
                getWithAuth(API_ENDPOINTS.TIPOS_RELACION_REQUISITO, token)
            ]);

            const catalogosData = {
                tipos_requisito: [],
                prioridades: [],
                estados: [],
                tipos_relacion: []
            };

            // Procesar tipos de requisito
            if (tiposResponse.status === 'fulfilled' && tiposResponse.value) {
                const tiposData = tiposResponse.value.tipos_requisito || tiposResponse.value.data || tiposResponse.value;
                if (Array.isArray(tiposData)) {
                    catalogosData.tipos_requisito = tiposData.map(tipo => ({
                        id: tipo.id || tipo.tipo_id,
                        nombre: tipo.nombre,
                        key: tipo.key || tipo.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tipo.descripcion || '',
                        activo: tipo.activo !== false
                    }));
                }
            }

            // Procesar prioridades
            if (prioridadesResponse.status === 'fulfilled' && prioridadesResponse.value) {
                const prioridadesData = prioridadesResponse.value.prioridades || prioridadesResponse.value.data || prioridadesResponse.value;
                if (Array.isArray(prioridadesData)) {
                    catalogosData.prioridades = prioridadesData.map(prioridad => ({
                        id: prioridad.id || prioridad.prioridad_id,
                        nombre: prioridad.nombre,
                        key: prioridad.key || prioridad.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: prioridad.descripcion || '',
                        nivel: prioridad.nivel,
                        activo: prioridad.activo !== false
                    }));
                }
            }

            // Procesar estados (filtrar solo para requisitos)
            if (estadosResponse.status === 'fulfilled' && estadosResponse.value) {
                const estadosData = estadosResponse.value.estados_elemento || estadosResponse.value.estados || estadosResponse.value.data || estadosResponse.value;
                if (Array.isArray(estadosData)) {
                    const estadosRequisitos = estadosData.filter(estado =>
                        estado.tipo === 'requisito' || !estado.tipo
                    );
                    catalogosData.estados = estadosRequisitos.map(estado => ({
                        id: estado.id || estado.estado_id,
                        nombre: estado.nombre,
                        key: estado.key || estado.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: estado.descripcion || '',
                        tipo: estado.tipo,
                        activo: estado.activo !== false
                    }));
                }
            }

            // Procesar tipos de relación
            if (tiposRelacionResponse.status === 'fulfilled' && tiposRelacionResponse.value) {
                const tiposRelacionData = tiposRelacionResponse.value.tipos_relacion_requisito || tiposRelacionResponse.value.tipos_relacion || tiposRelacionResponse.value.data || tiposRelacionResponse.value;
                if (Array.isArray(tiposRelacionData)) {
                    catalogosData.tipos_relacion = tiposRelacionData.map(tipoRelacion => ({
                        id: tipoRelacion.id || tipoRelacion.relacion_id,
                        nombre: tipoRelacion.nombre,
                        key: tipoRelacion.key || tipoRelacion.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
                        descripcion: tipoRelacion.descripcion || '',
                        activo: tipoRelacion.activo !== false
                    }));
                }
            }

            setCatalogos(catalogosData);

        } catch (error) {
            setErrorCatalogos(error.message);
            message.error(`Error al cargar catálogos: ${error.message}`);
        } finally {
            setLoadingCatalogos(false);
        }
    };

    // Cargar requisitos del proyecto
    const cargarRequisitos = async () => {
        if (!proyectoId) return;

        setLoading(true);
        try {
            const token = getStoredToken();
            const response = await getWithAuth(`${API_ENDPOINTS.LISTAR_REQUISITOS}/${proyectoId}/`, token);

            // Procesar los datos para que coincidan con el formato esperado
            const requisitosProcessed = response.requisitos.map(req => ({
                id: req.id,
                nombre: req.nombre,
                descripcion: req.descripcion,
                tipo: req.tipo,
                criterios: req.criterios,
                prioridad: req.prioridad,
                estado: req.estado,
                origen: req.origen,
                condiciones_previas: req.condiciones_previas,
                proyecto_id: req.proyecto_id,
                fecha_creacion: req.fecha_creacion
            }));

            setRequisitos(requisitosProcessed);
        } catch (error) {
            message.error(`Error al cargar requisitos: ${error.message}`);
            setRequisitos([]);
        } finally {
            setLoading(false);
        }
    };

    const cargarRequisitoParaEdicion = async (requisitoId) => {
        setLoadingSubmit(true);

        try {
            const token = getStoredToken();
            const response = await getWithAuth(`${API_ENDPOINTS.OBTENER_REQUISITO}/${requisitoId}/`, token);
            if (!response || !response.requisito) {
                throw new Error('No se pudo obtener la información del requisito');
            }

            const requisitoBackend = response.requisito;

            // Función helper para mapear keys a IDs
            const mapearKeyAId = (key, catalogo, tipo) => {
                if (!key || !catalogo) return undefined;

                const item = catalogo.find(item =>
                    item.key === key ||
                    item.nombre?.toLowerCase() === key.toLowerCase() ||
                    item.id?.toString() === key.toString()
                );
                return item ? item.id.toString() : undefined;
            };

            // Preparar los valores para el formulario
            const requisitoParaEditar = {
                id: requisitoBackend.id,
                nombre: requisitoBackend.nombre || '',
                descripcion: requisitoBackend.descripcion || '',
                criterios: requisitoBackend.criterios || '',
                origen: requisitoBackend.origen || '',
                condiciones_previas: requisitoBackend.condiciones_previas || '',
                proyecto_id: requisitoBackend.proyecto_id,

                // Mapear usando los catálogos disponibles
                tipo: mapearKeyAId(requisitoBackend.tipo, catalogos.tipos_requisito, 'tipo'),
                prioridad: mapearKeyAId(requisitoBackend.prioridad, catalogos.prioridades, 'prioridad'),
                estado: mapearKeyAId(requisitoBackend.estado, catalogos.estados, 'estado'),

                relaciones_requisitos: []
            };

            let relacionesData = [];

            // 1. Primero buscar en la respuesta del requisito
            if (requisitoBackend.relaciones_requisitos && Array.isArray(requisitoBackend.relaciones_requisitos)) {
                relacionesData = requisitoBackend.relaciones_requisitos;
            }
            // 2. Si no están en la respuesta del requisito, intentar cargarlas por separado
            else {
                try {
                    const relacionesResponse = await getWithAuth(`${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}/`, token);

                    if (relacionesResponse && relacionesResponse.relaciones) {
                        relacionesData = relacionesResponse.relaciones;
                    } else if (Array.isArray(relacionesResponse)) {
                        relacionesData = relacionesResponse;
                    }
                } catch (relacionesError) {
                    relacionesData = [];
                }
            }

            // Procesar relaciones si existen
            if (Array.isArray(relacionesData) && relacionesData.length > 0) {
                requisitoParaEditar.relaciones_requisitos = relacionesData.map(rel => {

                    return {
                        id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                        requisito_id: (rel.requisito_id || rel.requisito_relacionado_id || '').toString(),
                        tipo_relacion: (rel.tipo_relacion_id || rel.tipo_relacion || '').toString(),
                        descripcion: rel.descripcion || ''
                    };
                });

            }

            setEditing(requisitoParaEditar);

        } catch (error) {
            message.error(`Error al cargar requisito: ${error.message}`);
        } finally {
            setLoadingSubmit(false);
        }
    };

    useEffect(() => {
        if (proyectoId) {
            if (!catalogos) {
                cargarCatalogos();
            }
            cargarRequisitos();
        }
    }, [proyectoId]);

    const handleGuardar = async (values) => {
        if (!proyectoId) {
            message.error('No se ha especificado el ID del proyecto');
            return;
        }

        setLoadingSubmit(true);
        try {
            const token = getStoredToken();

            // Mapear los valores del formulario a los nombres esperados por el backend
            const dataToSend = {
                nombre: values.nombre,
                descripcion: values.descripcion,
                tipo_id: values.tipo ? parseInt(values.tipo) : null,
                criterios: values.criterios,
                prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
                estado_id: values.estado ? parseInt(values.estado) : null,
                origen: values.origen || '',
                condiciones_previas: values.condiciones_previas || '',
                proyecto_id: proyectoId,
                relaciones_requisitos: (values.relaciones_requisitos || [])
                    .filter(rel => rel.requisito_id && rel.tipo_relacion) // Solo enviar relaciones completas
                    .map(rel => ({
                        requisito_id: parseInt(rel.requisito_id),
                        tipo_relacion_id: parseInt(rel.tipo_relacion),
                        descripcion: rel.descripcion || ''
                    }))
            };


            let response;

            if (editing && editing.id) {
                response = await putJSONAuth(
                    `${API_ENDPOINTS.ACTUALIZAR_REQUISITO}/${editing.id}/`,
                    dataToSend,
                    token
                );
                message.success(response.mensaje || 'Requisito actualizado exitosamente');
            } else {
                // Crear nuevo requisito
                response = await postJSONAuth(API_ENDPOINTS.CREAR_REQUISITO, dataToSend, token);
                message.success(response.mensaje || 'Requisito creado exitosamente');
            }


            await cargarRequisitos();
            setEditing(null);

        } catch (error) {
            message.error(`Error al guardar requisito: ${error.message}`);
        } finally {
            setLoadingSubmit(false);
        }
    };

    // Manejar eliminación de requisito
    const handleEliminar = (requisito) => {
        confirm({
            title: 'Confirmar Eliminación',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>¿Estás seguro de que deseas eliminar el requisito:</p>
                    <p><strong>"{requisito.nombre}"</strong></p>
                    <p style={{ color: '#ff4d4f', fontSize: '0.9em', marginTop: '0.5rem' }}>
                        Esta acción no se puede deshacer y eliminará todas las relaciones asociadas.
                    </p>
                </div>
            ),
            okText: 'Eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            async onOk() {
                try {
                    const token = getStoredToken();
                    const response = await deleteWithAuth(
                        `${API_ENDPOINTS.ELIMINAR_REQUISITO}/${requisito.id}/`,
                        token
                    );
                    message.success(response.mensaje || 'Requisito eliminado exitosamente');
                    await cargarRequisitos();
                } catch (error) {
                    message.error(`Error al eliminar requisito: ${error.message}`);
                }
            },
        });
    };

    const handleEditar = async (requisito) => {
        // Verificar que los catálogos estén disponibles
        const catalogosDisponibles = catalogos &&
            Array.isArray(catalogos.tipos_requisito) && catalogos.tipos_requisito.length > 0 &&
            Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
            Array.isArray(catalogos.estados) && catalogos.estados.length > 0;

        if (!catalogosDisponibles) {
            message.error('Los catálogos necesarios no están disponibles. Reintentando carga...');

            await cargarCatalogos();
            return;
        }

        await cargarRequisitoParaEdicion(requisito.id);
    };

    // Funciones helper para obtener colores (sin cambios)
    const getColorTipo = (tipo) => {
        return tipoColors[tipo] || '#d9d9d9';
    };

    const getColorPrioridad = (prioridad) => {
        return prioridadColors[prioridad] || '#d9d9d9';
    };

    const getColorEstado = (estado) => {
        return estadoColors[estado] || '#d9d9d9';
    };

    const getEtiquetaFormateada = (valor) => {
        if (!valor) return '';
        return valor.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Manejar cancelación
    const handleCancelar = () => {
        setEditing(null);
    };

    // Recargar tanto catálogos como requisitos
    const handleRecargarTodo = async () => {
        await Promise.all([
            cargarCatalogos(),
            cargarRequisitos()
        ]);
    };

    if (!proyectoId) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <FileTextOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                <Title level={4} type="secondary">Selecciona un proyecto</Title>
                <Text type="secondary">Debes seleccionar un proyecto para gestionar sus requisitos</Text>
            </Card>
        );
    }

    // MOSTRAR LOADING SI ESTÁN CARGANDO LOS CATÁLOGOS CRÍTICOS
    if (loadingCatalogos && !catalogos) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <Spin size="large" />
                <div style={{ marginTop: "1rem" }}>
                    <Text type="secondary">Cargando catálogos necesarios...</Text>
                </div>
            </Card>
        );
    }

    // MOSTRAR ERROR SI NO SE PUDIERON CARGAR LOS CATÁLOGOS
    if (errorCatalogos && !catalogos) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <ExclamationCircleOutlined style={{ fontSize: "3rem", color: "#ff4d4f", marginBottom: "1rem" }} />
                <Title level={4} type="danger">Error al cargar catálogos</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '1rem' }}>{errorCatalogos}</Text>
                <Button
                    type="primary"
                    onClick={cargarCatalogos}
                    loading={loadingCatalogos}
                >
                    Reintentar
                </Button>
            </Card>
        );
    }

    return (
        <div>
            {editing !== null ? (
                <RequisitosFormContainer
                    initialValues={editing?.id ? editing : {}}
                    onSubmit={handleGuardar}
                    onCancel={handleCancelar}
                    requisitosExistentes={requisitos}
                    proyectoId={proyectoId}
                    loading={loadingSubmit}
                    catalogosExternos={catalogos}
                />
            ) : (
                <>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>
                                <FileTextOutlined style={{ marginRight: "0.5rem", color: "#1890ff" }} />
                                Gestión de Requisitos
                            </Title>
                            <Text type="secondary">
                                {requisitos.length} requisito{requisitos.length !== 1 ? "s" : ""}
                            </Text>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRecargarTodo}
                                loading={loading || loadingCatalogos}
                                className="btn btn-secondary"
                            >
                                Actualizar
                            </Button>

                            <Button
                                className="btn btn-primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    // VALIDACIÓN: Verificar que los catálogos estén disponibles antes de crear
                                    if (!catalogos || !catalogos.tipos_requisito || catalogos.tipos_requisito.length === 0) {
                                        message.error('Los catálogos necesarios no están disponibles. Por favor, actualiza la página.');
                                        return;
                                    }
                                    setEditing({}); // Objeto vacío para crear nuevo
                                }}
                                disabled={loading || loadingCatalogos || !catalogos}
                            >
                                Agregar Requisito
                            </Button>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                            <Spin size="large" />
                            <div style={{ marginTop: "1rem" }}>
                                <Text type="secondary">Cargando requisitos...</Text>
                            </div>
                        </Card>
                    ) : (
                        <>
                            {/* Lista de requisitos */}
                            {requisitos.length === 0 ? (
                                <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                                    <FileTextOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                                    <Title level={4} type="secondary">No hay requisitos definidos</Title>
                                    <Text type="secondary">Comienza agregando el primer requisito de este proyecto</Text>
                                </Card>
                            ) : (
                                <Card>
                                    <List
                                        dataSource={requisitos}
                                        renderItem={(req) => (
                                            <List.Item
                                                key={req.id}
                                                actions={[
                                                    <Button
                                                        className="btn btn-info btn-card"
                                                        icon={<EditOutlined />}
                                                        onClick={() => handleEditar(req)}
                                                        size="small"
                                                        loading={loadingSubmit}
                                                        disabled={!catalogos} // DESHABILITADO si no hay catálogos
                                                    >
                                                        Editar
                                                    </Button>,
                                                    <Button
                                                        className="btn btn-danger btn-card"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleEliminar(req)}
                                                        size="small"
                                                        disabled={loadingSubmit}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                            <Text strong>{req.nombre}</Text>
                                                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                                                {req.tipo && (
                                                                    <Tag
                                                                        color={getColorTipo(req.tipo)}
                                                                        style={{ fontSize: "10px", margin: 0 }}
                                                                    >
                                                                        {getEtiquetaFormateada(req.tipo)}
                                                                    </Tag>
                                                                )}
                                                                {req.prioridad && (
                                                                    <Tag
                                                                        color={getColorPrioridad(req.prioridad)}
                                                                        style={{ fontSize: "10px", margin: 0 }}
                                                                    >
                                                                        {getEtiquetaFormateada(req.prioridad)}
                                                                    </Tag>
                                                                )}
                                                                {req.estado && (
                                                                    <Tag
                                                                        color={getColorEstado(req.estado)}
                                                                        style={{ fontSize: "10px", margin: 0 }}
                                                                    >
                                                                        {getEtiquetaFormateada(req.estado)}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        </div>
                                                    }
                                                    description={
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: '0.9em' }}>
                                                                {req.descripcion}
                                                            </Text>
                                                            {req.criterios && (
                                                                <div style={{ marginTop: "0.5rem" }}>
                                                                    <Text style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                                                        <strong>Criterios:</strong> {req.criterios.length > 100 ? `${req.criterios.substring(0, 100)}...` : req.criterios}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                            {req.origen && (
                                                                <div style={{ marginTop: "0.25rem" }}>
                                                                    <Text style={{ fontSize: "11px", color: "var(--text-disabled)" }}>
                                                                        Origen: {req.origen}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                            {req.fecha_creacion && (
                                                                <div style={{ marginTop: "0.25rem" }}>
                                                                    <Text style={{ fontSize: "11px", color: "var(--text-disabled)" }}>
                                                                        Creado: {new Date(req.fecha_creacion).toLocaleDateString('es-ES', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default RequisitosSection;