import React, { useState, useMemo } from 'react';
import { Card, Typography, Row, Col, Tabs, Tag, Empty, Spin } from 'antd';
import { FileTextOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const EspecificacionesSection = ({
    proyectoId,
    especificacionesCombinadas,
    requisitos,
    casosUso,
    historiasUsuario,
    contadores,
    loading
}) => {
    const [filterType, setFilterType] = useState('all');

    if (!proyectoId) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <FileTextOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                <Title level={4} type="secondary">Selecciona un proyecto</Title>
                <Text type="secondary">Debes seleccionar un proyecto para ver sus especificaciones</Text>
            </Card>
        );
    }

    // Filtrar especificaciones según el tipo seleccionado
    const especificacionesFiltradas = useMemo(() => {
        if (filterType === 'all') {
            return especificacionesCombinadas;
        }
        return especificacionesCombinadas.filter(
            spec => spec.tipo_especificacion === filterType
        );
    }, [especificacionesCombinadas, filterType]);

    // Renderizar un elemento de especificación
    const renderSpecificationItem = (spec) => {
        const getIcon = (tipo) => {
            switch (tipo) {
                case 'requisito':
                    return <FileTextOutlined />;
                case 'caso_uso':
                    return <UserOutlined />;
                case 'historia_usuario':
                    return <BookOutlined />;
                default:
                    return <FileTextOutlined />;
            }
        };

        const getTitle = (spec) => {
            switch (spec.tipo_especificacion) {
                case 'requisito':
                    return spec.nombre || spec.titulo || 'Sin título';
                case 'caso_uso':
                    return spec.nombre || spec.titulo || 'Sin título';
                case 'historia_usuario':
                    return spec.titulo || spec.descripcion || 'Sin título';
                default:
                    return 'Sin título';
            }
        };

        const getDescription = (spec) => {
            switch (spec.tipo_especificacion) {
                case 'requisito':
                    return spec.descripcion || 'Sin descripción';
                case 'caso_uso':
                    return spec.descripcion || 'Sin descripción';
                case 'historia_usuario':
                    return spec.descripcion || spec.descripcion_historia || 'Sin descripción';
                default:
                    return 'Sin descripción';
            }
        };

        return (
            <div
                key={`${spec.tipo_especificacion}-${spec.id}`}
                style={{
                    padding: '1rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${spec.color}30`,
                    marginBottom: '1rem',
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${spec.color}10`;
                    e.currentTarget.style.boxShadow = `0 2px 8px ${spec.color}20`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                }}>
                    <span style={{
                        fontSize: '1.25rem',
                        color: spec.color,
                        flexShrink: 0,
                        marginTop: '0.25rem'
                    }}>
                        {getIcon(spec.tipo_especificacion)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                            flexWrap: 'wrap'
                        }}>
                            <h5 style={{
                                margin: 0,
                                color: 'var(--text-primary)',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                flex: 1
                            }}>
                                {getTitle(spec)}
                            </h5>
                            <Tag color={spec.color} style={{ margin: 0 }}>
                                {spec.tipo_label}
                            </Tag>
                        </div>
                        <p style={{
                            margin: '0.5rem 0 0 0',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {getDescription(spec)}
                        </p>
                        {spec.prioridad && (
                            <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <strong>Prioridad:</strong> {spec.prioridad}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <Spin size="large" />
                <div style={{ marginTop: "1rem" }}>
                    <Text type="secondary">Cargando especificaciones...</Text>
                </div>
            </Card>
        );
    }

    const tabs = [
        {
            key: 'all',
            label: (
                <span>
                    Todas
                    <span style={{
                        marginLeft: '0.5rem',
                        background: 'var(--bg-secondary)',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.85rem'
                    }}>
                        {contadores.total}
                    </span>
                </span>
            ),
            children: (
                <>
                    {especificacionesFiltradas.length === 0 ? (
                        <Empty
                            description="No hay especificaciones definidas"
                            style={{ marginTop: '2rem' }}
                        />
                    ) : (
                        <div>
                            {especificacionesFiltradas.map(spec => renderSpecificationItem(spec))}
                        </div>
                    )}
                </>
            )
        },
        {
            key: 'requisito',
            label: (
                <span>
                    <FileTextOutlined style={{ marginRight: '0.5rem' }} />
                    Requisitos
                    <span style={{
                        marginLeft: '0.5rem',
                        background: '#1890ff15',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.85rem',
                        color: '#1890ff'
                    }}>
                        {requisitos.length}
                    </span>
                </span>
            ),
            children: (
                <>
                    {requisitos.length === 0 ? (
                        <Empty
                            description="No hay requisitos definidos"
                            style={{ marginTop: '2rem' }}
                        />
                    ) : (
                        <div>
                            {requisitos.map(req =>
                                renderSpecificationItem({
                                    ...req,
                                    tipo_especificacion: 'requisito',
                                    tipo_label: 'Requisito',
                                    color: '#1890ff'
                                })
                            )}
                        </div>
                    )}
                </>
            )
        },
        {
            key: 'caso_uso',
            label: (
                <span>
                    <UserOutlined style={{ marginRight: '0.5rem' }} />
                    Casos de Uso
                    <span style={{
                        marginLeft: '0.5rem',
                        background: '#52c41a15',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.85rem',
                        color: '#52c41a'
                    }}>
                        {casosUso.length}
                    </span>
                </span>
            ),
            children: (
                <>
                    {casosUso.length === 0 ? (
                        <Empty
                            description="No hay casos de uso definidos"
                            style={{ marginTop: '2rem' }}
                        />
                    ) : (
                        <div>
                            {casosUso.map(cu =>
                                renderSpecificationItem({
                                    ...cu,
                                    tipo_especificacion: 'caso_uso',
                                    tipo_label: 'Caso de Uso',
                                    color: '#52c41a'
                                })
                            )}
                        </div>
                    )}
                </>
            )
        },
        {
            key: 'historia_usuario',
            label: (
                <span>
                    <BookOutlined style={{ marginRight: '0.5rem' }} />
                    Historias de Usuario
                    <span style={{
                        marginLeft: '0.5rem',
                        background: '#722ed115',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.85rem',
                        color: '#722ed1'
                    }}>
                        {historiasUsuario.length}
                    </span>
                </span>
            ),
            children: (
                <>
                    {historiasUsuario.length === 0 ? (
                        <Empty
                            description="No hay historias de usuario definidas"
                            style={{ marginTop: '2rem' }}
                        />
                    ) : (
                        <div>
                            {historiasUsuario.map(hu =>
                                renderSpecificationItem({
                                    ...hu,
                                    tipo_especificacion: 'historia_usuario',
                                    tipo_label: 'Historia',
                                    color: '#722ed1'
                                })
                            )}
                        </div>
                    )}
                </>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <Title level={4} style={{ margin: 0, marginBottom: '0.5rem' }}>
                    Vista General de Especificaciones
                </Title>
            </div>

            <Tabs
                activeKey={filterType}
                onChange={setFilterType}
                items={tabs}
                style={{
                    background: 'transparent'
                }}
            />
        </div>
    );
};

export default EspecificacionesSection;