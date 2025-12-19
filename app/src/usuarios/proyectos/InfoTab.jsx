import React, { useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Row,
  Col,
  Space,
  Typography,
  message,
  Divider,
  Spin
} from 'antd';
import {
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  CodeOutlined,
  BugOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import '../../styles/tabs.css';
import '../../styles/buttons.css';
import '../../styles/tags.css';
import '../../styles/info-tab.css';

// Importar los hooks
import { useRequisitos } from '../../hooks/useRequisitos';
import { useCasosUso } from '../../hooks/useCasosdeUso';
import { useHistoriasUsuario } from '../../hooks/useHistoriasdeUsuario';
import { usePruebas } from '../../hooks/usePruebas';

const { Text, Paragraph, Title } = Typography;

const InfoTab = ({ proyecto, onBack, onEditar }) => {
  // Inicializar hooks con el ID del proyecto
  const {
    requisitos,
    loading: loadingRequisitos,
    estadisticas: statsRequisitos,
    contadores: contadoresRequisitos
  } = useRequisitos(proyecto?.proyecto_id, true);

  const {
    casosUso,
    loading: loadingCasosUso,
    estadisticas: statsCasosUso,
    contadores: contadoresCasosUso
  } = useCasosUso(proyecto?.proyecto_id, true);

  const {
    historiasUsuario,
    loading: loadingHistorias,
    estadisticas: statsHistorias,
    contadores: contadoresHistorias
  } = useHistoriasUsuario(proyecto?.proyecto_id, true);

  const {
    pruebas,
    contadores: contadoresPruebas,
    loading: loadingPruebas,
    cargarPruebas
  } = usePruebas(proyecto?.proyecto_id, true);

  // Cargar pruebas al montar
  useEffect(() => {
    if (proyecto?.proyecto_id && !loadingPruebas && pruebas.length === 0) {
      cargarPruebas();
    }
  }, [proyecto?.proyecto_id]);

  // Calcular totales usando contadores en lugar de arrays
  const totalElementos = (contadoresRequisitos?.total || 0) +
    (contadoresCasosUso?.total || 0) +
    (contadoresHistorias?.total || 0);

  const isLoading = loadingRequisitos || loadingCasosUso || loadingHistorias || loadingPruebas;

  const getStatusTag = (estado) => {
    // Ahora estado es un objeto con {id, nombre, color, orden}
    if (!estado) {
      return <Tag style={{ fontSize: '14px', padding: '4px 12px' }}>Sin estado</Tag>;
    }

    // Usar el color del objeto estado, o un color por defecto
    const colorMap = {
      'blue': 'blue',
      'orange': 'orange',
      'green': 'green',
      'red': 'red',
      'purple': 'purple',
      'cyan': 'cyan',
      'magenta': 'magenta',
      'volcano': 'volcano',
      'gold': 'gold',
      'lime': 'lime',
      'default': 'default'
    };

    const tagColor = colorMap[estado.color] || estado.color || 'default';

    return (
      <Tag
        color={tagColor}
        style={{ fontSize: '14px', padding: '4px 12px' }}
      >
        {estado.nombre}
      </Tag>
    );
  };

  const handleEditarProyecto = () => {
    if (onEditar) {
      onEditar(proyecto);
    } else {
      message.info('La función de editar estará disponible próximamente');
    }
  };

  // Calcular progreso (simple: basado en si hay elementos creados)
  const calcularProgreso = () => {
    if (totalElementos === 0) return 0;

    let completados = 0;
    let total = 0;

    // Contar elementos por estado
    if (statsRequisitos) {
      Object.entries(statsRequisitos.porEstado).forEach(([estado, count]) => {
        total += count;
        if (estado.toLowerCase().includes('completado') || estado.toLowerCase().includes('aprobado')) {
          completados += count;
        }
      });
    }

    if (statsCasosUso) {
      Object.entries(statsCasosUso.porEstado).forEach(([estado, count]) => {
        total += count;
        if (estado.toLowerCase().includes('completado') || estado.toLowerCase().includes('aprobado')) {
          completados += count;
        }
      });
    }

    if (statsHistorias) {
      Object.entries(statsHistorias.porEstado).forEach(([estado, count]) => {
        total += count;
        if (estado.toLowerCase().includes('completado') || estado.toLowerCase().includes('aprobado')) {
          completados += count;
        }
      });
    }

    return total > 0 ? Math.round((completados / total) * 100) : 0;
  };

  const progreso = calcularProgreso();

  return (
    <div className="tab-main-content">
      <Row gutter={[24, 24]}>
        {/* Columna Principal - Izquierda */}
        <Col xs={24} lg={16}>
          {/* Card de Información General */}
          <Card
            className="info-card-modern"
            style={{
              marginBottom: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <Space size="middle">
                <div className="info-icon-wrapper">
                  <FileTextOutlined className="info-icon" />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                    {proyecto.nombre}
                  </Title>
                  <Text type="secondary">Información del Proyecto</Text>
                </div>
              </Space>
              <Button
                icon={<EditOutlined />}
                onClick={handleEditarProyecto}
                className="btn btn-primary"
                size="large"
              >
                Editar
              </Button>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong className="info-label">
                  Descripción
                </Text>
                {proyecto.descripcion ? (
                  <Paragraph className="info-description">
                    {proyecto.descripcion}
                  </Paragraph>
                ) : (
                  <div className="info-empty-description">
                    <FileTextOutlined className="info-empty-icon" />
                    <Text type="secondary" italic style={{ display: 'block' }}>
                      No hay descripción disponible
                    </Text>
                  </div>
                )}
              </div>
            </Space>
          </Card>

          {/* Card de Métricas */}
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: 'var(--success-color)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Métricas del Proyecto</span>
              </Space>
            }
            className="info-metrics-card"
            style={{
              marginBottom: '24px'
            }}
          >
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" tip="Cargando métricas..." />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={6}>
                  <div className="metric-box metric-box-blue">
                    <FileTextOutlined className="metric-icon" />
                    <div className="metric-value">{contadoresRequisitos?.total || 0}</div>
                    <Text className="metric-label">Requisitos</Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <div className="metric-box metric-box-orange">
                    <CodeOutlined className="metric-icon" />
                    <div className="metric-value">{contadoresCasosUso?.total || 0}</div>
                    <Text className="metric-label">Casos de Uso</Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <div className="metric-box metric-box-purple">
                    <TeamOutlined className="metric-icon" />
                    <div className="metric-value">{contadoresHistorias?.total || 0}</div>
                    <Text className="metric-label">Historias</Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <div className="metric-box metric-box-red">
                    <BugOutlined className="metric-icon" />
                    <div className="metric-value">{contadoresPruebas?.total || 0}</div>
                    <Text className="metric-label">Pruebas</Text>
                  </div>
                </Col>
              </Row>
            )}
          </Card>

          {/* Estado del Proyecto */}
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: 'var(--success-color)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Progreso General</span>
              </Space>
            }
            className="info-progress-card"
          >
            {totalElementos === 0 ? (
              <div className="info-empty-progress">
                <FolderOpenOutlined className="info-empty-progress-icon" />
                <Title level={4} className="info-empty-progress-title">
                  Proyecto Iniciado
                </Title>
                <Paragraph className="info-empty-progress-description">
                  Comienza a agregar requisitos, casos de uso y otros elementos para ver el progreso de tu proyecto en tiempo real.
                </Paragraph>
              </div>
            ) : (
              <div className="info-progress-content">
                <div className="info-progress-stats">
                  <div className="info-progress-stat">
                    <div className="info-progress-stat-value">{totalElementos}</div>
                    <div className="info-progress-stat-label">Elementos Totales</div>
                  </div>
                  <div className="info-progress-stat">
                    <div className="info-progress-stat-value info-progress-stat-value-success">
                      {progreso}%
                    </div>
                    <div className="info-progress-stat-label">Completado</div>
                  </div>
                </div>

                <div className="info-progress-bar-wrapper">
                  <div className="info-progress-bar">
                    <div
                      className="info-progress-bar-fill"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                <div className="info-progress-breakdown">
                  <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                    Desglose por tipo:
                  </Text>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <div className="info-breakdown-item">
                        <FileTextOutlined className="info-breakdown-icon" />
                        <span>{contadoresRequisitos?.total || 0} Requisitos</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="info-breakdown-item">
                        <CodeOutlined className="info-breakdown-icon" />
                        <span>{contadoresCasosUso?.total || 0} Casos de Uso</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="info-breakdown-item">
                        <TeamOutlined className="info-breakdown-icon" />
                        <span>{contadoresHistorias?.total || 0} Historias</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="info-breakdown-item">
                        <BugOutlined className="info-breakdown-icon" />
                        <span>{contadoresPruebas?.total || 0} Pruebas</span>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Panel Lateral - Derecha */}
        <Col xs={24} lg={8}>
          {/* Acciones Rápidas */}
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: 'var(--primary-color)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Acciones Rápidas</span>
              </Space>
            }
            className="info-actions-card"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                block
                icon={<EditOutlined />}
                className="btn btn-primary"
                onClick={handleEditarProyecto}
                size="large"
                style={{ height: '48px', fontSize: '15px' }}
              >
                Editar Proyecto
              </Button>

              <Button
                block
                icon={<SettingOutlined />}
                className="btn btn-secondary"
                disabled
                size="large"
                style={{ height: '48px', fontSize: '15px' }}
              >
                Configuración
              </Button>

              <Button
                block
                icon={<FileTextOutlined />}
                className="btn btn-info-outline"
                disabled
                size="large"
                style={{ height: '48px', fontSize: '15px' }}
              >
                Generar Documentación
              </Button>
            </Space>
          </Card>

          {/* Resumen Rápido */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: 'var(--info-color)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Resumen Rápido</span>
              </Space>
            }
            className="info-summary-card"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div className="info-summary-item">
                <Text className="info-summary-label">Elementos Totales</Text>
                <Text strong className="info-summary-value">{totalElementos}</Text>
              </div>

              <div className="info-summary-item">
                <Text className="info-summary-label">Progreso</Text>
                <Text strong className="info-summary-value info-summary-value-success">
                  {progreso}%
                </Text>
              </div>

              <div className="info-summary-item">
                <Text className="info-summary-label">Estado</Text>
                {getStatusTag(proyecto.estado)}
              </div>
            </Space>
          </Card>

          {/* Información Temporal */}
          <Card className="info-temporal-card">
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <CalendarOutlined className="info-temporal-icon" />
              <div style={{ marginBottom: '16px' }}>
                <Text strong className="info-temporal-label">
                  Última Actualización
                </Text>
                <Text className="info-temporal-value">
                  {proyecto.fecha_actualizacion}
                </Text>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <Text className="info-temporal-created">
                Creado el {proyecto.fecha_creacion || proyecto.fecha_actualizacion}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InfoTab;