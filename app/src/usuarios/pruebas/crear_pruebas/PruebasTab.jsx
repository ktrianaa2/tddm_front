import React from 'react';
import {
  Card,
  Typography,
  Button,
  Space
} from 'antd';
import {
  BugOutlined,
  ToolOutlined,
  RocketOutlined
} from '@ant-design/icons';

import '../../../styles/tabs.css'


const { Title, Paragraph } = Typography;

const PruebasTab = ({ proyecto }) => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
          <BugOutlined style={{ marginRight: '0.5rem', color: '#fa541c' }} />
          Gestión de Pruebas
        </Title>
        <Paragraph type="secondary">
          Módulo de testing y validación de calidad del software
        </Paragraph>
      </div>

      <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ 
          fontSize: '4rem', 
          color: 'var(--text-disabled)', 
          marginBottom: '2rem' 
        }}>
          <BugOutlined />
        </div>
        
        <Title level={2} type="secondary" style={{ marginBottom: '1rem' }}>
          Módulo de Pruebas en Desarrollo
        </Title>
        
        <Paragraph type="secondary" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Este módulo estará disponible próximamente y incluirá herramientas completas 
          para la gestión y ejecución de pruebas de software.
        </Paragraph>

        <div style={{ 
          background: 'var(--bg-gray)', 
          padding: '2rem', 
          borderRadius: 'var(--border-radius-lg)', 
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <Title level={4} style={{ marginBottom: '1rem' }}>
            <ToolOutlined style={{ marginRight: '0.5rem', color: '#1890ff' }} />
            Funcionalidades Planificadas
          </Title>
          
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            color: 'var(--text-secondary)',
            lineHeight: '2'
          }}>
            <li>✅ Gestión de casos de prueba</li>
            <li>✅ Pruebas unitarias, integración y sistema</li>
            <li>✅ Seguimiento de defectos y bugs</li>
            <li>✅ Planes de prueba automatizados</li>
            <li>✅ Métricas y reportes de cobertura</li>
            <li>✅ Integración con herramientas de CI/CD</li>
            <li>✅ Trazabilidad con requisitos</li>
          </ul>
        </div>

        <Space size="large">
          <Button 
            type="primary" 
            icon={<RocketOutlined />}
            className="btn btn-primary"
            disabled
          >
            Crear Plan de Pruebas
          </Button>
          
          <Button 
            icon={<BugOutlined />}
            className="btn btn-secondary"
            disabled
          >
            Gestionar Casos de Prueba
          </Button>
        </Space>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-disabled)' }}>
          <Paragraph type="secondary">
            💡 Mientras tanto, puedes documentar tus estrategias de prueba en la sección de especificaciones
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default PruebasTab;