import React, { useState } from "react";
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from "antd";
import { PlusOutlined, FileTextOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import RequisitosFormContainer from "./RequisitosFormContainer";
import RequisitoItem from "./RequisitoItem";
import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from "../../../../config";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const RequisitosSection = ({
    proyectoId,
    requisitos,
    catalogos,
    loading,
    loadingCatalogos,
    onActualizar
}) => {
    const [editing, setEditing] = useState(null); // null = lista, {} = creando, {datos} = editando
    const [loadingSubmit, setLoadingSubmit] = useState(false);

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

            // Procesar relaciones
            if (requisitoBackend.relaciones_requisitos && Array.isArray(requisitoBackend.relaciones_requisitos)) {
                relacionesData = requisitoBackend.relaciones_requisitos;
            } else {
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
                    .filter(rel => rel.requisito_id && rel.tipo_relacion)
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
                response = await postJSONAuth(API_ENDPOINTS.CREAR_REQUISITO, dataToSend, token);
                message.success(response.mensaje || 'Requisito creado exitosamente');
            }

            // Llamar al callback para actualizar los datos en el componente padre
            onActualizar();
            setEditing(null);

        } catch (error) {
            message.error(`Error al guardar requisito: ${error.message}`);
        } finally {
            setLoadingSubmit(false);
        }
    };

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
                    onActualizar();
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
            return;
        }

        await cargarRequisitoParaEdicion(requisito.id);
    };

    const handleCancelar = () => {
        setEditing(null);
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
    if (!catalogos) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <ExclamationCircleOutlined style={{ fontSize: "3rem", color: "#ff4d4f", marginBottom: "1rem" }} />
                <Title level={4} type="danger">Error al cargar catálogos</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '1rem' }}>
                    Los catálogos necesarios no están disponibles
                </Text>
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

                        <Button
                            className="btn btn-primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                // Verificar que los catálogos estén disponibles antes de crear
                                if (!catalogos || !catalogos.tipos_requisito || catalogos.tipos_requisito.length === 0) {
                                    message.error('Los catálogos necesarios no están disponibles. Por favor, actualiza la página.');
                                    return;
                                }
                                setEditing({});
                            }}
                            disabled={loading || loadingCatalogos || !catalogos}
                        >
                            Agregar Requisito
                        </Button>
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
                                <Row gutter={[16, 16]}>
                                    {requisitos.map((requisito) => (
                                        <Col key={requisito.id} xs={24} sm={24} md={12} lg={8} xl={8} xxl={6}>
                                            <RequisitoItem
                                                key={requisito.id}
                                                requisito={requisito}
                                                onEditar={handleEditar}
                                                onEliminar={handleEliminar}
                                                loading={loadingSubmit}
                                                catalogosDisponibles={!!catalogos}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default RequisitosSection;