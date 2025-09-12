import React, { useState, useEffect } from "react";
import { Card, Button, List, Typography, Tag, message, Spin, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import RequisitosForm from "./RequisitosForm";
import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from "../../../../config";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const RequisitosSection = ({ proyectoId, catalogos }) => {
    const [requisitos, setRequisitos] = useState([]);
    const [editing, setEditing] = useState(null); // null = lista, {} = creando, {id} = editando
    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

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

    // Cargar requisitos del proyecto
    const cargarRequisitos = async () => {
        if (!proyectoId) return;

        setLoading(true);
        try {
            const token = getStoredToken();
            const response = await getWithAuth(`${API_ENDPOINTS.LISTAR_REQUISITOS}/${proyectoId}/`, token);

            // Procesar los datos para que coincidan con el formato esperado por el formulario
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

    // Funciones helper para mapear entre keys y IDs
    const getTipoIdByKey = (key) => {
        const tipo = catalogos.tipos_requisito.find(t => t.key === key);
        return tipo ? tipo.id.toString() : undefined;
    };

    const getPrioridadIdByKey = (key) => {
        const prioridad = catalogos.prioridades.find(p => p.key === key);
        return prioridad ? prioridad.id.toString() : undefined;
    };

    const getEstadoIdByKey = (key) => {
        const estado = catalogos.estados.find(e => e.key === key);
        return estado ? estado.id.toString() : undefined;
    };

    // Cargar un requisito específico para edición
    const cargarRequisitoParaEdicion = async (requisitoId) => {
        try {
            const token = getStoredToken();
            const response = await getWithAuth(`${API_ENDPOINTS.OBTENER_REQUISITO}/${requisitoId}/`, token);

            // Preparar los valores para el formulario, convirtiendo keys a IDs
            const requisitoParaEditar = {
                ...response.requisito,
                // Convertir keys del backend a IDs para el formulario
                tipo: getTipoIdByKey(response.requisito.tipo),
                prioridad: getPrioridadIdByKey(response.requisito.prioridad),
                estado: getEstadoIdByKey(response.requisito.estado),
                // Convertir relaciones al formato esperado por el formulario
                relaciones_requisitos: (response.requisito.relaciones_requisitos || []).map(rel => ({
                    id: rel.id || Date.now() + Math.random(), // ID temporal para el formulario
                    requisito_id: rel.requisito_id,
                    tipo_relacion: rel.tipo_relacion,
                    descripcion: rel.descripcion || ''
                }))
            };

            console.log('Requisito cargado para edición:', requisitoParaEditar); // Debug
            setEditing(requisitoParaEditar);
        } catch (error) {
            message.error(`Error al cargar requisito: ${error.message}`);
        }
    };

    // Efecto para cargar requisitos cuando cambia el proyectoId
    useEffect(() => {
        if (proyectoId) {
            cargarRequisitos();
        }
    }, [proyectoId]);

    // Manejar guardado de requisito (crear/editar)
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
                tipo_id: parseInt(values.tipo), // El backend espera tipo_id
                criterios: values.criterios,
                prioridad_id: values.prioridad ? parseInt(values.prioridad) : null, // El backend espera prioridad_id
                estado_id: parseInt(values.estado), // El backend espera estado_id
                origen: values.origen || '',
                condiciones_previas: values.condiciones_previas || '',
                proyecto_id: proyectoId,
                relaciones_requisitos: (values.relaciones_requisitos || []).map(rel => ({
                    requisito_id: parseInt(rel.requisito_id),
                    tipo_relacion_id: parseInt(rel.tipo_relacion),
                    descripcion: rel.descripcion || ''
                }))
            };

            console.log('Datos a enviar:', dataToSend); // Debug

            if (editing?.id) {
                // Editar requisito existente
                const response = await putJSONAuth(
                    `${API_ENDPOINTS.ACTUALIZAR_REQUISITO}/${editing.id}/`,
                    dataToSend,
                    token
                );
                message.success(response.mensaje || 'Requisito actualizado exitosamente');
            } else {
                // Crear nuevo requisito
                const response = await postJSONAuth(API_ENDPOINTS.CREAR_REQUISITO, dataToSend, token);
                message.success(response.mensaje || 'Requisito creado exitosamente');
            }

            // Recargar la lista de requisitos
            await cargarRequisitos();
            setEditing(null);
        } catch (error) {
            console.error('Error al guardar:', error); // Debug
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

                    // Recargar la lista de requisitos
                    await cargarRequisitos();
                } catch (error) {
                    message.error(`Error al eliminar requisito: ${error.message}`);
                }
            },
        });
    };

    // Manejar edición de requisito
    const handleEditar = async (requisito) => {
        // Cargar el requisito completo con sus relaciones
        await cargarRequisitoParaEdicion(requisito.id);
    };

    // Obtener el color correspondiente a un tipo
    const getColorTipo = (tipo) => {
        return tipoColors[tipo] || '#d9d9d9';
    };

    // Obtener el color correspondiente a una prioridad
    const getColorPrioridad = (prioridad) => {
        return prioridadColors[prioridad] || '#d9d9d9';
    };

    // Obtener el color correspondiente a un estado
    const getColorEstado = (estado) => {
        return estadoColors[estado] || '#d9d9d9';
    };

    // Obtener etiqueta formateada para mostrar
    const getEtiquetaFormateada = (valor) => {
        if (!valor) return '';
        return valor.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
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

    return (
        <div>
            {editing ? (
                <RequisitosForm
                    initialValues={editing?.id ? editing : {}}
                    onSubmit={handleGuardar}
                    onCancel={() => setEditing(null)}
                    requisitosExistentes={requisitos}
                    catalogos={catalogos}
                    loading={loadingSubmit}
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
                                onClick={cargarRequisitos}
                                loading={loading}
                                className="btn btn-secondary"
                            >
                                Actualizar
                            </Button>

                            <Button
                                className="btn btn-primary"
                                icon={<PlusOutlined />}
                                onClick={() => setEditing({})}
                                disabled={loading}
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
                            {/* Lista */}
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
                                                    >
                                                        Editar
                                                    </Button>,
                                                    <Button
                                                        className="btn btn-danger btn-card"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleEliminar(req)}
                                                        size="small"
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