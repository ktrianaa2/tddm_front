import React, { useState } from 'react';
import {
  Card,
  Button,
  Table,
  Spin,
  Tag,
  Empty,
  Collapse,
  Space,
  Divider,
  Modal,
  message,
  Tabs
} from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import VistaDiagrama from './VistaDiagrama';
import VistaResumen from './VistaResumen';
import '../../styles/tabs.css';
import '../../styles/buttons.css';
import '../../styles/esquema-info.css';
import '../../styles/esquema-tabbed.css';

const VistaVerEsquema = ({
  proyectoId,
  esquemaPrincipal,
  estadisticas,
  loading,
  onRecargar,
  onEliminar,
  onEditar,
  onVolver,
  modoCompacto = false
}) => {
  const [tabActiva, setTabActiva] = useState('resumen');

  if (loading) {
    return (
      <div className="tab-main-content">
        <div className="tab-loading-state">
          <Spin size="large" />
          <div className="tab-loading-text">
            Cargando esquema de base de datos...
          </div>
        </div>
      </div>
    );
  }

  if (!esquemaPrincipal || !estadisticas.esquemaPrincipal) {
    return (
      <div className="tab-main-content">
        <Empty description="No hay esquema disponible" />
      </div>
    );
  }

  const tablas = estadisticas.tablas || [];
  const nombreBD = esquemaPrincipal?.nombre_bd || 'Sin especificar';

  const getColumnsForTable = (tableName) => {
    const tabla = tablas.find(t => t.name === tableName);

    if (!tabla || !tabla.columns || !Array.isArray(tabla.columns)) {
      return [];
    }

    return tabla.columns.map((col, idx) => ({
      key: idx,
      nombre: col.name || '',
      tipo: col.type || 'DESCONOCIDO',
      nulo: col.nullable ? 'Sí' : 'No',
      clavePrimaria: col.primaryKey ? '✓' : '-',
      claveForanea: col.foreignKey ? '✓' : '-',
      autoIncrement: col.autoIncrement ? '✓' : '-',
      unique: col.unique ? '✓' : '-'
    }));
  };

  const columnsDetalles = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: '20%',
      render: (text) => <span style={{ fontWeight: 500, fontSize: '12px' }}>{text}</span>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: '18%',
      render: (tipo) => <Tag style={{ fontSize: '11px' }}>{tipo}</Tag>
    },
    {
      title: 'Nulo',
      dataIndex: 'nulo',
      key: 'nulo',
      width: '10%',
      align: 'center',
      render: (text) => <span style={{ fontSize: '12px' }}>{text}</span>
    },
    {
      title: 'PK',
      dataIndex: 'clavePrimaria',
      key: 'clavePrimaria',
      width: '8%',
      align: 'center',
      render: (pk) => pk === '✓' ? <Tag color="green" style={{ fontSize: '10px' }}>{pk}</Tag> : <span style={{ fontSize: '12px' }}>-</span>
    },
    {
      title: 'FK',
      dataIndex: 'claveForanea',
      key: 'claveForanea',
      width: '8%',
      align: 'center',
      render: (fk) => fk === '✓' ? <Tag color="orange" style={{ fontSize: '10px' }}>{fk}</Tag> : <span style={{ fontSize: '12px' }}>-</span>
    },
    {
      title: 'AI',
      dataIndex: 'autoIncrement',
      key: 'autoIncrement',
      width: '8%',
      align: 'center',
      render: (ai) => ai === '✓' ? <Tag color="cyan" style={{ fontSize: '10px' }}>{ai}</Tag> : <span style={{ fontSize: '12px' }}>-</span>
    },
    {
      title: 'Único',
      dataIndex: 'unique',
      key: 'unique',
      width: '8%',
      align: 'center',
      render: (u) => u === '✓' ? <Tag color="purple" style={{ fontSize: '10px' }}>{u}</Tag> : <span style={{ fontSize: '12px' }}>-</span>
    }
  ];

  const tablasItems = tablas
    .filter(tabla => tabla && typeof tabla === 'object' && tabla.name)
    .map((tabla) => {
      const columnasTabla = getColumnsForTable(tabla.name);
      return {
        key: tabla.name,
        label: (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'space-between',
            width: '100%',
            paddingRight: '8px',
            fontSize: '13px'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {tabla.name}
            </span>
            <span className="text-muted">
              {columnasTabla.length} col
            </span>
          </div>
        ),
        children: (
          <div>
            <Table
              columns={columnsDetalles}
              dataSource={columnasTabla}
              pagination={false}
              locale={{ emptyText: 'No hay columnas' }}
              size="small"
              bordered
            />
            {tabla.description && (
              <div className="esquema-table-description">
                <strong>Descripción:</strong> {tabla.description}
              </div>
            )}
          </div>
        )
      };
    });

  // Items de las pestañas
  const tabItems = [
    {
      key: 'resumen',
      label: 'Resumen',
      children: (
        <VistaResumen
          esquemaPrincipal={esquemaPrincipal}
          estadisticas={estadisticas}
          tablas={tablas}
          tablasItems={tablasItems}
          columnsDetalles={columnsDetalles}
          getColumnsForTable={getColumnsForTable}
        />
      )
    },
    {
      key: 'diagrama',
      label: 'Diagrama',
      children: (
        <VistaDiagrama
          tablas={tablas}
          esquemaPrincipal={esquemaPrincipal}
        />
      )
    }
  ];

  return (
    <>
      {/* Header en modo no compacto */}
      {!modoCompacto && (
        <div className="tab-header">
          <div className="tab-header-content">
            <h3 className="tab-title">Detalles del Esquema</h3>
          </div>
          <div className="tab-header-actions">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onVolver}
              className="btn btn-secondary"
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="tab-main-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

          {/* CARD CON TABS */}
          <Card className="esquema-tabbed-card">
            <Tabs
              activeKey={tabActiva}
              onChange={setTabActiva}
              items={tabItems}
              className="esquema-tabs"
              tabBarExtraContent={
                <div className="tab-actions-header">
                  {!modoCompacto && (
                    <Button
                      onClick={onVolver}
                      className="btn btn-secondary"
                      size="small"
                    >
                      Volver
                    </Button>
                  )}
                  <Button
                    icon={<EditOutlined />}
                    onClick={onEditar}
                    className="btn btn-secondary"
                    size="small"
                  >
                    Editar
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      message.info('Descarga en desarrollo');
                    }}
                    className="btn btn-secondary"
                    size="small"
                  >
                    Descargar
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Eliminar Esquema',
                        icon: <ExclamationCircleOutlined />,
                        content: '¿Estás seguro de que deseas eliminar este esquema?',
                        okText: 'Eliminar',
                        okType: 'danger',
                        cancelText: 'Cancelar',
                        onOk() {
                          onEliminar();
                        }
                      });
                    }}
                    className="btn btn-danger"
                    size="small"
                  >
                    Eliminar
                  </Button>
                </div>
              }
            />
          </Card>
        </div>
      </div>
    </>
  );
};

export default VistaVerEsquema;