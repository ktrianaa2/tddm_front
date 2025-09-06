// src/usuarios/Usuario.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Avatar,
  Divider,
  Button,
  message,
  Spin,
  Tag,
  Alert,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  IdcardOutlined,
  CrownOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Navbar from "../components/Navbar";
import {
  API_ENDPOINTS,
  getWithAuth,
  getStoredToken,
  removeToken,
} from "../../config";

const { Title, Text } = Typography;

const Usuario = ({ onLogout }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      if (!token) {
        setError("No hay token. Por favor, inicia sesión.");
        return;
      }
      const response = await getWithAuth(API_ENDPOINTS.PROFILE, token);
      setUserProfile(response);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setError(error.message || "Error al cargar el perfil");
      
      // Si es un error 401 o de token, hacer logout
      if (error.message.includes("401") || error.message.includes("token") || error.status === 401) {
        removeToken();
        message.error("Sesión expirada. Redirigiendo al login...");
        if (onLogout) {
          setTimeout(() => onLogout(), 1500);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar onLogout={onLogout} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spin size="large" />
          <div>Cargando perfil...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Navbar onLogout={onLogout} />
        <Card>
          <Alert message="Error" description={error} type="error" showIcon />
          <Button onClick={fetchUserProfile} icon={<ReloadOutlined />}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} />
      <Row justify="center" style={{ marginTop: "2rem" }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card className="profile-card">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Avatar size={100} icon={<UserOutlined />} />
              <Title level={2}>
                {userProfile.nombre} {userProfile.apellido}
              </Title>
              <Text type="secondary">@{userProfile.usuario}</Text>
              <Tag
                icon={
                  userProfile.rol === "admin" ? <CrownOutlined /> : <UserOutlined />
                }
                color={userProfile.rol === "admin" ? "gold" : "blue"}
              >
                {userProfile.rol.toUpperCase()}
              </Tag>

              <Divider />

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>ID Usuario:</Text>
                  <br />
                  <Text>{userProfile.usuario_id}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Usuario:</Text>
                  <br />
                  <Text>{userProfile.usuario}</Text>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Usuario;