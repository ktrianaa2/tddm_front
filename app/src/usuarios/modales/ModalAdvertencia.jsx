import React from 'react';
import { Modal, Button } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import '../../styles/buttons.css';
import '../../styles/modal.css';

const ModalAdvertencia = ({
  visible,
  onCancel,
  onConfirm,
  loading = false,
  especificacionesCount = 0
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WarningOutlined style={{ fontSize: '20px' }} />
          <span>Advertencia: Generación de Pruebas</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancelar
        </Button>,
        <Button
          key="confirm"
          onClick={onConfirm}
          loading={loading}
          className="btn btn-warning"
        >
          Sí, Generar Pruebas
        </Button>
      ]}
      className="modal-warning"
      destroyOnHidden
      maskClosable={!loading}
      keyboard={!loading}
    >
      <p className="modal-text-primary">
        Estás a punto de generar las pruebas basadas en las {especificacionesCount} especificación{especificacionesCount !== 1 ? 'es' : ''} actuales del proyecto.
      </p>

      <div className="warning-box">
        <p className="warning-box-title">
          <WarningOutlined />
          Una vez generadas las pruebas:
        </p>
        <ul>
          <li>No podrás modificar los requisitos</li>
          <li>No podrás modificar las historias de usuario</li>
          <li>No podrás modificar los casos de uso</li>
        </ul>
      </div>

      <p className="modal-text-secondary">
        ¿Estás seguro de que deseas continuar?
      </p>
    </Modal>
  );
};

export default ModalAdvertencia;