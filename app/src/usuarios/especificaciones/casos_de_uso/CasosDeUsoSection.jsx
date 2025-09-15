import React, { useState } from "react";
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from "antd";
import { PlusOutlined, ReloadOutlined, ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
import CasosUsoFormContainer from "./CasosUsoFormContainer";
import CasoUsoItem from "./CasoUsoItem";
import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from "../../../../config";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CasosUsoSection = ({
  proyectoId,
  casosUso,
  catalogos,
  loading,
  loadingCatalogos,
  onActualizar
}) => {
  const [editing, setEditing] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Cargar un caso de uso específico para edición
  const cargarCasoUsoParaEdicion = async (casoUsoId) => {
    setLoadingSubmit(true);

    try {
      const token = getStoredToken();
      const response = await getWithAuth(`${API_ENDPOINTS.OBTENER_CASO_USO}/${casoUsoId}/`, token);

      if (!response || !response.id) {
        throw new Error('No se pudo obtener la información del caso de uso');
      }

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
      const casoUsoParaEditar = {
        id: response.id,
        nombre: response.nombre || '',
        descripcion: response.descripcion || '',
        actores: response.actores || '',
        precondiciones: response.precondiciones || '',
        flujo_principal: response.flujo_principal || [],
        flujos_alternativos: response.flujos_alternativos || [],
        postcondiciones: response.postcondiciones || '',
        requisitos_especiales: response.requisitos_especiales || '',
        riesgos_consideraciones: response.riesgos_consideraciones || '',
        proyecto_id: response.proyecto_id,

        // Mapear usando los catálogos disponibles
        prioridad: mapearKeyAId(response.prioridad, catalogos.prioridades, 'prioridad'),
        estado: mapearKeyAId(response.estado, catalogos.estados, 'estado'),
      };

      setEditing(casoUsoParaEditar);

    } catch (error) {
      message.error(`Error al cargar caso de uso: ${error.message}`);
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
        actores: Array.isArray(values.actores) ? values.actores.join(', ') : values.actores,
        precondiciones: values.precondiciones || '',
        flujo_principal: values.flujo_principal || [],
        flujos_alternativos: values.flujos_alternativos || [],
        postcondiciones: values.postcondiciones || '',
        requisitos_especiales: values.requisitos_especiales || '',
        riesgos_consideraciones: values.riesgos_consideraciones || '',
        proyecto_id: proyectoId,
        prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
        estado_id: values.estado ? parseInt(values.estado) : null,
        relaciones: (values.relaciones || [])
          .filter(rel => rel.casoUsoRelacionado && rel.tipo)
          .map(rel => {
            return {
              casoUsoRelacionado: parseInt(rel.casoUsoRelacionado),
              tipo: parseInt(rel.tipo),
              descripcion: rel.descripcion || ''
            };
          })
      };

      let response;

      if (editing && editing.id) {
        response = await putJSONAuth(
          `${API_ENDPOINTS.ACTUALIZAR_CASO_USO}/${editing.id}/`,
          dataToSend,
          token
        );
        message.success(response.mensaje || 'Caso de uso actualizado exitosamente');
      } else {
        response = await postJSONAuth(API_ENDPOINTS.CREAR_CASO_USO, dataToSend, token);
        message.success(response.mensaje || 'Caso de uso creado exitosamente');
      }

      // Llamar al callback para actualizar los datos en el componente padre
      onActualizar();
      setEditing(null);

    } catch (error) {
      message.error(`Error al guardar caso de uso: ${error.message}`);
    } finally {
      setLoadingSubmit(false);
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
        try {
          const token = getStoredToken();
          const response = await deleteWithAuth(
            `${API_ENDPOINTS.ELIMINAR_CASO_USO}/${casoUso.id}/`,
            token
          );
          message.success(response.mensaje || 'Caso de uso eliminado exitosamente');
          onActualizar();
        } catch (error) {
          message.error(`Error al eliminar caso de uso: ${error.message}`);
        }
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
    Array.isArray(catalogos.estados) && catalogos.estados.length > 0;

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
        <CasosUsoFormContainer
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          casosUsoExistentes={casosUso}
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
                <UserOutlined style={{ marginRight: "0.5rem", color: "#52c41a" }} />
                Gestión de Casos de Uso
              </Title>
              <Text type="secondary">
                {casosUso.length} caso{casosUso.length !== 1 ? "s" : ""} de uso
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
                  <UserOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                  <Title level={4} type="secondary">No hay casos de uso definidos</Title>
                  <Text type="secondary">Comienza agregando el primer caso de uso de este proyecto</Text>
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {casosUso.map((casoUso) => (
                    <Col key={casoUso.id} xs={24} sm={24} md={12} lg={8} xl={8} xxl={6}>
                      <CasoUsoItem
                        casoUso={casoUso}
                        onEditar={handleEditar}
                        onEliminar={handleEliminar}
                        loading={loadingSubmit}
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

export default CasosUsoSection;