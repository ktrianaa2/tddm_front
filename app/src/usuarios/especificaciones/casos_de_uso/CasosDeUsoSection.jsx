import React, { useState } from 'react';
import {
  Card,
  Button,
  List,
  Typography,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CasosUsoSection = ({ proyecto }) => {
  const [casosUso, setCasosUso] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCaso, setEditingCaso] = useState(null);
  const [form] = Form.useForm();

  const complejidades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' }
  ];

  const estados = [
    { value: 'borrador', label: 'Borrador' },
    { value: 'revision', label: 'En Revisión' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'implementado', label: 'Implementado' }
  ];

  const handleAgregar = () => {
    setEditingCaso(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditar = (caso) => {
    setEditingCaso(caso);
    form.setFieldsValue(caso);
    setModalVisible(true);
  };

  const handleGuardar = async (values) => {
    try {
      if (editingCaso) {
        setCasosUso(prev => prev.map(caso => 
          caso.id === editingCaso.id ? { ...caso, ...values } : caso
        ));
      } else {
        const nuevoCaso = {
          id: Date.now(),
          ...values,
          fechaCreacion: new Date().toLocaleDateString()
        };
        setCasosUso(prev => [...prev, nuevoCaso]);
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error al guardar caso de uso:', error);
    }
  };

  const handleEliminar = (id) => {
    Modal.confirm({
      title: '¿Estás seguro de eliminar este caso de uso?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => {
        setCasosUso(prev => prev.filter(caso => caso.id !== id));
      }
    });
  };

  const getComplejidadColor = (complejidad) => {
    const colors = {
      'baja': 'green',
      'media': 'orange',
      'alta': 'red'
    };
    return colors[complejidad] || 'default';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'borrador': 'default',
      'revision': 'orange',
      'aprobado': 'green',
      'implementado': 'blue'
    };
    return colors[estado] || 'default';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: '0.5rem', color: '#52c41a' }} />
            Gestión de Casos de Uso
          </Title>
          <Text type="secondary">
            {casosUso.length} caso{casosUso.length !== 1 ? 's' : ''} de uso en el proyecto
          </Text>
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAgregar}
          className="btn btn-primary"
        >
          Agregar Caso de Uso
        </Button>
      </div>

      {casosUso.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ 
            fontSize: '3rem', 
            color: 'var(--text-disabled)', 
            marginBottom: '1rem' 
          }}>
            <UserOutlined />
          </div>
          <Title level={4} type="secondary">
            No hay casos de uso definidos
          </Title>
          <Text type="secondary">
            Comienza agregando el primer caso de uso de tu proyecto
          </Text>
          <br />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAgregar}
            style={{ marginTop: '1rem' }}
            className="btn btn-primary"
          >
            Agregar Primer Caso de Uso
          </Button>
        </Card>
      ) : (
        <Card>
          <List
            dataSource={casosUso}
            renderItem={(caso) => (
              <List.Item
                key={caso.id}
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    className="btn btn-info btn-sm"
                    onClick={() => {
                      Modal.info({
                        title: caso.nombre,
                        content: (
                          <div>
                            <p><strong>Descripción:</strong> {caso.descripcion}</p>
                            <p><strong>Actor Principal:</strong> {caso.actorPrincipal}</p>
                            <p><strong>Precondiciones:</strong> {caso.precondiciones || 'No especificadas'}</p>
                            <p><strong>Postcondiciones:</strong> {caso.postcondiciones || 'No especificadas'}</p>
                            <p><strong>Flujo Principal:</strong> {caso.flujoPrincipal || 'No especificado'}</p>
                            <p><strong>Complejidad:</strong>
                              <Tag color={getComplejidadColor(caso.complejidad)} style={{ marginLeft: '0.5rem' }}>
                                {complejidades.find(c => c.value === caso.complejidad)?.label}
                              </Tag>
                            </p>
                            <p><strong>Estado:</strong>
                              <Tag color={getEstadoColor(caso.estado)} style={{ marginLeft: '0.5rem' }}>
                                {estados.find(e => e.value === caso.estado)?.label}
                              </Tag>
                            </p>
                            <p><strong>Fecha de creación:</strong> {caso.fechaCreacion}</p>
                          </div>
                        ),
                        width: 700
                      });
                    }}
                  >
                    Ver
                  </Button>,
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEditar(caso)}
                  >
                    Editar
                  </Button>,
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminar(caso.id)}
                  >
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Text strong>{caso.nombre}</Text>
                      <Tag color={getComplejidadColor(caso.complejidad)}>
                        {complejidades.find(c => c.value === caso.complejidad)?.label}
                      </Tag>
                      <Tag color={getEstadoColor(caso.estado)}>
                        {estados.find(e => e.value === caso.estado)?.label}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        {caso.descripcion?.length > 100 
                          ? `${caso.descripcion.substring(0, 100)}...` 
                          : caso.descripcion}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                        Actor: {caso.actorPrincipal}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Modal para Agregar/Editar */}
      <Modal
        title={editingCaso ? 'Editar Caso de Uso' : 'Agregar Nuevo Caso de Uso'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGuardar}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="nombre"
                label="Nombre del Caso de Uso"
                rules={[{ required: true, message: 'Por favor ingresa el nombre del caso de uso' }]}
              >
                <Input placeholder="Ej: Iniciar sesión en el sistema" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="actorPrincipal"
                label="Actor Principal"
                rules={[{ required: true, message: 'Por favor especifica el actor principal' }]}
              >
                <Input placeholder="Ej: Usuario, Administrador, Cliente" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="complejidad"
                label="Complejidad"
                rules={[{ required: true, message: 'Por favor selecciona la complejidad' }]}
              >
                <Select placeholder="Complejidad">
                  {complejidades.map(comp => (
                    <Select.Option key={comp.value} value={comp.value}>
                      {comp.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="estado"
                label="Estado"
                rules={[{ required: true, message: 'Por favor selecciona el estado' }]}
              >
                <Select placeholder="Estado">
                  {estados.map(estado => (
                    <Select.Option key={estado.value} value={estado.value}>
                      {estado.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: 'Por favor ingresa la descripción' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Describe brevemente el caso de uso..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="precondiciones"
                label="Precondiciones"
              >
                <TextArea 
                  rows={3} 
                  placeholder="¿Qué debe cumplirse antes de ejecutar este caso de uso?"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="postcondiciones"
                label="Postcondiciones"
              >
                <TextArea 
                  rows={3} 
                  placeholder="¿Qué debe cumplirse después de ejecutar este caso de uso?"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="flujoPrincipal"
            label="Flujo Principal"
          >
            <TextArea 
              rows={4} 
              placeholder="Describe los pasos principales del caso de uso..."
            />
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)} className="btn btn-secondary">
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" className="btn btn-primary">
                {editingCaso ? 'Actualizar' : 'Crear'} Caso de Uso
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CasosUsoSection;