import React from 'react';
import {
  Card,
  Button,
  Tag,
  Descriptions,
  Row,
  Col,
  Space,
  Typography,
  message
} from 'antd';
import {
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import '../../styles/tabs.css'

const { Text, Paragraph, Title } = Typography;

const InfoTab = ({ proyecto, onBack, onEditar }) => {
  const getStatusColor = (estado) => {
    return estado === "Requisitos" ? "blue" : "green";
  };

  const handleEditarProyecto = () => {
    if (onEditar) {
      onEditar(proyecto);
    } else {
      // Si no se pasa onEditar, mostrar mensaje de que la función no está disponible
      message.info('La función de editar estará disponible próximamente');
    }
  };

  return (
    <Row gutter={[24, 24]}>
      {/* Información del Proyecto */}
      <Col xs={24} lg={16}>
        <Card
          title={
            <Space>
              <FileTextOutlined />
              Información del Proyecto
            </Space>
          }
          style={{ marginBottom: '1.5rem' }}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Nombre">
              <Text strong>{proyecto.nombre}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={getStatusColor(proyecto.estado)}>
                {proyecto.estado}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Descripción">
              {proyecto.descripcion ? (
                <Paragraph>{proyecto.descripcion}</Paragraph>
              ) : (
                <Text type="secondary" italic>Sin descripción</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Creación">
              {proyecto.fecha_creacion || proyecto.fecha_actualizacion}
            </Descriptions.Item>
            <Descriptions.Item label="Última Actualización">
              {proyecto.fecha_actualizacion}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Información Adicional */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              Detalles del Proyecto
            </Space>
          }
        >
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Title level={4} type="secondary">
              Información General
            </Title>
            <Paragraph type="secondary">
              Aquí se mostrará información detallada del proyecto como métricas,
              progreso general y estadísticas importantes.
            </Paragraph>
          </div>
        </Card>
      </Col>

      {/* Panel Lateral */}
      <Col xs={24} lg={8}>
        <Card title="Acciones Rápidas" style={{ marginBottom: '1.5rem' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              block
              icon={<SettingOutlined />}
              className="btn btn-secondary"
              disabled
            >
              Configurar Proyecto
            </Button>

            <Button
              block
              icon={<FileTextOutlined />}
              className="btn btn-secondary"
              disabled
            >
              Generar Documentación
            </Button>
          </Space>
        </Card>

        <Card title="Estadísticas Generales" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Requisitos">
              <Text type="secondary">0</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Casos de Uso">
              <Text type="secondary">0</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Historias de Usuario">
              <Text type="secondary">0</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Pruebas">
              <Text type="secondary">0</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Progreso">
              <Text type="secondary">0%</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Información del Estado" size="small" style={{ marginTop: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <CalendarOutlined style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }} />
            </div>
            <Text strong>Última actualización</Text>
            <br />
            <Text type="secondary">{proyecto.fecha_actualizacion}</Text>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default InfoTab;