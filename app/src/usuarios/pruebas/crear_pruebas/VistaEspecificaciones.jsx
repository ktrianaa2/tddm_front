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
    // Fallback: usar índice si no hay ID
    return `${tipo}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Función para obtener relaciones entre especificaciones
  const obtenerRelaciones = () => {
    const relaciones = [];

    // Relacionar casos de uso con requisitos
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

    // Relacionar historias de usuario con casos de uso
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
    <div className="tabs-container">
      <div className="tabs-content-wrapper">
        {/* Header */}
        <div className="tab-header">
          <div className="tab-header-content">
            <h3 className="tab-title">
              <BugOutlined style={{ marginRight: '0.5rem' }} />
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
              style={{ marginRight: '0.5rem' }}
            >
              Actualizar
            </Button>
            <Button
              icon={<RocketOutlined />}
              type="primary"
              onClick={onIniciarPruebas}
              disabled={especificaciones.length === 0}
            >
              Iniciar Generación de Pruebas
            </Button>
          </div>
        </div>

        <div className="tab-main-content">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '1.5rem',
            height: 'calc(100vh - 250px)',
            minHeight: '600px'
          }}>
            {/* Columna Izquierda: Lista de Especificaciones */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Especificaciones
                </h4>
                <Badge count={especificaciones.length} showZero />
              </div>

              {especificaciones.length === 0 ? (
                <Empty
                  description="No hay especificaciones disponibles"
                  style={{ marginTop: '3rem' }}
                />
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

                      // Generar key única
                      const uniqueKey = obtenerIdUnico(item, item.tipo_especificacion) || `spec-${index}`;

                      return (
                        <List.Item
                          key={uniqueKey}
                          style={{
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            cursor: 'default'
                          }}
                        >
                          <List.Item.Meta
                            avatar={
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
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
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  marginRight: '0.5rem'
                                }}>
                                  {item.nombre || item.descripcion_historia?.substring(0, 50) || 'Sin nombre'}
                                </span>
                                <Tag color={item.color} style={{ margin: 0 }}>
                                  {item.tipo_label}
                                </Tag>
                              </div>
                            }
                            description={
                              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
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
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'auto'
            }}>
              <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                Relaciones entre Especificaciones
              </h4>

              {especificaciones.length === 0 ? (
                <Empty
                  description="No hay especificaciones para mostrar relaciones"
                  style={{ marginTop: '3rem' }}
                />
              ) : (
                <div style={{ position: 'relative', minHeight: '500px' }}>
                  {/* Nodos de Requisitos */}
                  {requisitos.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#666',
                        marginBottom: '1rem'
                      }}>
                        REQUISITOS
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        justifyContent: 'center'
                      }}>
                        {requisitos.map((req, index) => (
                          <div
                            key={obtenerIdUnico(req, 'requisito') || `req-${index}`}
                            style={{
                              padding: '1rem',
                              background: '#e6f4ff',
                              border: '2px solid #1890ff',
                              borderRadius: '8px',
                              minWidth: '150px',
                              maxWidth: '200px',
                              textAlign: 'center'
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: '1.5rem', color: '#1890ff', display: 'block', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                              {req.nombre || 'Requisito sin nombre'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nodos de Casos de Uso */}
                  {casosUso.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#666',
                        marginBottom: '1rem'
                      }}>
                        CASOS DE USO
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        justifyContent: 'center'
                      }}>
                        {casosUso.map((cu, index) => (
                          <div
                            key={obtenerIdUnico(cu, 'caso_uso') || `cu-${index}`}
                            style={{
                              padding: '1rem',
                              background: '#f6ffed',
                              border: '2px solid #52c41a',
                              borderRadius: '8px',
                              minWidth: '150px',
                              maxWidth: '200px',
                              textAlign: 'center'
                            }}
                          >
                            <UserOutlined style={{ fontSize: '1.5rem', color: '#52c41a', display: 'block', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
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
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#666',
                        marginBottom: '1rem'
                      }}>
                        HISTORIAS DE USUARIO
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        justifyContent: 'center'
                      }}>
                        {historiasUsuario.map((hu, index) => (
                          <div
                            key={obtenerIdUnico(hu, 'historia_usuario') || `hu-${index}`}
                            style={{
                              padding: '1rem',
                              background: '#f9f0ff',
                              border: '2px solid #722ed1',
                              borderRadius: '8px',
                              minWidth: '150px',
                              maxWidth: '200px',
                              textAlign: 'center'
                            }}
                          >
                            <BookOutlined style={{ fontSize: '1.5rem', color: '#722ed1', display: 'block', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
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
                        marginTop: '2rem',
                        background: '#fafafa'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        <strong>Relaciones detectadas:</strong> {relaciones.length}
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                          {relaciones.map((rel, idx) => (
                            <div key={`rel-${idx}`} style={{ marginBottom: '0.25rem' }}>
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
      </div>
    </div>
  );
};

export default VistaEspecificaciones;