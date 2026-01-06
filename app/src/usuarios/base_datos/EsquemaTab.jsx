import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Empty,
  Spin,
  message,
  List,
  Tag,
  Space,
  Tooltip,
  Divider,
  Row,
  Col,
  Modal
} from 'antd';
import {
  DatabaseOutlined,
  ReloadOutlined,
  UploadOutlined,
  PlusOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useRequisitos } from '../../hooks/useRequisitos';
import { useHistoriasUsuario } from '../../hooks/useHistoriasdeUsuario';
import { useCasosUso } from '../../hooks/useCasosdeUso';
import { useEsquemaBD } from '../../hooks/useEsquemaBD';
import VistaCrearEsquema from './VistaCrearEsquema';
import VistaSubirEsquema from './VistaSubirEsquema';
import VistaVerEsquema from './VistaVerEsquema';
import '../../styles/tabs.css';
import '../../styles/buttons.css';
import '../../styles/esquema-tab-styles.css';

const EsquemaTab = ({ proyecto }) => {
  const proyectoId = proyecto?.proyecto_id;
  const [vistaActual, setVistaActual] = useState('listado');
  const [esquemaSeleccionado, setEsquemaSeleccionado] = useState(null);

  // Hook de Requisitos
  const {
    requisitos,
    loading: loadingRequisitos,
    cargarRequisitos
  } = useRequisitos(proyectoId, false);

  // Hook de Historias de Usuario
  const {
    historiasUsuario,
    loading: loadingHistorias,
    cargarHistoriasUsuario
  } = useHistoriasUsuario(proyectoId, false);

  // Hook de Casos de Uso
  const {
    casosUso,
    loading: loadingCasosUso,
    cargarCasosUso
  } = useCasosUso(proyectoId, false);

  // Hook de Esquema BD
  const {
    esquemas,
    motoresBD,
    loading: loadingEsquemaBD,
    tieneEsquema,
    getEsquemaPrincipal,
    estadisticas,
    guardarEsquema,
    eliminarEsquema,
    cargarEsquemas,
    recargarTodo: recargarEsquema,
    obtenerEsquema
  } = useEsquemaBD(proyectoId);

  const loading = loadingRequisitos || loadingEsquemaBD || loadingHistorias || loadingCasosUso;

  // Verificar si hay CUALQUIER especificación
  const tieneEspecificaciones =
    (requisitos && requisitos.length > 0) ||
    (historiasUsuario && historiasUsuario.length > 0) ||
    (casosUso && casosUso.length > 0);

  const totalEspecificaciones = (requisitos?.length || 0) + (historiasUsuario?.length || 0) + (casosUso?.length || 0);

  // Cargar todas las especificaciones cuando cambie el proyecto
  useEffect(() => {
    if (proyectoId) {
      cargarRequisitos();
      cargarHistoriasUsuario();
      cargarCasosUso();
    }
  }, [proyectoId, cargarRequisitos, cargarHistoriasUsuario, cargarCasosUso]);

  // Auto-seleccionar el primer esquema si existe
  useEffect(() => {
    if (!loading && tieneEsquema && esquemas.length > 0 && !esquemaSeleccionado) {
      setEsquemaSeleccionado(esquemas[0]);
    }
  }, [loading, tieneEsquema, esquemas, esquemaSeleccionado]);

  // Handlers
  const handleEsquemaCreado = () => {
    message.success('Esquema creado exitosamente');
    cargarEsquemas();
    setVistaActual('listado');
  };

  const handleEsquemaCargado = () => {
    message.success('Esquema cargado exitosamente');
    cargarEsquemas();
    setVistaActual('listado');
  };

  const handleEliminarEsquema = (esquemaId) => {
    Modal.confirm({
      title: 'Eliminar Esquema',
      content: '¿Estás seguro de que deseas eliminar este esquema? Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        eliminarEsquema(esquemaId, () => {
          message.success('Esquema eliminado exitosamente');
          if (esquemaSeleccionado?.id === esquemaId) {
            setEsquemaSeleccionado(null);
          }
          cargarEsquemas();
        });
      }
    });
  };

  const handleRecargarTodo = () => {
    Promise.all([
      cargarRequisitos(),
      cargarHistoriasUsuario(),
      cargarCasosUso(),
      recargarEsquema()
    ]).then(() => {
      message.success('Datos actualizados');
    });
  };

  const handleSeleccionarEsquema = (esquema) => {
    setEsquemaSeleccionado(esquema);
  };

  const handleCrearConIA = () => {
    if (!tieneEspecificaciones) {
      Modal.info({
        title: 'Especificaciones Requeridas',
        content: 'Debes crear al menos una especificación (requisito, historia de usuario o caso de uso) antes de generar un esquema con IA.',
        okText: 'Entendido'
      });
      return;
    }
    setVistaActual('crear');
  };

  const handleSubirEsquema = () => {
    setVistaActual('subir');
  };

  // Vista: Cargando
  if (loading) {
    return (
      <div className="tab-main-content">
        <div className="tab-loading-state">
          <Spin size="large" />
          <div className="tab-loading-text">
            Cargando información de la base de datos...
          </div>
        </div>
      </div>
    );
  }

  // Vista: Subir Esquema
  if (vistaActual === 'subir') {
    return (
      <VistaSubirEsquema
        proyectoId={proyectoId}
        onEsquemaCargado={handleEsquemaCargado}
        onCancelar={() => setVistaActual('listado')}
      />
    );
  }

  // Vista: Crear Esquema con IA
  if (vistaActual === 'crear') {
    return (
      <VistaCrearEsquema
        proyectoId={proyectoId}
        motoresBD={motoresBD}
        requisitos={requisitos}
        historiasUsuario={historiasUsuario}
        casosUso={casosUso}
        onEsquemaCreado={handleEsquemaCreado}
        onCancelar={() => setVistaActual('listado')}
      />
    );
  }

  // Vista Principal: Listado de Esquemas
  return (
    <>
      {/* Header con controles principales */}
      <div className="tab-header">
        <div className="tab-header-content">
          <h3 className="tab-title">
            <DatabaseOutlined style={{ marginRight: 'var(--space-sm)' }} />
            Base de Datos
          </h3>
          <p className="tab-subtitle">
            Gestiona los esquemas de tu base de datos
          </p>
        </div>
        <div className="tab-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRecargarTodo}
            className="btn btn-secondary"
          >
            Actualizar
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={handleSubirEsquema}
            className="btn btn-secondary"
          >
            Subir
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCrearConIA}
            disabled={!tieneEspecificaciones}
            title={!tieneEspecificaciones ? 'Necesitas al menos una especificación para generar con IA' : ''}
            className="btn btn-primary"
          >
            Generar con IA
          </Button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="tab-main-content">
        {esquemas.length === 0 ? (
          // Empty State: Sin esquemas
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
                    No hay esquemas creados
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Comienza creando un nuevo esquema con IA o sube uno existente
                  </p>
                </div>
              }
            />
            {!tieneEspecificaciones && (
              <div className="esquema-empty-warning">
                <LockOutlined />
                Necesitas crear especificaciones para usar la generación con IA
              </div>
            )}
          </Card>
        ) : (
          // Vista con esquemas
          <div className="esquema-grid-container">
            {/* Panel Izquierdo: Lista de Esquemas */}
            <div className="esquema-sidebar">
              <Card
                title={
                  <span className="esquema-list-title">
                    Esquemas ({esquemas.length})
                  </span>
                }
                className="esquema-list-card"
              >
                <List
                  dataSource={esquemas}
                  renderItem={(esquema) => (
                    <List.Item
                      key={esquema.id}
                      className={`esquema-list-item ${esquemaSeleccionado?.id === esquema.id ? 'active' : ''}`}
                      onClick={() => handleSeleccionarEsquema(esquema)}
                    >
                      <div className="esquema-list-item-header">
                        <div className="esquema-list-item-icon-wrapper">
                          <DatabaseOutlined
                            className="esquema-list-item-icon"
                            style={{ color: esquema.motor_bd_color || '#1890ff' }}
                          />
                        </div>
                        <div className="esquema-list-item-title">
                          Esquema {esquema.id}
                        </div>
                      </div>
                      <div className="esquema-list-item-tags">
                        <Tooltip title={esquema.motor_bd_nombre}>
                          <Tag
                            color={esquema.motor_bd_color || '#1890ff'}
                            className="esquema-tag"
                          >
                            {esquema.motor_bd_nombre?.substring(0, 8)}
                          </Tag>
                        </Tooltip>
                        <Tag className="esquema-tag">
                          {esquema.total_tablas || esquema.tablas?.length || 0} tbl
                        </Tag>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>

              {/* Información de especificaciones */}
              {tieneEspecificaciones && (
                <Card className="esquema-specs-card">
                  <h4 className="esquema-specs-title">
                    📊 Especificaciones
                  </h4>
                  <div className="esquema-specs-content">
                    {requisitos.length > 0 && (
                      <div className="esquema-specs-item">
                        <strong className="esquema-specs-count requisitos-color">
                          {requisitos.length}
                        </strong>
                        <span className="esquema-specs-label"> requisito(s)</span>
                      </div>
                    )}
                    {historiasUsuario.length > 0 && (
                      <div className="esquema-specs-item">
                        <strong className="esquema-specs-count historias-color">
                          {historiasUsuario.length}
                        </strong>
                        <span className="esquema-specs-label"> historia(s)</span>
                      </div>
                    )}
                    {casosUso.length > 0 && (
                      <div className="esquema-specs-item">
                        <strong className="esquema-specs-count casos-color">
                          {casosUso.length}
                        </strong>
                        <span className="esquema-specs-label"> caso(s)</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Panel Derecho: Detalles o Mensaje */}
            <div className="esquema-content">
              {esquemaSeleccionado ? (
                <VistaVerEsquema
                  proyectoId={proyectoId}
                  esquemaPrincipal={esquemaSeleccionado}
                  estadisticas={{
                    esquemaPrincipal: esquemaSeleccionado,
                    motorBD: motoresBD?.find(m => m.id === esquemaSeleccionado.motor_bd_id),
                    totalTablas: esquemaSeleccionado.total_tablas || esquemaSeleccionado.tablas?.length || 0,
                    totalColumnas: esquemaSeleccionado.tablas?.reduce((sum, tabla) => {
                      return sum + (tabla.columns?.length || 0);
                    }, 0) || 0,
                    tablas: esquemaSeleccionado.tablas || []
                  }}
                  loading={false}
                  onRecargar={handleRecargarTodo}
                  onEliminar={() => handleEliminarEsquema(esquemaSeleccionado.id)}
                  onEditar={() => setVistaActual('crear')}
                  onVolver={() => setEsquemaSeleccionado(null)}
                  modoCompacto={true}
                />
              ) : (
                <Card style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Selecciona un esquema de la lista para ver sus detalles
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EsquemaTab;