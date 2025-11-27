import React, { useState, useRef, useEffect } from 'react';
import { Button, Space, Badge, Tooltip, Tabs } from 'antd';
import {
  ClearOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const ConsolaResultados = ({ resultados = [], ejecutando = false }) => {
  const [altura, setAltura] = useState(300);
  const [expandido, setExpandido] = useState(false);
  const consolaRef = useRef(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');

  useEffect(() => {
    // Auto-scroll al final cuando hay nuevos resultados
    if (consolaRef.current) {
      consolaRef.current.scrollTop = consolaRef.current.scrollHeight;
    }
  }, [resultados]);

  const handleClear = () => {
    // Nota: La limpieza se maneja desde el componente padre
    // Este botón podría deshabilitarse o implementarse con un callback
  };

  const handleExportar = () => {
    if (resultados.length === 0) return;
    
    const contenido = resultados.map(r => 
      `[${r.timestamp}] [${r.tipo.toUpperCase()}] ${r.mensaje}`
    ).join('\n');
    
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultados-pruebas-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpandir = () => {
    setExpandido(!expandido);
    setAltura(expandido ? 300 : window.innerHeight - 200);
  };

  const getTipoColor = (tipo) => {
    const colores = {
      success: '#52c41a',
      error: '#ff4d4f',
      warning: '#faad14',
      info: '#1890ff',
      log: '#8c8c8c'
    };
    return colores[tipo] || colores.log;
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      success: <CheckCircleOutlined />,
      error: <CloseCircleOutlined />,
      warning: <WarningOutlined />,
      info: <InfoCircleOutlined />
    };
    return iconos[tipo] || null;
  };

  const contadores = {
    todos: resultados.length,
    success: resultados.filter(r => r.tipo === 'success').length,
    error: resultados.filter(r => r.tipo === 'error').length,
    warning: resultados.filter(r => r.tipo === 'warning').length,
    info: resultados.filter(r => r.tipo === 'info').length
  };

  const resultadosFiltrados = filtroActivo === 'todos' 
    ? resultados 
    : resultados.filter(r => r.tipo === filtroActivo);

  const tabs = [
    {
      key: 'todos',
      label: (
        <span style={{ fontSize: '0.85rem' }}>
          Todos {contadores.todos > 0 && <Badge count={contadores.todos} style={{ backgroundColor: '#595959', marginLeft: '0.5rem' }} />}
        </span>
      )
    },
    {
      key: 'success',
      label: (
        <span style={{ fontSize: '0.85rem' }}>
          Éxito {contadores.success > 0 && <Badge count={contadores.success} style={{ backgroundColor: '#52c41a', marginLeft: '0.5rem' }} />}
        </span>
      )
    },
    {
      key: 'error',
      label: (
        <span style={{ fontSize: '0.85rem' }}>
          Errores {contadores.error > 0 && <Badge count={contadores.error} style={{ backgroundColor: '#ff4d4f', marginLeft: '0.5rem' }} />}
        </span>
      )
    },
    {
      key: 'warning',
      label: (
        <span style={{ fontSize: '0.85rem' }}>
          Advertencias {contadores.warning > 0 && <Badge count={contadores.warning} style={{ backgroundColor: '#faad14', marginLeft: '0.5rem' }} />}
        </span>
      )
    },
    {
      key: 'info',
      label: (
        <span style={{ fontSize: '0.85rem' }}>
          Info {contadores.info > 0 && <Badge count={contadores.info} style={{ backgroundColor: '#1890ff', marginLeft: '0.5rem' }} />}
        </span>
      )
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: altura,
      background: '#1e1e1e',
      borderTop: '1px solid #333',
      transition: 'height 0.3s ease'
    }}>
      {/* Header de la consola */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: '#2d2d2d',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ 
            color: '#cccccc',
            fontWeight: 500,
            fontSize: '0.9rem'
          }}>
            📊 Consola de Resultados
          </span>
          
          {ejecutando && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#52c41a',
              fontSize: '0.85rem'
            }}>
              <span className="pulse-dot" style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#52c41a',
                animation: 'pulse 1.5s infinite'
              }} />
              Ejecutando...
            </span>
          )}
        </div>

        <Space size="small">
          <Tooltip title="Exportar resultados">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExportar}
              style={{ color: '#cccccc' }}
              disabled={resultados.length === 0}
            />
          </Tooltip>
          
          <Tooltip title={expandido ? "Contraer" : "Expandir"}>
            <Button
              type="text"
              size="small"
              icon={expandido ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleExpandir}
              style={{ color: '#cccccc' }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Tabs de filtrado */}
      <Tabs
        activeKey={filtroActivo}
        onChange={setFiltroActivo}
        items={tabs}
        size="small"
        style={{
          marginBottom: 0,
          background: '#252526'
        }}
        tabBarStyle={{
          margin: 0,
          padding: '0 1rem',
          color: '#cccccc'
        }}
      />

      {/* Área de resultados */}
      <div
        ref={consolaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 1rem',
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: '0.85rem',
          lineHeight: '1.6',
          color: '#cccccc'
        }}
      >
        {resultadosFiltrados.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            color: '#666',
            fontSize: '0.9rem'
          }}>
            {ejecutando ? (
              <>
                <div className="pulse-dot" style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#52c41a',
                  animation: 'pulse 1.5s infinite',
                  marginBottom: '1rem'
                }} />
                <span>Esperando resultados...</span>
              </>
            ) : (
              <>
                <InfoCircleOutlined style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                <span>No hay resultados para mostrar</span>
                <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                  Ejecuta una prueba para ver los resultados aquí
                </span>
              </>
            )}
          </div>
        ) : (
          resultadosFiltrados.map((resultado, index) => (
            <div
              key={index}
              style={{
                padding: '0.4rem 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                borderBottom: index < resultadosFiltrados.length - 1 ? '1px solid #333333' : 'none',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              <span style={{
                color: getTipoColor(resultado.tipo),
                fontSize: '1rem',
                marginTop: '0.2rem',
                minWidth: '20px'
              }}>
                {getTipoIcon(resultado.tipo)}
              </span>
              
              <span style={{
                color: '#666',
                fontSize: '0.75rem',
                minWidth: '70px',
                fontFamily: 'monospace'
              }}>
                {resultado.timestamp}
              </span>
              
              <span style={{
                color: getTipoColor(resultado.tipo),
                fontWeight: 500,
                minWidth: '70px',
                fontSize: '0.75rem',
                textTransform: 'uppercase'
              }}>
                [{resultado.tipo}]
              </span>
              
              <span style={{ 
                flex: 1,
                wordBreak: 'break-word',
                color: resultado.tipo === 'error' ? '#ff4d4f' : 
                       resultado.tipo === 'success' ? '#52c41a' :
                       resultado.tipo === 'warning' ? '#faad14' :
                       resultado.tipo === 'info' ? '#1890ff' : '#cccccc',
                whiteSpace: 'pre-wrap'
              }}>
                {resultado.mensaje}
              </span>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
};

export default ConsolaResultados;