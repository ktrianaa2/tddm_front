import React from 'react';
import { Card, Tag, Button, Typography, Tooltip, Avatar, Space, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, BookOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import '../../../styles/item-card.css';

const { Text, Title } = Typography;

const HistoriaUsuarioItem = ({
    historia,
    onEditar,
    onEliminar,
    loading,
    catalogosDisponibles
}) => {
    // Mapeo de colores para prioridades
    const prioridadColors = {
        'critica': { primary: '#dc2626', background: '#fef2f2', border: '#fecaca' },
        'alta': { primary: '#ea580c', background: '#fff7ed', border: '#fed7aa' },
        'media': { primary: '#ca8a04', background: '#fefce8', border: '#fef3c7' },
        'baja': { primary: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' },
        'muy-alta': { primary: '#dc2626', background: '#fef2f2', border: '#fecaca' },
        'muy-baja': { primary: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' }
    };

    // Mapeo de colores para estados
    const estadoColors = {
        'pendiente': { primary: '#6b7280', background: '#f9fafb', icon: ClockCircleOutlined },
        'en-progreso': { primary: '#4f46e5', background: '#f0f0ff', icon: BookOutlined },
        'en-desarrollo': { primary: '#4f46e5', background: '#f0f0ff', icon: BookOutlined },
        'en-revision': { primary: '#f59e0b', background: '#fffbeb', icon: CalendarOutlined },
        'completada': { primary: '#16a34a', background: '#f0fdf4', icon: TrophyOutlined },
        'completado': { primary: '#16a34a', background: '#f0fdf4', icon: TrophyOutlined },
        'cancelada': { primary: '#dc2626', background: '#fef2f2', icon: DeleteOutlined },
        'cancelado': { primary: '#dc2626', background: '#fef2f2', icon: DeleteOutlined },
        'bloqueada': { primary: '#dc2626', background: '#fef2f2', icon: ClockCircleOutlined }
    };

    // Mapeo de colores para unidades de estimación
    const estimacionColors = {
        'story-points': { primary: '#1890ff', background: '#f0f9ff', border: '#dbeafe' },
        'horas': { primary: '#52c41a', background: '#f6ffed', border: '#d9f7be' },
        'dias': { primary: '#fa8c16', background: '#fff7e6', border: '#ffd591' },
        'costo': { primary: '#722ed1', background: '#f9f0ff', border: '#efdbff' }
    };

    const getPrioridadConfig = (prioridad) => prioridadColors[prioridad] || { primary: '#6b7280', background: '#f9fafb', border: '#e5e7eb' };
    const getEstadoConfig = (estado) => estadoColors[estado] || { primary: '#6b7280', background: '#f9fafb', icon: BookOutlined };
    const getEstimacionConfig = (unidad) => estimacionColors[unidad] || { primary: '#6b7280', background: '#f9fafb', border: '#e5e7eb' };

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

    // Extraer el título de la descripción de la historia
    const extraerTitulo = (descripcionHistoria) => {
        if (!descripcionHistoria) return 'Sin título';
        return descripcionHistoria.length > 50
            ? `${descripcionHistoria.substring(0, 50)}...`
            : descripcionHistoria;
    };

    // Formatear estimación para mostrar
    const formatearEstimacion = (valor, unidad) => {
        if (!valor || !unidad) return '';

        const sufijos = {
            'story-points': 'SP',
            'horas': 'hrs',
            'dias': 'días',
            'costo': '$'
        };

        const sufijo = sufijos[unidad] || unidad;
        return unidad === 'costo' ? `$${valor}` : `${valor} ${sufijo}`;
    };

    // Construir descripción completa de la historia
    const construirDescripcionCompleta = () => {
        const partes = [];

        if (historia.actor_rol) {
            partes.push(`Como ${historia.actor_rol}`);
        }
        if (historia.funcionalidad_accion) {
            partes.push(`quiero ${historia.funcionalidad_accion}`);
        }
        if (historia.beneficio_razon) {
            partes.push(`para ${historia.beneficio_razon}`);
        }

        return partes.length > 0 ? partes.join(', ') : historia.descripcion_historia;
    };

    const prioridadConfig = getPrioridadConfig(historia.prioridad);
    const estadoConfig = getEstadoConfig(historia.estado);
    const EstadoIcon = estadoConfig.icon;

    // Determinar si debe tener animación de pulso (prioridad crítica)
    const tienePulso = historia.prioridad === 'critica' || historia.prioridad === 'muy-alta';

    return (
        <Card
            className={`item-card-modern ${tienePulso ? 'pulse-animation' : ''}`}
            hoverable
            bodyStyle={{ padding: 0 }}
            data-estado={historia.estado}
            style={{
                '--tipo-primary': '#722ed1', // Color morado para historias de usuario
                '--tipo-background': '#f9f0ff',
                '--tipo-border': '#efdbff',
                '--prioridad-primary': prioridadConfig.primary,
            }}
        >
            {/* Header con avatar y acciones */}
            <div className="item-header-modern">
                <div className="item-avatar-section">
                    <Avatar
                        size={48}
                        icon={<BookOutlined />}
                        className="item-avatar"
                        style={{
                            backgroundColor: '#722ed1',
                            boxShadow: '0 4px 12px rgba(114, 46, 209, 0.4)',
                        }}
                    />
                    {historia.prioridad && (
                        <div className="item-priority-indicator">
                            <div
                                className="priority-dot"
                                style={{ '--priority-color': prioridadConfig.primary }}
                            />
                        </div>
                    )}
                </div>

                <div className="item-content-section">
                    <div className="item-title-row">
                        <Title level={5} className="item-title-modern">
                            {extraerTitulo(historia.descripcion_historia)}
                        </Title>
                        <div className="item-actions-modern">
                            <Tooltip title="Editar historia de usuario">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => onEditar(historia)}
                                    loading={loading}
                                    disabled={!catalogosDisponibles}
                                    className="action-btn edit-btn"
                                />
                            </Tooltip>
                            <Tooltip title="Eliminar historia de usuario">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() => onEliminar(historia)}
                                    disabled={loading}
                                    className="action-btn delete-btn"
                                    danger
                                />
                            </Tooltip>
                        </div>
                    </div>

                    <div className="item-description-modern">
                        <Text type="secondary" className="description-text">
                            {truncateText(construirDescripcionCompleta(), 120)}
                        </Text>
                    </div>

                    {/* Información extra específica para historias de usuario */}
                    <div className="caso-uso-extra-info">
                        {historia.actor_rol && (
                            <div className="extra-info-item">
                                <span className="extra-info-label">Actor:</span>
                                <span className="extra-info-text">{historia.actor_rol}</span>
                            </div>
                        )}
                        {historia.valor_negocio && (
                            <div className="extra-info-item">
                                <span className="extra-info-label">Valor:</span>
                                <span className="extra-info-text">{historia.valor_negocio}/100</span>
                            </div>
                        )}
                        {historia.componentes_relacionados && (
                            <div className="extra-info-item">
                                <span className="extra-info-label">Componentes:</span>
                                <span className="extra-info-text">{historia.componentes_relacionados}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Divider className="item-divider" />

            {/* Footer con tags y metadata */}
            <div className="item-footer-modern">
                <Space size={8} wrap className="item-tags-section">
                    {historia.prioridad && (
                        <Tag
                            className="tag-prioridad"
                            style={{
                                '--tag-background': prioridadConfig.background,
                                '--tag-border': prioridadConfig.primary,
                                '--tag-color': prioridadConfig.primary,
                            }}
                        >
                            {getEtiquetaFormateada(historia.prioridad)}
                        </Tag>
                    )}
                    {historia.estado && (
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
                                {getEtiquetaFormateada(historia.estado)}
                            </span>
                        </Tag>
                    )}

                    {/* Tags de estimación */}
                    {historia.estimacion_valor && historia.unidad_estimacion && (
                        <Tag
                            className="tag-complejidad"
                            style={{
                                '--tag-background': getEstimacionConfig(historia.unidad_estimacion).background,
                                '--tag-border': getEstimacionConfig(historia.unidad_estimacion).primary,
                                '--tag-color': getEstimacionConfig(historia.unidad_estimacion).primary,
                            }}
                        >
                            {formatearEstimacion(historia.estimacion_valor, historia.unidad_estimacion)}
                        </Tag>
                    )}

                    {/* Tags adicionales para múltiples estimaciones */}
                    {historia.estimaciones && historia.estimaciones.length > 0 && (
                        historia.estimaciones.slice(0, 2).map((estimacion, index) => (
                            <Tag
                                key={index}
                                className="tag-complejidad"
                                style={{
                                    '--tag-background': getEstimacionConfig(estimacion.unidad_estimacion).background,
                                    '--tag-border': getEstimacionConfig(estimacion.unidad_estimacion).primary,
                                    '--tag-color': getEstimacionConfig(estimacion.unidad_estimacion).primary,
                                }}
                            >
                                {formatearEstimacion(estimacion.valor, estimacion.unidad_estimacion)}
                            </Tag>
                        ))
                    )}

                    {/* Indicador de más estimaciones */}
                    {historia.estimaciones && historia.estimaciones.length > 2 && (
                        <Tag className="tag-categoria">
                            +{historia.estimaciones.length - 2} más
                        </Tag>
                    )}
                </Space>

                <Space size={16} className="item-metadata-section">
                    {historia.fecha_creacion && (
                        <div className="metadata-item">
                            <CalendarOutlined className="metadata-icon" />
                            <Text type="secondary" className="metadata-text">
                                {formatDate(historia.fecha_creacion)}
                            </Text>
                        </div>
                    )}
                </Space>
            </div>
        </Card>
    );
};

export default HistoriaUsuarioItem;