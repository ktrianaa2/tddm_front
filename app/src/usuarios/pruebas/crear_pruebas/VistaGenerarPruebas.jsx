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
  ArrowLeftOutlined,
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';
import '../../../styles/pruebas.css';

// Configuración de los tipos de prueba disponibles
const TODOS_LOS_TIPOS = [
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

const VistaGenerarPruebas = ({
  loading,
  onRecargar,
  onIniciarPruebas,
  tiposExcluidos = [],
  onVolver = null,
}) => {
  const tiposDisponibles = TODOS_LOS_TIPOS.filter(t => !tiposExcluidos.includes(t.key));

  const [tiposSeleccionados, setTiposSeleccionados] = useState(() => {
    return tiposDisponibles.length > 0 ? [tiposDisponibles[0].key] : [];
  });

  const toggleTipo = (key) => {
    setTiposSeleccionados(prev => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const seleccionarTodos = () => {
    setTiposSeleccionados(tiposDisponibles.map(t => t.key));
  };

  const handleIniciar = () => {
    onIniciarPruebas(tiposSeleccionados);
  };

  const todosSeleccionados = tiposSeleccionados.length === tiposDisponibles.length;
  const esModoGenerarMas = tiposExcluidos.length > 0;

  // Si no hay tipos disponibles
  if (tiposDisponibles.length === 0) {
    return (
      <>
        <div className="tab-header">
          <div className="tab-header-content">
            <h3 className="tab-title">
              <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
              Gestión de Pruebas
            </h3>
            <p className="tab-subtitle">Ya tienes pruebas de todos los tipos generadas</p>
          </div>
          <div className="tab-header-actions">
            {onVolver && (
              <Button icon={<ArrowLeftOutlined />} onClick={onVolver} className="btn btn-secondary">
                Volver a pruebas
              </Button>
            )}
          </div>
        </div>

        <div className="tab-main-content vista-todos-generados">
          <div className="vista-todos-generados__inner">
            <div className="vista-todos-generados__emoji">✅</div>
            <h3 className="vista-todos-generados__titulo">Todos los tipos generados</h3>
            <p className="vista-todos-generados__subtitulo">
              Ya tienes pruebas unitarias, de componente y de sistema.
            </p>
            {onVolver && (
              <Button type="primary" onClick={onVolver} className="btn btn-primary vista-todos-generados__btn">
                Ver mis pruebas
              </Button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="tab-header">
        <div className="tab-header-content">
          <h3 className="tab-title">
            <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
            {esModoGenerarMas ? 'Generar Más Pruebas' : 'Gestión de Pruebas'}
          </h3>
          <p className="tab-subtitle">
            {esModoGenerarMas
              ? `Genera pruebas de los tipos que aún no tienes (${tiposExcluidos.join(', ')} ya generados)`
              : 'Genera casos de prueba automáticamente con IA'
            }
          </p>
        </div>
        <div className="tab-header-actions">
          {onVolver && (
            <Button icon={<ArrowLeftOutlined />} onClick={onVolver} className="btn btn-secondary">
              Volver a pruebas
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={onRecargar} loading={loading} className="btn btn-secondary">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="tab-main-content">
        <div className="vista-generar-centrado">
          <div className="vista-generar-inner">
            <div className="vista-generar-emoji">🚀</div>

            <h2 className="vista-generar-titulo">
              {esModoGenerarMas ? 'Genera Más Pruebas' : 'Genera Pruebas Automáticas'}
            </h2>

            <p className="vista-generar-descripcion">
              {esModoGenerarMas
                ? 'Selecciona los tipos adicionales que deseas generar. La IA los creará basándose en las especificaciones del proyecto.'
                : 'Selecciona los tipos de prueba que deseas generar. La IA los creará basándose en las especificaciones del proyecto.'
              }
            </p>

            {/* Tipos ya generados (info) */}
            {esModoGenerarMas && tiposExcluidos.length > 0 && (
              <div className="vista-generar-ya-generados">
                ✅ Ya tienes pruebas de: <strong>{tiposExcluidos.join(', ')}</strong>
              </div>
            )}

            {/* Selección de tipos */}
            <div className="vista-generar-tipos-section">
              <div className="vista-generar-tipos-header">
                <span className="vista-generar-tipos-label">
                  Tipos disponibles
                  <span className="vista-generar-tipos-count">
                    ({tiposSeleccionados.length} de {tiposDisponibles.length} seleccionados)
                  </span>
                </span>
                {tiposDisponibles.length > 1 && (
                  <Button
                    type="link"
                    size="small"
                    onClick={seleccionarTodos}
                    disabled={todosSeleccionados}
                    className="btn-link"
                  >
                    Seleccionar todos
                  </Button>
                )}
              </div>

              <div className="vista-generar-tipos-lista">
                {tiposDisponibles.map((tipo) => {
                  const seleccionado = tiposSeleccionados.includes(tipo.key);
                  return (
                    <div
                      key={tipo.key}
                      onClick={() => toggleTipo(tipo.key)}
                      className="tipo-card"
                      style={{
                        borderColor: seleccionado ? tipo.color : undefined,
                        background: seleccionado ? tipo.colorBg : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!seleccionado) {
                          e.currentTarget.style.borderColor = tipo.colorBorder;
                          e.currentTarget.style.background = tipo.colorBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!seleccionado) {
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.background = '';
                        }
                      }}
                    >
                      {/* Icono tipo */}
                      <div
                        className="tipo-card__icono"
                        style={{
                          background: seleccionado ? tipo.color : tipo.colorBg,
                          color: seleccionado ? '#fff' : tipo.color,
                        }}
                      >
                        {tipo.icon}
                      </div>

                      {/* Texto */}
                      <div className="tipo-card__texto">
                        <div className="tipo-card__nombre-row">
                          <span className="tipo-card__nombre">
                            {tipo.emoji} {tipo.label}
                          </span>
                        </div>
                        <span className="tipo-card__descripcion">
                          {tipo.descripcion}
                        </span>
                      </div>

                      {/* Indicador de selección */}
                      <div
                        className="tipo-card__check"
                        style={{
                          borderColor: seleccionado ? tipo.color : undefined,
                          background: seleccionado ? tipo.color : undefined,
                        }}
                      >
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
              className="vista-generar-info-card"
              style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: 'none', borderRadius: 'var(--border-radius-lg)' }}
            >
              <div className="vista-generar-info-inner">
                <div className="vista-generar-info-emoji">💡</div>
                <div>
                  <h4 className="vista-generar-info-titulo">¿Cómo funciona?</h4>
                  <p className="vista-generar-info-texto">
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
              className="btn btn-primary vista-generar-btn-accion"
            >
              {tiposSeleccionados.length > 1
                ? `Generar ${tiposSeleccionados.length} tipos con IA`
                : `Generar Pruebas ${TODOS_LOS_TIPOS.find(t => t.key === tiposSeleccionados[0])?.label || ''}`
              }
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VistaGenerarPruebas;