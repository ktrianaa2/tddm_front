import React from 'react';
import {
  Card,
  Button,
  Tag,
  Row,
  Col,
  Space,
  Typography,
  message,
  Statistic,
  Divider
} from 'antd';
import {
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
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

const { Text, Paragraph, Title } = Typography;

const InfoTab = ({ proyecto, onBack, onEditar }) => {
  const getStatusTag = (estado) => {
    const statusMap = {
      'Requisitos': { color: 'blue', text: 'En Requisitos' },
      'Diseño': { color: 'purple', text: 'En Diseño' },
      'Desarrollo': { color: 'orange', text: 'En Desarrollo' },
      'Pruebas': { color: 'cyan', text: 'En Pruebas' },
      'Completado': { color: 'green', text: 'Completado' },
    };

    const status = statusMap[estado] || { color: 'default', text: estado };
    return <Tag className={`tag tag-${status.color}`} style={{ fontSize: '14px', padding: '4px 12px' }}>{status.text}</Tag>;
  };

  const handleEditarProyecto = () => {
    if (onEditar) {
      onEditar(proyecto);
    } else {
      message.info('La función de editar estará disponible próximamente');
    }
  };

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
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileTextOutlined style={{ fontSize: '24px', color: 'white' }} />
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

            {/* Estado y Descripción */}
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Estado Actual
                </Text>
                {getStatusTag(proyecto.estado)}
              </div>

              <div>
                <Text strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Descripción
                </Text>
                {proyecto.descripcion ? (
                  <Paragraph style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    padding: '12px',
                    background: 'var(--bg-hover)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {proyecto.descripcion}
                  </Paragraph>
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--bg-hover)',
                    borderRadius: '8px',
                    border: '2px dashed var(--border-color)'
                  }}>
                    <FileTextOutlined style={{ fontSize: '32px', color: 'var(--text-tertiary)', marginBottom: '8px' }} />
                    <Text type="secondary" italic style={{ display: 'block' }}>
                      No hay descripción disponible
                    </Text>
                  </div>
                )}
              </div>

              {/* Fechas en diseño mejorado */}
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{
                    padding: '16px',
                    background: 'var(--bg-hover)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space>
                        <CalendarOutlined style={{ color: 'var(--primary-color)', fontSize: '18px' }} />
                        <Text strong style={{ color: 'var(--text-secondary)' }}>Fecha de Creación</Text>
                      </Space>
                      <Text style={{ color: 'var(--text-primary)', fontSize: '15px', display: 'block', marginLeft: '26px' }}>
                        {proyecto.fecha_creacion || proyecto.fecha_actualizacion}
                      </Text>
                    </Space>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{
                    padding: '16px',
                    background: 'var(--bg-hover)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space>
                        <ClockCircleOutlined style={{ color: 'var(--info-color)', fontSize: '18px' }} />
                        <Text strong style={{ color: 'var(--text-secondary)' }}>Última Actualización</Text>
                      </Space>
                      <Text style={{ color: 'var(--text-primary)', fontSize: '15px', display: 'block', marginLeft: '26px' }}>
                        {proyecto.fecha_actualizacion}
                      </Text>
                    </Space>
                  </div>
                </Col>
              </Row>
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
            style={{
              marginBottom: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12} md={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #e6f4ff, #f0f5ff)',
                  borderRadius: '10px',
                  border: '1px solid #91caff',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>0</div>
                  <Text style={{ color: '#595959', fontSize: '13px' }}>Requisitos</Text>
                </div>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #fff7e6, #fffbf0)',
                  borderRadius: '10px',
                  border: '1px solid #ffd591',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <CodeOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '8px' }} />
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '4px' }}>0</div>
                  <Text style={{ color: '#595959', fontSize: '13px' }}>Casos de Uso</Text>
                </div>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f9f0ff, #faf5ff)',
                  borderRadius: '10px',
                  border: '1px solid #d3adf7',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <TeamOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '8px' }} />
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#722ed1', marginBottom: '4px' }}>0</div>
                  <Text style={{ color: '#595959', fontSize: '13px' }}>Historias</Text>
                </div>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #fff1f0, #fff5f5)',
                  borderRadius: '10px',
                  border: '1px solid #ffccc7',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <BugOutlined style={{ fontSize: '32px', color: '#f5222d', marginBottom: '8px' }} />
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f5222d', marginBottom: '4px' }}>0</div>
                  <Text style={{ color: '#595959', fontSize: '13px' }}>Pruebas</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Estado del Proyecto */}
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: 'var(--success-color)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Progreso General</span>
              </Space>
            }
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'linear-gradient(135deg, var(--bg-hover), var(--bg-card))',
              borderRadius: '10px',
              border: '2px dashed var(--border-color)'
            }}>
              <FolderOpenOutlined
                style={{
                  fontSize: '64px',
                  color: 'var(--primary-color)',
                  marginBottom: '16px',
                  opacity: 0.6
                }}
              />
              <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                Proyecto Iniciado
              </Title>
              <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                Comienza a agregar requisitos, casos de uso y otros elementos para ver el progreso de tu proyecto en tiempo real.
              </Paragraph>
            </div>
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
            style={{
              marginBottom: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
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
            style={{
              marginBottom: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'var(--bg-hover)',
                borderRadius: '8px'
              }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Elementos Totales</Text>
                <Text strong style={{ color: 'var(--text-primary)', fontSize: '18px' }}>0</Text>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'var(--bg-hover)',
                borderRadius: '8px'
              }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Progreso</Text>
                <Text strong style={{ color: 'var(--success-color)', fontSize: '18px' }}>0%</Text>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'var(--bg-hover)',
                borderRadius: '8px'
              }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Estado</Text>
                {getStatusTag(proyecto.estado)}
              </div>
            </Space>
          </Card>

          {/* Información Temporal */}
          <Card
            style={{
              background: 'linear-gradient(135deg, var(--primary-light), var(--bg-card))',
              border: '1px solid var(--primary-color)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)'
            }}
          >
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <CalendarOutlined
                style={{
                  fontSize: '48px',
                  color: 'var(--primary-color)',
                  marginBottom: '16px'
                }}
              />
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{
                  color: 'var(--text-primary)',
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Última Actualización
                </Text>
                <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {proyecto.fecha_actualizacion}
                </Text>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <Text style={{
                fontSize: '13px',
                color: 'var(--text-tertiary)',
                display: 'block'
              }}>
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