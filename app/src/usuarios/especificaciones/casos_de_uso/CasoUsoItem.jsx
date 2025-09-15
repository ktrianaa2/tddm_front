import React from 'react';
import { Card, Tag, Button, Typography, Tooltip, Avatar, Space, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined, BranchesOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import '../../../styles/item-card.css';

const { Text, Title } = Typography;

const CasoUsoItem = ({
    casoUso,
    onEditar,
    onEliminar,
    loading,
    catalogosDisponibles
}) => {
    // Mapeo de colores para casos de uso (diferente a requisitos)
    const tipoColors = {
        'caso-uso': { primary: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' },
        'historia-usuario': { primary: '#3b82f6', background: '#eff6ff', border: '#bfdbfe' },
        'epica': { primary: '#8b5cf6', background: '#f5f3ff', border: '#d8b4fe' },
        'escenario': { primary: '#f59e0b', background: '#fffbeb', border: '#fed7aa' }
    };

    // Mapeo de colores para prioridades (mismo que requisitos)
    const prioridadColors = {
        'muy-alta': { primary: '#dc2626', background: '#fef2f2', pulse: true },
        'alta': { primary: '#ea580c', background: '#fff7ed', pulse: false },
        'media': { primary: '#ca8a04', background: '#fefce8', pulse: false },
        'baja': { primary: '#16a34a', background: '#f0fdf4', pulse: false },
        'muy-baja': { primary: '#6b7280', background: '#f9fafb', pulse: false }
    };

    // Mapeo de colores para estados de casos de uso
    const estadoColors = {
        'borrador': { primary: '#6b7280', background: '#f9fafb', icon: ClockCircleOutlined },
        'en-desarrollo': { primary: '#4f46e5', background: '#f0f0ff', icon: BranchesOutlined },
        'en-revision': { primary: '#f59e0b', background: '#fffbeb', icon: CalendarOutlined },
        'aprobado': { primary: '#16a34a', background: '#f0fdf4', icon: CheckCircleOutlined },
        'implementado': { primary: '#059669', background: '#ecfdf5', icon: CheckCircleOutlined },
        'cancelado': { primary: '#dc2626', background: '#fef2f2', icon: DeleteOutlined }
    };

    const getTipoConfig = () => tipoColors['caso-uso']; // Casos de uso siempre tienen el mismo tipo visual
    const getPrioridadConfig = (prioridad) => prioridadColors[prioridad] || { primary: '#6b7280', background: '#f9fafb', pulse: false };
    const getEstadoConfig = (estado) => estadoColors[estado] || { primary: '#6b7280', background: '#f9fafb', icon: ClockCircleOutlined };

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

    const contarPasos = (flujo) => {
        if (!flujo || !Array.isArray(flujo)) return 0;
        return flujo.length;
    };

    const contarRelaciones = (relaciones) => {
        if (!relaciones || !Array.isArray(relaciones)) return 0;
        return relaciones.length;
    };

    const tipoConfig = getTipoConfig();
    const prioridadConfig = getPrioridadConfig(casoUso.prioridad);
    const estadoConfig = getEstadoConfig(casoUso.estado);
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
            data-estado={casoUso.estado}
        >
            {/* Header con avatar y acciones */}
            <div className="item-header-modern">
                <div className="item-avatar-section">
                    <Avatar
                        size={48}
                        icon={<UserOutlined />}
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
                            {casoUso.nombre}
                        </Title>
                        <div className="item-actions-modern">
                            <Tooltip title="Editar caso de uso">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => onEditar(casoUso)}
                                    loading={loading}
                                    disabled={!catalogosDisponibles}
                                    className="action-btn edit-btn"
                                />
                            </Tooltip>
                            <Tooltip title="Eliminar caso de uso">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() => onEliminar(casoUso)}
                                    disabled={loading}
                                    className="action-btn delete-btn"
                                    danger
                                />
                            </Tooltip>
                        </div>
                    </div>

                    <div className="item-description-modern">
                        <Text type="secondary" className="description-text">
                            {truncateText(casoUso.descripcion, 120)}
                        </Text>

                        {/* Información adicional específica de casos de uso */}
                        <div className="caso-uso-extra-info">
                            {casoUso.actores && (
                                <div className="extra-info-item">
                                    <Text type="secondary" className="extra-info-label">
                                        Actores:
                                    </Text>
                                    <Text type="secondary" className="extra-info-text">
                                        {truncateText(casoUso.actores, 80)}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Divider className="item-divider" />

            {/* Footer con tags y metadata */}
            <div className="item-footer-modern">
                <Space size={8} wrap className="item-tags-section">
                    <Tag
                        className="tag-tipo"
                        style={{
                            '--tag-background': tipoConfig.background,
                            '--tag-border': tipoConfig.border,
                            '--tag-color': tipoConfig.primary,
                        }}
                    >
                        Caso de Uso
                    </Tag>

                    {casoUso.prioridad && (
                        <Tag
                            className="tag-prioridad"
                            style={{
                                '--tag-background': prioridadConfig.background,
                                '--tag-border': prioridadConfig.primary,
                                '--tag-color': prioridadConfig.primary,
                            }}
                        >
                            {getEtiquetaFormateada(casoUso.prioridad)}
                        </Tag>
                    )}

                    {casoUso.estado && (
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
                                {getEtiquetaFormateada(casoUso.estado)}
                            </span>
                        </Tag>
                    )}

                    {/* Tags específicos para casos de uso */}
                    {contarPasos(casoUso.flujo_principal) > 0 && (
                        <Tag className="tag-flujo">
                            {contarPasos(casoUso.flujo_principal)} paso{contarPasos(casoUso.flujo_principal) !== 1 ? 's' : ''}
                        </Tag>
                    )}

                    {contarRelaciones(casoUso.relaciones) > 0 && (
                        <Tag className="tag-relaciones">
                            {contarRelaciones(casoUso.relaciones)} relación{contarRelaciones(casoUso.relaciones) !== 1 ? 'es' : ''}
                        </Tag>
                    )}
                </Space>

                <Space size={16} className="item-metadata-section">
                    {casoUso.fecha_creacion && (
                        <div className="metadata-item">
                            <CalendarOutlined className="metadata-icon" />
                            <Text type="secondary" className="metadata-text">
                                {formatDate(casoUso.fecha_creacion)}
                            </Text>
                        </div>
                    )}
                </Space>
            </div>
        </Card>
    );
};

export default CasoUsoItem;