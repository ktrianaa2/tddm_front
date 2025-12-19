// src/pages/DashboardAdmin.jsx
import React, { useState, useEffect } from 'react';
import {
    Layout,
    Avatar,
    Button,
    message,
    Tag,
    Dropdown,
    Tooltip
} from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    SafetyOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SunOutlined,
    MoonOutlined,
    GlobalOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { Typography } from 'antd';
import AdminSidebar from './AdminSidebar';
import UsuariosResumen from './usuarios/UsuariosResumen';
import UsuariosGestion from './usuarios/UsuariosGestion';
import CasosUso from './especificaciones/casosdeuso/CasosResumen';
import Requisitos from './especificaciones/requisitos/RequisitosResumen';
import HistoriasUsuario from './especificaciones/historiasdeusuario/HistoriasResumen';
import GenerarReporte from './reportes/GenerarReporte';
import VerResumen from './reportes/ReportesResumen';
import '../styles/dashboard.css';
import '../styles/side-bar.css';
import '../styles/admin-content.css';

const { Header, Content } = Layout;
const { Text } = Typography;

const DashboardAdmin = ({ onLogout, userProfile }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState('usuarios-resumen');
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    const [language, setLanguage] = useState("es");

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleLogout = () => {
        message.success('Sesión cerrada exitosamente');
        if (onLogout) {
            onLogout();
        }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const languageItems = [
        {
            key: "es",
            label: "Español",
            onClick: () => setLanguage("es"),
        },
        {
            key: "en",
            label: "English",
            onClick: () => setLanguage("en"),
        },
    ];

    const userMenuItems = [
        {
            key: 'perfil',
            icon: <UserOutlined />,
            label: 'Perfil',
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Cerrar sesión',
            danger: true,
            onClick: handleLogout
        }
    ];

    const renderContent = () => {
        switch (selectedMenu) {
            case 'usuarios-resumen':
                return <UsuariosResumen />;
            case 'usuarios-gestion':
                return <UsuariosGestion />;
            case 'casos-uso':
                return <CasosUso />;
            case 'requisitos':
                return <Requisitos />;
            case 'historias-usuario':
                return <HistoriasUsuario />;
            case 'generar-reporte':
                return <GenerarReporte />;
            case 'ver-resumen':
                return <VerResumen />;
            default:
                return <UsuariosResumen />;
        }
    };

    return (
        <div className="dashboard-container">
            <Layout style={{ minHeight: '100vh' }}>
                {/* Header / Navbar */}
                <Header style={{
                    padding: '0 24px',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-md)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: '18px', color: 'var(--text-primary)' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: '#fff',
                                fontSize: '18px'
                            }}>
                                T
                            </div>
                            <Text strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>TDDMachine</Text>
                            <Tag color="gold" icon={<SafetyOutlined />}>ADMIN</Tag>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Tooltip title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>
                            <Button
                                type="text"
                                icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                                onClick={toggleTheme}
                                style={{ fontSize: '16px', color: 'var(--text-primary)' }}
                            />
                        </Tooltip>

                        <Dropdown
                            menu={{ items: languageItems }}
                            placement="bottomRight"
                            trigger={["click"]}
                        >
                            <Button type="text" icon={<GlobalOutlined />} style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                                {language.toUpperCase()}
                            </Button>
                        </Dropdown>

                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                            trigger={["click"]}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Avatar icon={<CrownOutlined />} style={{ 
                                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)' 
                                }} />
                                <Text strong style={{ color: 'var(--text-primary)' }}>{userProfile?.nombre}</Text>
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                <Layout>
                    {/* Sidebar */}
                    <AdminSidebar
                        collapsed={collapsed}
                        onCollapse={setCollapsed}
                        selectedMenu={selectedMenu}
                        onMenuSelect={setSelectedMenu}
                        userProfile={userProfile}
                    />

                    {/* Content */}
                    <Content className="dashboard-content">
                        <div style={{
                            padding: 24,
                            minHeight: 280,
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--border-radius-lg)',
                        }}>
                            {renderContent()}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </div>
    );
};

export default DashboardAdmin;