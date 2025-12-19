// src/pages/admin/GenerarReporte.jsx
import React from 'react';
import { Card, Alert } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import '../../styles/admin-content.css';

const GenerarReporte = () => {
    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <FileSearchOutlined className="admin-content-icon" style={{ color: '#ff6b6b' }} />
                <h2 className="admin-content-title">Generar Reporte</h2>
            </div>
            <Card className="admin-info-card">
                <Alert
                    message="Módulo en desarrollo"
                    description="Herramienta para generar reportes personalizados."
                    type="info"
                    showIcon
                />
            </Card>
        </div>
    );
};

export default GenerarReporte;