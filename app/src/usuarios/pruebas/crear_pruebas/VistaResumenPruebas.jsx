import React, { useState } from 'react';
import {
    Card,
    Button,
    List,
    Tag,
    Empty,
    Badge,
    Input,
    Tabs
} from 'antd';
import {
    BugOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    ExperimentOutlined,
    ApiOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

const VistaResumenPruebas = ({
    pruebas,
    contadores,
    loading,
    onRecargar,
    onCrearPrueba,
    onEditarPrueba
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState('todas');

    // Filtrar pruebas
    const pruebasFiltradas = pruebas.filter(prueba => {
        const coincideBusqueda =
            prueba.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            prueba.codigo?.toLowerCase().includes(busqueda.toLowerCase());

        const coincideTipo =
            tipoFiltro === 'todas' || prueba.tipo_prueba === tipoFiltro;

        return coincideBusqueda && coincideTipo;
    });

    const getTipoConfig = (tipo) => {
        const configs = {
            unitaria: {
                icon: <ExperimentOutlined />,
                color: '#52c41a',
                bgColor: '#f6ffed',
                label: 'Unitaria'
            },
            sistema: {
                icon: <ApiOutlined />,
                color: '#1890ff',
                bgColor: '#e6f4ff',
                label: 'Sistema'
            },
            componente: {
                icon: <AppstoreOutlined />,
                color: '#722ed1',
                bgColor: '#f9f0ff',
                label: 'Componente'
            }
        };
        return configs[tipo] || configs.unitaria;
    };

    const tabs = [
        {
            key: 'todas',
            label: (
                <span>
                    Todas <Badge count={contadores.total} style={{ backgroundColor: '#595959' }} />
                </span>
            )
        },
        {
            key: 'unitaria',
            label: (
                <span>
                    Unitarias <Badge count={contadores.unitarias} style={{ backgroundColor: '#52c41a' }} />
                </span>
            )
        },
        {
            key: 'sistema',
            label: (
                <span>
                    Sistema <Badge count={contadores.sistema} style={{ backgroundColor: '#1890ff' }} />
                </span>
            )
        },
        {
            key: 'componente',
            label: (
                <span>
                    Componentes <Badge count={contadores.componentes} style={{ backgroundColor: '#722ed1' }} />
                </span>
            )
        }
    ];

    return (
        <>
            {/* Header usando clases de tabs.css */}
            <div className="tab-header">
                <div className="tab-header-content">
                    <h3 className="tab-title">
                        <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
                        Gestión de Pruebas
                    </h3>
                    <p className="tab-subtitle">
                        Organiza y gestiona todos los casos de prueba de tu proyecto
                    </p>
                </div>
                <div className="tab-header-actions">
                    <Button
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={onCrearPrueba}
                        className="btn btn-primary"
                    >
                        Nueva Prueba
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onRecargar}
                        loading={loading}
                        className="btn btn-secondary"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Contenido principal usando clases de tabs.css */}
            <div className="tab-main-content">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '450px 1fr',
                    gap: 'var(--space-xl)',
                    height: 'calc(100vh - 250px)',
                    minHeight: '600px'
                }}>
                    {/* Columna Izquierda: Lista de Pruebas */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--border-radius-lg)',
                        boxShadow: 'var(--shadow-md)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header de la lista */}
                        <div style={{
                            padding: 'var(--space-xl)',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--space-md)'
                            }}>
                                <h4 style={{
                                    margin: 0,
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--text-primary)'
                                }}>
                                    Casos de Prueba
                                </h4>
                                <Badge count={pruebasFiltradas.length} showZero />
                            </div>

                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Buscar prueba..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                allowClear
                                style={{
                                    background: 'var(--bg-hover)',
                                    borderColor: 'var(--border-color)'
                                }}
                            />
                        </div>

                        {/* Tabs de filtro */}
                        <Tabs
                            activeKey={tipoFiltro}
                            onChange={setTipoFiltro}
                            items={tabs}
                            size="small"
                            style={{
                                padding: '0 var(--space-md)',
                                marginBottom: 0
                            }}
                        />

                        {/* Lista scrolleable */}
                        {pruebas.length === 0 ? (
                            <div className="tab-empty-state">
                                <Empty description="No hay pruebas creadas" />
                            </div>
                        ) : pruebasFiltradas.length === 0 ? (
                            <div className="tab-empty-state">
                                <Empty description="No se encontraron pruebas" />
                            </div>
                        ) : (
                            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-md)' }}>
                                <List
                                    dataSource={pruebasFiltradas}
                                    loading={loading}
                                    renderItem={(prueba) => {
                                        const config = getTipoConfig(prueba.tipo_prueba);

                                        return (
                                            <List.Item
                                                style={{
                                                    padding: 'var(--space-md)',
                                                    marginBottom: 'var(--space-md)',
                                                    background: 'var(--bg-hover)',
                                                    borderRadius: 'var(--border-radius)',
                                                    border: '2px solid var(--border-color)',
                                                    cursor: 'pointer',
                                                    transition: 'all var(--transition-normal)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = config.color;
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                                onClick={() => onEditarPrueba(prueba)}
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <div style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: 'var(--border-radius-lg)',
                                                            background: config.bgColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: config.color,
                                                            fontSize: '1.5rem'
                                                        }}>
                                                            {config.icon}
                                                        </div>
                                                    }
                                                    title={
                                                        <div>
                                                            <div style={{
                                                                fontSize: 'var(--font-size-base)',
                                                                fontWeight: 'var(--font-weight-medium)',
                                                                marginBottom: 'var(--space-sm)',
                                                                color: 'var(--text-primary)'
                                                            }}>
                                                                {prueba.nombre}
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: 'var(--space-sm)',
                                                                alignItems: 'center'
                                                            }}>
                                                                <Tag color={config.color} style={{ margin: 0 }}>
                                                                    {config.label}
                                                                </Tag>
                                                                <span style={{
                                                                    fontSize: 'var(--font-size-sm)',
                                                                    color: 'var(--text-tertiary)'
                                                                }}>
                                                                    {prueba.codigo}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    }
                                                    description={
                                                        prueba.descripcion && (
                                                            <div style={{
                                                                fontSize: 'var(--font-size-sm)',
                                                                marginTop: 'var(--space-sm)',
                                                                color: 'var(--text-secondary)'
                                                            }}>
                                                                {prueba.descripcion.substring(0, 100)}...
                                                            </div>
                                                        )
                                                    }
                                                />
                                            </List.Item>
                                        );
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Columna Derecha: Resumen y Estadísticas */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-xl)',
                        overflow: 'auto'
                    }}>

                        {/* Resumen Total usando clases CSS */}
                        <Card
                            title={
                                <span style={{
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 'var(--font-weight-semibold)'
                                }}>
                                    Resumen General de Pruebas
                                </span>
                            }

                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius-lg)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--space-md) 0'
                            }}>
                                <div>
                                    <div style={{
                                        fontSize: '3rem',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--primary-color)'
                                    }}>
                                        {contadores.total}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--font-size-base)',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Total de Casos de Prueba
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-md)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: '#f6ffed',
                                        borderRadius: 'var(--border-radius)'
                                    }}>
                                        <ExperimentOutlined style={{ fontSize: '1.5rem', color: '#52c41a' }} />
                                        <div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: '#52c41a'
                                            }}>
                                                {contadores.unitarias}
                                            </div>
                                            <div style={{
                                                fontSize: 'var(--font-size-sm)',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Unitarias
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: '#e6f4ff',
                                        borderRadius: 'var(--border-radius)'
                                    }}>
                                        <ApiOutlined style={{ fontSize: '1.5rem', color: '#1890ff' }} />
                                        <div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: '#1890ff'
                                            }}>
                                                {contadores.sistema}
                                            </div>
                                            <div style={{
                                                fontSize: 'var(--font-size-sm)',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Sistema
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: '#f9f0ff',
                                        borderRadius: 'var(--border-radius)'
                                    }}>
                                        <AppstoreOutlined style={{ fontSize: '1.5rem', color: '#722ed1' }} />
                                        <div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: '#722ed1'
                                            }}>
                                                {contadores.componentes}
                                            </div>
                                            <div style={{
                                                fontSize: 'var(--font-size-sm)',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Componentes
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Información de Ayuda usando variables CSS */}
                        <Card
                            style={{
                                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                border: 'none',
                                borderRadius: 'var(--border-radius-lg)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'start',
                                gap: 'var(--space-md)'
                            }}>
                                <div style={{ fontSize: '2rem' }}>💡</div>
                                <div>
                                    <h4 style={{
                                        margin: '0 0 var(--space-sm) 0',
                                        fontSize: 'var(--font-size-base)',
                                        fontWeight: 'var(--font-weight-semibold)'
                                    }}>
                                        ¿Cómo gestionar tus pruebas?
                                    </h4>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 'var(--font-size-sm)',
                                        lineHeight: 'var(--line-height-normal)'
                                    }}>
                                        Haz clic en cualquier prueba de la lista para editarla o visualizar su código.
                                        También puedes crear nuevas pruebas usando el botón "Nueva Prueba".
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VistaResumenPruebas;