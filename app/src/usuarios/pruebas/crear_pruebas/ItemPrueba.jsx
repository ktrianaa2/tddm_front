import React from 'react';
import { Tag } from 'antd';
import {
  ExperimentOutlined,
  ApiOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const ItemPrueba = ({ prueba, isActive, onClick }) => {
  const getTipoConfig = (tipo) => {
    const configs = {
      unitaria: {
        icon: <ExperimentOutlined />,
        color: '#52c41a',
        label: 'Unitaria'
      },
      sistema: {
        icon: <ApiOutlined />,
        color: '#1890ff',
        label: 'Sistema'
      },
      componente: {
        icon: <AppstoreOutlined />,
        color: '#722ed1',
        label: 'Componente'
      }
    };
    return configs[tipo] || configs.unitaria;
  };

  const config = getTipoConfig(prueba.tipo);

  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.75rem',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isActive ? 'var(--primary-bg-light)' : 'transparent',
        border: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
        marginBottom: '0.5rem',
        transition: 'all 0.2s ease',
        ':hover': {
          background: 'var(--bg-gray)'
        }
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-gray)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: '0.5rem'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          color: config.color,
          marginTop: '0.2rem'
        }}>
          {config.icon}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {prueba.nombre}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <Tag 
              color={config.color}
              style={{ 
                margin: 0,
                fontSize: '0.75rem'
              }}
            >
              {config.label}
            </Tag>
            
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {prueba.codigo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemPrueba;