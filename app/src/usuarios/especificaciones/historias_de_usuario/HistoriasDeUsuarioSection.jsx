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
  Divider,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  BookOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const HistoriasUsuarioSection = ({ proyecto }) => {
  const [historias, setHistorias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState(null);
  const [form] = Form.useForm();

  const prioridades = [
    { value: 'muy-alta', label: 'Muy Alta' },
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
    { value: 'muy-baja', label: 'Muy Baja' }
  ];

  const estados = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'en-progreso', label: 'En Progreso' },
    { value: 'en-revision', label: 'En Revisión' },
    { value: 'completada', label: 'Completada' },
    { value: 'aceptada', label: 'Aceptada' }
  ];

  const epicas = [
    { value: 'autenticacion', label: 'Autenticación' },
    { value: 'gestion-usuarios', label: 'Gestión de Usuarios' },
    { value: 'reportes', label: 'Reportes' },
    { value: 'configuracion', label: 'Configuración' }
  ];

  const handleAgregar = () => {
    setEditingHistoria(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditar = (historia) => {
    setEditingHistoria(historia);
    form.setFieldsValue(historia);
    setModalVisible(true);
  };

  const handleGuardar = async (values) => {
    try {
      if (editingHistoria) {
        setHistorias(prev => prev.map(historia => 
          historia.id === editingHistoria.id ? { ...historia, ...values } : historia
        ));
      } else {
        const nuevaHistoria = {
          id: Date.now(),
          ...values,
          fechaCreacion: new Date().toLocaleDateString()
        };
        setHistorias(prev => [...prev, nuevaHistoria]);
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error al guardar historia de usuario:', error);
    }
  };

  const handleEliminar = (id) => {
    Modal.confirm({
      title: '¿Estás seguro de eliminar esta historia de usuario?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => {
        setHistorias(prev => prev.filter(historia => historia.id !== id));
      }
    });
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'muy-alta': 'red',
      'alta': 'orange',
      'media': 'gold',
      'baja': 'green',
      'muy-baja': 'blue'
    };
    return colors[prioridad] || 'default';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'backlog': 'default',
      'en-progreso': 'processing',
      'en-revision': 'warning',
      'completada': 'success',
      'aceptada': 'green'
    };
    return colors[estado] || 'default';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: '0.5rem', color: '#722ed1' }} />
            Gestión de Historias de Usuario
          </Title>
          <Text type="secondary">
            {historias.length} historia{historias.length !== 1 ? 's' : ''} de usuario en el proyecto
          </Text>
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAgregar}
          className="btn btn-primary"
        >
          Agregar Historia de Usuario
        </Button>
      </div>

      {historias.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ 
            fontSize: '3rem', 
            color: 'var(--text-disabled)', 
            marginBottom: '1rem' 
          }}>
            <BookOutlined />
          </div>
          <Title level={4} type="secondary">
            No hay historias de usuario definidas
          </Title>
          <Text type="secondary">
            Comienza agregando la primera historia de usuario de tu proyecto
          </Text>
          <br />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAgregar}
            style={{ marginTop: '1rem' }}
            className="btn btn-primary"
          >
            Agregar Primera Historia
          </Button>
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
                    type="text"
                    icon={<EyeOutlined />}
                    className="btn btn-info btn-sm"
                    onClick={() => {
                      Modal.info({
                        title: historia.titulo,
                        content: (
                          <div>
                            <p><strong>Como:</strong> {historia.como}</p>
                            <p><strong>Quiero:</strong> {historia.quiero}</p>
                            <p><strong>Para:</strong> {historia.para}</p>
                            <p><strong>Criterios de Aceptación:</strong> {historia.criteriosAceptacion || 'No especificados'}</p>
                            <p><strong>Notas:</strong> {historia.notas || 'Sin notas'}</p>
                            <p><strong>Épica:</strong> 
                              <Tag style={{ marginLeft: '0.5rem' }}>
                                {epicas.find(e => e.value === historia.epica)?.label || 'Sin épica'}
                              </Tag>
                            </p>
                            <p><strong>Prioridad:</strong>
                              <Tag color={getPrioridadColor(historia.prioridad)} style={{ marginLeft: '0.5rem' }}>
                                {prioridades.find(p => p.value === historia.prioridad)?.label}
                              </Tag>
                            </p>
                            <p><strong>Story Points:</strong> {historia.storyPoints || 'No estimado'}</p>
                            <p><strong>Estado:</strong>
                              <Tag color={getEstadoColor(historia.estado)} style={{ marginLeft: '0.5rem' }}>
                                {estados.find(e => e.value === historia.estado)?.label}
                              </Tag>
                            </p>
                            <p><strong>Fecha de creación:</strong> {historia.fechaCreacion}</p>
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
                    onClick={() => handleEditar(historia)}
                  >
                    Editar
                  </Button>,
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminar(historia.id)}
                  >
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Text strong>{historia.titulo}</Text>
                      <Tag color={getPrioridadColor(historia.prioridad)}>
                        {prioridades.find(p => p.value === historia.prioridad)?.label}
                      </Tag>
                      <Tag color={getEstadoColor(historia.estado)}>
                        {estados.find(e => e.value === historia.estado)?.label}
                      </Tag>
                      {historia.storyPoints && (
                        <Tag color="blue">{historia.storyPoints} SP</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontStyle: 'italic' }}>
                        "Como <strong>{historia.como}</strong>, quiero <strong>{historia.quiero}</strong> para <strong>{historia.para}</strong>"
                      </Text>
                      {historia.epica && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                            Épica: {epicas.find(e => e.value === historia.epica)?.label}
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

      {/* Modal para Agregar/Editar */}
      <Modal
        title={editingHistoria ? 'Editar Historia de Usuario' : 'Agregar Nueva Historia de Usuario'}
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
          <Form.Item
            name="titulo"
            label="Título de la Historia"
            rules={[{ required: true, message: 'Por favor ingresa el título de la historia' }]}
          >
            <Input placeholder="Ej: Login de usuario en la aplicación" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="como"
                label="Como (Rol/Usuario)"
                rules={[{ required: true, message: 'Especifica el rol' }]}
              >
                <Input placeholder="Ej: Usuario registrado" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quiero"
                label="Quiero (Acción)"
                rules={[{ required: true, message: 'Especifica la acción' }]}
              >
                <Input placeholder="Ej: iniciar sesión" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="para"
                label="Para (Beneficio/Objetivo)"
                rules={[{ required: true, message: 'Especifica el beneficio' }]}
              >
                <Input placeholder="Ej: acceder a mi cuenta" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="prioridad"
                label="Prioridad"
                rules={[{ required: true, message: 'Selecciona la prioridad' }]}
              >
                <Select placeholder="Prioridad">
                  {prioridades.map(prioridad => (
                    <Select.Option key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estado"
                label="Estado"
                rules={[{ required: true, message: 'Selecciona el estado' }]}
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
            <Col span={8}>
              <Form.Item
                name="epica"
                label="Épica"
              >
                <Select placeholder="Seleccionar épica" allowClear>
                  {epicas.map(epica => (
                    <Select.Option key={epica.value} value={epica.value}>
                      {epica.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storyPoints"
                label="Story Points"
              >
                <InputNumber 
                  min={1} 
                  max={21} 
                  placeholder="1, 2, 3, 5, 8, 13, 21"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="criteriosAceptacion"
            label="Criterios de Aceptación"
          >
            <TextArea 
              rows={4} 
              placeholder="Define los criterios que deben cumplirse para considerar la historia como completa..."
            />
          </Form.Item>

          <Form.Item
            name="notas"
            label="Notas Adicionales"
          >
            <TextArea 
              rows={3} 
              placeholder="Cualquier información adicional relevante..."
            />
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)} className="btn btn-secondary">
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" className="btn btn-primary">
                {editingHistoria ? 'Actualizar' : 'Crear'} Historia
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HistoriasUsuarioSection;