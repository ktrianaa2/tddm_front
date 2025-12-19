// src/pages/admin/UsuariosGestion.jsx
import React from 'react';
import { Card, Alert, Button } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import '../../styles/admin-content.css';

const UsuariosGestion = () => {
    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <SettingOutlined className="admin-content-icon" style={{ color: '#ffd93d' }} />
                <h2 className="admin-content-title">Gestión de Usuarios</h2>
            </div>
            <Card className="admin-info-card">
                <Alert
                    message="Módulo en desarrollo"
                    description="Aquí podrás crear, editar y eliminar usuarios del sistema."
                    type="info"
                    showIcon
                />
                <div className="admin-actions">
                    <Button type="primary" icon={<UserOutlined />}>
                        Crear Usuario
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default UsuariosGestion;