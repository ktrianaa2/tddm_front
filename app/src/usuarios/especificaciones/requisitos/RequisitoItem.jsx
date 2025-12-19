import React from 'react';
import { Card, Tag, Button, Typography, Tooltip, Avatar, Space, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import '../../../styles/item-card.css';

const { Text, Title } = Typography;

const RequisitoItem = ({
    requisito,
    onEditar,
    onEliminar,
    loading,
    catalogosDisponibles
}) => {
    // Mapeo de colores para tipos de requisito
    const tipoColors = {
        'funcional': { primary: '#4f46e5', background: '#f0f0ff', border: '#d0d0ff' },
        'no-funcional': { primary: '#10b981', background: '#f0fdfa', border: '#ccfbf1' },
        'negocio': { primary: '#f59e0b', background: '#fffbeb', border: '#fed7aa' },
        'tecnico': { primary: '#7c3aed', background: '#f8f5ff', border: '#e0d4fd' },
        'sistema': { primary: '#06b6d4', background: '#f0fdff', border: '#cffafe' },
        'interfaz': { primary: '#ef4444', background: '#fef2f2', border: '#fecaca' }
    };

    // Mapeo de colores para prioridades
    const prioridadColors = {
        'critica': { primary: '#dc2626', background: '#fef2f2', pulse: true },
        'alta': { primary: '#ea580c', background: '#fff7ed', pulse: false },
        'media': { primary: '#ca8a04', background: '#fefce8', pulse: false },
        'baja': { primary: '#16a34a', background: '#f0fdf4', pulse: false }
    };

    // Mapeo de colores para estados
    const estadoColors = {
        'pendiente': { primary: '#6b7280', background: '#f9fafb', icon: ClockCircleOutlined },
        'en-desarrollo': { primary: '#4f46e5', background: '#f0f0ff', icon: FileTextOutlined },
        'en-revision': { primary: '#f59e0b', background: '#fffbeb', icon: CalendarOutlined },
        'completado': { primary: '#16a34a', background: '#f0fdf4', icon: UserOutlined },
        'cancelado': { primary: '#dc2626', background: '#fef2f2', icon: DeleteOutlined }
    };

    const getTipoConfig = (tipo) => tipoColors[tipo] || { primary: '#6b7280', background: '#f9fafb', border: '#e5e7eb' };
    const getPrioridadConfig = (prioridad) => prioridadColors[prioridad] || { primary: '#6b7280', background: '#f9fafb', pulse: false };
    const getEstadoConfig = (estado) => estadoColors[estado] || { primary: '#6b7280', background: '#f9fafb', icon: FileTextOutlined };

    const getEtiquetaFormateada = (valor) => {
        if (!valor) return '';
        return valor.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const truncateText = (text, maxLength = 150) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const tipoConfig = getTipoConfig(requisito.tipo);
    const prioridadConfig = getPrioridadConfig(requisito.prioridad);
    const estadoConfig = getEstadoConfig(requisito.estado);
    const EstadoIcon = estadoConfig.icon;

    return (
        <Card
            className={`item-card-modern ${prioridadConfig.pulse ? 'pulse-animation' : ''}`}
            hoverable
            bodyStyle={{ padding: 0 }}
            style={{
                '--tipo-primary': tipoConfig.primary,
                '--tipo-background': tipoConfig.background,
                '--tipo-border': tipoConfig.border,
                '--prioridad-primary': prioridadConfig.primary,
            }}
        >
            {/* Header con avatar y acciones */}
            <div className="item-header-modern">
                <div className="item-avatar-section">
                    <Avatar
                        size={48}
                        icon={<FileTextOutlined />}
                        className="item-avatar"
                        style={{
                            '--avatar-color': tipoConfig.primary,
                            backgroundColor: 'var(--avatar-color)',
                            boxShadow: `0 4px 12px ${tipoConfig.primary}40`,
                        }}
                    />
                    <div className="item-priority-indicator">
                        <div
                            className="priority-dot"
                            style={{ '--priority-color': prioridadConfig.primary }}
                        />
                    </div>
                </div>

                <div className="item-content-section">
                    <div className="item-title-row">
                        <Title level={5} className="item-title-modern">
                            {requisito.nombre}
                        </Title>
                        <div className="item-actions-modern">
                            <Tooltip title="Editar requisito">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => onEditar(requisito)}
                                    loading={loading}
                                    //disabled={!catalogosDisponibles}
                                    className="action-btn edit-btn"
                                />
                            </Tooltip>
                            <Tooltip title="Eliminar requisito">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() => onEliminar(requisito)}
                                    disabled={loading}
                                    className="action-btn delete-btn"
                                    danger
                                />
                            </Tooltip>
                        </div>
                    </div>

                    <div className="item-description-modern">
                        <Text type="secondary" className="description-text">
                            {truncateText(requisito.descripcion, 120)}
                        </Text>
                    </div>
                </div>
            </div>

            <Divider className="item-divider" />

            {/* Footer con tags y metadata */}
            <div className="item-footer-modern">
                <Space size={8} wrap className="item-tags-section">
                    {requisito.tipo && (
                        <Tag
                            className="tag-tipo"
                            style={{
                                '--tag-background': tipoConfig.background,
                                '--tag-border': tipoConfig.border,
                                '--tag-color': tipoConfig.primary,
                            }}
                        >
                            {getEtiquetaFormateada(requisito.tipo)}
                        </Tag>
                    )}
                    {requisito.prioridad && (
                        <Tag
                            className="tag-prioridad"
                            style={{
                                '--tag-background': prioridadConfig.background,
                                '--tag-border': prioridadConfig.primary,
                                '--tag-color': prioridadConfig.primary,
                            }}
                        >
                            {getEtiquetaFormateada(requisito.prioridad)}
                        </Tag>
                    )}
                    {requisito.estado && (
                        <Tag
                            className="tag-estado"
                            style={{
                                '--tag-background': estadoConfig.background,
                                '--tag-border': estadoConfig.primary,
                                '--tag-color': estadoConfig.primary,
                            }}
                        >
                            <EstadoIcon className="estado-icon" />
                            <span className="estado-text">
                                {getEtiquetaFormateada(requisito.estado)}
                            </span>
                        </Tag>
                    )}
                </Space>

                <Space size={16} className="item-metadata-section">
                    {requisito.origen && (
                        <div className="metadata-item">
                            <UserOutlined className="metadata-icon" />
                            <Text type="secondary" className="metadata-text">
                                {requisito.origen}
                            </Text>
                        </div>
                    )}
                    {requisito.fecha_creacion && (
                        <div className="metadata-item">
                            <CalendarOutlined className="metadata-icon" />
                            <Text type="secondary" className="metadata-text">
                                {formatDate(requisito.fecha_creacion)}
                            </Text>
                        </div>
                    )}
                </Space>
            </div>
        </Card>
    );
};

export default RequisitoItem;