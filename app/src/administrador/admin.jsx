import React, { useState, useEffect } from 'react';
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
    Statistic,
    Badge
} from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    IdcardOutlined,
    CrownOutlined,
    ReloadOutlined,
    DashboardOutlined,
    TeamOutlined,
    SettingOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import { API_ENDPOINTS, getWithAuth, getStoredToken, removeToken } from '../../config';

const { Title, Text } = Typography;

const Admin = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getStoredToken();

            if (!token) {
                setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
                return;
            }

            const response = await getWithAuth(API_ENDPOINTS.PROFILE, token);
            setUserProfile(response);

            // Verificar si realmente es admin
            if (response.rol !== 'admin') {
                setError('Acceso denegado. No tienes permisos de administrador.');
                return;
            }

        } catch (error) {
            console.error('Error al obtener perfil:', error);
            setError(error.message || 'Error al cargar la información del perfil');

            // Si es error de autenticación, eliminar token
            if (error.message.includes('401') || error.message.includes('token')) {
                removeToken();
                message.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const handleLogout = () => {
        removeToken();
        message.success('Sesión de administrador cerrada exitosamente');
        window.location.reload();
    };

    const handleRetry = () => {
        fetchUserProfile();
    };

    const handleAdminAction = (action) => {
        message.info(`Funcionalidad de ${action} en desarrollo...`);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <Card style={{ textAlign: 'center', minWidth: '300px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>
                        <Text>Cargando panel de administración...</Text>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <Card style={{ maxWidth: '500px', width: '100%' }}>
                    <Alert
                        message="Error de Acceso"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={handleRetry}
                            style={{ marginRight: '8px' }}
                        >
                            Reintentar
                        </Button>
                        <Button
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                        >
                            Volver al Login
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)',
            padding: '20px'
        }}>
            <Row gutter={[20, 20]} justify="center">

                {/* Panel Principal del Admin */}
                <Col xs={24} lg={16}>
                    <Card
                        style={{
                            borderRadius: '16px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)'
                        }}
                        styles={{
                            body: { padding: '32px' }
                        }}
                    >
                        {/* Header Admin */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <Badge.Ribbon text="ADMIN" color="gold">
                                <Avatar
                                    size={120}
                                    style={{
                                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
                                        border: '4px solid #fff',
                                        boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
                                    }}
                                    icon={<CrownOutlined />}
                                />
                            </Badge.Ribbon>

                            <Title level={1} style={{ margin: '20px 0 8px 0', color: '#1a1a1a' }}>
                                Panel de Administrador
                            </Title>

                            <Title level={3} style={{ margin: '0 0 8px 0', color: '#333' }}>
                                {userProfile.nombre} {userProfile.apellido}
                            </Title>

                            <Text type="secondary" style={{ fontSize: '18px' }}>
                                @{userProfile.usuario}
                            </Text>

                            <div style={{ marginTop: '16px' }}>
                                <Tag
                                    icon={<SafetyOutlined />}
                                    color="red"
                                    style={{ fontSize: '16px', padding: '8px 16px', fontWeight: 'bold' }}
                                >
                                    ADMINISTRADOR DEL SISTEMA
                                </Tag>
                            </div>
                        </div>

                        <Divider />

                        {/* Información del Admin */}
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <Card
                                    size="small"
                                    title={
                                        <span>
                                            <IdcardOutlined style={{ marginRight: '8px', color: '#ff6b6b' }} />
                                            Información Personal
                                        </span>
                                    }
                                    style={{ height: '100%' }}
                                >
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <div>
                                            <Text strong style={{ color: '#666' }}>ID Usuario:</Text>
                                            <br />
                                            <Text style={{ fontSize: '16px', fontWeight: '500' }}>#{userProfile.usuario_id}</Text>
                                        </div>

                                        <div>
                                            <Text strong style={{ color: '#666' }}>Nombre Completo:</Text>
                                            <br />
                                            <Text style={{ fontSize: '16px', fontWeight: '500' }}>
                                                {userProfile.nombre} {userProfile.apellido}
                                            </Text>
                                        </div>

                                        <div>
                                            <Text strong style={{ color: '#666' }}>Usuario:</Text>
                                            <br />
                                            <Text style={{ fontSize: '16px', fontWeight: '500' }}>@{userProfile.usuario}</Text>
                                        </div>

                                        <div>
                                            <Text strong style={{ color: '#666' }}>Nivel de Acceso:</Text>
                                            <br />
                                            <Tag
                                                icon={<CrownOutlined />}
                                                color="gold"
                                                style={{ fontSize: '14px', padding: '4px 12px', marginTop: '4px' }}
                                            >
                                                ADMINISTRADOR COMPLETO
                                            </Tag>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} md={12}>
                                <Card
                                    size="small"
                                    title={
                                        <span>
                                            <DashboardOutlined style={{ marginRight: '8px', color: '#ffd93d' }} />
                                            Estadísticas Rápidas
                                        </span>
                                    }
                                    style={{ height: '100%' }}
                                >
                                    <Row gutter={[16, 16]}>
                                        <Col span={12}>
                                            <Statistic
                                                title="Usuarios Activos"
                                                value={25}
                                                prefix={<TeamOutlined />}
                                                valueStyle={{ color: '#3f8600' }}
                                            />
                                        </Col>
                                        <Col span={12}>
                                            <Statistic
                                                title="Sesiones Hoy"
                                                value={8}
                                                prefix={<UserOutlined />}
                                                valueStyle={{ color: '#cf1322' }}
                                            />
                                        </Col>
                                        <Col span={12}>
                                            <Statistic
                                                title="Configuraciones"
                                                value={12}
                                                prefix={<SettingOutlined />}
                                                valueStyle={{ color: '#1890ff' }}
                                            />
                                        </Col>
                                        <Col span={12}>
                                            <Statistic
                                                title="Alertas"
                                                value={3}
                                                prefix={<SafetyOutlined />}
                                                valueStyle={{ color: '#faad14' }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        {/* Acciones de Admin */}
                        <div>
                            <Title level={4} style={{ marginBottom: '20px', color: '#1a1a1a' }}>
                                <SettingOutlined style={{ marginRight: '8px' }} />
                                Acciones de Administrador
                            </Title>

                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} md={8}>
                                    <Button
                                        type="primary"
                                        icon={<TeamOutlined />}
                                        onClick={() => handleAdminAction('Gestión de Usuarios')}
                                        block
                                        size="large"
                                        style={{
                                            height: '50px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
                                            border: 'none'
                                        }}
                                    >
                                        Gestionar Usuarios
                                    </Button>
                                </Col>

                                <Col xs={24} sm={12} md={8}>
                                    <Button
                                        type="primary"
                                        icon={<SettingOutlined />}
                                        onClick={() => handleAdminAction('Configuración del Sistema')}
                                        block
                                        size="large"
                                        style={{
                                            height: '50px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #ffd93d 0%, #6bcf7f 100%)',
                                            border: 'none'
                                        }}
                                    >
                                        Configuraciones
                                    </Button>
                                </Col>

                                <Col xs={24} sm={12} md={8}>
                                    <Button
                                        type="primary"
                                        icon={<SafetyOutlined />}
                                        onClick={() => handleAdminAction('Seguridad')}
                                        block
                                        size="large"
                                        style={{
                                            height: '50px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #6bcf7f 0%, #667eea 100%)',
                                            border: 'none'
                                        }}
                                    >
                                        Seguridad
                                    </Button>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={handleRetry}
                                        block
                                        size="large"
                                        style={{
                                            height: '50px',
                                            borderRadius: '8px',
                                            border: '2px solid #ff6b6b',
                                            color: '#ff6b6b'
                                        }}
                                    >
                                        Actualizar Datos
                                    </Button>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Button
                                        danger
                                        icon={<LogoutOutlined />}
                                        onClick={handleLogout}
                                        block
                                        size="large"
                                        style={{
                                            height: '50px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Cerrar Sesión Admin
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                    </Card>
                </Col>

            </Row>
        </div>
    );
};

export default Admin;