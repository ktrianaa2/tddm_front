import React, { useState } from 'react';
import { Button, Card } from 'antd';
import {
  BugOutlined,
  RocketOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

// Configuración de los tipos de prueba disponibles
const TIPOS_PRUEBA = [
  {
    key: 'unitaria',
    label: 'Pruebas Unitarias',
    descripcion: 'Verifican funciones y métodos individuales de forma aislada.',
    icon: <ExperimentOutlined />,
    color: '#52c41a',
    colorBg: '#f6ffed',
    colorBorder: '#b7eb8f',
    emoji: '🧪',
  },
  {
    key: 'componente',
    label: 'Pruebas de Componente',
    descripcion: 'Verifican la integración entre módulos y la interacción entre capas del sistema.',
    icon: <AppstoreOutlined />,
    color: '#722ed1',
    colorBg: '#f9f0ff',
    colorBorder: '#d3adf7',
    emoji: '🔗',
  },
  {
    key: 'sistema',
    label: 'Pruebas de Sistema',
    descripcion: 'Validan flujos completos end-to-end desde la perspectiva del usuario final.',
    icon: <ApiOutlined />,
    color: '#1890ff',
    colorBg: '#e6f4ff',
    colorBorder: '#91caff',
    emoji: '🌐',
  },
];

const VistaGenerarPruebas = ({ loading, onRecargar, onIniciarPruebas }) => {
  const [tiposSeleccionados, setTiposSeleccionados] = useState(['unitaria']);

  const toggleTipo = (key) => {
    setTiposSeleccionados(prev => {
      if (prev.includes(key)) {
        // No permitir deseleccionar si es el único seleccionado
        if (prev.length === 1) return prev;
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const seleccionarTodos = () => {
    setTiposSeleccionados(TIPOS_PRUEBA.map(t => t.key));
  };

  const handleIniciar = () => {
    onIniciarPruebas(tiposSeleccionados);
  };

  const todosSeleccionados = tiposSeleccionados.length === TIPOS_PRUEBA.length;

  return (
    <>
      {/* Header */}
      <div className="tab-header">
        <div className="tab-header-content">
          <h3 className="tab-title">
            <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
            Gestión de Pruebas
          </h3>
          <p className="tab-subtitle">
            Genera casos de prueba automáticamente con IA
          </p>
        </div>
        <div className="tab-header-actions">
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
      <div className="tab-main-content">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '600px',
          padding: 'var(--space-xl)'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
            alignItems: 'center'
          }}>
            {/* Título */}
            <div style={{ fontSize: '3rem' }}>🚀</div>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0,
              textAlign: 'center'
            }}>
              Genera Pruebas Automáticas
            </h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 'var(--line-height-normal)',
              textAlign: 'center'
            }}>
              Selecciona los tipos de prueba que deseas generar.
              La IA los creará basándose en las especificaciones del proyecto.
            </p>

            {/* Selección de tipos */}
            <div style={{ width: '100%' }}>
              {/* Encabezado de selección */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)'
              }}>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  Tipos de prueba
                  <span style={{
                    marginLeft: '8px',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    fontWeight: 'normal'
                  }}>
                    ({tiposSeleccionados.length} de {TIPOS_PRUEBA.length} seleccionados)
                  </span>
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={seleccionarTodos}
                  disabled={todosSeleccionados}
                  style={{ padding: 0, height: 'auto', fontSize: 'var(--font-size-sm)' }}
                >
                  Seleccionar todos
                </Button>
              </div>

              {/* Cards de tipos */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)'
              }}>
                {TIPOS_PRUEBA.map((tipo) => {
                  const seleccionado = tiposSeleccionados.includes(tipo.key);
                  return (
                    <div
                      key={tipo.key}
                      onClick={() => toggleTipo(tipo.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                        padding: '14px 16px',
                        borderRadius: 'var(--border-radius-lg)',
                        border: `2px solid ${seleccionado ? tipo.color : 'var(--border-color)'}`,
                        background: seleccionado ? tipo.colorBg : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        userSelect: 'none',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!seleccionado) {
                          e.currentTarget.style.borderColor = tipo.colorBorder;
                          e.currentTarget.style.background = tipo.colorBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!seleccionado) {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--bg-card)';
                        }
                      }}
                    >
                      {/* Icono tipo */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: seleccionado ? tipo.color : tipo.colorBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: seleccionado ? '#fff' : tipo.color,
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}>
                        {tipo.icon}
                      </div>

                      {/* Texto */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '2px'
                        }}>
                          <span style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)'
                          }}>
                            {tipo.emoji} {tipo.label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-secondary)',
                          lineHeight: 'var(--line-height-normal)'
                        }}>
                          {tipo.descripcion}
                        </span>
                      </div>

                      {/* Indicador de selección */}
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: `2px solid ${seleccionado ? tipo.color : 'var(--border-color)'}`,
                        background: seleccionado ? tipo.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}>
                        {seleccionado && (
                          <CheckCircleOutlined style={{ color: '#fff', fontSize: '12px' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info card */}
            <Card
              style={{
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                border: 'none',
                borderRadius: 'var(--border-radius-lg)',
                width: '100%',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: 'var(--space-md)'
              }}>
                <div style={{ fontSize: '1.5rem' }}>💡</div>
                <div>
                  <h4 style={{
                    margin: '0 0 var(--space-sm) 0',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    ¿Cómo funciona?
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 'var(--line-height-normal)'
                  }}>
                    La IA generará pruebas específicas para cada tipo seleccionado,
                    usando prompts especializados. Puedes generar todos los tipos a la vez
                    o solo los que necesites.
                  </p>
                </div>
              </div>
            </Card>

            {/* Botón de acción */}
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleIniciar}
              disabled={tiposSeleccionados.length === 0 || loading}
              loading={loading}
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-sm)', minWidth: '280px' }}
            >
              {tiposSeleccionados.length > 1
                ? `Generar ${tiposSeleccionados.length} tipos con IA`
                : `Generar Pruebas ${TIPOS_PRUEBA.find(t => t.key === tiposSeleccionados[0])?.label || ''}`
              }
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VistaGenerarPruebas;