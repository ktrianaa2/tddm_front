import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Upload, Dropdown, Tag, Empty, Spin, Checkbox, Tooltip } from 'antd';
import {
  PlayCircleOutlined, GithubOutlined, UploadOutlined, SaveOutlined,
  StopOutlined, DownloadOutlined, SettingOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, CodeOutlined, DisconnectOutlined,
  ExperimentOutlined, ThunderboltOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import ConsolaResultados from './ConsolaResultados';
import ModalGitHub from './ModalGitHub';
import ExplorarGitHub from './ExplorarGitHub';
import { usePruebas } from '../../../hooks/usePruebas';
import { useEjecucion } from '../../../hooks/useEjecucion';
import '../../../styles/tabs.css';
import '../../../styles/ejecutar-pruebas.css';
import '../../../styles/modo-ejecucion.css';

const EjecutarPruebasTab = ({ proyecto }) => {
  const proyectoId = proyecto?.proyecto_id;
  const { pruebas, loading: loadingPruebas, cargarPruebas } = usePruebas(proyectoId);
  const {
    conectadoGitHub, githubConfig, githubUsuario, loadingGitHub, verificandoConexion,
    tieneConexionGuardada, arbolArchivos, loadingArbol, archivoActivo, codigoActivo,
    loadingArchivo, archivosModificados, tieneModificaciones, totalArchivosModificados,
    tabsAbiertos, cerrarTab, validarToken, listarRepositorios, listarRamas,
    conectarGitHub, desconectarGitHub, cargarArbolArchivos, cargarArchivo,
    actualizarCodigoActivo, guardarCambiosLocales, descartarCambios,
    ejecutando, resultados, estadisticas, ejecutarPruebas, detenerEjecucion,
    limpiarResultados, inicializarPendientes,
  } = useEjecucion();

  const [codigoManual, setCodigoManual] = useState(
    '# Pega aquí el código Python que tus pruebas importan/testean\n' +
    '# (opcional — déjalo vacío si las pruebas son autónomas)\n\n'
  );
  const [codigoManualGuardado, setCodigoManualGuardado] = useState('');
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState([]);
  const [pruebaActiva, setPruebaActiva] = useState(null);
  const [modalGitHubVisible, setModalGitHubVisible] = useState(false);

  // ── NUEVO: pestaña de modo activa ────────────────────────────────
  const [modoActivo, setModoActivo] = useState('prueba_sola'); // 'prueba_sola' | 'sobre_codigo'

  const editorRef = useRef(null);

  useEffect(() => { if (proyectoId) cargarPruebas(); }, [proyectoId]);
  useEffect(() => {
    if (pruebas.length > 0) inicializarPendientes(pruebas.filter(p => p.estado === 'Aprobada').length);
  }, [pruebas]);

  const pruebasAprobadas = pruebas.filter(p => p.estado === 'Aprobada');

  const handleTogglePrueba = (prueba) => {
    if (prueba.estado !== 'Aprobada') { message.warning('Solo se pueden ejecutar pruebas aprobadas'); return; }
    setPruebaActiva(prueba);
    setPruebasSeleccionadas(prev => {
      const existe = prev.some(p => p.id_prueba === prueba.id_prueba);
      return existe ? prev.filter(p => p.id_prueba !== prueba.id_prueba) : [...prev, prueba];
    });
  };

  const handleSeleccionarTodas = (e) =>
    setPruebasSeleccionadas(e.target.checked ? [...pruebasAprobadas] : []);

  const todasSeleccionadas = pruebasAprobadas.length > 0 && pruebasSeleccionadas.length === pruebasAprobadas.length;
  const algunaSeleccionada = pruebasSeleccionadas.length > 0;

  // ── Ejecutar según modo activo ───────────────────────────────────
  const handleEjecutar = () => {
    if (!algunaSeleccionada) { message.warning('Selecciona al menos una prueba para ejecutar'); return; }
    if (modoActivo === 'sobre_codigo' && !conectadoGitHub && !codigoManual.trim()) {
      message.warning('Pega el código del proyecto en el editor o conecta GitHub');
      return;
    }
    ejecutarPruebas(
      pruebasSeleccionadas,
      conectadoGitHub ? '' : codigoManual,
      120,
      modoActivo,
    );
  };

  const handleCargarArchivo = (info) => {
    const { file } = info;
    if (file.status === 'done' || file.originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => { setCodigoManual(e.target.result); message.success(`${file.name} cargado`); };
      reader.readAsText(file.originFileObj || file);
    }
  };

  const handleConectarGitHub = async (valores) => {
    try { await conectarGitHub(valores); setModalGitHubVisible(false); } catch { }
  };
  const handleGuardarManual = () => { setCodigoManualGuardado(codigoManual); message.success('Código guardado'); };
  const handleExportarManual = () => {
    const blob = new Blob([codigoManual], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `codigo-${Date.now()}.py`; link.click();
    URL.revokeObjectURL(url); message.success('Código exportado');
  };

  const tieneModificacionesManual = codigoManual !== codigoManualGuardado;
  const menuOpciones = {
    items: [
      { key: 'guardar', label: 'Guardar Código', icon: <SaveOutlined />, onClick: handleGuardarManual, disabled: !tieneModificacionesManual },
      { key: 'exportar', label: 'Exportar Código', icon: <DownloadOutlined />, onClick: handleExportarManual },
    ],
  };

  if (loadingPruebas) return (
    <div className="ep-loading-state"><Spin size="large" /><div className="ep-loading-text">Cargando pruebas...</div></div>
  );
  if (pruebas.length === 0) return (
    <div className="ep-empty-state">
      <Empty description={<div><p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay pruebas disponibles</p><p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Primero debes crear y aprobar pruebas en la pestaña "Pruebas"</p></div>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  );
  if (pruebasAprobadas.length === 0) return (
    <div className="ep-empty-state">
      <Empty description={<div><p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay pruebas aprobadas</p><p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Aprueba al menos una prueba para poder ejecutarla</p></div>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  );

  return (
    <div className="ep-root">

      {/* ── Header ── */}
      <div className="ep-header">
        <div className="ep-header-left">
          <h3><PlayCircleOutlined className="ep-header-icon" />Ejecución de Pruebas</h3>
          <div className="ep-header-tags">
            <Tag color="blue">{pruebasAprobadas.length} pruebas disponibles</Tag>
            <Tag color="purple">pytest real</Tag>
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

      {/* ── TABS DE MODO ── */}
      <div className="modo-tabs">
        <button
          className={`modo-tab ${modoActivo === 'prueba_sola' ? 'modo-tab--active modo-tab--red' : ''}`}
          onClick={() => setModoActivo('prueba_sola')}
        >
          <div className="modo-tab__icon"><ExperimentOutlined /></div>
          <div className="modo-tab__content">
            <span className="modo-tab__title">Prueba sola</span>
            <span className="modo-tab__subtitle">Sin código real · Auto-mock · Red phase</span>
          </div>
          <div className="modo-tab__badge modo-tab__badge--red">TDD ①</div>
        </button>

        <button
          className={`modo-tab ${modoActivo === 'sobre_codigo' ? 'modo-tab--active modo-tab--green' : ''}`}
          onClick={() => setModoActivo('sobre_codigo')}
        >
          <div className="modo-tab__icon"><ThunderboltOutlined /></div>
          <div className="modo-tab__content">
            <span className="modo-tab__title">Sobre código</span>
            <span className="modo-tab__subtitle">Con código real · Sin mocks · Green phase</span>
          </div>
          <div className="modo-tab__badge modo-tab__badge--green">TDD ②</div>
        </button>
      </div>

      {/* ── Banner contextual del modo ── */}
      <div className={`modo-banner ${modoActivo === 'prueba_sola' ? 'modo-banner--red' : 'modo-banner--green'}`}>
        {modoActivo === 'prueba_sola' ? (
          <>
            <ExperimentOutlined className="modo-banner__icon" />
            <div className="modo-banner__text">
              <strong>Fase roja (Red):</strong> ejecuta las pruebas sin código real del proyecto.
              Los imports faltantes se simulan con mocks automáticos.
              <em> Lo esperado es que fallen</em> — si pasan, la prueba puede ser trivial.
            </div>
          </>
        ) : (
          <>
            <ThunderboltOutlined className="modo-banner__icon" />
            <div className="modo-banner__text">
              <strong>Fase verde (Green):</strong> ejecuta las pruebas contra el código real
              {conectadoGitHub
                ? ` del repo ${githubConfig?.repositorio?.split('/')[1]}.`
                : ' pegado en el editor.'}
              {' '}No se aplican mocks automáticos.
              <em> Lo esperado es que pasen.</em>
            </div>
          </>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="ep-toolbar">
        <div className="ep-toolbar-left">
          {!ejecutando ? (
            <Button
              type={modoActivo === 'sobre_codigo' ? 'primary' : 'default'}
              icon={modoActivo === 'sobre_codigo' ? <ThunderboltOutlined /> : <ExperimentOutlined />}
              onClick={handleEjecutar}
              disabled={!algunaSeleccionada}
              className={`btn ${modoActivo === 'sobre_codigo' ? 'btn-primary' : 'btn-red-phase'}`}
            >
              {algunaSeleccionada && pruebasSeleccionadas.length > 1
                ? `${modoActivo === 'prueba_sola' ? 'Prueba sola' : 'Ejecutar'} (${pruebasSeleccionadas.length})`
                : modoActivo === 'prueba_sola' ? 'Prueba sola' : 'Ejecutar sobre código'
              }
            </Button>
          ) : (
            <Button danger icon={<StopOutlined />} onClick={detenerEjecucion} className="btn btn-danger">
              Detener
            </Button>
          )}

          {/* Editor / GitHub solo visible en modo sobre_codigo */}
          {modoActivo === 'sobre_codigo' && !conectadoGitHub && (
            <Upload beforeUpload={() => false} onChange={handleCargarArchivo} showUploadList={false} accept=".py,.pyi,.pyx">
              <Button icon={<UploadOutlined />} className="btn btn-secondary">Cargar .py</Button>
            </Upload>
          )}

          {modoActivo === 'sobre_codigo' && (
            conectadoGitHub
              ? <Button icon={<DisconnectOutlined />} onClick={desconectarGitHub} danger className="btn btn-danger-outline">
                Desconectar GitHub
              </Button>
              : <Button
                icon={<GithubOutlined />}
                onClick={() => setModalGitHubVisible(true)}
                loading={loadingGitHub || verificandoConexion}
                className={tieneConexionGuardada ? 'btn ep-btn-github-saved' : 'btn btn-secondary'}
              >
                {verificandoConexion ? 'Verificando...' : tieneConexionGuardada ? `GitHub — @${githubUsuario?.login || '...'}` : 'Conectar GitHub'}
              </Button>
          )}
        </div>

        <div className="ep-toolbar-right">
          {modoActivo === 'sobre_codigo' && !conectadoGitHub && tieneModificacionesManual && (
            <Tag color="orange">Sin guardar</Tag>
          )}
          {modoActivo === 'sobre_codigo' && !conectadoGitHub && (
            <Dropdown menu={menuOpciones} trigger={['click']}>
              <Button icon={<SettingOutlined />} className="btn btn-secondary">Opciones</Button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ep-body">

        {/* Lista de pruebas */}
        <div className="ep-list-panel">
          <div className="ep-list-header">
            <div className="ep-list-header-top">
              <h4 className="ep-list-title">Pruebas aprobadas</h4>
              {algunaSeleccionada && <span className="ep-selected-count">{pruebasSeleccionadas.length} sel.</span>}
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
                  className={['ep-prueba-item', seleccionada ? 'ep-prueba-item--selected' : '', activa ? 'ep-prueba-item--active' : ''].join(' ')}
                  onClick={() => handleTogglePrueba(prueba)}
                >
                  <Checkbox
                    checked={seleccionada}
                    className="ep-prueba-checkbox"
                    onClick={e => e.stopPropagation()}
                    onChange={() => handleTogglePrueba(prueba)}
                  />
                  <div className="ep-prueba-icon">
                    {prueba.tipo_prueba?.nombre === 'unitaria' ? '🧪' : prueba.tipo_prueba?.nombre === 'sistema' ? '🖥️' : '⚙️'}
                  </div>
                  <div className="ep-prueba-content">
                    <div className="ep-prueba-name">{prueba.nombre}</div>
                    <div className="ep-prueba-meta">
                      <Tag size="small" color="blue">{prueba.tipo_prueba?.nombre}</Tag>
                      <span className="ep-prueba-code">{prueba.codigo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zona de editor — cambia según modo */}
        <div className="ep-editor-zone">
          {modoActivo === 'sobre_codigo' && conectadoGitHub ? (
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
              onRecargarArbol={() => cargarArbolArchivos(githubConfig.token, githubConfig.repositorio, githubConfig.rama)}
            />
          ) : modoActivo === 'sobre_codigo' ? (
            <>
              <div className="ep-manual-bar">
                <span className="ep-manual-bar-label"><CodeOutlined />Código bajo prueba</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  Pega el código Python que tus pruebas necesitan
                </span>
                {pruebaActiva && <Tag color="blue" style={{ marginLeft: 'auto' }}>{pruebaActiva.codigo}</Tag>}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  value={codigoManual}
                  onChange={(v) => setCodigoManual(v || '')}
                  onMount={(editor) => { editorRef.current = editor; }}
                  theme="vs-dark"
                  options={{ minimap: { enabled: true }, fontSize: 14, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: 'on' }}
                />
              </div>
            </>
          ) : (
            /* Modo prueba_sola: no hay editor, mostrar explicación */
            <div className="modo-sola-placeholder">
              <div className="modo-sola-placeholder__inner">
                <ExperimentOutlined className="modo-sola-placeholder__icon" />
                <h4 className="modo-sola-placeholder__title">Modo Prueba Sola</h4>
                <p className="modo-sola-placeholder__desc">
                  En este modo no necesitas código del proyecto. Las pruebas se ejecutan
                  de forma aislada y los imports del proyecto se simulan automáticamente.
                </p>
                <div className="modo-sola-placeholder__steps">
                  <div className="modo-sola-step">
                    <span className="modo-sola-step__num">①</span>
                    <span>Selecciona las pruebas de la lista</span>
                  </div>
                  <div className="modo-sola-step">
                    <span className="modo-sola-step__num">②</span>
                    <span>Haz clic en <strong>Prueba sola</strong></span>
                  </div>
                  <div className="modo-sola-step">
                    <span className="modo-sola-step__num">③</span>
                    <span>Lo esperado es que las pruebas <strong>fallen</strong> (red phase)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ConsolaResultados
            resultados={resultados}
            ejecutando={ejecutando}
            onLimpiar={limpiarResultados}
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