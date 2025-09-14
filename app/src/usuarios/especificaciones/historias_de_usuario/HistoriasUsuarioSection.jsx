import React, { useState, useEffect } from 'react';
import { Card, Button, List, Typography, Tag, message, Spin, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import HistoriasUsuarioFormContainer from './HistoriasUsuarioFormContainer'; import { getStoredToken, API_ENDPOINTS, postJSONAuth, getWithAuth, putJSONAuth, deleteWithAuth } from '../../../../config';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const HistoriasUsuarioSection = ({ proyectoId }) => {
  const [historias, setHistorias] = useState([]);
  const [editing, setEditing] = useState(null); // null = lista, {} = creando, {datos} = editando
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // ESTADOS PARA CATÁLOGOS
  const [catalogos, setCatalogos] = useState(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState(null);

  // Mapeo de colores para prioridades
  const prioridadColors = {
    'critica': '#ff4d4f',
    'alta': '#fa8c16',
    'media': '#fadb14',
    'baja': '#52c41a',
    'muy-alta': '#ff4d4f',
    'muy-baja': '#87d068'
  };

  // Mapeo de colores para estados
  const estadoColors = {
    'pendiente': '#d9d9d9',
    'en-progreso': '#1890ff',
    'en-desarrollo': '#1890ff',
    'en-revision': '#fa8c16',
    'completada': '#52c41a',
    'completado': '#52c41a',
    'cancelada': '#ff4d4f',
    'cancelado': '#ff4d4f',
    'bloqueada': '#ff4d4f'
  };

  // Mapeo de colores para unidades de estimación
  const estimacionColors = {
    'story-points': '#1890ff',
    'horas': '#52c41a',
    'dias': '#fa8c16',
    'costo': '#722ed1'
  };

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    setErrorCatalogos(null);

    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const [prioridadesResponse, estadosResponse, estimacionResponse] = await Promise.allSettled([
        getWithAuth(API_ENDPOINTS.PRIORIDADES, token),
        getWithAuth(API_ENDPOINTS.ESTADOS_ELEMENTO, token),
        getWithAuth(API_ENDPOINTS.TIPOS_ESTIMACION, token)
      ]);

      const catalogosData = {
        prioridades: [],
        estados: [],
        unidades_estimacion: []
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

      // Procesar estados (filtrar para historias de usuario)
      if (estadosResponse.status === 'fulfilled' && estadosResponse.value) {
        const estadosData = estadosResponse.value.estados_elemento || estadosResponse.value.estados || estadosResponse.value.data || estadosResponse.value;
        if (Array.isArray(estadosData)) {
          const estadosHistorias = estadosData.filter(estado =>
            estado.tipo === 'historia_usuario' || !estado.tipo
          );
          catalogosData.estados = estadosHistorias.map(estado => ({
            id: estado.id || estado.estado_id,
            nombre: estado.nombre,
            key: estado.key || estado.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
            descripcion: estado.descripcion || '',
            tipo: estado.tipo,
            activo: estado.activo !== false
          }));
        }
      }

      // Procesar unidades de estimación
      if (estimacionResponse.status === 'fulfilled' && estimacionResponse.value) {
        const estimacionData = estimacionResponse.value.tipos_estimacion || estimacionResponse.value.data || estimacionResponse.value;
        if (Array.isArray(estimacionData)) {
          catalogosData.unidades_estimacion = estimacionData.map(estimacion => ({
            id: estimacion.id || estimacion.estimacion_id,
            nombre: estimacion.nombre,
            key: estimacion.key || estimacion.nombre?.toLowerCase().replace(/[\s_-]+/g, '-'),
            descripcion: estimacion.descripcion || '',
            activo: estimacion.activo !== false
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

  // Cargar historias de usuario del proyecto
  const cargarHistorias = async () => {
    if (!proyectoId) return;

    setLoading(true);
    try {
      const token = getStoredToken();
      const response = await getWithAuth(`${API_ENDPOINTS.LISTAR_HISTORIAS_USUARIO}/${proyectoId}/`, token);
      const historiasData = response.historias || response.historias_usuario || response.data || [];

      const historiasProcessed = historiasData.map(historia => ({
        id: historia.id,
        descripcion_historia: historia.descripcion || historia.titulo || '',
        actor_rol: historia.actor_rol || '',
        funcionalidad_accion: historia.funcionalidad_accion || '',
        beneficio_razon: historia.beneficio_razon || '',
        criterios_aceptacion: historia.criterios_aceptacion || '',
        dependencias_relaciones: historia.dependencias_relaciones || '',
        componentes_relacionados: historia.componentes_relacionados || '',
        valor_negocio: historia.valor_negocio,
        notas_adicionales: historia.notas_adicionales || '',
        proyecto_id: historia.proyecto_id,
        fecha_creacion: historia.fecha_creacion,
        prioridad: historia.prioridad,
        estado: historia.estado,
        estimacion_valor: historia.estimacion_valor,
        unidad_estimacion: historia.unidad_estimacion,
        estimaciones: historia.estimaciones || []
      }));
      setHistorias(historiasProcessed);
    } catch (error) {
      message.error(`Error al cargar historias de usuario: ${error.message}`);
      setHistorias([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (proyectoId) {
      if (!catalogos) {
        cargarCatalogos();
      }
      cargarHistorias();
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

      // Recargar las historias para ver los cambios
      await cargarHistorias();
      setEditing(null);

    } catch (error) {
      message.error(`Error al guardar historia de usuario: ${error.message}`);
    } finally {
      setLoadingSubmit(false);
    }
  };



  // Manejar eliminación de historia
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
          await cargarHistorias();
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
      await cargarCatalogos();
      return;
    }

    await cargarHistoriaParaEdicion(historia.id);
  };

  // Funciones helper para obtener colores
  const getColorPrioridad = (prioridad) => {
    return prioridadColors[prioridad] || '#d9d9d9';
  };

  const getColorEstado = (estado) => {
    return estadoColors[estado] || '#d9d9d9';
  };

  const getColorEstimacion = (unidad) => {
    return estimacionColors[unidad] || '#d9d9d9';
  };

  const getEtiquetaFormateada = (valor) => {
    if (!valor) return '';
    return valor.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Extraer el título de la descripción de la historia (primeras palabras hasta 50 caracteres)
  const extraerTitulo = (descripcionHistoria) => {
    if (!descripcionHistoria) return 'Sin título';
    return descripcionHistoria.length > 50
      ? `${descripcionHistoria.substring(0, 50)}...`
      : descripcionHistoria;
  };

  // Manejar cancelación
  const handleCancelar = () => {
    setEditing(null);
  };

  // Recargar tanto catálogos como historias
  const handleRecargarTodo = async () => {
    await Promise.all([
      cargarCatalogos(),
      cargarHistorias()
    ]);
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
        <HistoriasUsuarioFormContainer
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          historiasExistentes={historias}
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
                {historias.length} historia{historias.length !== 1 ? "s" : ""} de usuario
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
              {historias.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <BookOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                  <Title level={4} type="secondary">No hay historias de usuario definidas</Title>
                  <Text type="secondary">Comienza agregando la primera historia de usuario de tu proyecto</Text>
                </Card>
              ) : (
                <Card>
                  <List
                    dataSource={historias}
                    renderItem={(historia) => (
                      <List.Item
                        key={historia.id}
                        actions={[
                          <Button
                            className="btn btn-info btn-card"
                            icon={<EditOutlined />}
                            onClick={() => handleEditar(historia)}
                            size="small"
                            loading={loadingSubmit}
                            disabled={!catalogos} // DESHABILITADO si no hay catálogos
                          >
                            Editar
                          </Button>,
                          <Button
                            className="btn btn-danger btn-card"
                            icon={<DeleteOutlined />}
                            onClick={() => handleEliminar(historia)}
                            size="small"
                            disabled={loadingSubmit}
                          >
                            Eliminar
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <Text strong>{extraerTitulo(historia.descripcion_historia)}</Text>
                              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                {historia.prioridad && (
                                  <Tag
                                    color={getColorPrioridad(historia.prioridad)}
                                    style={{ fontSize: "10px", margin: 0 }}
                                  >
                                    {getEtiquetaFormateada(historia.prioridad)}
                                  </Tag>
                                )}
                                {historia.estado && (
                                  <Tag
                                    color={getColorEstado(historia.estado)}
                                    style={{ fontSize: "10px", margin: 0 }}
                                  >
                                    {getEtiquetaFormateada(historia.estado)}
                                  </Tag>
                                )}
                                {(historia.unidad_estimacion && historia.estimacion_valor) && (
                                  <Tag
                                    color={getColorEstimacion(historia.unidad_estimacion)}
                                    style={{ fontSize: "10px", margin: 0 }}
                                  >
                                    {historia.estimacion_valor} {historia.unidad_estimacion === 'story-points' ? 'SP' :
                                      historia.unidad_estimacion === 'horas' ? 'hrs' :
                                        historia.unidad_estimacion === 'dias' ? 'días' : '$'}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          }
                          description={
                            <div>
                              <Text type="secondary" style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
                                {historia.descripcion_historia?.length > 150
                                  ? `${historia.descripcion_historia.substring(0, 150)}...`
                                  : historia.descripcion_historia}
                              </Text>
                              {historia.actor_rol && (
                                <div style={{ marginTop: "0.5rem" }}>
                                  <Text style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    <strong>Actor:</strong> {historia.actor_rol}
                                  </Text>
                                </div>
                              )}
                              {historia.valor_negocio && (
                                <div style={{ marginTop: "0.25rem" }}>
                                  <Text style={{ fontSize: "11px", color: "var(--text-disabled)" }}>
                                    Valor de Negocio: {historia.valor_negocio}/100
                                  </Text>
                                </div>
                              )}
                              {historia.fecha_creacion && (
                                <div style={{ marginTop: "0.25rem" }}>
                                  <Text style={{ fontSize: "11px", color: "var(--text-disabled)" }}>
                                    Creado: {new Date(historia.fecha_creacion).toLocaleDateString('es-ES', {
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

export default HistoriasUsuarioSection;