import React, { useState } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Space,
    Badge,
    Divider
} from 'antd';
import {
    FileTextOutlined,
    UserOutlined,
    BookOutlined,
    PlusOutlined
} from '@ant-design/icons';

// Importar los componentes individuales
import RequisitosSection from './requisitos/RequisitosSection';
import CasosDeUsoSection from './casos_de_uso/CasosDeUsoSection';
import HistoriasDeUsuarioSection from './historias_de_usuario/HistoriasDeUsuarioSection';

const { Title, Text } = Typography;

const EspecificacionesTab = ({ proyecto }) => {
    const [activeSection, setActiveSection] = useState(null);
    const contadores = {
        requisitos: 0,
        casosUso: 0,
        historiasUsuario: 0
    };

    const especificacionesCards = [
        {
            key: 'requisitos',
            title: 'Requisitos',
            icon: <FileTextOutlined style={{ fontSize: '2rem' }} />,
            count: contadores.requisitos,
            color: '#1890ff',
            description: 'Gestiona los requisitos funcionales y no funcionales del proyecto'
        },
        {
            key: 'casos-uso',
            title: 'Casos de Uso',
            icon: <UserOutlined style={{ fontSize: '2rem' }} />,
            count: contadores.casosUso,
            color: '#52c41a',
            description: 'Define los casos de uso y escenarios de interacción'
        },
        {
            key: 'historias-usuario',
            title: 'Historias de Usuario',
            icon: <BookOutlined style={{ fontSize: '2rem' }} />,
            count: contadores.historiasUsuario,
            color: '#722ed1',
            description: 'Crea historias de usuario para metodologías ágiles'
        }
    ];

    const handleCardClick = (key) => {
        setActiveSection(key);
    };

    const handleBackToOverview = () => {
        setActiveSection(null);
    };

    if (activeSection) {
        return (
            <div>
                <div style={{ marginBottom: '1rem' }}>
                    <Button
                        onClick={handleBackToOverview}
                        className="btn btn-secondary btn-sm"
                    >
                        ← Volver a Especificaciones
                    </Button>
                </div>

                {activeSection === 'requisitos' && (
                    <RequisitosSection proyectoId={proyecto.proyecto_id} />
                )}
                {activeSection === 'casos-uso' && (
                    <CasosDeUsoSection proyectoId={proyecto.proyecto_id} />
                )}
                {activeSection === 'historias-usuario' && (
                    <HistoriasDeUsuarioSection proyectoId={proyecto.proyecto_id} />
                )}
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
                    Gestión de Especificaciones
                </Title>
                <Text type="secondary">
                    Organiza y gestiona todos los elementos de especificación de tu proyecto
                </Text>
            </div>

            <Row gutter={[24, 24]}>
                {especificacionesCards.map((card) => (
                    <Col xs={24} sm={12} lg={8} key={card.key}>
                        <Card
                            hoverable
                            onClick={() => handleCardClick(card.key)}
                            style={{
                                height: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: `1px solid ${card.color}20`,
                                borderRadius: 'var(--border-radius-lg)'
                            }}
                            bodyStyle={{
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                height: '100%'
                            }}
                        >
                            <div style={{
                                color: card.color,
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {card.icon}
                                <Badge
                                    count={card.count}
                                    showZero
                                    style={{
                                        backgroundColor: card.color,
                                        marginLeft: '0.5rem'
                                    }}
                                />
                            </div>

                            <Title level={4} style={{ margin: '0 0 0.5rem 0' }}>
                                {card.title}
                            </Title>

                            <Text type="secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                {card.description}
                            </Text>

                            <Divider style={{ margin: '1rem 0 0.5rem 0' }} />

                            <Space>
                                <Text strong style={{ color: card.color }}>
                                    {card.count}
                                </Text>
                                <Text type="secondary">elementos</Text>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Resumen General */}
            <Card
                title="Resumen de Especificaciones"
                style={{ marginTop: '2rem' }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col span={12}>
                        <div style={{ textAlign: 'center' }}>
                            <Title level={2} type="secondary" style={{ margin: 0 }}>
                                {contadores.requisitos + contadores.casosUso + contadores.historiasUsuario}
                            </Title>
                            <Text type="secondary">Total de Especificaciones</Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Requisitos:</Text>
                                <Text strong>{contadores.requisitos}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Casos de Uso:</Text>
                                <Text strong>{contadores.casosUso}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Historias de Usuario:</Text>
                                <Text strong>{contadores.historiasUsuario}</Text>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default EspecificacionesTab;