import React, { useState } from 'react';
import {
  Card,
  Button,
  Form,
  Select,
  Spin,
  message,
  Space,
  Alert,
  Progress,
  Statistic,
  Row,
  Col,
  Empty,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useEsquemaBD } from '../../hooks/useEsquemaBD';
import '../../styles/tabs.css';
import '../../styles/buttons.css';

const VistaCrearEsquema = ({
  proyectoId,
  motoresBD,
  requisitos = [],
  historiasUsuario = [],
  casosUso = [],
  onEsquemaCreado,
  onCancelar
}) => {
  const [form] = Form.useForm();
  const [motorSeleccionado, setMotorSeleccionado] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [esquemaGenerado, setEsquemaGenerado] = useState(null);

  const { generarEsquemaIA } = useEsquemaBD(proyectoId, false);

  const totalEspecificaciones = requisitos.length + historiasUsuario.length + casosUso.length;

  const motorInfo = motorSeleccionado
    ? motoresBD?.find(m => m.id === motorSeleccionado)
    : null;

  const handleSeleccionarMotor = (motorId) => {
    setMotorSeleccionado(motorId);
    setProgreso(0);
    setEsquemaGenerado(null);
  };

  const handleGenerarEsquema = async () => {
    if (!motorSeleccionado) {
      message.error('Por favor selecciona un motor de base de datos');
      return;
    }

    setGenerando(true);
    setProgreso(10);

    // Simular progreso gradual mientras se genera
    const intervalo = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 90) {
          clearInterval(intervalo);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    try {
      const resultado = await generarEsquemaIA(motorSeleccionado);

      clearInterval(intervalo);

      if (resultado.success) {
        setProgreso(100);
        setEsquemaGenerado(resultado.data);
        message.success('¡Esquema generado exitosamente!');
      } else {
        message.error(resultado.error || 'Error al generar esquema');
        setProgreso(0);
      }
    } catch (error) {
      clearInterval(intervalo);
      message.error('Error inesperado al generar esquema');
      setProgreso(0);
    } finally {
      setGenerando(false);
    }
  };

  const handleNuevoIntento = () => {
    setMotorSeleccionado(null);
    setProgreso(0);
    setEsquemaGenerado(null);
  };

  return (
    <div className="tab-main-content">
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xl)'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              marginBottom: '8px',
              color: 'var(--text-primary)',
              fontSize: '1.75rem',
              fontWeight: 600
            }}>
              Generar Esquema con IA
            </h2>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.95rem'
            }}>
              Selecciona el motor de base de datos y la IA generará automáticamente un esquema optimizado
            </p>
          </div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onCancelar}
            className="btn btn-secondary"
          >
            Volver
          </Button>
        </div>

        {/* Resumen de especificaciones */}
        <Card style={{
          marginBottom: 'var(--space-lg)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(245, 87, 108, 0.08) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)'
        }}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#667eea',
                  marginBottom: '4px'
                }}>
                  {totalEspecificaciones}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500
                }}>
                  Especificaciones
                </div>
              </div>
            </Col>
            {requisitos.length > 0 && (
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#667eea',
                    marginBottom: '4px'
                  }}>
                    {requisitos.length}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  }}>
                    Requisito(s)
                  </div>
                </div>
              </Col>
            )}
            {historiasUsuario.length > 0 && (
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#f093fb',
                    marginBottom: '4px'
                  }}>
                    {historiasUsuario.length}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  }}>
                    Historia(s) de Usuario
                  </div>
                </div>
              </Col>
            )}
            {casosUso.length > 0 && (
              <Col xs={24} sm={12} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#f5576c',
                    marginBottom: '4px'
                  }}>
                    {casosUso.length}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  }}>
                    Caso(s) de Uso
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card>

        {/* Info sobre generación con IA */}
        <Alert
          message="Generación Inteligente"
          description="La IA analizará tus especificaciones y generará automáticamente un esquema de base de datos optimizado con tablas, columnas, relaciones y tipos de datos apropiados."
          type="info"
          showIcon
          style={{
            marginBottom: 'var(--space-lg)',
            borderRadius: 'var(--border-radius-lg)'
          }}
        />

        {/* Selector de Motor */}
        <Card style={{
          marginBottom: 'var(--space-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)'
        }}>
          <h3 style={{
            margin: 0,
            marginBottom: 'var(--space-lg)',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Selecciona el Motor de Base de Datos
          </h3>

          {!motoresBD || motoresBD.length === 0 ? (
            <Empty description="No hay motores de BD disponibles" />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-lg)'
            }}>
              {motoresBD.map(motor => (
                <div
                  key={motor.id}
                  onClick={() => handleSeleccionarMotor(motor.id)}
                  style={{
                    cursor: 'pointer',
                    padding: 'var(--space-lg)',
                    borderRadius: 'var(--border-radius)',
                    border: motorSeleccionado === motor.id
                      ? `2px solid ${motor.color || '#1890ff'}`
                      : '2px solid var(--border-color)',
                    background: motorSeleccionado === motor.id
                      ? `${motor.color || '#1890ff'}10`
                      : 'var(--bg-hover)',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (motorSeleccionado !== motor.id) {
                      e.currentTarget.style.borderColor = motor.color || '#1890ff';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 8px 16px ${motor.color || '#1890ff'}20`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (motorSeleccionado !== motor.id) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {motorSeleccionado === motor.id && (
                    <div style={{
                      position: 'absolute',
                      top: 'var(--space-md)',
                      right: 'var(--space-md)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: motor.color || '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircleOutlined style={{
                        color: 'white',
                        fontSize: '14px'
                      }} />
                    </div>
                  )}
                  <DatabaseOutlined style={{
                    fontSize: '2.5rem',
                    color: motor.color || '#1890ff',
                    marginBottom: 'var(--space-md)'
                  }} />
                  <h4 style={{
                    margin: 0,
                    marginBottom: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {motor.nombre}
                  </h4>
                  {motor.descripcion && (
                    <p style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4
                    }}>
                      {motor.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Motor Seleccionado - Info Detallada */}
          {motorInfo && (
            <>
              <Divider style={{ margin: 'var(--space-lg) 0' }} />
              <div style={{
                padding: 'var(--space-lg)',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(245, 87, 108, 0.08) 100%)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)'
              }}>
                <h3 style={{
                  margin: 0,
                  marginBottom: 'var(--space-md)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Motor Seleccionado
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    background: motorInfo.color || '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DatabaseOutlined style={{
                      color: 'white',
                      fontSize: '28px'
                    }} />
                  </div>
                  <div>
                    <p style={{
                      margin: 0,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '1.1rem'
                    }}>
                      {motorInfo.nombre}
                    </p>
                    {motorInfo.descripcion && (
                      <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                      }}>
                        {motorInfo.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado de generación o stats */}
              {generando && (
                <>
                  <Divider style={{ margin: 'var(--space-lg) 0' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-lg)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        animation: 'spin 3s linear infinite'
                      }}>
                      </div>
                    </div>
                    <h4 style={{
                      margin: 0,
                      marginBottom: 'var(--space-md)',
                      color: 'var(--text-primary)'
                    }}>
                      Generando Esquema
                    </h4>
                    <p style={{
                      margin: 0,
                      marginBottom: 'var(--space-lg)',
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)'
                    }}>
                      La IA está analizando tus especificaciones...
                    </p>
                    <Progress
                      percent={Math.round(progreso)}
                      strokeColor={{
                        '0%': '#667eea',
                        '100%': '#764ba2'
                      }}
                      style={{ marginBottom: 'var(--space-md)' }}
                    />
                    <p style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {Math.round(progreso)}% completado
                    </p>
                  </div>
                  <style>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </>
              )}

              {/* Esquema generado exitosamente */}
              {esquemaGenerado && !generando && (
                <>
                  <Divider style={{ margin: 'var(--space-lg) 0' }} />
                  <div style={{
                    padding: 'var(--space-lg)',
                    background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid #b7eb8f',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-md)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: '#52c41a'
                      }}>
                        <CheckCircleOutlined style={{
                          fontSize: '36px',
                          color: 'white'
                        }} />
                      </div>
                    </div>
                    <h4 style={{
                      margin: 0,
                      marginBottom: 'var(--space-md)',
                      color: '#262626',
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}>
                      ¡Esquema Generado Exitosamente!
                    </h4>
                    <p style={{
                      margin: 0,
                      marginBottom: 'var(--space-md)',
                      fontSize: '0.95rem',
                      color: '#595959'
                    }}>
                      Tu esquema de base de datos ha sido creado y guardado correctamente.
                    </p>
                    <Row gutter={[16, 16]}>
                      <Col xs={12}>
                        <div style={{
                          padding: 'var(--space-md)',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: 'var(--border-radius)',
                        }}>
                          <div style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color: '#52c41a'
                          }}>
                            {esquemaGenerado?.total_tablas || 0}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#595959'
                          }}>
                            Tablas
                          </div>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div style={{
                          padding: 'var(--space-md)',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: 'var(--border-radius)',
                        }}>
                          <div style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color: '#52c41a'
                          }}>
                            {esquemaGenerado?.total_columnas || 0}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#595959'
                          }}>
                            Columnas
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </>
          )}
        </Card>

        {/* Pie */}
        <div style={{
          marginBottom: 'var(--space-lg)',
          padding: 'var(--space-lg)',
          borderRadius: 'var(--border-radius)',
          background: 'var(--bg-hover)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          💡 Puedes cambiar o editar el esquema después de la generación inicial
        </div>

        {/* Botón Generar */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          justifyContent: 'center',
          marginTop: 'var(--space-xl)'
        }}>
          {esquemaGenerado && !generando && (
            <>
              <Button
                onClick={handleNuevoIntento}
                className="btn btn-secondary"
              >
                Generar Otro
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  onEsquemaCreado();
                  onCancelar();
                }}
                className="btn btn-primary"
                size="large"
              >
                Ir a Ver Esquema
              </Button>
            </>
          )}
          {!esquemaGenerado && !generando && (
            <Button
              type="primary"
              onClick={handleGenerarEsquema}
              disabled={!motorSeleccionado}
              size="large"
              className="btn btn-primary"
              style={{
                opacity: motorSeleccionado ? 1 : 0.6,
                cursor: motorSeleccionado ? 'pointer' : 'not-allowed'
              }}
            >
              {motorSeleccionado ? 'Generar Esquema' : 'Selecciona un motor para continuar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VistaCrearEsquema;