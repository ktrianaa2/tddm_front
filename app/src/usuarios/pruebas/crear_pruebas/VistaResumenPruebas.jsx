import React from 'react';
import {
    Card,
    Button
} from 'antd';
import {
    BugOutlined,
    PlusOutlined,
    ReloadOutlined,
    ExperimentOutlined,
    ApiOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

const VistaResumenPruebas = ({
    contadores,
    loading,
    onRecargar,
    onCrearPrueba
}) => {
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

            {/* Contenido principal */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-xl)',
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%'
            }}>
                {/* Resumen Total */}
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
                        padding: 'var(--space-md) 0',
                        flexWrap: 'wrap',
                        gap: 'var(--space-xl)'
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

                {/* Información de Ayuda */}
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
                                Selecciona una prueba de la lista lateral para editarla o visualizar su código.
                                También puedes crear nuevas pruebas usando el botón "Nueva Prueba".
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default VistaResumenPruebas;