import React from 'react';
import {
  Button,
  Card,
  Empty
} from 'antd';
import {
  BugOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

const VistaRequerimientoBD = ({
  proyectoId,
  onSchemaBDCreado,
  onRecargar
}) => {
  const handleIrASchemaBuilder = () => {
    // Navegar a la pestaña de Schema o abrir modal
    // Esto depende de tu estructura de navegación
    // Por ejemplo: window.location.href = `/proyecto/${proyectoId}/schema`
    // O emitir un evento para cambiar de pestaña
    console.log('Ir a generar esquema de BD');
    // TODO: Implementar navegación al panel de schema
  };

  const handleSubirBD = () => {
    // Abrir modal para subir archivo BD
    console.log('Subir archivo BD');
    // TODO: Implementar modal de carga de BD
  };

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
            Para generar pruebas, necesitas un esquema de base de datos
          </p>
        </div>
        <div className="tab-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={onRecargar}
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
            gap: 'var(--space-xl)'
          }}>
            {/* Icono y mensaje principal */}
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-2xl)'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: 'var(--space-lg)'
              }}>
                🗄️
              </div>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-md) 0'
              }}>
                Esquema de Base de Datos Requerido
              </h2>
              <p style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 'var(--line-height-normal)'
              }}>
                Para generar pruebas automáticas, primero necesitas crear o cargar
                un esquema de base de datos de tu proyecto.
              </p>
            </div>

            {/* Opciones */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)'
            }}>
              {/* Opción 1: Generar esquema */}
              <Card
                hoverable
                style={{
                  background: 'var(--bg-card)',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-lg)'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    minWidth: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DatabaseOutlined style={{
                      color: 'var(--primary-color)',
                      fontSize: '2rem'
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 var(--space-sm) 0',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)'
                    }}>
                      Generar Esquema
                    </h3>
                    <p style={{
                      margin: '0 0 var(--space-md) 0',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--line-height-normal)'
                    }}>
                      Crea un nuevo esquema de base de datos usando el builder visual.
                      Define tablas, columnas, relaciones y tipos de datos.
                    </p>
                    <Button
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      onClick={handleIrASchemaBuilder}
                      className="btn btn-primary"
                    >
                      Ir a Schema Builder
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Separador */}
              <div style={{
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                O
              </div>

              {/* Opción 2: Subir esquema */}
              <Card
                hoverable
                style={{
                  background: 'var(--bg-card)',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-lg)'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    minWidth: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileTextOutlined style={{
                      color: '#52c41a',
                      fontSize: '2rem'
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 var(--space-sm) 0',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)'
                    }}>
                      Subir Esquema
                    </h3>
                    <p style={{
                      margin: '0 0 var(--space-md) 0',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--line-height-normal)'
                    }}>
                      Carga un archivo de esquema existente (SQL, JSON, XML, etc.)
                      desde tu computadora.
                    </p>
                    <Button
                      icon={<ArrowRightOutlined />}
                      onClick={handleSubirBD}
                      className="btn btn-secondary"
                    >
                      Subir Archivo
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Información adicional */}
            <Card
              style={{
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                border: 'none',
                borderRadius: 'var(--border-radius-lg)'
              }}
            >
              <div style={{
                display: 'flex',
                gap: 'var(--space-md)',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                <div>
                  <h4 style={{
                    margin: '0 0 var(--space-sm) 0',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    ¿Por qué necesito un esquema?
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--line-height-normal)'
                  }}>
                    El esquema de base de datos proporciona la estructura necesaria
                    para que la IA genere pruebas precisas y relevantes para tu aplicación.
                    Define las entidades, campos y relaciones que la aplicación utiliza.
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

export default VistaRequerimientoBD;