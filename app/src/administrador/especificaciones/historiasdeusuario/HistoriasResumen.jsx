// src/pages/admin/HistoriasUsuario.jsx
import React from 'react';
import { Card, Alert } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import '../../../styles/admin-content.css';

const HistoriasResumen = () => {
    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <FileDoneOutlined className="admin-content-icon" style={{ color: '#f093fb' }} />
                <h2 className="admin-content-title">Historias de Usuario</h2>
            </div>
            <Card className="admin-info-card">
                <Alert
                    message="Módulo en desarrollo"
                    description="Gestión de historias de usuario y backlog."
                    type="info"
                    showIcon
                />
            </Card>
        </div>
    );
};

export default HistoriasResumen;