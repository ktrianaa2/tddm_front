import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, message, Spin, Modal, Row, Col } from 'antd';
import { PlusOutlined, BookOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import HistoriasUsuarioFormContainer from './HistoriasUsuarioFormContainer';
import HistoriaUsuarioItem from './HistoriaUsuarioItem';
import { useHistoriasUsuario } from '../../../hooks/useHistoriasdeUsuario';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const HistoriasUsuarioSection = ({ proyectoId }) => {
  const [editing, setEditing] = useState(null); // null = lista, {} = creando, {datos} = editando

  // Usar el hook refactorizado con autoLoad en true
  const {
    historiasUsuario,
    catalogos,
    loading,
    loadingCatalogos,
    loadingAccion,
    errorCatalogos,
    obtenerHistoriaUsuario,
    crearHistoriaUsuario,
    actualizarHistoriaUsuario,
    eliminarHistoriaUsuario,
    cargarCatalogos
  } = useHistoriasUsuario(proyectoId, true);

  // Adaptar catálogos para compatibilidad con el formulario
  // El formulario espera 'unidades_estimacion' pero el hook retorna 'tipos_estimacion'
  const catalogosAdaptados = catalogos ? {
    ...catalogos,
    unidades_estimacion: catalogos.tipos_estimacion || []
  } : null;

  // Recargar catálogos si hay error
  useEffect(() => {
    if (errorCatalogos && proyectoId) {
      const timer = setTimeout(() => {
        cargarCatalogos();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorCatalogos, proyectoId, cargarCatalogos]);

  const cargarHistoriaParaEdicion = async (historiaId) => {
    try {
      const historiaBackend = await obtenerHistoriaUsuario(historiaId);

      if (!historiaBackend) {
        throw new Error('No se pudo obtener la información de la historia de usuario');
      }

      // Función helper para mapear keys a IDs
      const mapearKeyAId = (keyOrId, catalogo) => {
        if (!keyOrId || !catalogo || !Array.isArray(catalogo)) return null;

        const keyOrIdStr = keyOrId.toString();

        // 1. Buscar por ID exacto primero
        let found = catalogo.find(item => item.id?.toString() === keyOrIdStr);
        if (found) return found.id.toString();

        // 2. Buscar por key normalizada
        const normalizedKey = keyOrIdStr.toLowerCase();
        found = catalogo.find(item => item.key === normalizedKey);
        if (found) return found.id.toString();

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

        if (found) return found.id.toString();
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
        const prioridadId = mapearKeyAId(historiaBackend.prioridad, catalogos.prioridades);
        if (prioridadId) historiaParaEditar.prioridad = prioridadId;
      }

      // Mapear estado  
      if (historiaBackend.estado && catalogos.estados) {
        const estadoId = mapearKeyAId(historiaBackend.estado, catalogos.estados);
        if (estadoId) historiaParaEditar.estado = estadoId;
      }

      const estimacionesParaFormulario = [];

      // Procesar múltiples estimaciones
      if (historiaBackend.estimaciones && Array.isArray(historiaBackend.estimaciones) && historiaBackend.estimaciones.length > 0) {
        historiaBackend.estimaciones.forEach((est, index) => {
          let tipoEstimacionId = null;

          if (est.tipo_estimacion_id) {
            // Verificar que existe en nuestro catálogo
            const tipoExiste = catalogos.tipos_estimacion?.find(
              t => t.id.toString() === est.tipo_estimacion_id.toString()
            );
            if (tipoExiste) {
              tipoEstimacionId = est.tipo_estimacion_id.toString();
            }
          }
          // Fallback: buscar por nombre
          else if (est.tipo_estimacion_nombre) {
            tipoEstimacionId = mapearKeyAId(
              est.tipo_estimacion_nombre,
              catalogos.tipos_estimacion
            );
          }

          // Si tenemos tipo válido y valor válido, agregar la estimación
          if (tipoEstimacionId && (est.valor !== null && est.valor !== undefined)) {
            estimacionesParaFormulario.push({
              id: est.id || `existing_${Date.now()}_${index}`,
              tipo_estimacion_id: tipoEstimacionId,
              valor: est.valor
            });
          }
        });
      }
      // Procesar estimación única (formato legacy)
      else if (historiaBackend.estimacion_valor && historiaBackend.unidad_estimacion) {
        const tipoEstimacionId = mapearKeyAId(
          historiaBackend.unidad_estimacion,
          catalogos.tipos_estimacion
        );

        if (tipoEstimacionId) {
          estimacionesParaFormulario.push({
            id: `existing_single_${Date.now()}`,
            tipo_estimacion_id: tipoEstimacionId,
            valor: historiaBackend.estimacion_valor
          });
        }
      }

      historiaParaEditar.estimaciones = estimacionesParaFormulario;
      setEditing(historiaParaEditar);

    } catch (error) {
      message.error(`Error al cargar historia de usuario: ${error.message}`);
    }
  };

  const handleGuardar = async (values) => {
    if (!proyectoId) {
      message.error('No se ha especificado el ID del proyecto');
      return;
    }

    try {
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
        // Actualizar historia existente
        result = await actualizarHistoriaUsuario(editing.id, dataToSend);
      } else {
        // Crear nueva historia
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

  const handleEditar = async (historia) => {
    // Verificar que los catálogos estén disponibles
    const catalogosDisponibles = catalogos &&
      Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
      Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
      Array.isArray(catalogos.tipos_estimacion) && catalogos.tipos_estimacion.length > 0;

    if (!catalogosDisponibles) {
      message.error('Los catálogos necesarios no están disponibles. Reintentando carga...');
      await cargarCatalogos();
      return;
    }

    await cargarHistoriaParaEdicion(historia.id);
  };

  const handleCancelar = () => {
    setEditing(null);
  };

  // Extraer el título de la descripción de la historia
  const extraerTitulo = (texto) => {
    if (!texto) return 'Sin título';
    return texto.length > 50 ? `${texto.substring(0, 50)}...` : texto;
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
        <Text type="secondary" style={{ display: 'block', marginBottom: '1rem' }}>
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
        <HistoriasUsuarioFormContainer
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={handleCancelar}
          historiasExistentes={historiasUsuario}
          proyectoId={proyectoId}
          loading={loadingAccion}
          catalogosExternos={catalogosAdaptados}
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