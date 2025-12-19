// src/pages/admin/UsuariosResumen.jsx
import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
    TeamOutlined,
    UserOutlined,
    CrownOutlined,
} from '@ant-design/icons';
import '../../styles/admin-content.css';

const UsuariosResumen = () => {
    const stats = {
        totalUsuarios: 150,
        usuariosActivos: 125,
        nuevosUsuarios: 15,
        administradores: 5
    };

    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <TeamOutlined className="admin-content-icon" style={{ color: '#ff6b6b' }} />
                <h2 className="admin-content-title">Resumen de Usuarios</h2>
            </div>

            <Row gutter={[16, 16]} className="admin-stats-grid">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card" hoverable>
                        <Statistic
                            title="Total Usuarios"
                            value={stats.totalUsuarios}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: 'var(--success-color)' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card" hoverable>
                        <Statistic
                            title="Usuarios Activos"
                            value={stats.usuariosActivos}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: 'var(--primary-color)' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card" hoverable>
                        <Statistic
                            title="Nuevos (este mes)"
                            value={stats.nuevosUsuarios}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: 'var(--secondary-color)' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card" hoverable>
                        <Statistic
                            title="Administradores"
                            value={stats.administradores}
                            prefix={<CrownOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UsuariosResumen;