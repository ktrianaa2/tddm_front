import React from 'react';
import { Card, Button, Empty, Spin } from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    BookOutlined,
    TeamOutlined
} from '@ant-design/icons';
import '../../styles/tabs.css';

const ResumenEspecificacionesPanel = ({
    contadores,
    loading,
    selectedFilter,
    onFilterChange
}) => {
    const cardItems = [
        {
            key: 'total',
            title: 'Total de Especificaciones',
            icon: <TeamOutlined />,
            count: contadores.total,
            color: 'blue',
            description: 'Todas las especificaciones del proyecto'
        },
        {
            key: 'casos-uso',
            title: 'Casos de Uso',
            icon: <UserOutlined />,
            count: contadores.casosUso,
            color: 'green',
            description: 'Casos de uso definidos'
        },
        {
            key: 'requisitos',
            title: 'Requisitos',
            icon: <FileTextOutlined />,
            count: contadores.requisitos,
            color: 'blue',
            description: 'Requisitos del proyecto'
        },
        {
            key: 'historias-usuario',
            title: 'Historias de Usuario',
            icon: <BookOutlined />,
            count: contadores.historiasUsuario,
            color: 'purple',
            description: 'Historias de usuario'
        }
    ];

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                height: '100%',
                overflow: 'auto'
            }}
        >
            {cardItems.map((item) => (
                <Card
                    key={item.key}
                    hoverable
                    onClick={() => onFilterChange(item.key)}
                    style={{
                        cursor: 'pointer',
                        border: selectedFilter === item.key ? '2px solid #1890ff' : '1px solid var(--border-color)',
                        background: selectedFilter === item.key ? '#fafafa' : 'var(--bg-card)',
                        transition: 'all var(--transition-normal)',
                        borderRadius: 'var(--border-radius-lg)'
                    }}
                    bodyStyle={{
                        padding: '1.5rem'
                    }}
                >
                    <Spin spinning={loading}>
                        <div style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '0.5rem',
                                    color: item.color === 'blue' ? '#1890ff' :
                                        item.color === 'green' ? '#52c41a' :
                                            item.color === 'purple' ? '#722ed1' : '#666'
                                }}
                            >
                                {item.icon}
                            </div>

                            <div
                                style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: 'var(--text-primary)',
                                    margin: '0.5rem 0'
                                }}
                            >
                                {item.count}
                            </div>

                            <div
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                {item.title}
                            </div>

                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                {item.description}
                            </div>
                        </div>
                    </Spin>
                </Card>
            ))}
        </div>
    );
};

export default ResumenEspecificacionesPanel;