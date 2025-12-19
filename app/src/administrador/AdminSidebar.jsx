// src/components/AdminSidebar.jsx
import React from 'react';
import { Layout, Menu, Avatar, Space, Typography } from 'antd';
import {
    TeamOutlined,
    FileTextOutlined,
    BarChartOutlined,
    DashboardOutlined,
    SettingOutlined,
    CrownOutlined,
    ApartmentOutlined,
    BookOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import '../styles/side-bar.css';

const { Sider } = Layout;
const { Text } = Typography;

const AdminSidebar = ({ collapsed, onCollapse, selectedMenu, onMenuSelect, userProfile }) => {
    const menuItems = [
        {
            key: 'usuarios',
            icon: <TeamOutlined />,
            label: 'Usuarios',
            children: [
                {
                    key: 'usuarios-resumen',
                    icon: <DashboardOutlined />,
                    label: 'Resumen',
                },
                {
                    key: 'usuarios-gestion',
                    icon: <SettingOutlined />,
                    label: 'Gestión',
                },
            ],
        },
        {
            key: 'especificaciones',
            icon: <FileTextOutlined />,
            label: 'Especificaciones',
            children: [
                {
                    key: 'casos-uso',
                    icon: <ApartmentOutlined />,
                    label: 'Casos de Uso',
                },
                {
                    key: 'requisitos',
                    icon: <BookOutlined />,
                    label: 'Requisitos',
                },
                {
                    key: 'historias-usuario',
                    icon: <FileDoneOutlined />,
                    label: 'Historias de Usuario',
                },
            ],
        },
        {
            key: 'reportes',
            icon: <BarChartOutlined />,
            label: 'Reportes',
            children: [
                {
                    key: 'generar-reporte',
                    icon: <FileSearchOutlined />,
                    label: 'Generar',
                },
                {
                    key: 'ver-resumen',
                    icon: <LineChartOutlined />,
                    label: 'Ver Resumen',
                },
            ],
        },
    ];

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={onCollapse}
            trigger={null}
            width={250}
            className="admin-sidebar"
        >
            <div className={`admin-sidebar-profile ${collapsed ? 'collapsed' : ''}`}>
                {!collapsed && (
                    <Space direction="vertical" size="small">
                        <Avatar
                            size={64}
                            icon={<CrownOutlined />}
                            className="admin-sidebar-avatar"
                        />
                        <div>
                            <Text strong className="admin-sidebar-name">
                                {userProfile?.nombre} {userProfile?.apellido}
                            </Text>
                            <Text type="secondary" className="admin-sidebar-username">
                                @{userProfile?.usuario}
                            </Text>
                        </div>
                    </Space>
                )}
                {collapsed && (
                    <Avatar
                        size={40}
                        icon={<CrownOutlined />}
                        className="admin-sidebar-avatar"
                    />
                )}
            </div>

            <Menu
                mode="inline"
                selectedKeys={[selectedMenu]}
                defaultOpenKeys={['usuarios', 'especificaciones', 'reportes']}
                items={menuItems}
                onClick={({ key }) => onMenuSelect(key)}
                className="admin-sidebar-menu"
            />
        </Sider>
    );
};

export default AdminSidebar;