// src/pages/admin/Requisitos.jsx
import React from 'react';
import { Card, Alert } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import '../../../styles/admin-content.css';

const RequisitosResumen = () => {
    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <BookOutlined className="admin-content-icon" style={{ color: '#667eea' }} />
                <h2 className="admin-content-title">Requisitos</h2>
            </div>
            <Card className="admin-info-card">
                <Alert
                    message="Módulo en desarrollo"
                    description="Gestión de requisitos funcionales y no funcionales."
                    type="info"
                    showIcon
                />
            </Card>
        </div>
    );
};

export default RequisitosResumen;