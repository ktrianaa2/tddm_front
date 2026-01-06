import React from 'react';
import { Card, Table, Empty, Collapse } from 'antd';
import '../../styles/esquema-info.css';

const VistaResumen = ({
  esquemaPrincipal,
  estadisticas,
  tablas,
  tablasItems,
  columnsDetalles,
  getColumnsForTable
}) => {
  const nombreBD = esquemaPrincipal?.nombre_bd || 'Sin especificar';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      {/* ===== INFORMACIÓN PRINCIPAL (CONSOLIDADA EN UNA CARD) ===== */}
      <div className="esquema-info-container">

        {/* CARD UNIFICADA: Base de Datos e Información General */}
        <Card className="esquema-info-card esquema-info-card-unified">
          <div className="esquema-unified-content">

            {/* Sección principal: Nombre BD y Motor */}
            <div className="esquema-unified-main">
              <div className="esquema-unified-item">
                <div className="esquema-item-label">Base de Datos</div>
                <div className="esquema-item-value-large">{nombreBD}</div>
              </div>
              <div className="esquema-unified-divider"></div>
              <div className="esquema-unified-item">
                <div className="esquema-item-label">Motor</div>
                <div 
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: estadisticas.motorBD?.color || '#1890ff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {estadisticas.motorBD?.nombre || 'Sin especificar'}
                </div>
              </div>
            </div>

            {/* Sección secundaria: Tablas y Fechas */}
            <div className="esquema-unified-secondary">
              <div className="esquema-secondary-item">
                <div className="esquema-item-label">Tablas</div>
                <div className="esquema-item-value-medium">{estadisticas.totalTablas}</div>
              </div>
              <div className="esquema-secondary-divider"></div>
              <div className="esquema-secondary-item">
                <div className="esquema-item-label">Creado</div>
                <div className="esquema-item-value-small">
                  {esquemaPrincipal?.fecha_creacion
                    ? new Date(esquemaPrincipal.fecha_creacion).toLocaleDateString('es-ES')
                    : '-'}
                </div>
              </div>
              <div className="esquema-secondary-divider"></div>
              <div className="esquema-secondary-item">
                <div className="esquema-item-label">Actualizado</div>
                <div className="esquema-item-value-small">
                  {esquemaPrincipal?.fecha_actualizacion
                    ? new Date(esquemaPrincipal.fecha_actualizacion).toLocaleDateString('es-ES')
                    : '-'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* CARD: Tablas (full width) */}
        <Card className="esquema-tables-card esquema-info-card">
          <h4 className="esquema-main-title">Tablas ({tablas.length})</h4>

          {tablas.length > 0 ? (
            <Collapse
              items={tablasItems}
              accordion={false}
            />
          ) : (
            <Empty description="No hay tablas definidas" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default VistaResumen;