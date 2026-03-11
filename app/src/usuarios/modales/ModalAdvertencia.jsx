import React from 'react';
import { Modal, Tag } from 'antd';
import {
  ExclamationCircleOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  ApiOutlined,
} from '@ant-design/icons';

const TIPO_CONFIG = {
  unitaria: {
    label: 'Unitarias',
    color: 'success',
    icon: <ExperimentOutlined />,
  },
  componente: {
    label: 'Componente',
    color: 'purple',
    icon: <AppstoreOutlined />,
  },
  sistema: {
    label: 'Sistema',
    color: 'blue',
    icon: <ApiOutlined />,
  },
};

const ModalAdvertencia = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  especificacionesCount,
  tiposSeleccionados = ['unitaria'],
}) => {
  return (
    <Modal
      open={visible}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
          Confirmar Generación de Pruebas
        </span>
      }
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Sí, generar pruebas"
      cancelText="Cancelar"
      confirmLoading={loading}
      okButtonProps={{ type: 'primary' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, color: 'var(--text-primary)' }}>
          Se generarán pruebas automáticamente con IA usando{' '}
          <strong>{especificacionesCount}</strong> especificación
          {especificacionesCount !== 1 ? 'es' : ''} del proyecto.
        </p>

        {/* Tipos seleccionados */}
        <div>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            Tipos de prueba a generar:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tiposSeleccionados.map(tipo => {
              const cfg = TIPO_CONFIG[tipo];
              if (!cfg) return null;
              return (
                <Tag
                  key={tipo}
                  color={cfg.color}
                  icon={cfg.icon}
                  style={{ fontSize: '0.85rem', padding: '2px 10px' }}
                >
                  {cfg.label}
                </Tag>
              );
            })}
          </div>
        </div>

        <div style={{
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: '6px',
          padding: '10px 14px',
          fontSize: '0.85rem',
          color: '#874d00'
        }}>
          <strong>⚠️ Ten en cuenta:</strong>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
            <li>Las pruebas se guardarán automáticamente en el proyecto.</li>
            {tiposSeleccionados.length > 1 && (
              <li>Se generarán <strong>{tiposSeleccionados.length} lotes</strong> de pruebas (uno por tipo).</li>
            )}
            <li>El estado del proyecto cambiará a <strong>"Generación"</strong>.</li>
            <li>Este proceso puede tomar algunos segundos.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ModalAdvertencia;