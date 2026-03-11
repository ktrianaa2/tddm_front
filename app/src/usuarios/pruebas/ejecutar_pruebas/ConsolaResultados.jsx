import React, { useState, useRef, useEffect } from 'react';
import { Button, Tabs, Tooltip } from 'antd';
import {
  DownloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ClearOutlined,
  ConsoleSqlOutlined,
} from '@ant-design/icons';
import '../../../styles/ejecutar-pruebas.css';

const TIPO_META = {
  success: {
    icon: <CheckCircleOutlined />,
    rowClass: 'ep-console-row--success',
    textClass: 'ep-type-success',
    label: 'OK',
  },
  error: {
    icon: <CloseCircleOutlined />,
    rowClass: 'ep-console-row--error',
    textClass: 'ep-type-error',
    label: 'ERR',
  },
  warning: {
    icon: <WarningOutlined />,
    rowClass: 'ep-console-row--warning',
    textClass: 'ep-type-warning',
    label: 'WARN',
  },
  info: {
    icon: <InfoCircleOutlined />,
    rowClass: 'ep-console-row--info',
    textClass: 'ep-type-info',
    label: 'INFO',
  },
  log: {
    icon: null,
    rowClass: 'ep-console-row--log',
    textClass: 'ep-type-log',
    label: 'LOG',
  },
};

const ConsolaResultados = ({ resultados = [], ejecutando = false, onLimpiar }) => {
  const [altura, setAltura] = useState(260);
  const [expandido, setExpandido] = useState(false);
  const consolaRef = useRef(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');

  // Auto-scroll al fondo al recibir nuevos resultados
  useEffect(() => {
    if (consolaRef.current) {
      consolaRef.current.scrollTop = consolaRef.current.scrollHeight;
    }
  }, [resultados]);

  const handleExportar = () => {
    if (resultados.length === 0) return;
    const contenido = resultados
      .map(r => `[${r.timestamp}] [${r.tipo.toUpperCase().padEnd(7)}] ${r.mensaje}`)
      .join('\n');
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultados-${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpandir = () => {
    const nuevo = !expandido;
    setExpandido(nuevo);
    setAltura(nuevo ? Math.max(window.innerHeight - 220, 400) : 260);
  };

  const contadores = {
    todos: resultados.length,
    success: resultados.filter(r => r.tipo === 'success').length,
    error: resultados.filter(r => r.tipo === 'error').length,
    warning: resultados.filter(r => r.tipo === 'warning').length,
    info: resultados.filter(r => r.tipo === 'info').length,
  };

  const resultadosFiltrados = filtroActivo === 'todos'
    ? resultados
    : resultados.filter(r => r.tipo === filtroActivo);

  const tabs = [
    { key: 'todos', label: `TODOS${contadores.todos > 0 ? ` (${contadores.todos})` : ''}` },
    { key: 'success', label: `OK${contadores.success > 0 ? ` (${contadores.success})` : ''}` },
    { key: 'error', label: `ERRORES${contadores.error > 0 ? ` (${contadores.error})` : ''}` },
    { key: 'warning', label: `AVISOS${contadores.warning > 0 ? ` (${contadores.warning})` : ''}` },
    { key: 'info', label: `INFO${contadores.info > 0 ? ` (${contadores.info})` : ''}` },
  ];

  return (
    <div className="ep-console" style={{ height: altura }}>

      {/* ── Header ── */}
      <div className="ep-console-header">
        <div className="ep-console-header-left">
          <span className="ep-console-title">
            <ConsoleSqlOutlined className="ep-console-title-icon" />
            OUTPUT
          </span>

          {ejecutando && (
            <span className="ep-console-running">
              <span className="ep-console-pulse" />
              Ejecutando...
            </span>
          )}

          {!ejecutando && contadores.todos > 0 && (
            <span style={{
              fontSize: '0.68rem',
              color: '#484f58',
              fontFamily: 'monospace',
              letterSpacing: '0.03em',
            }}>
              {contadores.todos} línea{contadores.todos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="ep-console-actions">
          {onLimpiar && (
            <Tooltip title="Limpiar consola">
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onClick={onLimpiar}
                disabled={resultados.length === 0}
                className="ep-console-action-btn"
              />
            </Tooltip>
          )}
          <Tooltip title="Exportar log">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExportar}
              disabled={resultados.length === 0}
              className="ep-console-action-btn"
            />
          </Tooltip>
          <Tooltip title={expandido ? 'Contraer' : 'Expandir'}>
            <Button
              type="text"
              size="small"
              icon={expandido ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleExpandir}
              className="ep-console-action-btn"
            />
          </Tooltip>
        </div>
      </div>

      {/* ── Tabs de filtro ── */}
      <Tabs
        activeKey={filtroActivo}
        onChange={setFiltroActivo}
        items={tabs}
        size="small"
        className="ep-console-tabs"
      />

      {/* ── Área de resultados ── */}
      <div ref={consolaRef} className="ep-console-body">
        {resultadosFiltrados.length === 0 ? (
          <div className="ep-console-empty">
            {ejecutando ? (
              <>
                <span className="ep-console-pulse ep-console-pulse--lg" />
                <span style={{ fontSize: '0.78rem', color: '#8b949e' }}>
                  Esperando salida del proceso...
                </span>
              </>
            ) : (
              <>
                <ConsoleSqlOutlined className="ep-console-empty-icon" />
                <span style={{ color: '#484f58', fontSize: '0.78rem' }}>
                  Sin salida
                  {filtroActivo !== 'todos' ? ` de tipo "${filtroActivo}"` : ''}
                </span>
                <span className="ep-console-empty-subtitle">
                  Ejecuta una prueba para ver los resultados aquí
                </span>
              </>
            )}
          </div>
        ) : (
          resultadosFiltrados.map((resultado, index) => {
            const meta = TIPO_META[resultado.tipo] || TIPO_META.log;
            return (
              <div
                key={index}
                className={`ep-console-row ${meta.rowClass}`}
              >
                {/* Icono */}
                <span className={`ep-console-row-icon ${meta.textClass}`}>
                  {meta.icon}
                </span>

                {/* Timestamp */}
                <span className="ep-console-row-ts">
                  {resultado.timestamp}
                </span>

                {/* Tipo */}
                <span className={`ep-console-row-type ${meta.textClass}`}>
                  {meta.label}
                </span>

                {/* Mensaje */}
                <span className={`ep-console-row-msg ${meta.textClass}`}>
                  {resultado.mensaje}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConsolaResultados;