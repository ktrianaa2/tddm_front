import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col, Empty, Spin, message, Select } from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import mermaid from 'mermaid';

const VistaDiagramaDB = ({ tablas = [], esquemaPrincipal = {} }) => {
  const [tipoDiagrama, setTipoDiagrama] = useState('clases');
  const [zoom, setZoom] = useState(100);
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [codigoMermaid, setCodigoMermaid] = useState('');
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  const nombreBD = esquemaPrincipal?.nombre_bd || 'Base de Datos';

  const extraerTipoBasico = (tipo) => {
    if (!tipo) return 'string';
    const tipoLimpio = tipo.split('(')[0].toUpperCase();

    const mapaTipos = {
      'VARCHAR': 'string',
      'CHAR': 'string',
      'TEXT': 'string',
      'INTEGER': 'int',
      'INT': 'int',
      'SERIAL': 'int',
      'BIGINT': 'int',
      'SMALLINT': 'int',
      'DECIMAL': 'decimal',
      'NUMERIC': 'decimal',
      'FLOAT': 'float',
      'DOUBLE': 'float',
      'BOOLEAN': 'bool',
      'BOOL': 'bool',
      'DATE': 'date',
      'DATETIME': 'datetime',
      'TIMESTAMP': 'timestamp',
      'TIME': 'time',
      'JSON': 'json',
      'UUID': 'uuid'
    };

    return mapaTipos[tipoLimpio] || 'string';
  };

  // Generar diagrama de clases (como tablas con atributos y métodos)
  const generarDiagramaClases = () => {
    if (!tablas || tablas.length === 0) return '';

    let diagrama = 'classDiagram\n';
    diagrama += '    class BaseEntity {\n';
    diagrama += '        +int id PK\n';
    diagrama += '        +datetime created_at\n';
    diagrama += '        +datetime updated_at\n';
    diagrama += '    }\n\n';

    // Mapeo de relaciones para evitar duplicados
    const relacionesProcesadas = new Set();

    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;
      if (!nombreTabla) return;

      diagrama += `    class ${nombreTabla} {\n`;

      // Procesar columnas como atributos
      if (tabla.columns && Array.isArray(tabla.columns)) {
        tabla.columns.forEach((columna) => {
          const nombreCol = columna.name || columna.nombre;
          if (!nombreCol) return;

          const tipo = extraerTipoBasico(columna.type);
          const esPK = columna.primaryKey ? ' PK' : '';
          const esFK = columna.foreignKey || columna.reference ? ' FK' : '';
          const esNullable = columna.nullable ? '?' : '';

          diagrama += `        ${esNullable}${tipo} ${nombreCol}${esPK}${esFK}\n`;
        });
      }

      diagrama += '    }\n\n';
    });

    // Procesar relaciones
    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;
      if (!nombreTabla) return;

      if (tabla.columns && Array.isArray(tabla.columns)) {
        tabla.columns.forEach((columna) => {
          if (columna.reference) {
            const match = columna.reference.match(/^(\w+)\((\w+)\)$/);
            if (match) {
              const tablaReferenciada = match[1];
              const relacionKey = `${nombreTabla}||--o{${tablaReferenciada}`;

              if (!relacionesProcesadas.has(relacionKey)) {
                relacionesProcesadas.add(relacionKey);
                diagrama += `    ${tablaReferenciada} "1" <-- "N" ${nombreTabla}\n`;
              }
            }
          }
        });
      }

      if (tabla.relaciones && typeof tabla.relaciones === 'object') {
        Object.entries(tabla.relaciones).forEach(([nombreRel, relacion]) => {
          if (typeof relacion === 'object' && relacion.tabla_referenciada) {
            const tablaReferenciada = relacion.tabla_referenciada;
            const tipo = relacion.tipo || 'N:1';
            const relacionKey = `${nombreTabla}--${tablaReferenciada}--${tipo}`;

            if (!relacionesProcesadas.has(relacionKey)) {
              relacionesProcesadas.add(relacionKey);

              if (tipo === '1:1' || tipo === 'uno-a-uno') {
                diagrama += `    ${tablaReferenciada} "1" <-- "1" ${nombreTabla}\n`;
              } else if (tipo === 'N:N' || tipo === 'muchos-a-muchos') {
                diagrama += `    ${tablaReferenciada} "N" <-- "M" ${nombreTabla}\n`;
              } else {
                diagrama += `    ${tablaReferenciada} "1" <-- "N" ${nombreTabla}\n`;
              }
            }
          }
        });
      }
    });

    // Herencia de BaseEntity
    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;
      if (nombreTabla) {
        diagrama += `    ${nombreTabla} --|> BaseEntity\n`;
      }
    });

    return diagrama;
  };

  // Generar diagrama ER mejorado
  const generarDiagramaER = () => {
    if (!tablas || tablas.length === 0) return '';

    let diagrama = 'erDiagram\n';

    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;
      if (!nombreTabla) return;

      diagrama += `    ${nombreTabla} {\n`;

      if (tabla.columns && Array.isArray(tabla.columns) && tabla.columns.length > 0) {
        tabla.columns.forEach((columna) => {
          const nombreCol = columna.name || columna.nombre;
          if (!nombreCol) return;

          const tipoBasico = extraerTipoBasico(columna.type);
          const esPK = columna.primaryKey ? ' PK' : '';
          const esFK = columna.foreignKey || columna.reference ? ' FK' : '';

          diagrama += `        ${tipoBasico} ${nombreCol}${esPK}${esFK}\n`;
        });
      } else {
        diagrama += `        int id PK\n`;
      }

      diagrama += '    }\n';
    });

    diagrama += '\n';
    const relacionesAgregadas = new Set();

    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;
      if (!nombreTabla) return;

      if (tabla.columns && Array.isArray(tabla.columns)) {
        tabla.columns.forEach((columna) => {
          if (columna.reference) {
            const match = columna.reference.match(/^(\w+)\((\w+)\)$/);
            if (match) {
              const tablaReferenciada = match[1];
              const relacionKey = `${nombreTabla}-${tablaReferenciada}`;

              if (!relacionesAgregadas.has(relacionKey)) {
                relacionesAgregadas.add(relacionKey);
                const notacion = '||--o{';
                diagrama += `    ${tablaReferenciada} ${notacion} ${nombreTabla} : "contiene"\n`;
              }
            }
          }
        });
      }

      if (tabla.relaciones && typeof tabla.relaciones === 'object') {
        Object.entries(tabla.relaciones).forEach(([nombreRel, relacion]) => {
          if (typeof relacion === 'object' && relacion.tabla_referenciada) {
            const tablaReferenciada = relacion.tabla_referenciada;
            const tipo = relacion.tipo || 'N:1';
            const relacionKey = `${nombreTabla}-${tablaReferenciada}-${nombreRel}`;

            if (!relacionesAgregadas.has(relacionKey)) {
              relacionesAgregadas.add(relacionKey);

              let notacion = '||--||';
              if (tipo === 'N:1' || tipo === 'muchos-a-uno') {
                notacion = '||--o{';
              } else if (tipo === '1:1' || tipo === 'uno-a-uno') {
                notacion = '||--||';
              } else if (tipo === 'N:N' || tipo === 'muchos-a-muchos') {
                notacion = '}o--o{';
              }

              diagrama += `    ${tablaReferenciada} ${notacion} ${nombreTabla} : "${nombreRel}"\n`;
            }
          }
        });
      }
    });

    return diagrama;
  };

  // Generar el diagrama según el tipo seleccionado
  useEffect(() => {
    setDiagramLoading(true);
    const timer = setTimeout(() => {
      let codigo = '';
      if (tipoDiagrama === 'clases') {
        codigo = generarDiagramaClases();
      } else {
        codigo = generarDiagramaER();
      }
      setCodigoMermaid(codigo);
      setDiagramLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [tipoDiagrama, tablas, esquemaPrincipal]);

  // Renderizar el diagrama con Mermaid
  useEffect(() => {
    if (!codigoMermaid || !containerRef.current) return;

    const renderDiagram = async () => {
      try {
        containerRef.current.innerHTML = `<div class="mermaid">${codigoMermaid}</div>`;
        await mermaid.contentLoaded();
      } catch (error) {
        console.error('Error renderizando diagrama:', error);
        message.error('Error al renderizar el diagrama');
      }
    };

    renderDiagram();
  }, [codigoMermaid]);

  // Manejo de zoom y pan
  const handleWheel = (e) => {
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const isOverDiagram = e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (isOverDiagram) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.max(25, Math.min(400, prev + delta)));
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  // Descargar PNG
  const descargarPNG = async () => {
    try {
      message.loading('Generando imagen...');

      const svg = containerRef.current?.querySelector('svg');
      if (!svg) {
        message.error('No hay diagrama para descargar');
        return;
      }

      const viewBox = svg.getAttribute('viewBox');
      let width, height;

      if (viewBox) {
        const parts = viewBox.split(' ');
        width = parseFloat(parts[2]);
        height = parseFloat(parts[3]);
      } else {
        const bbox = svg.getBBox();
        width = bbox.width;
        height = bbox.height;
      }

      const scale = 4;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgClone = svg.cloneNode(true);
      svgClone.setAttribute('width', width * scale);
      svgClone.setAttribute('height', height * scale);

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const img = new Image();

      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png', 1);
        link.download = `diagrama-${tipoDiagrama}-${new Date().getTime()}.png`;
        link.click();
        message.destroy();
        message.success('Diagrama descargado en alta calidad');
      };

      const encodedSvg = encodeURIComponent(svgData);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
    } catch (error) {
      console.error('Error descargando diagrama:', error);
      message.destroy();
      message.error('Error al descargar el diagrama');
    }
  };

  // Descargar SVG
  const descargarSVG = () => {
    try {
      const svg = containerRef.current?.querySelector('svg');
      if (!svg) {
        message.error('No hay diagrama para descargar');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagrama-${tipoDiagrama}-${new Date().getTime()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('Diagrama descargado');
    } catch (error) {
      console.error('Error descargando diagrama:', error);
      message.error('Error al descargar el diagrama');
    }
  };

  // Recargar diagrama
  const recargar = () => {
    setDiagramLoading(true);
    const timer = setTimeout(() => {
      let codigo = '';
      if (tipoDiagrama === 'clases') {
        codigo = generarDiagramaClases();
      } else {
        codigo = generarDiagramaER();
      }
      setCodigoMermaid(codigo);
      setDiagramLoading(false);
      resetView();
      message.success('Diagrama recargado');
    }, 300);

    return () => clearTimeout(timer);
  };

  const zoomValue = zoom / 100;
  const tieneDatos = tablas && tablas.length > 0;

  const opcionesDiagrama = [
    {
      label: (
        <span>
          <DatabaseOutlined style={{ marginRight: '0.5rem' }} />
          Diagrama de Clases {tablas.length > 0 && `(${tablas.length})`}
        </span>
      ),
      value: 'clases'
    },
    {
      label: (
        <span>
          <DatabaseOutlined style={{ marginRight: '0.5rem' }} />
          Entidad-Relación {tablas.length > 0 && `(${tablas.length})`}
        </span>
      ),
      value: 'entidad-relacion'
    }
  ];

  if (!tieneDatos) {
    return (
      <Card style={{
        textAlign: "center",
        padding: "3rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)"
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p style={{
                fontSize: '1.1rem',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                No hay tablas para generar diagrama
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                Crea al menos una tabla con columnas para ver el diagrama
              </p>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 300px)', minHeight: '600px', gap: '1rem' }}>
      {/* Controles superiores */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Select
            value={tipoDiagrama}
            onChange={(value) => {
              setTipoDiagrama(value);
              resetView();
            }}
            options={opcionesDiagrama}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={16}>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={recargar}
              loading={diagramLoading}
            >
              Recargar
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={descargarSVG}
              disabled={!codigoMermaid}
            >
              Descargar SVG
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={descargarPNG}
              disabled={!codigoMermaid}
              type="primary"
            >
              Descargar PNG HD
            </Button>
          </div>
        </Col>
      </Row>

      {/* Diagrama Container */}
      <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>
            {tipoDiagrama === 'clases' ? 'Diagrama de Clases' : 'Diagrama Entidad-Relación'}: {nombreBD} ({tablas.length} tabla{tablas.length !== 1 ? 's' : ''})
          </h3>
        </div>

        {codigoMermaid ? (
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Área del diagrama */}
            <div
              ref={wrapperRef}
              style={{
                flex: 1,
                overflow: 'auto',
                cursor: 'grab',
                position: 'relative',
                background: '#fafafa',
                border: '2px solid #d9d9d9',
                borderRadius: '8px'
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={containerRef}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomValue})`,
                  transformOrigin: 'top center',
                  display: 'inline-block',
                  minWidth: '100%',
                  padding: '2rem',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                {diagramLoading && <Spin size="large" />}
              </div>

              {/* Controles de zoom flotantes */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                display: 'flex',
                gap: '6px',
                background: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                <Button
                  icon={<ZoomOutOutlined />}
                  onClick={() => setZoom(prev => Math.max(25, prev - 10))}
                  disabled={zoom <= 25}
                  size="small"
                />

                <div style={{ position: 'relative' }}>
                  <Button
                    size="small"
                    onClick={() => setShowZoomSlider(!showZoomSlider)}
                    style={{ minWidth: '56px' }}
                  >
                    {zoom}%
                  </Button>

                  {showZoomSlider && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '16px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 20,
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {/* Slider vertical - requiere que Slider esté importado de antd */}
                    </div>
                  )}
                </div>

                <Button
                  icon={<ZoomInOutlined />}
                  onClick={() => setZoom(prev => Math.min(400, prev + 10))}
                  disabled={zoom >= 400}
                  size="small"
                />

                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetView}
                  disabled={zoom === 100 && pan.x === 0 && pan.y === 0}
                  size="small"
                  title="Restablecer vista"
                />
              </div>

              {/* Instrucciones flotantes */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                color: '#666',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                <strong>Controles:</strong> Rueda del ratón para zoom • Arrastra para desplazarte
              </div>
            </div>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Generando diagrama..."
          />
        )}
      </Card>
    </div>
  );
};

export default VistaDiagramaDB;