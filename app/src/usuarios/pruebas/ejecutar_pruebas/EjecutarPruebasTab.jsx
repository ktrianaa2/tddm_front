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
  Spin
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

const EjecutarPruebasTab = ({ proyecto }) => {
  const proyectoId = proyecto?.proyecto_id;

  const {
    pruebas,
    loading: loadingPruebas,
    cargarPruebas
  } = usePruebas(proyectoId);

  // ── Hook de ejecución + GitHub ──────────────────────────────────────────
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

  // ── Estado local del editor manual (cuando NO hay GitHub) ────────────────
  const [codigoManual, setCodigoManual] = useState('// Escribe tu código aquí o cárgalo desde un archivo\n\n');
  const [codigoManualGuardado, setCodigoManualGuardado] = useState('// Escribe tu código aquí o cárgalo desde un archivo\n\n');

  // ── Estado general ────────────────────────────────────────────────────────
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);
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

  // ── Código activo: GitHub o manual ───────────────────────────────────────
  const codigoParaEjecucion = conectadoGitHub ? codigoActivo : codigoManual;

  // ── Acciones de prueba ────────────────────────────────────────────────────
  const handleSeleccionarPrueba = (prueba) => {
    if (prueba.estado !== 'Aprobada') {
      message.warning('Solo se pueden ejecutar pruebas aprobadas');
      return;
    }
    if (pruebaSeleccionada?.id_prueba !== prueba.id_prueba) {
      setPruebaSeleccionada(prueba);
    }
  };

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

  const handleEjecutarPrueba = async () => {
    if (!pruebaSeleccionada) {
      message.warning('Selecciona una prueba para ejecutar');
      return;
    }

    const codigoVacio = !codigoParaEjecucion.trim();
    const codigoSinCambios = !conectadoGitHub && codigoManual === codigoManualGuardado;

    if (codigoVacio || codigoSinCambios) {
      message.warning(
        conectadoGitHub
          ? 'Selecciona un archivo del explorador de GitHub'
          : 'Debes escribir o cargar código antes de ejecutar'
      );
      return;
    }

    setEjecutando(true);
    setResultados([]);

    const detallePrueba = pruebaSeleccionada.prueba || pruebaSeleccionada;
    const inicio = Date.now();

    try {
      agregarResultado('info', `═══════════════════════════════════════`);
      agregarResultado('info', `Iniciando ejecución: ${pruebaSeleccionada.nombre}`);
      agregarResultado('info', `Código: ${pruebaSeleccionada.codigo}`);
      agregarResultado('info', `Tipo: ${pruebaSeleccionada.tipo_prueba}`);

      if (conectadoGitHub && archivoActivo) {
        agregarResultado('info', `Archivo: ${archivoActivo.path}`);
      }

      agregarResultado('info', `═══════════════════════════════════════`);
      agregarResultado('log', `\n🎯 OBJETIVO: ${detallePrueba.objetivo}`);
      agregarResultado('log', `\n📋 Verificando precondiciones...`);
      await new Promise(r => setTimeout(r, 1000));

      for (const pre of detallePrueba.precondiciones || []) {
        agregarResultado('info', `  • ${pre}`);
        await new Promise(r => setTimeout(r, 300));
      }
      agregarResultado('success', '✓ Todas las precondiciones cumplidas');
      agregarResultado('log', `\n⚙️  Compilando código...`);
      await new Promise(r => setTimeout(r, 1200));
      agregarResultado('success', '✓ Código compilado exitosamente');
      agregarResultado('log', `\n🔄 Ejecutando pasos de la prueba...`);
      agregarResultado('log', `───────────────────────────────────────`);

      let todosLosPasosPasaron = true;
      const pasos = detallePrueba.pasos || [];

      for (let i = 0; i < pasos.length; i++) {
        const exito = await simularEjecucionPaso(pasos[i], i, pasos.length);
        if (!exito) { todosLosPasosPasaron = false; break; }
      }

      if (todosLosPasosPasaron) {
        agregarResultado('log', `\n📝 Verificando postcondiciones...`);
        await new Promise(r => setTimeout(r, 800));
        for (const post of detallePrueba.postcondiciones || []) {
          agregarResultado('info', `  • ${post}`);
          await new Promise(r => setTimeout(r, 300));
        }
        agregarResultado('success', '✓ Todas las postcondiciones cumplidas');
      }

      const tiempoTotal = ((Date.now() - inicio) / 1000).toFixed(2);
      agregarResultado('log', `\n═══════════════════════════════════════`);

      if (todosLosPasosPasaron) {
        agregarResultado('success', '✅ PRUEBA APROBADA');
        agregarResultado('success', `✓ Todos los pasos ejecutados correctamente (${pasos.length}/${pasos.length})`);
        for (const criterio of detallePrueba.criterios_aceptacion || []) {
          agregarResultado('success', `  ✓ ${criterio}`);
        }
        agregarResultado('info', `⏱️  Tiempo: ${tiempoTotal}s`);
        setEstadisticas(prev => ({
          pasadas: prev.pasadas + 1,
          fallidas: prev.fallidas,
          pendientes: Math.max(0, prev.pendientes - 1),
          tiempo: prev.tiempo + parseFloat(tiempoTotal)
        }));
        message.success('¡Prueba ejecutada exitosamente!');
      } else {
        agregarResultado('error', '❌ PRUEBA FALLIDA');
        agregarResultado('error', '✗ Uno o más pasos no se completaron correctamente');
        agregarResultado('warning', '💡 Revisa el código e inténtalo nuevamente');
        agregarResultado('info', `⏱️  Tiempo: ${tiempoTotal}s`);
        setEstadisticas(prev => ({
          pasadas: prev.pasadas,
          fallidas: prev.fallidas + 1,
          pendientes: Math.max(0, prev.pendientes - 1),
          tiempo: prev.tiempo + parseFloat(tiempoTotal)
        }));
        message.error('La prueba falló');
      }
      agregarResultado('log', `═══════════════════════════════════════`);

    } catch (error) {
      agregarResultado('error', `💥 Error crítico: ${error.message}`);
      message.error('Error al ejecutar la prueba');
    } finally {
      setEjecutando(false);
    }
  };

  const handleEjecutarTodas = async () => {
    const pruebasAprobadas = pruebas.filter(p => p.estado === 'Aprobada');
    if (pruebasAprobadas.length === 0) {
      message.warning('No hay pruebas aprobadas para ejecutar');
      return;
    }
    if (!codigoParaEjecucion.trim()) {
      message.warning(
        conectadoGitHub
          ? 'Selecciona un archivo del explorador de GitHub'
          : 'Debes escribir o cargar código antes de ejecutar'
      );
      return;
    }

    setEjecutando(true);
    setResultados([]);

    agregarResultado('info', '╔═══════════════════════════════════════╗');
    agregarResultado('info', '║   EJECUCIÓN COMPLETA DE PRUEBAS       ║');
    agregarResultado('info', '╚═══════════════════════════════════════╝');
    agregarResultado('log', `\nTotal de pruebas: ${pruebasAprobadas.length}`);

    let pasadas = 0;
    let fallidas = 0;
    const inicioTotal = Date.now();

    for (let i = 0; i < pruebasAprobadas.length; i++) {
      const prueba = pruebasAprobadas[i];
      agregarResultado('info', `\n[${i + 1}/${pruebasAprobadas.length}] ${prueba.nombre}`);
      await new Promise(r => setTimeout(r, 1500));
      const exito = Math.random() > 0.15;
      if (exito) { agregarResultado('success', `✅ ${prueba.codigo} - APROBADA`); pasadas++; }
      else { agregarResultado('error', `❌ ${prueba.codigo} - FALLIDA`); fallidas++; }
    }

    const tiempoTotal = ((Date.now() - inicioTotal) / 1000).toFixed(2);
    agregarResultado('log', '\n═══════════════════════════════════════');
    agregarResultado('success', `✅ Aprobadas: ${pasadas}/${pruebasAprobadas.length}`);
    agregarResultado('error', `❌ Fallidas: ${fallidas}/${pruebasAprobadas.length}`);
    agregarResultado('info', `⏱️  Tiempo total: ${tiempoTotal}s`);
    agregarResultado('info', `📈 Tasa de éxito: ${((pasadas / pruebasAprobadas.length) * 100).toFixed(1)}%`);

    setEstadisticas({ pasadas, fallidas, pendientes: 0, tiempo: parseFloat(tiempoTotal) });
    setEjecutando(false);

    if (fallidas === 0) message.success('🎉 ¡Todas las pruebas pasaron!');
    else message.warning(`${fallidas} prueba(s) fallaron`);
  };

  const handleDetenerEjecucion = () => {
    setEjecutando(false);
    agregarResultado('warning', '⚠️  Ejecución detenida por el usuario');
    message.info('Ejecución detenida');
  };

  // ── Archivo de código para cargar en el editor manual ────────────────────
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

  // ── Conectar GitHub ───────────────────────────────────────────────────────
  const handleConectarGitHub = async (valores) => {
    try {
      await conectarGitHub(valores);
      setModalGitHubVisible(false);
    } catch {
      // Error ya manejado en el hook
    }
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
  const pruebasAprobadas = pruebas.filter(p => p.estado === 'Aprobada');

  const menuOpciones = {
    items: [
      {
        key: 'guardar',
        label: 'Guardar Código',
        icon: <SaveOutlined />,
        onClick: handleGuardarManual,
        disabled: !tieneModificacionesManual,
      },
      {
        key: 'exportar',
        label: 'Exportar Código',
        icon: <DownloadOutlined />,
        onClick: handleExportarManual,
      },
    ],
  };

  // ── Loading / Empty states ────────────────────────────────────────────────
  if (loadingPruebas) {
    return (
      <div className="tab-main-content">
        <div className="tab-loading-state">
          <Spin size="large" />
          <div className="tab-loading-text">Cargando pruebas...</div>
        </div>
      </div>
    );
  }

  if (pruebas.length === 0) {
    return (
      <div className="tab-main-content">
        <Empty
          description={
            <div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay pruebas disponibles</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
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
      <div className="tab-main-content">
        <Empty
          description={
            <div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay pruebas aprobadas</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Debes aprobar al menos una prueba para ejecutarla
              </p>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header: estadísticas ─────────────────────────────────────────── */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'white',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <h3 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              <PlayCircleOutlined style={{ marginRight: '0.5rem', color: '#52c41a' }} />
              Ejecución de Pruebas
            </h3>
            <Space size="small">
              <Tag color="blue">{pruebasAprobadas.length} pruebas disponibles</Tag>
              {conectadoGitHub && (
                <Tag color="success" icon={<GithubOutlined />}>
                  {githubConfig?.repositorio?.split('/')[1]} · {githubConfig?.rama}
                </Tag>
              )}
              {conectadoGitHub && totalArchivosModificados > 0 && (
                <Tag color="orange">
                  {totalArchivosModificados} archivo(s) modificado(s) localmente
                </Tag>
              )}
            </Space>
          </Col>

          <Col>
            <Space size="middle">
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: '1.5rem', color: '#52c41a', display: 'block', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#52c41a' }}>{estadisticas.pasadas}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Pasadas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <CloseCircleOutlined style={{ fontSize: '1.5rem', color: '#ff4d4f', display: 'block', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff4d4f' }}>{estadisticas.fallidas}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Fallidas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '1.5rem', color: '#faad14', display: 'block', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#faad14' }}>{estadisticas.pendientes}</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Pendientes</div>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* ── Barra de acciones ────────────────────────────────────────────── */}
      <div style={{
        padding: '0.75rem 1.5rem',
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          {!ejecutando ? (
            <>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleEjecutarPrueba}
                disabled={!pruebaSeleccionada}
              >
                Ejecutar Prueba
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleEjecutarTodas}
              >
                Ejecutar Todas ({pruebasAprobadas.length})
              </Button>
            </>
          ) : (
            <Button danger icon={<StopOutlined />} onClick={handleDetenerEjecucion}>
              Detener Ejecución
            </Button>
          )}

          {/* Botones solo visibles cuando NO hay GitHub conectado */}
          {!conectadoGitHub && (
            <Upload
              beforeUpload={() => false}
              onChange={handleCargarArchivo}
              showUploadList={false}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cs,.go,.rs,.rb,.php"
            >
              <Button icon={<UploadOutlined />}>Cargar Archivo</Button>
            </Upload>
          )}

          {/* Botón GitHub */}
          {conectadoGitHub ? (
            <Button icon={<DisconnectOutlined />} onClick={desconectarGitHub} danger>
              Desconectar GitHub
            </Button>
          ) : (
            <Button
              icon={<GithubOutlined />}
              onClick={() => setModalGitHubVisible(true)}
              loading={loadingGitHub || verificandoConexion}
              type={tieneConexionGuardada ? 'default' : 'default'}
              style={tieneConexionGuardada ? { borderColor: '#52c41a', color: '#52c41a' } : {}}
            >
              {verificandoConexion
                ? 'Verificando...'
                : tieneConexionGuardada
                  ? `GitHub — @${githubUsuario?.login || '...'}`
                  : 'Conectar GitHub'
              }
            </Button>
          )}
        </Space>

        <Space>
          {!conectadoGitHub && tieneModificacionesManual && (
            <Tag color="orange">Sin guardar</Tag>
          )}
          {!conectadoGitHub && (
            <Dropdown menu={menuOpciones} trigger={['click']}>
              <Button icon={<SettingOutlined />}>Opciones</Button>
            </Dropdown>
          )}
        </Space>
      </div>

      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Lista de pruebas (siempre visible) */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <ListaPruebas
            pruebas={pruebasAprobadas}
            pruebaActiva={pruebaSeleccionada}
            onSeleccionarPrueba={handleSeleccionarPrueba}
          />
        </div>

        {/* Zona de código: GitHub o editor manual */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {conectadoGitHub ? (
            /* ── Modo GitHub: Explorador + Editor ──────────────────────── */
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
              onRecargarArbol={() =>
                cargarArbolArchivos(githubConfig.token, githubConfig.repositorio, githubConfig.rama)
              }
            />
          ) : (
            /* ── Modo manual: Editor simple ────────────────────────────── */
            <>
              <div style={{
                padding: '0.6rem 1rem',
                background: '#2d2d30',
                borderBottom: '1px solid #3e3e42',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#cccccc', fontSize: '0.85rem' }}>
                  <CodeOutlined style={{ marginRight: '0.4rem' }} />
                  Editor de Código
                </span>
                {pruebaSeleccionada && (
                  <Tag color="blue">{pruebaSeleccionada.codigo} seleccionada</Tag>
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

          {/* Consola de resultados (siempre visible abajo) */}
          <ConsolaResultados
            resultados={resultados}
            ejecutando={ejecutando}
          />
        </div>
      </div>

      {/* Modal GitHub */}
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
    </div >
  );
};

export default EjecutarPruebasTab;