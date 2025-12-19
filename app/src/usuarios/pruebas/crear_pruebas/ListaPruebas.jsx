import React, { useState } from 'react';
import { Input, Tabs, Badge, Empty } from 'antd';
import {
  SearchOutlined,
  ExperimentOutlined,
  ApiOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import '../../../styles/lista-pruebas.css';

const ListaPruebas = ({ pruebas, pruebaActiva, onSeleccionarPrueba }) => {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todas');

  // Función helper para obtener el tipo de prueba
  const getTipoPrueba = (prueba) => {
    const tipo = (prueba.tipo_prueba || prueba.tipo || '').toLowerCase();
    return tipo;
  };

  // Configuración de íconos y colores por tipo
  const getTipoConfig = (tipo) => {
    const configs = {
      unitaria: {
        icon: <ExperimentOutlined />,
        color: '#52c41a',
        label: 'Unitaria',
        className: 'unitaria'
      },
      sistema: {
        icon: <ApiOutlined />,
        color: '#1890ff',
        label: 'Sistema',
        className: 'sistema'
      },
      componente: {
        icon: <AppstoreOutlined />,
        color: '#722ed1',
        label: 'Componente',
        className: 'componente'
      }
    };
    return configs[tipo] || configs.unitaria;
  };

  // Contar por tipo
  const contadores = {
    todas: pruebas.length,
    unitaria: pruebas.filter(p => getTipoPrueba(p) === 'unitaria').length,
    sistema: pruebas.filter(p => getTipoPrueba(p) === 'sistema').length,
    componente: pruebas.filter(p => getTipoPrueba(p) === 'componente').length
  };

  // Filtrar pruebas
  const pruebasFiltradas = pruebas.filter(prueba => {
    const coincideBusqueda =
      (prueba.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (prueba.codigo || '').toLowerCase().includes(busqueda.toLowerCase());

    const tipoPrueba = getTipoPrueba(prueba);
    const coincideTipo =
      tipoFiltro === 'todas' || tipoPrueba === tipoFiltro;

    return coincideBusqueda && coincideTipo;
  });

  const tabs = [
    {
      key: 'todas',
      label: (
        <span>
          Todas <Badge count={contadores.todas} style={{ backgroundColor: '#595959' }} />
        </span>
      )
    },
    {
      key: 'unitaria',
      label: (
        <span>
          Unitarias <Badge count={contadores.unitaria} style={{ backgroundColor: '#52c41a' }} />
        </span>
      )
    },
    {
      key: 'sistema',
      label: (
        <span>
          Sistema <Badge count={contadores.sistema} style={{ backgroundColor: '#1890ff' }} />
        </span>
      )
    },
    {
      key: 'componente',
      label: (
        <span>
          Componentes <Badge count={contadores.componente} style={{ backgroundColor: '#722ed1' }} />
        </span>
      )
    }
  ];

  return (
    <div className="lista-pruebas-container">
      {/* Header */}
      <div className="lista-pruebas-header">
        <div className="lista-pruebas-header-title-wrapper">
          <h3 className="lista-pruebas-title">
            Casos de Prueba
          </h3>
          <Badge count={pruebasFiltradas.length} showZero />
        </div>

        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar prueba..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          allowClear
          className="lista-pruebas-search"
        />
      </div>

      {/* Tabs de filtro */}
      <Tabs
        activeKey={tipoFiltro}
        onChange={setTipoFiltro}
        items={tabs}
        size="small"
        className="lista-pruebas-tabs"
      />

      {/* Lista de pruebas */}
      <div className="lista-pruebas-items">
        {pruebas.length === 0 ? (
          <div className="lista-pruebas-empty">
            <div className="lista-pruebas-empty-icon">📋</div>
            <div className="lista-pruebas-empty-text">
              No hay pruebas creadas
            </div>
          </div>
        ) : pruebasFiltradas.length === 0 ? (
          <div className="lista-pruebas-empty">
            <div className="lista-pruebas-empty-icon">🔍</div>
            <div className="lista-pruebas-empty-text">
              {busqueda ? "No se encontraron pruebas" : "No hay pruebas de este tipo"}
            </div>
          </div>
        ) : (
          pruebasFiltradas.map(prueba => {
            const tipoPrueba = getTipoPrueba(prueba);
            const config = getTipoConfig(tipoPrueba);
            const isActive = pruebaActiva?.id_prueba === (prueba.id_prueba || prueba.id);

            return (
              <div
                key={prueba.id_prueba || prueba.id}
                className={`lista-pruebas-item ${isActive ? 'active' : ''}`}
                onClick={() => onSeleccionarPrueba(prueba)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = config.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                {/* Icono */}
                <div className={`lista-pruebas-item-icon ${config.className}`}>
                  {config.icon}
                </div>

                {/* Contenido */}
                <div className="lista-pruebas-item-content">
                  <div className="lista-pruebas-item-header">
                    <h4 className="lista-pruebas-item-title">
                      {prueba.nombre || 'Sin nombre'}
                    </h4>
                    <div className="lista-pruebas-item-meta">
                      <span
                        className="lista-pruebas-item-tag"
                        style={{
                          background: config.color + '20',
                          color: config.color,
                          border: `1px solid ${config.color}`
                        }}
                      >
                        {config.label}
                      </span>
                      {prueba.codigo && (
                        <span className="lista-pruebas-item-code">
                          {prueba.codigo}
                        </span>
                      )}
                    </div>
                  </div>
                  {prueba.descripcion && (
                    <div className="lista-pruebas-item-description">
                      {prueba.descripcion}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ListaPruebas;