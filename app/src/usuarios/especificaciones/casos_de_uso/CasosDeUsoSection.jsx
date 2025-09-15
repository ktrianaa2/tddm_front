import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from "antd";
import { PlusOutlined, ReloadOutlined, ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
import CasosUsoFormContainer from "./CasosUsoFormContainer";
import CasoUsoItem from "./CasoUsoItem"; // Importar el nuevo componente
import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from "../../../../config";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CasosUsoSection = ({ proyectoId }) => {
  const [casosUso, setCasosUso] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [catalogos, setCatalogos] = useState(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState(null);

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    setErrorCatalogos(null);

    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const [prioridadesResponse, estadosResponse, tiposRelacionResponse] = await Promise.allSettled([
        getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
        getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
        getWithAuth(API_ENDPOINTS.TIPOS_RELACION_CU, token)
      ]);

      const catalogosData = {
        prioridades: [],
        estados: [],
        tipos_relacion: []
      };

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

      // Procesar tipos de relación para casos de uso
      if (tiposRelacionResponse.status === 'fulfilled' && tiposRelacionResponse.value) {
        const tiposRelacionData = tiposRelacionResponse.value.tipos_relacion_cu || tiposRelacionResponse.value.tipos_relacion || tiposRelacionResponse.value.data || tiposRelacionResponse.value;
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

      // Procesar estados (filtrar solo para casos de uso)
      if (estadosResponse.status === 'fulfilled' && estadosResponse.value) {
        const estadosData = estadosResponse.value.estados_elemento || estadosResponse.value.estados || estadosResponse.value.data || estadosResponse.value;
        if (Array.isArray(estadosData)) {
          const estadosCasosdeUso = estadosData.filter(estado =>
            estado.tipo === 'caso_uso' || !estado.tipo
          );
          catalogosData.estados = estadosCasosdeUso.map(estado => ({
            id: estado.id || estado.estado_id,
            nombre: estado.nombre,
            key: estado.key || estado.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
            descripcion: estado.descripcion || '',
            tipo: estado.tipo,
            activo: estado.activo !== false
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

  const cargarCasosUso = async () => {
    if (!proyectoId) return;

    setLoading(true);
    try {
      const token = getStoredToken();
      const response = await getWithAuth(`${API_ENDPOINTS.LISTAR_CASOS_USO}/${proyectoId}/`, token);
      const casosUsoData = response.data || [];

      if (!Array.isArray(casosUsoData)) {
        setCasosUso([]);
        return;
      }

      const casosUsoProcessed = casosUsoData.map(cu => ({
        id: cu.id,
        nombre: cu.nombre,
        descripcion: cu.descripcion,
        actores: cu.actores,
        precondiciones: cu.precondiciones,
        flujo_principal: cu.flujo_principal,
        flujos_alternativos: cu.flujos_alternativos,
        postcondiciones: cu.postcondiciones,
        prioridad: cu.prioridad,
        estado: cu.estado,
        proyecto_id: cu.proyecto_id,
        fecha_creacion: cu.fecha_creacion,
        relaciones: cu.relaciones || []
      }));

      setCasosUso(casosUsoProcessed);
    } catch (error) {
      message.error(`Error al cargar casos de uso: ${error.message}`);
      setCasosUso([]);
    } finally {
      setLoading(false);
    }
  };

  //Cargar un caso de uso específico para edición
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

  useEffect(() => {
    if (proyectoId) {
      if (!catalogos) {
        cargarCatalogos();
      }
      cargarCasosUso();
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
          .filter(rel => rel.casoUsoRelacionado && rel.tipo) // Solo enviar relaciones completas
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

      await cargarCasosUso();
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
          await cargarCasosUso();
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
      await cargarCatalogos();
      return;
    }

    await cargarCasoUsoParaEdicion(casoUso.id);
  };

  const handleCancelar = () => {
    setEditing(null);
  };

  const handleRecargarTodo = async () => {
    await Promise.all([
      cargarCatalogos(),
      cargarCasosUso()
    ]);
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