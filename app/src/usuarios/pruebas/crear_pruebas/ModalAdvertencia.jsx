import React from 'react';
import { Modal } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

const ModalAdvertencia = ({ visible, onCancel, onConfirm, loading = false }) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <WarningOutlined style={{ color: '#faad14', fontSize: '1.5rem' }} />
          <span>Advertencia: Generación de Pruebas</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Sí, Generar Pruebas"
      cancelText="Cancelar"
      confirmLoading={loading}
      okButtonProps={{ danger: true }}
      width={600}
    >
      <div style={{ padding: '1rem 0' }}>
        <p style={{ 
          fontSize: '1rem', 
          marginBottom: '1rem',
          color: 'var(--text-primary)'
        }}>
          Estás a punto de generar las pruebas basadas en las especificaciones actuales del proyecto.
        </p>
        
        <div style={{
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{ 
            margin: 0,
            color: '#d46b08',
            fontWeight: 500
          }}>
            ⚠️ Una vez generadas las pruebas:
          </p>
          <ul style={{ 
            marginTop: '0.5rem',
            marginBottom: 0,
            paddingLeft: '1.5rem',
            color: '#d46b08'
          }}>
            <li>No podrás modificar los requisitos</li>
            <li>No podrás modificar las historias de usuario</li>
            <li>No podrás modificar los casos de uso</li>
          </ul>
        </div>

        <p style={{ 
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          ¿Estás seguro de que deseas continuar?
        </p>
      </div>
    </Modal>
  );
};

export default ModalAdvertencia;