import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col, Empty, Spin, message, Slider } from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import mermaid from 'mermaid';
import '../../styles/diagrams.css';


const VistaDiagrama = ({ tablas = [], esquemaPrincipal = {} }) => {
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

  /**
   * Extrae tipo de dato básico (VARCHAR -> VARCHAR, DECIMAL(10,2) -> DECIMAL, etc)
   */
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

  /**
   * Genera diagrama ER con el nuevo formato JSON
   * Maneja: columnas con estructura, índices, y relaciones FK
   */
  const generarDiagramaER = () => {
    if (!tablas || tablas.length === 0) return '';

    let diagrama = 'erDiagram\n';

    // Procesar cada tabla
    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;

      if (!nombreTabla) return;

      diagrama += `    ${nombreTabla} {\n`;

      // Procesar columnas
      if (tabla.columns && Array.isArray(tabla.columns) && tabla.columns.length > 0) {
        tabla.columns.forEach((columna) => {
          const nombreCol = columna.name || columna.nombre;
          if (!nombreCol) return;

          // Extraer tipo básico
          const tipoBasico = extraerTipoBasico(columna.type);

          // Marcar Primary Key
          const esPK = columna.primaryKey ? ' PK' : '';
          // Marcar Foreign Key
          const esFK = columna.foreignKey || columna.reference ? ' FK' : '';

          diagrama += `        ${tipoBasico} ${nombreCol}${esPK}${esFK}\n`;
        });
      } else {
        // Fallback si no hay columnas
        diagrama += `        int id PK\n`;
      }

      diagrama += '    }\n';
    });

    // Procesar relaciones desde las columnas FK
    diagrama += '\n';
    const relacionesAgregadas = new Set();

    tablas.forEach((tabla) => {
      const nombreTabla = tabla.name || tabla.nombre;

      if (!nombreTabla) return;

      // Buscar columnas con referencias
      if (tabla.columns && Array.isArray(tabla.columns)) {
        tabla.columns.forEach((columna) => {
          if (columna.reference) {
            // Formato de referencia: "tabla_referenciada(columna)"
            const match = columna.reference.match(/^(\w+)\((\w+)\)$/);
            
            if (match) {
              const tablaReferenciada = match[1];
              const columnaPK = match[2];
              const nombreCol = columna.name || columna.nombre;

              // Evitar duplicados
              const relacionKey = `${nombreTabla}-${tablaReferenciada}`;
              
              if (!relacionesAgregadas.has(relacionKey)) {
                relacionesAgregadas.add(relacionKey);
                
                // Cardinalidad: muchos-a-uno (la tabla actual tiene FK, referencia a una fila)
                const notacion = '||--o{';
                diagrama += `    ${tablaReferenciada} ${notacion} ${nombreTabla} : "tiene"\n`;
              }
            }
          }
        });
      }

      // También procesar relaciones desde el objeto "relaciones" si existe
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

  // Generar el diagrama cuando cambien los datos
  useEffect(() => {
    setDiagramLoading(true);
    const timer = setTimeout(() => {
      const codigo = generarDiagramaER();
      console.log('🔍 Código Mermaid generado:', codigo);
      setCodigoMermaid(codigo);
      setDiagramLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [tablas, esquemaPrincipal]);

  // Renderizar el diagrama con Mermaid
  useEffect(() => {
    if (!codigoMermaid || !containerRef.current) return;

    const renderDiagram = async () => {
      try {
        containerRef.current.innerHTML = `<div class="mermaid">${codigoMermaid}</div>`;
        await mermaid.contentLoaded();
      } catch (error) {
        console.error('Error renderizando diagrama ER:', error);
        message.error('Error al renderizar el diagrama ER');
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

  // Descargar como PNG
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
        link.download = `diagrama-er-${new Date().getTime()}.png`;
        link.click();
        message.destroy();
        message.success('Diagrama descargado en alta calidad');
      };

      img.onerror = () => {
        message.destroy();
        message.error('Error al procesar la imagen');
      };

      const encodedSvg = encodeURIComponent(svgData);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
    } catch (error) {
      console.error('Error descargando diagrama:', error);
      message.destroy();
      message.error('Error al descargar el diagrama');
    }
  };

  // Descargar como SVG
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
      link.download = `diagrama-er-${new Date().getTime()}.svg`;
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
      const codigo = generarDiagramaER();
      setCodigoMermaid(codigo);
      setDiagramLoading(false);
      resetView();
      message.success('Diagrama recargado');
    }, 300);

    return () => clearTimeout(timer);
  };

  const zoomValue = zoom / 100;
  const tieneDatos = tablas && tablas.length > 0;

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
                Crea al menos una tabla con columnas para ver el diagrama ER
              </p>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="diagram-uml-container">
      {/* Controles superiores */}
      <Row gutter={[16, 16]} style={{ marginBottom: '1rem' }}>
        <Col xs={24} sm={24} md={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                Diagrama ER: {nombreBD} ({tablas.length} tabla{tablas.length !== 1 ? 's' : ''})
              </h3>
            </div>
            <div className="diagram-actions">
              <Button
                icon={<ReloadOutlined />}
                onClick={recargar}
                loading={diagramLoading}
                className="diagram-btn"
              >
                Recargar
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={descargarSVG}
                disabled={!codigoMermaid}
                className="diagram-btn"
              >
                Descargar SVG
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={descargarPNG}
                disabled={!codigoMermaid}
                className="diagram-btn diagram-btn-primary"
              >
                Descargar PNG HD
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Diagrama Container */}
      <Card className="diagram-card">
        {codigoMermaid ? (
          <div className="diagram-content">
            {/* Área del diagrama */}
            <div
              ref={wrapperRef}
              className={`diagram-viewer ${isDragging ? 'dragging' : ''}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={containerRef}
                className="diagram-canvas"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomValue})`,
                  transition: isDragging ? 'none' : 'transform 0.1s'
                }}
              >
                {diagramLoading && <Spin size="large" />}
              </div>
            </div>

            {/* Controles de zoom flotantes */}
            <div className="diagram-zoom-controls">
              <Button
                icon={<ZoomOutOutlined />}
                onClick={() => setZoom(prev => Math.max(25, prev - 10))}
                disabled={zoom <= 25}
                size="small"
                className="zoom-btn"
              />

              <div className="zoom-value-container">
                <Button
                  size="small"
                  className="zoom-value-btn"
                  onClick={() => setShowZoomSlider(!showZoomSlider)}
                >
                  {zoom}%
                </Button>

                {showZoomSlider && (
                  <div className="zoom-slider-popup">
                    <Slider
                      vertical
                      min={25}
                      max={400}
                      value={zoom}
                      onChange={setZoom}
                      tooltip={{
                        formatter: (val) => `${val}%`
                      }}
                    />
                  </div>
                )}
              </div>

              <Button
                icon={<ZoomInOutlined />}
                onClick={() => setZoom(prev => Math.min(400, prev + 10))}
                disabled={zoom >= 400}
                size="small"
                className="zoom-btn"
              />

              <Button
                icon={<ReloadOutlined />}
                onClick={resetView}
                disabled={zoom === 100 && pan.x === 0 && pan.y === 0}
                size="small"
                className="zoom-btn"
                title="Restablecer vista"
              />
            </div>

            {/* Instrucciones flotantes */}
            <div className="diagram-instructions">
              <strong>Controles:</strong> Rueda del ratón para zoom • Arrastra para desplazarte
            </div>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p style={{
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Generando diagrama ER...
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)'
                }}>
                  Por favor espera mientras se procesa la información
                </p>
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default VistaDiagrama;