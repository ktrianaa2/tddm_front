import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from "antd";
import { PlusOutlined, ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useCasosUso } from "../../../hooks/useCasosdeUso";
import CasosUsoFormContainer from "./CasosUsoFormContainer";
import CasoUsoItem from "./CasoUsoItem";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CasosDeUsoSection = ({ proyectoId }) => {
  const [editing, setEditing] = useState(null);

  // Usar el hook refactorizado
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
    errorCatalogos,

    // Funciones CRUD
    obtenerCasoUso,
    crearCasoUso,
    actualizarCasoUso,
    eliminarCasoUso,

    // Funciones auxiliares
    cargarCasosUso,
    recargarTodo
  } = useCasosUso(proyectoId, true);

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

  // Cargar un caso de uso específico para edición
  const cargarCasoUsoParaEdicion = async (casoUsoId) => {
    try {
      const casoUso = await obtenerCasoUso(casoUsoId);

      if (!casoUso || !casoUso.id) {
        throw new Error('No se pudo obtener la información del caso de uso');
      }

      // Preparar los valores para el formulario
      const casoUsoParaEditar = {
        id: casoUso.id,
        nombre: casoUso.nombre || '',
        descripcion: casoUso.descripcion || '',
        actores: casoUso.actores || '',
        precondiciones: casoUso.precondiciones || '',
        flujo_principal: casoUso.flujo_principal || [],
        flujos_alternativos: casoUso.flujos_alternativos || [],
        postcondiciones: casoUso.postcondiciones || '',
        requisitos_especiales: casoUso.requisitos_especiales || '',
        riesgos_consideraciones: casoUso.riesgos_consideraciones || '',
        proyecto_id: casoUso.proyecto_id,

        // Mapear usando los catálogos disponibles
        prioridad: mapearKeyAId(casoUso.prioridad, catalogos?.prioridades),
        estado: mapearKeyAId(casoUso.estado, catalogos?.estados),
      };

      setEditing(casoUsoParaEditar);

    } catch (error) {
      message.error(`Error al cargar caso de uso: ${error.message}`);
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
        actores: Array.isArray(values.actores) ? values.actores.join(', ') : values.actores,
        precondiciones: values.precondiciones || '',
        flujo_principal: values.flujo_principal || [],
        flujos_alternativos: values.flujos_alternativos || [],
        postcondiciones: values.postcondiciones || '',
        requisitos_especiales: values.requisitos_especiales || '',
        riesgos_consideraciones: values.riesgos_consideraciones || '',
        prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
        estado_id: values.estado ? parseInt(values.estado) : null,
        relaciones: (values.relaciones || [])
          .filter(rel => rel.casoUsoRelacionado && rel.tipo)
          .map(rel => ({
            casoUsoRelacionado: parseInt(rel.casoUsoRelacionado),
            tipo: parseInt(rel.tipo),
            descripcion: rel.descripcion || ''
          }))
      };

      let resultado;

      if (editing && editing.id) {
        // Actualizar
        resultado = await actualizarCasoUso(editing.id, dataToSend);
      } else {
        // Crear
        resultado = await crearCasoUso(dataToSend);
      }

      if (resultado.success) {
        setEditing(null);
      }

    } catch (error) {
      message.error(`Error al guardar caso de uso: ${error.message}`);
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
    // Verificar que los catálogos estén disponibles
    const catalogosDisponibles = catalogos &&
      Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
      Array.isArray(catalogos.estados) && catalogos.estados.length > 0;

    if (!catalogosDisponibles) {
      message.error('Los catálogos necesarios no están disponibles. Reintentando carga...');
      return;
    }

    await cargarCasoUsoParaEdicion(casoUso.id);
  };

  const handleCancelar = () => {
    setEditing(null);
  };

  // Verificar si los catálogos están disponibles
  const catalogosDisponibles = catalogos &&
    Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
    Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
    Array.isArray(catalogos.tipos_relacion_cu);

  // VALIDACIONES Y ESTADOS DE CARGA

  if (!proyectoId) {
    return (
      <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <UserOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
        <Title level={4} type="secondary">Selecciona un proyecto</Title>
        <Text type="secondary">Debes seleccionar un proyecto para gestionar sus casos de uso</Text>
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

  // RENDERIZADO PRINCIPAL

  return (
    <div>
      {editing !== null ? (
        <CasosUsoFormContainer
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          casosUsoExistentes={casosUso}
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
              onClick={() => {
                if (!catalogosDisponibles) {
                  message.error('Los catálogos necesarios no están disponibles. Por favor, actualiza la página.');
                  return;
                }
                setEditing({});
              }}
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
                      onClick={() => setEditing({})}
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