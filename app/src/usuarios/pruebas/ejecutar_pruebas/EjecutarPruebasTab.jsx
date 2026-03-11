import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Space,
  message,
  Upload,
  Dropdown,
  Tag,
  Row,
  Col,
  Empty,
  Spin,
  Checkbox
} from 'antd';
import {
  PlayCircleOutlined,
  GithubOutlined,
  UploadOutlined,
  SaveOutlined,
  StopOutlined,
  DownloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import ListaPruebas from '../crear_pruebas/ListaPruebas';
import ConsolaResultados from './ConsolaResultados';
import ModalGitHub from './ModalGitHub';
import ExplorarGitHub from './ExplorarGitHub';
import { usePruebas } from '../../../hooks/usePruebas';
import { useEjecucion } from '../../../hooks/useEjecucion';
import '../../../styles/tabs.css';
import '../../../styles/ejecutar-pruebas.css';

const EjecutarPruebasTab = ({ proyecto }) => {
  const proyectoId = proyecto?.proyecto_id;

  const {
    pruebas,
    loading: loadingPruebas,
    cargarPruebas
  } = usePruebas(proyectoId);

  const {
    conectadoGitHub,
    githubConfig,
    githubUsuario,
    loadingGitHub,
    verificandoConexion,
    tieneConexionGuardada,
    arbolArchivos,
    loadingArbol,
    archivoActivo,
    codigoActivo,
    loadingArchivo,
    archivosModificados,
    tieneModificaciones,
    totalArchivosModificados,
    tabsAbiertos,
    cerrarTab,
    validarToken,
    listarRepositorios,
    listarRamas,
    conectarGitHub,
    desconectarGitHub,
    cargarArbolArchivos,
    cargarArchivo,
    actualizarCodigoActivo,
    guardarCambiosLocales,
    descartarCambios,
  } = useEjecucion();

  // ── Editor manual ────────────────────────────────────────────────
  const [codigoManual, setCodigoManual] = useState('// Escribe tu código aquí o cárgalo desde un archivo\n\n');
  const [codigoManualGuardado, setCodigoManualGuardado] = useState('// Escribe tu código aquí o cárgalo desde un archivo\n\n');

  // ── Multi-selección de pruebas ───────────────────────────────────
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState([]);
  // La "prueba activa" es la última seleccionada (para mostrar detalles si fuera necesario)
  const [pruebaActiva, setPruebaActiva] = useState(null);

  // ── Estado general ───────────────────────────────────────────────
  const [ejecutando, setEjecutando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [modalGitHubVisible, setModalGitHubVisible] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    pasadas: 0, fallidas: 0, pendientes: 0, tiempo: 0
  });

  const editorRef = useRef(null);

  useEffect(() => {
    if (proyectoId) cargarPruebas();
  }, [proyectoId]);

  useEffect(() => {
    if (pruebas.length > 0) {
      setEstadisticas(prev => ({
        ...prev,
        pendientes: pruebas.filter(p => p.estado === 'Aprobada').length
      }));
    }
  }, [pruebas]);

  const pruebasAprobadas = pruebas.filter(p => p.estado === 'Aprobada');
  const codigoParaEjecucion = conectadoGitHub ? codigoActivo : codigoManual;

  // ── Selección múltiple ───────────────────────────────────────────
  const handleTogglePrueba = (prueba) => {
    if (prueba.estado !== 'Aprobada') {
      message.warning('Solo se pueden ejecutar pruebas aprobadas');
      return;
    }
    setPruebaActiva(prueba);
    setPruebasSeleccionadas(prev => {
      const existe = prev.some(p => p.id_prueba === prueba.id_prueba);
      return existe
        ? prev.filter(p => p.id_prueba !== prueba.id_prueba)
        : [...prev, prueba];
    });
  };

  const handleSeleccionarTodas = (e) => {
    if (e.target.checked) {
      setPruebasSeleccionadas([...pruebasAprobadas]);
    } else {
      setPruebasSeleccionadas([]);
    }
  };

  const todasSeleccionadas =
    pruebasAprobadas.length > 0 &&
    pruebasSeleccionadas.length === pruebasAprobadas.length;
  const algunaSeleccionada = pruebasSeleccionadas.length > 0;

  // ── Helpers de resultado ─────────────────────────────────────────
  const agregarResultado = (tipo, msg) => {
    const timestamp = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    setResultados(prev => [...prev, { tipo, mensaje: msg, timestamp }]);
  };

  const simularEjecucionPaso = async (paso, indice, totalPasos) => {
    agregarResultado('log', `\n[Paso ${indice + 1}/${totalPasos}] ${paso.descripcion}`);
    await new Promise(r => setTimeout(r, 800));
    const exito = Math.random() > 0.2;
    if (exito) {
      agregarResultado('success', `✓ Resultado esperado alcanzado: ${paso.resultado_esperado}`);
    } else {
      agregarResultado('error', `✗ Fallo: No se cumplió "${paso.resultado_esperado}"`);
      agregarResultado('warning', `  Revisar la implementación del código`);
      return false;
    }
    return true;
  };

  // ── Ejecutar pruebas seleccionadas ───────────────────────────────
  const handleEjecutarSeleccionadas = async () => {
    if (pruebasSeleccionadas.length === 0) {
      message.warning('Selecciona al menos una prueba para ejecutar');
      return;
    }
    const codigoVacio = !codigoParaEjecucion.trim();
    if (codigoVacio) {
      message.warning(
        conectadoGitHub
          ? 'Selecciona un archivo del explorador de GitHub'
          : 'Debes escribir o cargar código antes de ejecutar'
      );
      return;
    }

    if (pruebasSeleccionadas.length === 1) {
      await _ejecutarUnaPrueba(pruebasSeleccionadas[0]);
    } else {
      await _ejecutarMultiples(pruebasSeleccionadas);
    }
  };

  const _ejecutarUnaPrueba = async (prueba) => {
    setEjecutando(true);
    setResultados([]);
    const detalle = prueba.prueba || prueba;
    const inicio = Date.now();
    try {
      agregarResultado('info', `═══════════════════════════════════════`);
      agregarResultado('info', `Iniciando: ${prueba.nombre}`);
      agregarResultado('info', `Código: ${prueba.codigo} | Tipo: ${prueba.tipo_prueba}`);
      if (conectadoGitHub && archivoActivo) agregarResultado('info', `Archivo: ${archivoActivo.path}`);
      agregarResultado('info', `═══════════════════════════════════════`);
      agregarResultado('log', `\n🎯 OBJETIVO: ${detalle.objetivo}`);
      agregarResultado('log', `\n📋 Verificando precondiciones...`);
      await new Promise(r => setTimeout(r, 1000));
      for (const pre of detalle.precondiciones || []) {
        agregarResultado('info', `  • ${pre}`);
        await new Promise(r => setTimeout(r, 300));
      }
      agregarResultado('success', '✓ Precondiciones cumplidas');
      agregarResultado('log', `\n⚙️  Compilando código...`);
      await new Promise(r => setTimeout(r, 1200));
      agregarResultado('success', '✓ Compilado');
      agregarResultado('log', `\n🔄 Ejecutando pasos...`);

      let ok = true;
      const pasos = detalle.pasos || [];
      for (let i = 0; i < pasos.length; i++) {
        const res = await simularEjecucionPaso(pasos[i], i, pasos.length);
        if (!res) { ok = false; break; }
      }

      const t = ((Date.now() - inicio) / 1000).toFixed(2);
      agregarResultado('log', `\n═══════════════════════════════════════`);
      if (ok) {
        agregarResultado('success', '✅ PRUEBA APROBADA');
        agregarResultado('info', `⏱️  Tiempo: ${t}s`);
        setEstadisticas(prev => ({ ...prev, pasadas: prev.pasadas + 1, pendientes: Math.max(0, prev.pendientes - 1), tiempo: prev.tiempo + parseFloat(t) }));
        message.success('¡Prueba ejecutada exitosamente!');
      } else {
        agregarResultado('error', '❌ PRUEBA FALLIDA');
        agregarResultado('info', `⏱️  Tiempo: ${t}s`);
        setEstadisticas(prev => ({ ...prev, fallidas: prev.fallidas + 1, pendientes: Math.max(0, prev.pendientes - 1), tiempo: prev.tiempo + parseFloat(t) }));
        message.error('La prueba falló');
      }
    } catch (err) {
      agregarResultado('error', `💥 Error crítico: ${err.message}`);
    } finally {
      setEjecutando(false);
    }
  };

  const _ejecutarMultiples = async (lista) => {
    setEjecutando(true);
    setResultados([]);
    agregarResultado('info', '╔═══════════════════════════════════════╗');
    agregarResultado('info', `║  EJECUTANDO ${lista.length} PRUEBA(S) SELECCIONADA(S)  ║`);
    agregarResultado('info', '╚═══════════════════════════════════════╝');

    let pasadas = 0, fallidas = 0;
    const inicioTotal = Date.now();

    for (let i = 0; i < lista.length; i++) {
      const prueba = lista[i];
      agregarResultado('info', `\n[${i + 1}/${lista.length}] ${prueba.nombre}`);
      await new Promise(r => setTimeout(r, 1200));
      const exito = Math.random() > 0.15;
      if (exito) { agregarResultado('success', `✅ ${prueba.codigo} - APROBADA`); pasadas++; }
      else { agregarResultado('error', `❌ ${prueba.codigo} - FALLIDA`); fallidas++; }
    }

    const t = ((Date.now() - inicioTotal) / 1000).toFixed(2);
    agregarResultado('log', '\n═══════════════════════════════════════');
    agregarResultado('success', `✅ Aprobadas: ${pasadas}/${lista.length}`);
    if (fallidas > 0) agregarResultado('error', `❌ Fallidas: ${fallidas}/${lista.length}`);
    agregarResultado('info', `⏱️  Tiempo total: ${t}s`);
    agregarResultado('info', `📈 Tasa de éxito: ${((pasadas / lista.length) * 100).toFixed(1)}%`);
    setEstadisticas({ pasadas, fallidas, pendientes: 0, tiempo: parseFloat(t) });
    setEjecutando(false);
    if (fallidas === 0) message.success('🎉 ¡Todas las pruebas seleccionadas pasaron!');
    else message.warning(`${fallidas} prueba(s) fallaron`);
  };

  const handleDetenerEjecucion = () => {
    setEjecutando(false);
    agregarResultado('warning', '⚠️  Ejecución detenida por el usuario');
    message.info('Ejecución detenida');
  };

  const handleCargarArchivo = (info) => {
    const { file } = info;
    if (file.status === 'done' || file.originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCodigoManual(e.target.result);
        message.success(`Archivo ${file.name} cargado`);
      };
      reader.readAsText(file.originFileObj || file);
    }
  };

  const handleConectarGitHub = async (valores) => {
    try {
      await conectarGitHub(valores);
      setModalGitHubVisible(false);
    } catch { /* Error ya manejado */ }
  };

  const handleGuardarManual = () => {
    setCodigoManualGuardado(codigoManual);
    message.success('Código guardado');
  };

  const handleExportarManual = () => {
    const blob = new Blob([codigoManual], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigo-prueba-${Date.now()}.js`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Código exportado');
  };

  const tieneModificacionesManual = codigoManual !== codigoManualGuardado;

  const menuOpciones = {
    items: [
      { key: 'guardar', label: 'Guardar Código', icon: <SaveOutlined />, onClick: handleGuardarManual, disabled: !tieneModificacionesManual },
      { key: 'exportar', label: 'Exportar Código', icon: <DownloadOutlined />, onClick: handleExportarManual },
    ],
  };

  // ── Loading / Empty states ───────────────────────────────────────
  if (loadingPruebas) {
    return (
      <div className="ep-loading-state">
        <Spin size="large" />
        <div className="ep-loading-text">Cargando pruebas...</div>
      </div>
    );
  }

  if (pruebas.length === 0) {
    return (
      <div className="ep-empty-state">
        <Empty
          description={
            <div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay pruebas disponibles</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Primero debes crear y aprobar pruebas en la pestaña "Pruebas"
              </p>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  if (pruebasAprobadas.length === 0) {
    return (
      <div className="ep-empty-state">
        <Empty
          description={
            <div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay pruebas aprobadas</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Debes aprobar al menos una prueba para ejecutarla
              </p>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="ep-root">

      {/* ── Header ── */}
      <div className="ep-header">
        <div className="ep-header-left">
          <h3>
            <PlayCircleOutlined className="ep-header-icon" />
            Ejecución de Pruebas
          </h3>
          <div className="ep-header-tags">
            <Tag color="blue">{pruebasAprobadas.length} pruebas disponibles</Tag>
            {conectadoGitHub && (
              <Tag color="success" icon={<GithubOutlined />}>
                {githubConfig?.repositorio?.split('/')[1]} · {githubConfig?.rama}
              </Tag>
            )}
            {conectadoGitHub && totalArchivosModificados > 0 && (
              <Tag color="orange">{totalArchivosModificados} archivo(s) modificado(s)</Tag>
            )}
          </div>
        </div>

        <div className="ep-stats">
          <div className="ep-stat-item">
            <CheckCircleOutlined className="ep-stat-icon ep-stat-icon--pass" />
            <div className="ep-stat-value ep-stat-value--pass">{estadisticas.pasadas}</div>
            <div className="ep-stat-label">Pasadas</div>
          </div>
          <div className="ep-stat-item">
            <CloseCircleOutlined className="ep-stat-icon ep-stat-icon--fail" />
            <div className="ep-stat-value ep-stat-value--fail">{estadisticas.fallidas}</div>
            <div className="ep-stat-label">Fallidas</div>
          </div>
          <div className="ep-stat-item">
            <ClockCircleOutlined className="ep-stat-icon ep-stat-icon--pend" />
            <div className="ep-stat-value ep-stat-value--pend">{estadisticas.pendientes}</div>
            <div className="ep-stat-label">Pendientes</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="ep-toolbar">
        <div className="ep-toolbar-left">
          {!ejecutando ? (
            <>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleEjecutarSeleccionadas}
                disabled={!algunaSeleccionada}
                className="btn btn-primary"
              >
                {pruebasSeleccionadas.length > 1
                  ? `Ejecutar (${pruebasSeleccionadas.length})`
                  : 'Ejecutar Prueba'}
              </Button>
            </>
          ) : (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleDetenerEjecucion}
              className="btn btn-danger"
            >
              Detener Ejecución
            </Button>
          )}

          {!conectadoGitHub && (
            <Upload
              beforeUpload={() => false}
              onChange={handleCargarArchivo}
              showUploadList={false}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cs,.go,.rs,.rb,.php"
            >
              <Button icon={<UploadOutlined />} className="btn btn-secondary">
                Cargar Archivo
              </Button>
            </Upload>
          )}

          {conectadoGitHub ? (
            <Button
              icon={<DisconnectOutlined />}
              onClick={desconectarGitHub}
              danger
              className="btn btn-danger-outline"
            >
              Desconectar GitHub
            </Button>
          ) : (
            <Button
              icon={<GithubOutlined />}
              onClick={() => setModalGitHubVisible(true)}
              loading={loadingGitHub || verificandoConexion}
              className={tieneConexionGuardada ? 'btn ep-btn-github-saved' : 'btn btn-secondary'}
            >
              {verificandoConexion
                ? 'Verificando...'
                : tieneConexionGuardada
                  ? `GitHub — @${githubUsuario?.login || '...'}`
                  : 'Conectar GitHub'
              }
            </Button>
          )}
        </div>

        <div className="ep-toolbar-right">
          {!conectadoGitHub && tieneModificacionesManual && (
            <Tag color="orange">Sin guardar</Tag>
          )}
          {!conectadoGitHub && (
            <Dropdown menu={menuOpciones} trigger={['click']}>
              <Button icon={<SettingOutlined />} className="btn btn-secondary">
                Opciones
              </Button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="ep-body">

        {/* Lista de pruebas con checkboxes */}
        <div className="ep-list-panel">
          <div className="ep-list-header">
            <div className="ep-list-header-top">
              <h4 className="ep-list-title">Pruebas aprobadas</h4>
              {algunaSeleccionada && (
                <span className="ep-selected-count">
                  {pruebasSeleccionadas.length} sel.
                </span>
              )}
            </div>
            <Checkbox
              checked={todasSeleccionadas}
              indeterminate={algunaSeleccionada && !todasSeleccionadas}
              onChange={handleSeleccionarTodas}
            >
              <span className="ep-list-select-all">Seleccionar todas</span>
            </Checkbox>
          </div>

          <div className="ep-list-items">
            {pruebasAprobadas.map(prueba => {
              const seleccionada = pruebasSeleccionadas.some(p => p.id_prueba === prueba.id_prueba);
              const activa = pruebaActiva?.id_prueba === prueba.id_prueba;
              return (
                <div
                  key={prueba.id_prueba}
                  className={[
                    'ep-prueba-item',
                    seleccionada ? 'ep-prueba-item--selected' : '',
                    activa ? 'ep-prueba-item--active' : '',
                  ].join(' ')}
                  onClick={() => handleTogglePrueba(prueba)}
                >
                  <Checkbox
                    checked={seleccionada}
                    className="ep-prueba-checkbox"
                    onClick={e => e.stopPropagation()}
                    onChange={() => handleTogglePrueba(prueba)}
                  />
                  <div className="ep-prueba-icon">
                    {prueba.tipo_prueba === 'unitaria' ? '🧪' :
                      prueba.tipo_prueba === 'sistema' ? '🖥️' : '⚙️'}
                  </div>
                  <div className="ep-prueba-content">
                    <div className="ep-prueba-name">{prueba.nombre}</div>
                    <div className="ep-prueba-meta">
                      <Tag size="small" color="blue">{prueba.tipo_prueba}</Tag>
                      <span className="ep-prueba-code">{prueba.codigo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zona de código */}
        <div className="ep-editor-zone">

          {conectadoGitHub ? (
            <ExplorarGitHub
              githubConfig={githubConfig}
              arbolArchivos={arbolArchivos}
              loadingArbol={loadingArbol}
              archivoActivo={archivoActivo}
              codigoActivo={codigoActivo}
              loadingArchivo={loadingArchivo}
              archivosModificados={archivosModificados}
              tieneModificaciones={tieneModificaciones}
              totalArchivosModificados={totalArchivosModificados}
              tabsAbiertos={tabsAbiertos}
              onSeleccionarArchivo={cargarArchivo}
              onActualizarCodigo={actualizarCodigoActivo}
              onGuardarLocal={guardarCambiosLocales}
              onDescartarCambios={descartarCambios}
              onCerrarTab={cerrarTab}
              onDesconectar={desconectarGitHub}
              onCambiarProyecto={() => setModalGitHubVisible(true)}
              onRecargarArbol={() =>
                cargarArbolArchivos(githubConfig.token, githubConfig.repositorio, githubConfig.rama)
              }
            />
          ) : (
            <>
              <div className="ep-manual-bar">
                <span className="ep-manual-bar-label">
                  <CodeOutlined />
                  Editor de Código
                </span>
                {pruebaActiva && (
                  <Tag color="blue">{pruebaActiva.codigo} seleccionada</Tag>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={codigoManual}
                  onChange={(v) => setCodigoManual(v || '')}
                  onMount={(editor) => { editorRef.current = editor; }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </>
          )}

          <ConsolaResultados
            resultados={resultados}
            ejecutando={ejecutando}
          />
        </div>
      </div>

      <ModalGitHub
        visible={modalGitHubVisible}
        onCancel={() => setModalGitHubVisible(false)}
        onConectar={handleConectarGitHub}
        onEliminarConexion={desconectarGitHub}
        loading={loadingGitHub}
        tieneConexionGuardada={tieneConexionGuardada}
        githubUsuario={githubUsuario}
        githubConfigGuardada={githubConfig}
        validarToken={validarToken}
        listarRepositorios={listarRepositorios}
        listarRamas={listarRamas}
      />
    </div>
  );
};

export default EjecutarPruebasTab;