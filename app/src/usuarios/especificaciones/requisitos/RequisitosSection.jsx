import React, { useState } from "react";
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from "antd";
import { PlusOutlined, FileTextOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useRequisitos } from '../../../hooks/useRequisitos';
import RequisitosFormContainer from "./RequisitosFormContainer";
import RequisitoItem from "./RequisitoItem";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const RequisitosSection = ({ proyectoId }) => {
    const [editing, setEditing] = useState(null);

    // Usar el hook refactorizado
    const {
        // Datos
        requisitos,
        catalogos,
        contadores,

        // Estados de carga
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,
        errorCatalogos,

        // Funciones CRUD
        obtenerRequisito,
        crearRequisito,
        actualizarRequisito,
        eliminarRequisito,

        // Funciones auxiliares
        cargarRequisitos,
        recargarTodo,
        limpiarEstado
    } = useRequisitos(proyectoId, true);

    // Función helper para mapear keys a IDs
    const mapearKeyAId = (key, catalogo) => {
        if (!key || !catalogo) return undefined;

        const item = catalogo.find(item =>
            item.key === key ||
            item.nombre?.toLowerCase() === key.toLowerCase() ||
            item.id?.toString() === key.toString()
        );
        return item ? item.id.toString() : undefined;
    };

    // Cargar requisito completo para edición
    const cargarRequisitoParaEdicion = async (requisitoId) => {
        try {
            const requisitoCompleto = await obtenerRequisito(requisitoId, false);

            if (!requisitoCompleto) {
                throw new Error('No se pudo obtener la información del requisito');
            }

            // Preparar los valores para el formulario
            const requisitoParaEditar = {
                id: requisitoCompleto.id,
                nombre: requisitoCompleto.nombre || '',
                descripcion: requisitoCompleto.descripcion || '',
                criterios: requisitoCompleto.criterios || '',
                origen: requisitoCompleto.origen || '',
                condiciones_previas: requisitoCompleto.condiciones_previas || '',
                proyecto_id: requisitoCompleto.proyecto_id,

                // Mapear usando los catálogos disponibles
                tipo: mapearKeyAId(requisitoCompleto.tipo, catalogos?.tipos_requisito),
                prioridad: mapearKeyAId(requisitoCompleto.prioridad, catalogos?.prioridades),
                estado: mapearKeyAId(requisitoCompleto.estado, catalogos?.estados),

                relaciones_requisitos: []
            };

            // Procesar relaciones si existen
            if (Array.isArray(requisitoCompleto.relaciones_requisitos) &&
                requisitoCompleto.relaciones_requisitos.length > 0) {
                requisitoParaEditar.relaciones_requisitos = requisitoCompleto.relaciones_requisitos.map(rel => ({
                    id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                    requisito_id: (rel.requisito_id || rel.requisito_relacionado_id || '').toString(),
                    tipo_relacion: (rel.tipo_relacion_id || rel.tipo_relacion || '').toString(),
                    descripcion: rel.descripcion || ''
                }));
            }

            setEditing(requisitoParaEditar);

        } catch (error) {
            message.error(`Error al cargar requisito: ${error.message}`);
        }
    };

    const handleGuardar = async (values) => {
        if (!proyectoId) {
            message.error('No se ha especificado el ID del proyecto');
            return;
        }

        try {
            // Preparar datos para enviar
            const dataToSend = {
                nombre: values.nombre,
                descripcion: values.descripcion,
                tipo_id: values.tipo ? parseInt(values.tipo) : null,
                criterios: values.criterios,
                prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
                estado_id: values.estado ? parseInt(values.estado) : null,
                origen: values.origen || '',
                condiciones_previas: values.condiciones_previas || '',
                relaciones_requisitos: (values.relaciones_requisitos || [])
                    .filter(rel => rel.requisito_id && rel.tipo_relacion)
                    .map(rel => ({
                        requisito_id: parseInt(rel.requisito_id),
                        tipo_relacion_id: parseInt(rel.tipo_relacion),
                        descripcion: rel.descripcion || ''
                    }))
            };

            let resultado;

            if (editing && editing.id) {
                // Actualizar
                resultado = await actualizarRequisito(editing.id, dataToSend);
            } else {
                // Crear
                resultado = await crearRequisito(dataToSend);
            }

            if (resultado.success) {
                setEditing(null);
                limpiarEstado();
            }

        } catch (error) {
            message.error(`Error al guardar requisito: ${error.message}`);
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
                const resultado = await eliminarRequisito(requisito.id);
                if (resultado.success) {
                    limpiarEstado();
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
        limpiarEstado();
    };

    // Verificar si hay catálogos disponibles
    const catalogosDisponibles = catalogos &&
        Array.isArray(catalogos.tipos_requisito) && catalogos.tipos_requisito.length > 0 &&
        Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
        Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
        Array.isArray(catalogos.tipos_relacion_requisito);

    // VALIDACIONES Y ESTADOS DE CARGA

    if (!proyectoId) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <FileTextOutlined style={{
                    fontSize: "3rem",
                    color: "var(--text-disabled)",
                    marginBottom: "1rem"
                }} />
                <Title level={4} type="secondary">Selecciona un proyecto</Title>
                <Text type="secondary">
                    Debes seleccionar un proyecto para gestionar sus requisitos
                </Text>
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
    if (errorCatalogos || (!catalogos && !loadingCatalogos)) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <ExclamationCircleOutlined style={{
                    fontSize: "3rem",
                    color: "#ff4d4f",
                    marginBottom: "1rem"
                }} />
                <Title level={4} type="danger">Error al cargar catálogos</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '1rem' }}>
                    {errorCatalogos || 'Los catálogos necesarios no están disponibles'}
                </Text>
                <Button type="primary" onClick={recargarTodo}>
                    Reintentar
                </Button>
            </Card>
        );
    }

    // RENDERIZADO PRINCIPAL

    return (
        <div>
            {editing !== null ? (
                <RequisitosFormContainer
                    initialValues={editing?.id ? editing : {}}
                    onSubmit={handleGuardar}
                    onCancel={handleCancelar}
                    requisitosExistentes={requisitos}
                    proyectoId={proyectoId}
                    loading={loadingAccion}
                    catalogosExternos={catalogos}
                />
            ) : (
                <>
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem"
                    }}>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>
                                <FileTextOutlined style={{
                                    marginRight: "0.5rem",
                                    color: "#1890ff"
                                }} />
                                Gestión de Requisitos
                            </Title>
                            <Text type="secondary">
                                {contadores.total} requisito{contadores.total !== 1 ? "s" : ""}
                                {contadores.conRelaciones > 0 && (
                                    <span style={{ marginLeft: '0.5rem' }}>
                                        • {contadores.conRelaciones} con relaciones
                                    </span>
                                )}
                            </Text>
                        </div>

                        <Button
                            className="btn btn-primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                if (!catalogosDisponibles) {
                                    message.error('Los catálogos necesarios no están disponibles. Por favor, actualiza la página.');
                                    return;
                                }
                                setEditing({});
                            }}
                            disabled={loading || loadingCatalogos || !catalogosDisponibles}
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
                                    <FileTextOutlined style={{
                                        fontSize: "3rem",
                                        color: "var(--text-disabled)",
                                        marginBottom: "1rem"
                                    }} />
                                    <Title level={4} type="secondary">
                                        No hay requisitos definidos
                                    </Title>
                                    <Text type="secondary">
                                        Comienza agregando el primer requisito de este proyecto
                                    </Text>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => setEditing({})}
                                            disabled={!catalogosDisponibles}
                                        >
                                            Crear Primer Requisito
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {requisitos.map((requisito) => (
                                        <Col
                                            key={requisito.id}
                                            xs={24}
                                            sm={24}
                                            md={12}
                                            lg={8}
                                            xl={8}
                                            xxl={6}
                                        >
                                            <RequisitoItem
                                                requisito={requisito}
                                                onEditar={handleEditar}
                                                onEliminar={handleEliminar}
                                                loading={loadingDetalle || loadingAccion}
                                                catalogosDisponibles={catalogosDisponibles}
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