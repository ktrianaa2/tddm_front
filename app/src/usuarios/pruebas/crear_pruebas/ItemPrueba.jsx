import React from 'react';
import { Tag } from 'antd';
import {
  ExperimentOutlined,
  ApiOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import "../../../styles/pruebas.css";

const TIPO_CONFIG = {
  unitaria: { icon: <ExperimentOutlined />, color: '#52c41a', label: 'Unitaria' },
  sistema: { icon: <ApiOutlined />, color: '#1890ff', label: 'Sistema' },
  componente: { icon: <AppstoreOutlined />, color: '#722ed1', label: 'Componente' },
};

const ItemPrueba = ({ prueba, isActive, onClick }) => {
  const tipoPrueba = (prueba.tipo_prueba || prueba.tipo || 'unitaria').toLowerCase();
  const config = TIPO_CONFIG[tipoPrueba] || TIPO_CONFIG.unitaria;

  return (
    <div
      onClick={onClick}
      className={`item-prueba${isActive ? ' active' : ''}`}
    >
      <div className="item-prueba__inner">
        <div className="item-prueba__icono" style={{ color: config.color }}>
          {config.icon}
        </div>

        <div className="item-prueba__body">
          <span className="item-prueba__nombre" title={prueba.nombre}>
            {prueba.nombre}
          </span>

          <div className="item-prueba__meta">
            <Tag color={config.color} style={{ margin: 0, fontSize: '0.75rem' }}>
              {config.label}
            </Tag>
            {prueba.codigo && (
              <span className="item-prueba__codigo">{prueba.codigo}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemPrueba;