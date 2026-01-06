import React from 'react';
import {
  Button,
  Card
} from 'antd';
import {
  BugOutlined,
  RocketOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

const VistaGenerarPruebas = ({
  loading,
  onRecargar,
  onIniciarPruebas
}) => {
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
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '3rem' }}>🚀</div>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Genera Pruebas Automáticas
            </h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 'var(--line-height-normal)'
            }}>
              Basándose en el esquema de base de datos y las especificaciones,
              la IA generará casos de prueba automáticamente.
            </p>
            
            <Card
              style={{
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                border: 'none',
                borderRadius: 'var(--border-radius-lg)',
                marginTop: 'var(--space-lg)',
                width: '100%'
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
                    Haz clic en el botón de abajo para iniciar la generación de pruebas.
                    Esto puede tomar algunos segundos dependiendo de la complejidad.
                  </p>
                </div>
              </div>
            </Card>

            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={onIniciarPruebas}
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-lg)', minWidth: '250px' }}
            >
              Generar Pruebas con IA
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VistaGenerarPruebas;