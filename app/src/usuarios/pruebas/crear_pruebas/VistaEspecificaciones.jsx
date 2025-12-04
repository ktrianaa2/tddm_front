import React from 'react';
import {
  Button,
  List,
  Tag,
  Empty,
  Badge,
  Card
} from 'antd';
import {
  BugOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined,
  BookOutlined,
  RocketOutlined
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

const VistaEspecificaciones = ({
  especificaciones,
  requisitos,
  casosUso,
  historiasUsuario,
  loading,
  onRecargar,
  onIniciarPruebas
}) => {

  // Función para obtener un ID único
  const obtenerIdUnico = (item, tipo) => {
    if (tipo === 'requisito' && item.requisito_id) return `req-${item.requisito_id}`;
    if (tipo === 'caso_uso' && item.caso_uso_id) return `cu-${item.caso_uso_id}`;
    if (tipo === 'historia_usuario' && item.historia_id) return `hu-${item.historia_id}`;
    return `${tipo}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Función para obtener relaciones entre especificaciones
  const obtenerRelaciones = () => {
    const relaciones = [];

    casosUso.forEach(cu => {
      if (cu.requisito_id) {
        const req = requisitos.find(r => r.requisito_id === cu.requisito_id);
        if (req) {
          relaciones.push({
            desde: { id: req.requisito_id, nombre: req.nombre, tipo: 'requisito' },
            hacia: { id: cu.caso_uso_id, nombre: cu.nombre, tipo: 'caso_uso' }
          });
        }
      }
    });

    historiasUsuario.forEach(hu => {
      if (hu.caso_uso_id) {
        const cu = casosUso.find(c => c.caso_uso_id === hu.caso_uso_id);
        if (cu) {
          relaciones.push({
            desde: { id: cu.caso_uso_id, nombre: cu.nombre, tipo: 'caso_uso' },
            hacia: { id: hu.historia_id, nombre: hu.descripcion_historia, tipo: 'historia_usuario' }
          });
        }
      }
    });

    return relaciones;
  };

  const relaciones = obtenerRelaciones();

  const getColorByType = (tipo) => {
    const colors = {
      requisito: '#1890ff',
      caso_uso: '#52c41a',
      historia_usuario: '#722ed1'
    };
    return colors[tipo] || '#666';
  };

  return (
    <>
      {/* Header usando clases de tabs.css */}
      <div className="tab-header">
        <div className="tab-header-content">
          <h3 className="tab-title">
            <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
            Especificaciones del Proyecto
          </h3>
          <p className="tab-subtitle">
            Revisa las especificaciones antes de generar las pruebas
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
          <Button
            icon={<RocketOutlined />}
            type="primary"
            onClick={onIniciarPruebas}
            disabled={especificaciones.length === 0}
            className="btn btn-primary"
          >
            Iniciar Generación de Pruebas
          </Button>
        </div>
      </div>

      {/* Contenido principal usando clases de tabs.css */}
      <div className="tab-main-content">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: 'var(--space-xl)',
          height: 'calc(100vh - 250px)',
          minHeight: '600px'
        }}>
          {/* Columna Izquierda: Lista de Especificaciones */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
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
                Especificaciones
              </h4>
              <Badge count={especificaciones.length} showZero />
            </div>

            {especificaciones.length === 0 ? (
              <div className="tab-empty-state">
                <Empty description="No hay especificaciones disponibles" />
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <List
                  dataSource={especificaciones}
                  loading={loading}
                  renderItem={(item, index) => {
                    const icons = {
                      requisito: <FileTextOutlined />,
                      caso_uso: <UserOutlined />,
                      historia_usuario: <BookOutlined />
                    };

                    const uniqueKey = obtenerIdUnico(item, item.tipo_especificacion) || `spec-${index}`;

                    return (
                      <List.Item
                        key={uniqueKey}
                        style={{
                          padding: 'var(--space-md)',
                          marginBottom: 'var(--space-sm)',
                          background: 'var(--bg-hover)',
                          borderRadius: 'var(--border-radius)',
                          border: '1px solid var(--border-color)',
                          cursor: 'default',
                          transition: 'all var(--transition-normal)'
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--border-radius)',
                              background: item.color === 'blue' ? '#e6f4ff' :
                                item.color === 'green' ? '#f6ffed' : '#f9f0ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: getColorByType(item.tipo_especificacion),
                              fontSize: '1.2rem'
                            }}>
                              {icons[item.tipo_especificacion]}
                            </div>
                          }
                          title={
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'start'
                            }}>
                              <span style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                marginRight: 'var(--space-sm)',
                                color: 'var(--text-primary)'
                              }}>
                                {item.nombre || item.descripcion_historia?.substring(0, 50) || 'Sin nombre'}
                              </span>
                              <Tag color={item.color} style={{ margin: 0 }}>
                                {item.tipo_label}
                              </Tag>
                            </div>
                          }
                          description={
                            <div style={{
                              fontSize: 'var(--font-size-sm)',
                              marginTop: 'var(--space-sm)',
                              color: 'var(--text-secondary)'
                            }}>
                              {item.tipo_especificacion === 'requisito' && (
                                <span>{item.descripcion?.substring(0, 80) || 'Sin descripción'}...</span>
                              )}
                              {item.tipo_especificacion === 'caso_uso' && (
                                <span>{item.descripcion?.substring(0, 80) || 'Sin descripción'}...</span>
                              )}
                              {item.tipo_especificacion === 'historia_usuario' && (
                                <span>Como {item.actor_rol || 'usuario'}, quiero {item.funcionalidad_accion?.substring(0, 50) || 'realizar una acción'}...</span>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              </div>
            )}
          </div>

          {/* Columna Derecha: Diagrama de Relaciones */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-color)',
            overflow: 'auto'
          }}>
            <h4 style={{
              margin: '0 0 var(--space-xl) 0',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)'
            }}>
              Relaciones entre Especificaciones
            </h4>

            {especificaciones.length === 0 ? (
              <div className="tab-empty-state">
                <Empty description="No hay especificaciones para mostrar relaciones" />
              </div>
            ) : (
              <div style={{ position: 'relative', minHeight: '500px' }}>
                {/* Nodos de Requisitos */}
                {requisitos.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-tertiary)',
                      marginBottom: 'var(--space-md)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      REQUISITOS
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-md)',
                      justifyContent: 'center'
                    }}>
                      {requisitos.map((req, index) => (
                        <div
                          key={obtenerIdUnico(req, 'requisito') || `req-${index}`}
                          style={{
                            padding: 'var(--space-md)',
                            background: '#e6f4ff',
                            border: '2px solid #1890ff',
                            borderRadius: 'var(--border-radius)',
                            minWidth: '150px',
                            maxWidth: '200px',
                            textAlign: 'center',
                            transition: 'all var(--transition-normal)',
                            cursor: 'default'
                          }}
                        >
                          <FileTextOutlined style={{
                            fontSize: '1.5rem',
                            color: '#1890ff',
                            display: 'block',
                            marginBottom: 'var(--space-sm)'
                          }} />
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--text-primary)'
                          }}>
                            {req.nombre || 'Requisito sin nombre'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nodos de Casos de Uso */}
                {casosUso.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-tertiary)',
                      marginBottom: 'var(--space-md)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      CASOS DE USO
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-md)',
                      justifyContent: 'center'
                    }}>
                      {casosUso.map((cu, index) => (
                        <div
                          key={obtenerIdUnico(cu, 'caso_uso') || `cu-${index}`}
                          style={{
                            padding: 'var(--space-md)',
                            background: '#f6ffed',
                            border: '2px solid #52c41a',
                            borderRadius: 'var(--border-radius)',
                            minWidth: '150px',
                            maxWidth: '200px',
                            textAlign: 'center',
                            transition: 'all var(--transition-normal)',
                            cursor: 'default'
                          }}
                        >
                          <UserOutlined style={{
                            fontSize: '1.5rem',
                            color: '#52c41a',
                            display: 'block',
                            marginBottom: 'var(--space-sm)'
                          }} />
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--text-primary)'
                          }}>
                            {cu.nombre || 'Caso de uso sin nombre'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nodos de Historias de Usuario */}
                {historiasUsuario.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-tertiary)',
                      marginBottom: 'var(--space-md)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      HISTORIAS DE USUARIO
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-md)',
                      justifyContent: 'center'
                    }}>
                      {historiasUsuario.map((hu, index) => (
                        <div
                          key={obtenerIdUnico(hu, 'historia_usuario') || `hu-${index}`}
                          style={{
                            padding: 'var(--space-md)',
                            background: '#f9f0ff',
                            border: '2px solid #722ed1',
                            borderRadius: 'var(--border-radius)',
                            minWidth: '150px',
                            maxWidth: '200px',
                            textAlign: 'center',
                            transition: 'all var(--transition-normal)',
                            cursor: 'default'
                          }}
                        >
                          <BookOutlined style={{
                            fontSize: '1.5rem',
                            color: '#722ed1',
                            display: 'block',
                            marginBottom: 'var(--space-sm)'
                          }} />
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--text-primary)'
                          }}>
                            {hu.descripcion_historia?.substring(0, 30) || 'Historia sin descripción'}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información de relaciones */}
                {relaciones.length > 0 && (
                  <Card
                    style={{
                      marginTop: 'var(--space-xl)',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius)'
                    }}
                  >
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        Relaciones detectadas:
                      </strong> {relaciones.length}
                      <div style={{
                        marginTop: 'var(--space-sm)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {relaciones.map((rel, idx) => (
                          <div key={`rel-${idx}`} style={{ marginBottom: 'var(--space-sm)' }}>
                            • {rel.desde.nombre} → {rel.hacia.nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VistaEspecificaciones;