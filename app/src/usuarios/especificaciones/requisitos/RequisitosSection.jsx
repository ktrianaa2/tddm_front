import React from "react";
import { Card, Button, Typography, Spin, Row, Col } from "antd";
import { PlusOutlined, FileTextOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useRequisitos } from '../../../hooks/useRequisitos';
import RequisitosForm from "./RequisitosForm";
import RequisitoItem from "./RequisitoItem";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;

const RequisitosSection = ({ proyectoId }) => {
    const {
        // Datos
        requisitos,
        contadores,

        // Estado del formulario
        formularioAbierto,
        modoEdicion,
        valoresFormulario,
        relacionesFormulario,

        // Catálogos para el formulario
        tiposRequisito,
        prioridades,
        estados,
        tiposRelacion,

        // Estados
        catalogosDisponibles,
        loading,
        loadingDetalle,
        loadingAccion,
        loadingCatalogos,
        loadingRelaciones,
        errorCatalogos,

        // Funciones
        abrirFormularioCrear,
        abrirFormularioEditar,
        cerrarFormulario,
        guardarRequisito,
        eliminarRequisito,
        agregarRelacion,
        actualizarRelacion,
        eliminarRelacion,
        recargarTodo,
        getRequisitoInfo,
        getItemByKey,
        cargarRelaciones
    } = useRequisitos(proyectoId, true);

    // VALIDACIONES

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

    if (loadingCatalogos) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <Spin size="large" />
                <div style={{ marginTop: "1rem" }}>
                    <Text type="secondary">Cargando catálogos necesarios...</Text>
                </div>
            </Card>
        );
    }

    if (errorCatalogos || !catalogosDisponibles) {
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
            {formularioAbierto ? (
                <RequisitosForm
                    // Valores
                    initialValues={valoresFormulario}
                    relacionesRequisitos={relacionesFormulario}
                    requisitosExistentes={requisitos}
                    proyectoId={proyectoId}

                    // Catálogos
                    tiposRequisito={tiposRequisito}
                    prioridades={prioridades}
                    estados={estados}
                    tiposRelacion={tiposRelacion}

                    // Estados
                    loading={loadingAccion}
                    loadingRelaciones={loadingRelaciones}
                    isEditing={modoEdicion}

                    // Funciones
                    onSubmit={guardarRequisito}
                    onCancel={cerrarFormulario}
                    onAgregarRelacion={agregarRelacion}
                    onActualizarRelacion={actualizarRelacion}
                    onEliminarRelacion={eliminarRelacion}
                    getRequisitoInfo={getRequisitoInfo}
                    getItemByKey={getItemByKey}
                    cargarRelacionesExistentes={cargarRelaciones}
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
                            onClick={abrirFormularioCrear}
                            disabled={loading || loadingCatalogos}
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
                                            onClick={abrirFormularioCrear}
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
                                                onEditar={() => abrirFormularioEditar(requisito)}
                                                onEliminar={() => eliminarRequisito(requisito)}
                                                loading={loadingDetalle || loadingAccion}
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