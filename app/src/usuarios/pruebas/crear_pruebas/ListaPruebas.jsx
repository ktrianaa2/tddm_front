import React, { useState } from 'react';
import { Input, Tabs, Badge, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ItemPrueba from './ItemPrueba';

const ListaPruebas = ({ pruebas, pruebaActiva, onSeleccionarPrueba }) => {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todas');

  // Función helper para obtener el tipo de prueba
  const getTipoPrueba = (prueba) => {
    const tipo = (prueba.tipo_prueba || prueba.tipo || '').toLowerCase();
    return tipo;
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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRight: '1px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          margin: 0,
          marginBottom: '0.75rem',
          fontSize: '1.1rem',
          color: 'var(--text-primary)'
        }}>
          Pruebas Generadas
        </h3>

        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar prueba..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          allowClear
        />
      </div>

      {/* Tabs de filtro */}
      <Tabs
        activeKey={tipoFiltro}
        onChange={setTipoFiltro}
        items={tabs}
        size="small"
        style={{
          padding: '0 1rem',
          marginBottom: 0
        }}
      />

      {/* Lista de pruebas */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem'
      }}>
        {pruebasFiltradas.length > 0 ? (
          pruebasFiltradas.map(prueba => (
            <ItemPrueba
              key={prueba.id_prueba || prueba.id}
              prueba={prueba}
              isActive={pruebaActiva?.id_prueba === prueba.id_prueba}
              onClick={() => onSeleccionarPrueba(prueba)}
            />
          ))
        ) : (
          <Empty
            description={
              busqueda
                ? "No se encontraron pruebas"
                : "No hay pruebas de este tipo"
            }
            style={{ marginTop: '2rem' }}
          />
        )}
      </div>
    </div>
  );
};

export default ListaPruebas;