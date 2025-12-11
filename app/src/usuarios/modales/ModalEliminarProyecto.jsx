import React from 'react';
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import '../../styles/buttons.css';
import '../../styles/modal.css';

const ModalEliminarProyecto = ({
  visible,
  onCancel,
  onConfirm,
  loading = false,
  nombreProyecto = ''
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationCircleOutlined style={{ fontSize: '20px' }} />
          <span>Confirmar Eliminación de Proyecto</span>
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
          className="btn btn-danger"
        >
          Sí, Eliminar Proyecto
        </Button>
      ]}
      className="modal-error"
      destroyOnClose
      maskClosable={!loading}
      keyboard={!loading}
    >
      <p className="modal-text-primary">
        ¿Estás seguro de que deseas eliminar el proyecto <strong>"{nombreProyecto}"</strong>?
      </p>

      <div className="error-box">
        <p className="error-box-title">
          <ExclamationCircleOutlined />
          Esta acción es irreversible y se eliminarán:
        </p>
        <ul>
          <li>Todos los requisitos del proyecto</li>
          <li>Todas las historias de usuario</li>
          <li>Todos los casos de uso</li>
          <li>Todas las especificaciones generadas</li>
          <li>Todas las pruebas asociadas</li>
        </ul>
      </div>

      <p className="modal-text-secondary">
        Esta acción no se puede deshacer. ¿Deseas continuar?
      </p>
    </Modal>
  );
};

export default ModalEliminarProyecto;