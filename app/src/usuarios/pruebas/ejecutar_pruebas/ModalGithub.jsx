import React, { useState } from 'react';
import { Modal, Form, Input, Select, Space, Button, Alert, Steps } from 'antd';
import { GithubOutlined, LinkOutlined, FolderOutlined, BranchesOutlined } from '@ant-design/icons';

const { Option } = Select;

const ModalGitHub = ({ visible, onCancel, onConectar, loading = false }) => {
  const [form] = Form.useForm();
  const [paso, setPaso] = useState(0);
  const [autenticado, setAutenticado] = useState(false);

  const handleNext = async () => {
    try {
      if (paso === 0) {
        await form.validateFields(['token']);
        // Simular autenticación
        setAutenticado(true);
        setPaso(1);
      } else if (paso === 1) {
        await form.validateFields(['repositorio', 'rama']);
        setPaso(2);
      }
    } catch (error) {
      console.log('Validación fallida:', error);
    }
  };

  const handlePrev = () => {
    setPaso(paso - 1);
  };

  const handleSubmit = async (values) => {
    if (onConectar) {
      await onConectar(values);
    }
    form.resetFields();
    setPaso(0);
    setAutenticado(false);
  };

  const handleCancel = () => {
    form.resetFields();
    setPaso(0);
    setAutenticado(false);
    onCancel();
  };

  const steps = [
    {
      title: 'Autenticación',
      icon: <GithubOutlined />
    },
    {
      title: 'Repositorio',
      icon: <FolderOutlined />
    },
    {
      title: 'Configuración',
      icon: <BranchesOutlined />
    }
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GithubOutlined style={{ fontSize: '1.5rem' }} />
          <span>Conectar con GitHub</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Steps current={paso} items={steps} style={{ marginBottom: '2rem' }} />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {paso === 0 && (
          <div>
            <Alert
              message="Token de Acceso Personal"
              description="Necesitas un token de GitHub con permisos de lectura de repositorios. Puedes generarlo en Settings > Developer settings > Personal access tokens"
              type="info"
              showIcon
              style={{ marginBottom: '1.5rem' }}
            />

            <Form.Item
              label="GitHub Personal Access Token"
              name="token"
              rules={[
                { required: true, message: 'El token es obligatorio' },
                { min: 20, message: 'El token debe tener al menos 20 caracteres' }
              ]}
            >
              <Input.Password
                prefix={<LinkOutlined />}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                maxLength={100}
              />
            </Form.Item>

            <Form.Item
              label="Usuario de GitHub"
              name="usuario"
              rules={[{ required: true, message: 'El usuario es obligatorio' }]}
            >
              <Input
                prefix={<GithubOutlined />}
                placeholder="tu-usuario"
              />
            </Form.Item>
          </div>
        )}

        {paso === 1 && (
          <div>
            <Alert
              message="Repositorio Conectado"
              description="Selecciona el repositorio y la rama donde se encuentran tus pruebas"
              type="success"
              showIcon
              style={{ marginBottom: '1.5rem' }}
            />

            <Form.Item
              label="Repositorio"
              name="repositorio"
              rules={[{ required: true, message: 'Selecciona un repositorio' }]}
            >
              <Select
                placeholder="Selecciona un repositorio"
                showSearch
                optionFilterProp="children"
              >
                <Option value="proyecto-tests">proyecto-tests</Option>
                <Option value="app-frontend">app-frontend</Option>
                <Option value="backend-api">backend-api</Option>
                <Option value="e2e-testing">e2e-testing</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Rama"
              name="rama"
              rules={[{ required: true, message: 'Selecciona una rama' }]}
              initialValue="main"
            >
              <Select placeholder="Selecciona una rama">
                <Option value="main">main</Option>
                <Option value="master">master</Option>
                <Option value="develop">develop</Option>
                <Option value="testing">testing</Option>
              </Select>
            </Form.Item>
          </div>
        )}

        {paso === 2 && (
          <div>
            <Alert
              message="Configuración Final"
              description="Define la ruta donde se encuentran los archivos de prueba en el repositorio"
              type="info"
              showIcon
              style={{ marginBottom: '1.5rem' }}
            />

            <Form.Item
              label="Ruta de las Pruebas"
              name="ruta"
              rules={[{ required: true, message: 'La ruta es obligatoria' }]}
              initialValue="/tests"
            >
              <Input
                prefix={<FolderOutlined />}
                placeholder="/tests o /src/__tests__"
              />
            </Form.Item>

            <Form.Item
              label="Framework de Pruebas"
              name="framework"
              initialValue="jest"
            >
              <Select>
                <Option value="jest">Jest</Option>
                <Option value="mocha">Mocha</Option>
                <Option value="jasmine">Jasmine</Option>
                <Option value="cypress">Cypress</Option>
                <Option value="playwright">Playwright</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Patrón de Archivos"
              name="patron"
              initialValue="**/*.test.js"
            >
              <Input
                placeholder="**/*.test.js, **/*.spec.js"
              />
            </Form.Item>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Space>
            {paso > 0 && (
              <Button onClick={handlePrev}>
                Anterior
              </Button>
            )}
          </Space>
          
          <Space>
            <Button onClick={handleCancel}>
              Cancelar
            </Button>
            
            {paso < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<LinkOutlined />}
              >
                Conectar Repositorio
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalGitHub;