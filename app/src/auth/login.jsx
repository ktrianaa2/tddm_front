import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Divider,
  message,
  Card,
  notification,
} from 'antd';
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { API_ENDPOINTS, postFormData, saveToken } from '../../config';
import '../styles/login.css';

const { Title, Text, Link } = Typography;

const LoginForm = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('usuario', values.usuario);
      formData.append('contraseña', values.password);

      const response = await postFormData(API_ENDPOINTS.LOGIN, formData);

      message.success(response.mensaje || '¡Login exitoso!');
      if (response.token) {
        saveToken(response.token);
      }
      if (onLoginSuccess) onLoginSuccess(response);

    } catch (error) {
      if (error.status === 401) {
        notification.error({
          message: 'Error de autenticación',
          description: 'Usuario o contraseña incorrecta',
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Error',
          description: error.message || 'Ocurrió un error al iniciar sesión.',
          placement: 'topRight',
        });
      }
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        {/* Logo + Encabezado */}
        <div className="login-header">
          <img src="/logo.jpg" alt="Logo" className="login-logo" />
          <Title level={2}>Iniciar Sesión</Title>
          <p>Ingrese sus credenciales para continuar</p>
        </div>

        {/* Formulario */}
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="login-form"
        >
          <Form.Item
            label="Usuario"
            name="usuario"
            rules={[{ required: true, message: 'Por favor ingresa tu usuario' }]}
          >
            <Input
              className="login-input"
              placeholder="Nombre de usuario"
            />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
          >
            <Input.Password
              className="login-input"
              placeholder="••••••••"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="submit"
              loading={loading}
              block
              className="login-button"
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>
          </Form.Item>
        </Form>

        {/* Enlaces */}
        <Divider />
        <div className="login-links">
          <a href="#!">¿Olvidaste tu contraseña?</a>
          <a href="/registro">¿No tienes cuenta? Regístrate</a>
        </div>
      </Card>
    </div>
  );
};

export default LoginForm;