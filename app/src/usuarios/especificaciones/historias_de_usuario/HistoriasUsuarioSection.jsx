import React, { useState } from 'react';
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from 'antd';
import { PlusOutlined, BookOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import HistoriasUsuarioFormContainer from './HistoriasUsuarioFormContainer';
import HistoriaUsuarioItem from './HistoriaUsuarioItem';
import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from '../../../../config';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const HistoriasUsuarioSection = ({
  proyectoId,
  historiasUsuario,
  catalogos,
  loading,
  loadingCatalogos,
  onActualizar
}) => {
  const [editing, setEditing] = useState(null); // null = lista, {} = creando, {datos} = editando
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const cargarHistoriaParaEdicion = async (historiaId) => {
    setLoadingSubmit(true);

    try {
      const token = getStoredToken();
      const response = await getWithAuth(`${API_ENDPOINTS.OBTENER_HISTORIA_USUARIO}/${historiaId}/`, token);

      if (!response || !response.historia) {
        throw new Error('No se pudo obtener la información de la historia de usuario');
      }

      const historiaBackend = response.historia;

      // Función helper para mapear keys a IDs
      const mapearKeyAId = (keyOrId, catalogo, tipoCatalogo = '') => {
        if (!keyOrId || !catalogo || !Array.isArray(catalogo)) return null;

        const keyOrIdStr = keyOrId.toString();

        // 1. Buscar por ID exacto primero
        let found = catalogo.find(item => item.id?.toString() === keyOrIdStr);
        if (found) {
          return found.id.toString();
        }

        // 2. Buscar por key normalizada
        const normalizedKey = keyOrIdStr.toLowerCase();
        found = catalogo.find(item => item.key === normalizedKey);
        if (found) {
          return found.id.toString();
        }

        // 3. Buscar por nombre normalizado
        found = catalogo.find(item => {
          if (!item.nombre) return false;
          const nombreNormalizado = item.nombre.toLowerCase()
            .replace(/[\s_-]+/g, '-')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n');
          return nombreNormalizado === normalizedKey;
        });

        if (found) {
          return found.id.toString();
        }

        return null;
      };

      // Preparar datos básicos de la historia
      const historiaParaEditar = {
        id: historiaBackend.id,
        descripcion_historia: historiaBackend.descripcion || historiaBackend.titulo || '',
        actor_rol: historiaBackend.actor_rol || '',
        funcionalidad_accion: historiaBackend.funcionalidad_accion || '',
        beneficio_razon: historiaBackend.beneficio_razon || '',
        criterios_aceptacion: historiaBackend.criterios_aceptacion || '',
        dependencias_relaciones: historiaBackend.dependencias_relaciones || '',
        componentes_relacionados: historiaBackend.componentes_relacionados || '',
        valor_negocio: historiaBackend.valor_negocio || '',
        notas_adicionales: historiaBackend.notas_adicionales || '',
        proyecto_id: historiaBackend.proyecto_id,
        prioridad: null,
        estado: null,
        estimaciones: []
      };

      // Mapear prioridad
      if (historiaBackend.prioridad && catalogos.prioridades) {
        const prioridadId = mapearKeyAId(historiaBackend.prioridad, catalogos.prioridades, 'Prioridad');
        if (prioridadId) {
          historiaParaEditar.prioridad = prioridadId;
        }
      }

      // Mapear estado  
      if (historiaBackend.estado && catalogos.estados) {
        const estadoId = mapearKeyAId(historiaBackend.estado, catalogos.estados, 'Estado');
        if (estadoId) {
          historiaParaEditar.estado = estadoId;
        }
      }

      const estimacionesParaFormulario = [];

      // Procesar múltiples estimaciones
      if (historiaBackend.estimaciones && Array.isArray(historiaBackend.estimaciones) && historiaBackend.estimaciones.length > 0) {
        historiaBackend.estimaciones.forEach((est, index) => {
          let unidadId = null;

          if (est.tipo_estimacion_id) {
            // Verificar que existe en nuestro catálogo
            const unidadExiste = catalogos.unidades_estimacion?.find(u => u.id.toString() === est.tipo_estimacion_id.toString());
            if (unidadExiste) {
              unidadId = est.tipo_estimacion_id.toString();
            }
          }
          // Fallback: buscar por nombre
          else if (est.tipo_estimacion_nombre) {
            unidadId = mapearKeyAId(est.tipo_estimacion_nombre, catalogos.unidades_estimacion, 'Unidad Estimación');
          }

          // Si tenemos unidad válida y valor válido
          if (unidadId && (est.valor !== null && est.valor !== undefined)) {
            const estimacionFormulario = {
              id: est.id || `existing_${Date.now()}_${index}`,
              unidad_estimacion: unidadId,
              valor: est.valor
            };

            estimacionesParaFormulario.push(estimacionFormulario);
          }
        });
      }
      // Procesar estimación única (formato legacy)
      else if (historiaBackend.estimacion_valor && historiaBackend.unidad_estimacion) {
        const unidadId = mapearKeyAId(historiaBackend.unidad_estimacion, catalogos.unidades_estimacion, 'Unidad Estimación');

        if (unidadId) {
          const estimacionFormulario = {
            id: `existing_single_${Date.now()}`,
            unidad_estimacion: unidadId,
            valor: historiaBackend.estimacion_valor
          };
          estimacionesParaFormulario.push(estimacionFormulario);
        }
      }

      historiaParaEditar.estimaciones = estimacionesParaFormulario;
      setEditing(historiaParaEditar);

    } catch (error) {
      message.error(`Error al cargar historia de usuario: ${error.message}`);
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

      // Construir título basado en los campos disponibles
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
        proyecto_id: parseInt(proyectoId),
        estimaciones: []
      };

      if (values.estimaciones && Array.isArray(values.estimaciones) && values.estimaciones.length > 0) {
        const estimacionesValidas = values.estimaciones
          .filter(est => {
            const tieneUnidad = est.tipo_estimacion_id && est.tipo_estimacion_id !== '';
            const tieneValor = est.valor !== null && est.valor !== undefined && est.valor !== '';
            const valorValido = !isNaN(parseFloat(est.valor)) && parseFloat(est.valor) > 0;

            return tieneUnidad && tieneValor && valorValido;
          })
          .map(est => {
            const estimacionParaBackend = {
              tipo_estimacion_id: parseInt(est.tipo_estimacion_id),
              valor: parseFloat(est.valor)
            };

            return estimacionParaBackend;
          });

        dataToSend.estimaciones = estimacionesValidas;
      }

      // Mantener compatibilidad con formato legacy si solo hay una estimación
      if (dataToSend.estimaciones.length === 1) {
        dataToSend.estimacion_valor = dataToSend.estimaciones[0].valor;
        dataToSend.unidad_estimacion = dataToSend.estimaciones[0].tipo_estimacion_id;
      }

      let response;

      if (editing && editing.id) {
        // Actualizar historia existente
        response = await putJSONAuth(
          `${API_ENDPOINTS.ACTUALIZAR_HISTORIA_USUARIO}/${editing.id}/`,
          dataToSend,
          token
        );
        message.success(response.mensaje || 'Historia de usuario actualizada exitosamente');
      } else {
        // Crear nueva historia
        response = await postJSONAuth(API_ENDPOINTS.CREAR_HISTORIA_USUARIO, dataToSend, token);
        message.success(response.mensaje || 'Historia de usuario creada exitosamente');
      }

      // Llamar al callback para actualizar los datos en el componente padre
      onActualizar();
      setEditing(null);

    } catch (error) {
      message.error(`Error al guardar historia de usuario: ${error.message}`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleEliminar = (historia) => {
    confirm({
      title: 'Confirmar Eliminación',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>¿Estás seguro de que deseas eliminar la historia de usuario:</p>
          <p><strong>"{extraerTitulo(historia.descripcion_historia)}"</strong></p>
          <p style={{ color: '#ff4d4f', fontSize: '0.9em', marginTop: '0.5rem' }}>
            Esta acción no se puede deshacer.
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
            `${API_ENDPOINTS.ELIMINAR_HISTORIA_USUARIO}/${historia.id}/`,
            token
          );
          message.success(response.mensaje || 'Historia de usuario eliminada exitosamente');
          onActualizar();
        } catch (error) {
          message.error(`Error al eliminar historia de usuario: ${error.message}`);
        }
      },
    });
  };

  const handleEditar = async (historia) => {
    // Verificar que los catálogos estén disponibles
    const catalogosDisponibles = catalogos &&
      Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
      Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
      Array.isArray(catalogos.unidades_estimacion) && catalogos.unidades_estimacion.length > 0;

    if (!catalogosDisponibles) {
      message.error('Los catálogos necesarios no están disponibles. Reintentando carga...');
      return;
    }

    await cargarHistoriaParaEdicion(historia.id);
  };

  const handleCancelar = () => {
    setEditing(null);
  };

  // Extraer el título de la descripción de la historia (primeras palabras hasta 50 caracteres)
  const extraerTitulo = (descripcionHistoria) => {
    if (!descripcionHistoria) return 'Sin título';
    return descripcionHistoria.length > 50
      ? `${descripcionHistoria.substring(0, 50)}...`
      : descripcionHistoria;
  };

  if (!proyectoId) {
    return (
      <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <BookOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
        <Title level={4} type="secondary">Selecciona un proyecto</Title>
        <Text type="secondary">Debes seleccionar un proyecto para gestionar sus historias de usuario</Text>
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
        <HistoriasUsuarioFormContainer
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          historiasExistentes={historiasUsuario}
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
                <BookOutlined style={{ marginRight: "0.5rem", color: "#722ed1" }} />
                Gestión de Historias de Usuario
              </Title>
              <Text type="secondary">
                {historiasUsuario.length} historia{historiasUsuario.length !== 1 ? "s" : ""} de usuario
              </Text>
            </div>

            <Button
              className="btn btn-primary"
              icon={<PlusOutlined />}
              onClick={() => {
                // Verificar que los catálogos estén disponibles antes de crear
                if (!catalogos || !catalogos.prioridades || catalogos.prioridades.length === 0) {
                  message.error('Los catálogos necesarios no están disponibles. Por favor, actualiza la página.');
                  return;
                }
                setEditing({}); // Objeto vacío para crear nuevo
              }}
              disabled={loading || loadingCatalogos || !catalogos}
            >
              Agregar Historia de Usuario
            </Button>
          </div>

          {/* Loading */}
          {loading ? (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Spin size="large" />
              <div style={{ marginTop: "1rem" }}>
                <Text type="secondary">Cargando historias de usuario...</Text>
              </div>
            </Card>
          ) : (
            <>
              {/* Lista de historias */}
              {historiasUsuario.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <BookOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                  <Title level={4} type="secondary">No hay historias de usuario definidas</Title>
                  <Text type="secondary">Comienza agregando la primera historia de usuario de tu proyecto</Text>
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {historiasUsuario.map((historia) => (
                    <Col key={historia.id} xs={24} sm={24} md={12} lg={8} xl={8} xxl={6}>
                      <HistoriaUsuarioItem
                        key={historia.id}
                        historia={historia}
                        onEditar={handleEditar}
                        onEliminar={handleEliminar}
                        loading={loadingSubmit}
                        catalogosDisponibles={catalogos &&
                          Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
                          Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
                          Array.isArray(catalogos.unidades_estimacion) && catalogos.unidades_estimacion.length > 0
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