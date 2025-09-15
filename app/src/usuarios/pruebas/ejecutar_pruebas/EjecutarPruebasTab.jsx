import React from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Progress,
  Row,
  Col
} from 'antd';
import {
  PlayCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import '../../../styles/tabs.css'

const { Title, Paragraph, Text } = Typography;

const EjecutarPruebasTab = ({ proyecto }) => {
  // Datos simulados para mostrar el diseño
  const estadisticasPruebas = {
    total: 0,
    pasadas: 0,
    fallidas: 0,
    pendientes: 0,
    cobertura: 0
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
          <PlayCircleOutlined style={{ marginRight: '0.5rem', color: '#52c41a' }} />
          Ejecución de Pruebas
        </Title>
        <Paragraph type="secondary">
          Centro de control para ejecutar y monitorear pruebas automatizadas
        </Paragraph>
      </div>

      {/* Estadísticas rápidas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '2rem' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: '2rem', color: '#52c41a', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#52c41a' }}>
              {estadisticasPruebas.pasadas}
            </div>
            <Text type="secondary">Pasadas</Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <CloseCircleOutlined style={{ fontSize: '2rem', color: '#ff4d4f', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4d4f' }}>
              {estadisticasPruebas.fallidas}
            </div>
            <Text type="secondary">Fallidas</Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <ClockCircleOutlined style={{ fontSize: '2rem', color: '#faad14', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#faad14' }}>
              {estadisticasPruebas.pendientes}
            </div>
            <Text type="secondary">Pendientes</Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <Progress 
                type="circle" 
                percent={estadisticasPruebas.cobertura} 
                width={40}
                strokeColor="#1890ff"
              />
            </div>
            <Text type="secondary">Cobertura</Text>
          </Card>
        </Col>
      </Row>

      <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ 
          fontSize: '4rem', 
          color: 'var(--text-disabled)', 
          marginBottom: '2rem' 
        }}>
          <PlayCircleOutlined />
        </div>
        
        <Title level={2} type="secondary" style={{ marginBottom: '1rem' }}>
          Motor de Ejecución en Desarrollo
        </Title>
        
        <Paragraph type="secondary" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          El sistema de ejecución automática de pruebas estará disponible próximamente.
          Podrás ejecutar, monitorear y analizar resultados de pruebas desde esta interfaz.
        </Paragraph>

        <div style={{ 
          background: 'var(--bg-gray)', 
          padding: '2rem', 
          borderRadius: 'var(--border-radius-lg)', 
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <Title level={4} style={{ marginBottom: '1rem' }}>
            <ThunderboltOutlined style={{ marginRight: '0.5rem', color: '#722ed1' }} />
            Capacidades del Motor de Ejecución
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                color: 'var(--text-secondary)',
                lineHeight: '2'
              }}>
                <li>🚀 Ejecución paralela de pruebas</li>
                <li>📊 Reportes en tiempo real</li>
                <li>🔄 Integración continua</li>
                <li>📱 Notificaciones automáticas</li>
              </ul>
            </Col>
            <Col xs={24} md={12}>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                color: 'var(--text-secondary)',
                lineHeight: '2'
              }}>
                <li>📈 Métricas de rendimiento</li>
                <li>🎯 Análisis de cobertura</li>
                <li>🔍 Logs detallados</li>
                <li>📋 Historial de ejecuciones</li>
              </ul>
            </Col>
          </Row>
        </div>

        <Space size="large" wrap>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            className="btn btn-primary"
            size="large"
            disabled
          >
            Ejecutar Todas las Pruebas
          </Button>
          
          <Button 
            icon={<ThunderboltOutlined />}
            className="btn btn-secondary"
            disabled
          >
            Ejecución Rápida
          </Button>

          <Button 
            icon={<CheckCircleOutlined />}
            className="btn btn-secondary"
            disabled
          >
            Solo Pruebas Críticas
          </Button>
        </Space>

        <div style={{ marginTop: '2rem' }}>
          <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #bae7ff' }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text style={{ color: '#1890ff' }}>
                <strong>Próximamente:</strong> Programación automática de pruebas y integración con pipelines CI/CD
              </Text>
            </Space>
          </Card>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-disabled)' }}>
          <Paragraph type="secondary">
            💡 Una vez configuradas las pruebas, podrás ejecutarlas y ver los resultados aquí
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default EjecutarPruebasTab;