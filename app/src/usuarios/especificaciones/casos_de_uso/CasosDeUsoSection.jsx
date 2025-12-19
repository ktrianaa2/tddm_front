import React, { useState } from "react";
import { Card, Button, Typography, Modal, Row, Col, Spin } from "antd";
import { PlusOutlined, ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useCasosUso } from "../../../hooks/useCasosdeUso";
import CasosUsoForm from "./CasosUsoForm";
import CasoUsoItem from "./CasoUsoItem";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CasosDeUsoSection = ({ proyectoId }) => {
  const [editing, setEditing] = useState(null);

  const {
    // Datos
    casosUso,
    catalogos,
    contadores,

    // Estados de carga
    loading,
    loadingDetalle,
    loadingAccion,
    loadingCatalogos,
    loadingRelaciones,
    errorCatalogos,

    // Funciones CRUD
    obtenerCasoUso,
    crearCasoUso,
    actualizarCasoUso,
    eliminarCasoUso,
    obtenerRelaciones,

    // Funciones de procesamiento
    prepararValoresIniciales,
    prepararDatosParaEnvio,

    // Funciones auxiliares
    recargarTodo
  } = useCasosUso(proyectoId, true);

  // ============== HANDLERS ==============

  const handleGuardar = async (values) => {
    try {
      const esEdicion = editing && editing.id;
      const dataToSend = prepararDatosParaEnvio(values, esEdicion, editing?.id);

      const resultado = esEdicion
        ? await actualizarCasoUso(editing.id, dataToSend)
        : await crearCasoUso(dataToSend);

      if (resultado.success) {
        setEditing(null);
      }
    } catch (error) {
      console.error('Error al guardar caso de uso:', error);
    }
  };

  const handleEliminar = (casoUso) => {
    confirm({
      title: 'Confirmar Eliminación',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>¿Estás seguro de que deseas eliminar el caso de uso:</p>
          <p><strong>"{casoUso.nombre}"</strong></p>
          <p style={{ color: '#ff4d4f', fontSize: '0.9em', marginTop: '0.5rem' }}>
            Esta acción no se puede deshacer y eliminará todas las relaciones asociadas.
          </p>
        </div>
      ),
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        await eliminarCasoUso(casoUso.id);
      },
    });
  };

  const handleEditar = async (casoUso) => {
    const catalogosDisponibles = catalogos &&
      Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
      Array.isArray(catalogos.estados) && catalogos.estados.length > 0;

    if (!catalogosDisponibles) {
      return;
    }

    // Obtener caso de uso completo desde la API
    const casoUsoCompleto = await obtenerCasoUso(casoUso.id);
    if (!casoUsoCompleto) return;

    // Preparar valores usando la función del hook
    const valoresParaEditar = prepararValoresIniciales(casoUsoCompleto);
    setEditing(valoresParaEditar);
  };

  const handleCancelar = () => {
    setEditing(null);
  };

  const handleAgregar = () => {
    const catalogosDisponibles = catalogos &&
      Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
      Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
      Array.isArray(catalogos.tipos_relacion_cu);

    if (!catalogosDisponibles) {
      return;
    }
    setEditing({});
  };

  // ============== VALIDACIONES ==============

  const catalogosDisponibles = catalogos &&
    Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
    Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
    Array.isArray(catalogos.tipos_relacion_cu);

  // ============== RENDERIZADO CONDICIONAL ==============

  if (!proyectoId) {
    return (
      <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <UserOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
        <Title level={4} type="secondary">Selecciona un proyecto</Title>
        <Text type="secondary">Debes seleccionar un proyecto para gestionar sus casos de uso</Text>
      </Card>
    );
  }

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

  if (errorCatalogos || (!catalogos && !loadingCatalogos)) {
    return (
      <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <ExclamationCircleOutlined style={{ fontSize: "3rem", color: "#ff4d4f", marginBottom: "1rem" }} />
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

  // ============== RENDERIZADO PRINCIPAL ==============

  return (
    <div>
      {editing !== null ? (
        <CasosUsoForm
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          casosUsoExistentes={casosUso}
          proyectoId={proyectoId}
          loading={loadingAccion}

          // Catálogos ya procesados desde el hook
          prioridades={catalogos?.prioridades || []}
          estados={catalogos?.estados || []}
          tiposRelacion={catalogos?.tipos_relacion_cu || []}

          // Estados de carga
          loadingPrioridades={loadingCatalogos}
          loadingTiposRelacion={loadingCatalogos}
          loadingRelaciones={loadingRelaciones}

          // Estados de error
          errorPrioridades={errorCatalogos}
          errorTiposRelacion={errorCatalogos}

          // Función para cargar relaciones
          cargarRelacionesExistentes={obtenerRelaciones}
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
                <UserOutlined style={{ marginRight: "0.5rem", color: "#52c41a" }} />
                Gestión de Casos de Uso
              </Title>
              <Text type="secondary">
                {contadores.total} caso{contadores.total !== 1 ? "s" : ""} de uso
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
              onClick={handleAgregar}
              disabled={loading || loadingCatalogos || !catalogosDisponibles}
            >
              Agregar Caso de Uso
            </Button>
          </div>

          {/* Loading */}
          {loading ? (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Spin size="large" />
              <div style={{ marginTop: "1rem" }}>
                <Text type="secondary">Cargando casos de uso...</Text>
              </div>
            </Card>
          ) : (
            <>
              {/* Lista de casos de uso */}
              {casosUso.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <UserOutlined style={{
                    fontSize: "3rem",
                    color: "var(--text-disabled)",
                    marginBottom: "1rem"
                  }} />
                  <Title level={4} type="secondary">
                    No hay casos de uso definidos
                  </Title>
                  <Text type="secondary">
                    Comienza agregando el primer caso de uso de este proyecto
                  </Text>
                  <div style={{ marginTop: '1.5rem' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAgregar}
                      disabled={!catalogosDisponibles}
                    >
                      Crear Primer Caso de Uso
                    </Button>
                  </div>
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {casosUso.map((casoUso) => (
                    <Col key={casoUso.id} xs={24} sm={24} md={12} lg={8} xl={8} xxl={6}>
                      <CasoUsoItem
                        casoUso={casoUso}
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

export default CasosDeUsoSection;