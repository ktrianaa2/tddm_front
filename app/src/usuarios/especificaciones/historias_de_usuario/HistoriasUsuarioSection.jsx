import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, message, Spin, Modal, Row, Col, Empty } from 'antd';
import { PlusOutlined, BookOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import HistoriasUsuarioForm from './HistoriasUsuarioForm';
import HistoriaUsuarioItem from './HistoriaUsuarioItem';
import { useHistoriasUsuario } from '../../../hooks/useHistoriasdeUsuario';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const HistoriasUsuarioSection = ({ proyectoId }) => {
  const [editing, setEditing] = useState(null);

  // Usar el hook con todas las funciones y datos necesarios
  const {
    historiasUsuario,
    catalogos,
    catalogosFormulario,
    loading,
    loadingCatalogos,
    loadingAccion,
    errorCatalogos,
    prepararHistoriaParaEdicion,
    crearHistoriaUsuario,
    actualizarHistoriaUsuario,
    eliminarHistoriaUsuario,
    cargarCatalogos,
    findByKeyOrId,
    getIdByKeyOrId
  } = useHistoriasUsuario(proyectoId, true);

  // Recargar catálogos si hay error
  useEffect(() => {
    if (errorCatalogos && proyectoId) {
      const timer = setTimeout(() => {
        cargarCatalogos();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorCatalogos, proyectoId, cargarCatalogos]);

  const handleEditar = async (historia) => {
    const catalogosDisponibles = catalogos &&
      Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
      Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
      Array.isArray(catalogos.tipos_estimacion) && catalogos.tipos_estimacion.length > 0;

    if (!catalogosDisponibles) {
      message.error('Los catálogos necesarios no están disponibles. Reintentando carga...');
      await cargarCatalogos();
      return;
    }

    try {
      const historiaParaEditar = await prepararHistoriaParaEdicion(historia.id);
      setEditing(historiaParaEditar);
    } catch (error) {
      // El error ya se maneja en prepararHistoriaParaEdicion
    }
  };

  const handleGuardar = async (values) => {
    if (!proyectoId) {
      message.error('No se ha especificado el ID del proyecto');
      return;
    }

    try {
      // Construir título
      let titulo = values.descripcion_historia || '';
      if (!titulo && values.actor_rol && values.funcionalidad_accion) {
        titulo = `Como ${values.actor_rol}, quiero ${values.funcionalidad_accion}`;
        if (values.beneficio_razon) {
          titulo += ` para ${values.beneficio_razon}`;
        }
      }
      if (!titulo) {
        titulo = 'Historia de usuario sin título';
      }

      const dataToSend = {
        titulo: titulo,
        descripcion: values.descripcion_historia || '',
        actor_rol: values.actor_rol || '',
        funcionalidad_accion: values.funcionalidad_accion || '',
        beneficio_razon: values.beneficio_razon || '',
        criterios_aceptacion: values.criterios_aceptacion,
        dependencias_relaciones: values.dependencias_relaciones || '',
        componentes_relacionados: values.componentes_relacionados || '',
        notas_adicionales: values.notas_adicionales || '',
        valor_negocio: values.valor_negocio || null,
        prioridad_id: values.prioridad ? parseInt(values.prioridad) : null,
        estado_id: values.estado ? parseInt(values.estado) : null,
        estimaciones: []
      };

      // Procesar estimaciones
      if (values.estimaciones && Array.isArray(values.estimaciones) && values.estimaciones.length > 0) {
        const estimacionesValidas = values.estimaciones
          .filter(est => {
            const tieneUnidad = est.tipo_estimacion_id && est.tipo_estimacion_id !== '';
            const tieneValor = est.valor !== null && est.valor !== undefined && est.valor !== '';
            const valorValido = !isNaN(parseFloat(est.valor)) && parseFloat(est.valor) > 0;
            return tieneUnidad && tieneValor && valorValido;
          })
          .map(est => ({
            tipo_estimacion_id: parseInt(est.tipo_estimacion_id),
            valor: parseFloat(est.valor)
          }));

        dataToSend.estimaciones = estimacionesValidas;
      }

      let result;

      if (editing && editing.id) {
        result = await actualizarHistoriaUsuario(editing.id, dataToSend);
      } else {
        result = await crearHistoriaUsuario(dataToSend);
      }

      if (result.success) {
        setEditing(null);
      }

    } catch (error) {
      message.error(`Error al guardar historia de usuario: ${error.message}`);
    }
  };

  const handleEliminar = (historia) => {
    confirm({
      title: 'Confirmar Eliminación',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>¿Estás seguro de que deseas eliminar la historia de usuario:</p>
          <p><strong>"{extraerTitulo(historia.descripcion || historia.titulo)}"</strong></p>
          <p style={{ color: '#ff4d4f', fontSize: '0.9em', marginTop: '0.5rem' }}>
            Esta acción no se puede deshacer.
          </p>
        </div>
      ),
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      async onOk() {
        await eliminarHistoriaUsuario(historia.id);
      },
    });
  };

  const handleCancelar = () => {
    setEditing(null);
  };

  const extraerTitulo = (texto) => {
    if (!texto) return 'Sin título';
    return texto.length > 50 ? `${texto.substring(0, 50)}...` : texto;
  };

  if (!proyectoId) {
    return (
      <Card style={{
        textAlign: "center",
        padding: "3rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)"
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p style={{
                fontSize: '1.1rem',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                Selecciona un proyecto
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                Debes seleccionar un proyecto para gestionar sus historias de usuario
              </p>
            </div>
          }
        />
      </Card>
    );
  }

  if (loadingCatalogos && !catalogos) {
    return (
      <Card style={{
        textAlign: "center",
        padding: "3rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)"
      }}>
        <Spin size="large" />
        <div style={{ marginTop: "1rem" }}>
          <Text style={{ color: 'var(--text-secondary)' }}>
            Cargando catálogos necesarios...
          </Text>
        </div>
      </Card>
    );
  }

  if (errorCatalogos && !catalogos) {
    return (
      <Card style={{
        textAlign: "center",
        padding: "3rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)"
      }}>
        <ExclamationCircleOutlined style={{
          fontSize: "3rem",
          color: "var(--error-color)",
          marginBottom: "1rem"
        }} />
        <Title level={4} style={{ color: 'var(--error-color)' }}>
          Error al cargar catálogos
        </Title>
        <Text style={{
          display: 'block',
          marginBottom: '1rem',
          color: 'var(--text-secondary)'
        }}>
          {errorCatalogos}
        </Text>
        <Button onClick={cargarCatalogos} loading={loadingCatalogos}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div>
      {editing !== null ? (
        <HistoriasUsuarioForm
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          proyectoId={proyectoId}
          loading={loadingAccion}
          catalogosFormulario={catalogosFormulario}
          loadingCatalogos={loadingCatalogos}
          errorCatalogos={errorCatalogos}
          findByKeyOrId={findByKeyOrId}
          getIdByKeyOrId={getIdByKeyOrId}
          cargarCatalogos={cargarCatalogos}
        />
      ) : (
        <>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem"
          }}>
            <div>
              <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                <BookOutlined style={{ marginRight: "0.5rem", color: "#722ed1" }} />
                Gestión de Historias de Usuario
              </Title>
            </div>

            <Button
              className="btn btn-primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (!catalogos || !catalogos.prioridades || catalogos.prioridades.length === 0) {
                  message.error('Los catálogos necesarios no están disponibles. Por favor, actualiza la página.');
                  return;
                }
                setEditing({});
              }}
              disabled={loading || loadingCatalogos || !catalogos}
            >
              Agregar Historia de Usuario
            </Button>
          </div>

          {loading ? (
            <Card style={{
              textAlign: "center",
              padding: "3rem 1rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)"
            }}>
              <Spin size="large" />
              <div style={{ marginTop: "1rem" }}>
                <Text style={{ color: 'var(--text-secondary)' }}>
                  Cargando historias de usuario...
                </Text>
              </div>
            </Card>
          ) : (
            <>
              {historiasUsuario.length === 0 ? (
                <Card style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)"
                }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <p style={{
                          fontSize: '1.1rem',
                          marginBottom: '0.5rem',
                          color: 'var(--text-primary)'
                        }}>
                          No hay historias de usuario definidas
                        </p>
                        <p style={{
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary)'
                        }}>
                          Comienza agregando la primera historia de usuario de tu proyecto
                        </p>
                      </div>
                    }
                  />
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {historiasUsuario.map((historia) => (
                    <Col key={historia.id} xs={24} sm={24} md={12} lg={8} xl={8} xxl={6}>
                      <HistoriaUsuarioItem
                        historia={historia}
                        onEditar={handleEditar}
                        onEliminar={handleEliminar}
                        loading={loadingAccion}
                        catalogosDisponibles={catalogos &&
                          Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
                          Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
                          Array.isArray(catalogos.tipos_estimacion) && catalogos.tipos_estimacion.length > 0
                        }
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

export default HistoriasUsuarioSection;