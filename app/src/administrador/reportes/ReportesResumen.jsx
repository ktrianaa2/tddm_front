// src/pages/admin/VerResumen.jsx
import React from 'react';
import { Card, Alert } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import '../../styles/admin-content.css';

const ReportesResumen = () => {
    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <LineChartOutlined className="admin-content-icon" style={{ color: '#ffd93d' }} />
                <h2 className="admin-content-title">Resumen de Reportes</h2>
            </div>
            <Card className="admin-info-card">
                <Alert
                    message="Módulo en desarrollo"
                    description="Visualización de reportes generados."
                    type="info"
                    showIcon
                />
            </Card>
        </div>
    );
};

export default ReportesResumen;