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
        <div className="tabs-container">
            <div className="tabs-content-wrapper">
                {/* Header */}
                <div className="tab-header">
                    <div className="tab-header-content">
                        <h3 className="tab-title">
                            <BugOutlined style={{ marginRight: '0.5rem' }} />
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
                            style={{ marginRight: '0.5rem' }}
                        >
                            Nueva Prueba
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={onRecargar}
                            loading={loading}
                            className="tab-refresh-btn"
                        >
                            Actualizar
                        </Button>
                    </div>
                </div>

                <div className="tab-main-content">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '450px 1fr',
                        gap: '1.5rem',
                        height: 'calc(100vh - 250px)',
                        minHeight: '600px'
                    }}>
                        {/* Columna Izquierda: Lista de Pruebas */}
                        <div style={{
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Header de la lista */}
                            <div style={{
                                padding: '1.5rem',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
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
                                />
                            </div>

                            {/* Tabs de filtro */}
                            <Tabs
                                activeKey={tipoFiltro}
                                onChange={setTipoFiltro}
                                items={tabs}
                                size="small"
                                style={{
                                    padding: '0 1rem',
                                    marginBottom: 0
                                }}
                            />

                            {/* Lista scrolleable */}
                            {pruebas.length === 0 ? (
                                <Empty
                                    description="No hay pruebas creadas"
                                    style={{ marginTop: '3rem' }}
                                />
                            ) : pruebasFiltradas.length === 0 ? (
                                <Empty
                                    description="No se encontraron pruebas"
                                    style={{ marginTop: '3rem' }}
                                />
                            ) : (
                                <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                                    <List
                                        dataSource={pruebasFiltradas}
                                        loading={loading}
                                        renderItem={(prueba) => {
                                            const config = getTipoConfig(prueba.tipo_prueba);

                                            return (
                                                <List.Item
                                                    style={{
                                                        padding: '1rem',
                                                        marginBottom: '0.75rem',
                                                        background: '#f9fafb',
                                                        borderRadius: '8px',
                                                        border: '2px solid #e5e7eb',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = config.color;
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
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
                                                                borderRadius: '10px',
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
                                                                    fontSize: '1rem',
                                                                    fontWeight: 500,
                                                                    marginBottom: '0.25rem',
                                                                    color: '#1f2937'
                                                                }}>
                                                                    {prueba.nombre}
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    gap: '0.5rem',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <Tag color={config.color} style={{ margin: 0 }}>
                                                                        {config.label}
                                                                    </Tag>
                                                                    <span style={{
                                                                        fontSize: '0.75rem',
                                                                        color: '#9ca3af'
                                                                    }}>
                                                                        {prueba.codigo}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        }
                                                        description={
                                                            prueba.descripcion && (
                                                                <div style={{
                                                                    fontSize: '0.85rem',
                                                                    marginTop: '0.5rem',
                                                                    color: '#6b7280'
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
                            gap: '1.5rem',
                            overflow: 'auto'
                        }}>
                            {/* Cards de Resumen */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem'
                            }}>
                                <Card
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <ExperimentOutlined style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {contadores.unitarias}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                            Pruebas Unitarias
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    style={{
                                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <ApiOutlined style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {contadores.sistema}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                            Pruebas de Sistema
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    style={{
                                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <AppstoreOutlined style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                            {contadores.componentes}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                            Pruebas de Componentes
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Resumen Total */}
                            <Card
                                title="Resumen General de Pruebas"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={onCrearPrueba}
                                    >
                                        Nueva Prueba
                                    </Button>
                                }
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem 0'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1890ff' }}>
                                            {contadores.total}
                                        </div>
                                        <div style={{ fontSize: '1rem', color: '#666' }}>
                                            Total de Casos de Prueba
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.5rem 1rem',
                                            background: '#f6ffed',
                                            borderRadius: '6px'
                                        }}>
                                            <ExperimentOutlined style={{ fontSize: '1.5rem', color: '#52c41a' }} />
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#52c41a' }}>
                                                    {contadores.unitarias}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>Unitarias</div>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.5rem 1rem',
                                            background: '#e6f4ff',
                                            borderRadius: '6px'
                                        }}>
                                            <ApiOutlined style={{ fontSize: '1.5rem', color: '#1890ff' }} />
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1890ff' }}>
                                                    {contadores.sistema}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>Sistema</div>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.5rem 1rem',
                                            background: '#f9f0ff',
                                            borderRadius: '6px'
                                        }}>
                                            <AppstoreOutlined style={{ fontSize: '1.5rem', color: '#722ed1' }} />
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#722ed1' }}>
                                                    {contadores.componentes}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>Componentes</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Información de Ayuda */}
                            <Card
                                style={{
                                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                    border: 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                                    <div style={{ fontSize: '2rem' }}>💡</div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0' }}>¿Cómo gestionar tus pruebas?</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                            Haz clic en cualquier prueba de la lista para editarla o visualizar su código.
                                            También puedes crear nuevas pruebas usando el botón "Nueva Prueba".
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VistaResumenPruebas;