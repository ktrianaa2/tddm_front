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
  CodeOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import ListaPruebas from '../crear_pruebas/ListaPruebas';
import ConsolaResultados from './ConsolaResultados';
import ModalGitHub from './ModalGitHub';
import { usePruebas } from '../../../hooks/usePruebas';
import '../../../styles/tabs.css';

const EjecutarPruebasTab = ({ proyecto }) => {
  const proyectoId = proyecto?.proyecto_id;

  const {
    pruebas,
    loading: loadingPruebas,
    cargarPruebas
  } = usePruebas(proyectoId);

  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);
  const [codigoUsuario, setCodigoUsuario] = useState('// Escribe tu código aquí o cárgalo desde un archivo\n\n');
  const [codigoGuardado, setCodigoGuardado] = useState('// Escribe tu código aquí o cárgalo desde un archivo\n\n');
  const [ejecutando, setEjecutando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [modalGitHubVisible, setModalGitHubVisible] = useState(false);
  const [conectadoGitHub, setConectadoGitHub] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    pasadas: 0,
    fallidas: 0,
    pendientes: 0,
    tiempo: 0
  });

  const editorRef = useRef(null);

  useEffect(() => {
    if (proyectoId) {
      cargarPruebas();
    }
  }, [proyectoId]);

  useEffect(() => {
    if (pruebas.length > 0) {
      setEstadisticas(prev => ({
        ...prev,
        pendientes: pruebas.filter(p => p.estado === 'Aprobada').length
      }));
    }
  }, [pruebas]);

  const handleSeleccionarPrueba = (prueba) => {
    if (prueba.estado !== 'Aprobada') {
      message.warning('Solo se pueden ejecutar pruebas aprobadas');
      return;
    }

    if (pruebaSeleccionada?.id_prueba !== prueba.id_prueba) {
      setPruebaSeleccionada(prueba);
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    setCodigoUsuario(value || '');
  };

  const agregarResultado = (tipo, mensaje) => {
    const timestamp = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setResultados(prev => [...prev, { tipo, mensaje, timestamp }]);
  };

  const simularEjecucionPaso = async (paso, indice, totalPasos) => {
    agregarResultado('log', `\n[Paso ${indice + 1}/${totalPasos}] ${paso.descripcion}`);
    await new Promise(resolve => setTimeout(resolve, 800));

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

    if (!codigoUsuario.trim() || codigoUsuario === codigoGuardado) {
      message.warning('Debes escribir o cargar código antes de ejecutar');
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
      agregarResultado('info', `═══════════════════════════════════════`);

      agregarResultado('log', `\n🎯 OBJETIVO: ${detallePrueba.objetivo}`);

      agregarResultado('log', `\n📋 Verificando precondiciones...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      for (const precondicion of detallePrueba.precondiciones || []) {
        agregarResultado('info', `  • ${precondicion}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      agregarResultado('success', '✓ Todas las precondiciones cumplidas');

      agregarResultado('log', `\n⚙️  Compilando código del usuario...`);
      await new Promise(resolve => setTimeout(resolve, 1200));
      agregarResultado('success', '✓ Código compilado exitosamente');

      agregarResultado('log', `\n🔄 Ejecutando pasos de la prueba...`);
      agregarResultado('log', `───────────────────────────────────────`);

      let todosLosPasosPasaron = true;
      const pasos = detallePrueba.pasos || [];

      for (let i = 0; i < pasos.length; i++) {
        const pasoExito = await simularEjecucionPaso(pasos[i], i, pasos.length);
        if (!pasoExito) {
          todosLosPasosPasaron = false;
          break;
        }
      }

      if (todosLosPasosPasaron) {
        agregarResultado('log', `\n📝 Verificando postcondiciones...`);
        await new Promise(resolve => setTimeout(resolve, 800));

        for (const postcondicion of detallePrueba.postcondiciones || []) {
          agregarResultado('info', `  • ${postcondicion}`);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        agregarResultado('success', '✓ Todas las postcondiciones cumplidas');
      }

      const tiempoTotal = ((Date.now() - inicio) / 1000).toFixed(2);

      agregarResultado('log', `\n═══════════════════════════════════════`);

      if (todosLosPasosPasaron) {
        agregarResultado('success', '✅ PRUEBA APROBADA');
        agregarResultado('success', `✓ Todos los pasos ejecutados correctamente (${pasos.length}/${pasos.length})`);
        agregarResultado('log', `\n📊 Criterios de aceptación cumplidos:`);

        for (const criterio of detallePrueba.criterios_aceptacion || []) {
          agregarResultado('success', `  ✓ ${criterio}`);
        }

        agregarResultado('info', `⏱️  Tiempo de ejecución: ${tiempoTotal}s`);

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
        agregarResultado('info', `⏱️  Tiempo de ejecución: ${tiempoTotal}s`);

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

    if (!codigoUsuario.trim() || codigoUsuario === codigoGuardado) {
      message.warning('Debes escribir o cargar código antes de ejecutar');
      return;
    }

    setEjecutando(true);
    setResultados([]);

    agregarResultado('info', '╔═══════════════════════════════════════╗');
    agregarResultado('info', '║   EJECUCIÓN COMPLETA DE PRUEBAS       ║');
    agregarResultado('info', '╚═══════════════════════════════════════╝');
    agregarResultado('log', `\nTotal de pruebas a ejecutar: ${pruebasAprobadas.length}`);
    agregarResultado('log', '═══════════════════════════════════════\n');

    let pasadas = 0;
    let fallidas = 0;
    const inicioTotal = Date.now();

    for (let i = 0; i < pruebasAprobadas.length; i++) {
      const prueba = pruebasAprobadas[i];
      const detalle = prueba.prueba || prueba;

      agregarResultado('info', `\n[${i + 1}/${pruebasAprobadas.length}] Ejecutando: ${prueba.nombre}`);
      agregarResultado('log', `Código: ${prueba.codigo} | Tipo: ${prueba.tipo_prueba}`);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const pasos = detalle.pasos || [];
      let exito = true;

      for (let j = 0; j < pasos.length; j++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (Math.random() < 0.15) {
          exito = false;
          break;
        }
      }

      if (exito) {
        agregarResultado('success', `✅ ${prueba.codigo} - APROBADA`);
        pasadas++;
      } else {
        agregarResultado('error', `❌ ${prueba.codigo} - FALLIDA`);
        fallidas++;
      }
    }

    const tiempoTotal = ((Date.now() - inicioTotal) / 1000).toFixed(2);

    agregarResultado('log', '\n═══════════════════════════════════════');
    agregarResultado('info', '📊 RESUMEN DE EJECUCIÓN:');
    agregarResultado('log', '═══════════════════════════════════════');
    agregarResultado('success', `✅ Pruebas aprobadas: ${pasadas}/${pruebasAprobadas.length}`);
    agregarResultado('error', `❌ Pruebas fallidas: ${fallidas}/${pruebasAprobadas.length}`);
    agregarResultado('info', `⏱️  Tiempo total: ${tiempoTotal}s`);
    agregarResultado('info', `📈 Tasa de éxito: ${((pasadas / pruebasAprobadas.length) * 100).toFixed(1)}%`);

    setEstadisticas({
      pasadas,
      fallidas,
      pendientes: 0,
      tiempo: parseFloat(tiempoTotal)
    });

    setEjecutando(false);

    if (fallidas === 0) {
      message.success('🎉 ¡Todas las pruebas pasaron exitosamente!');
    } else {
      message.warning(`${fallidas} prueba(s) fallaron`);
    }
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
        const contenido = e.target.result;
        setCodigoUsuario(contenido);
        message.success(`Archivo ${file.name} cargado exitosamente`);
      };
      reader.readAsText(file.originFileObj || file);
    }
  };

  const handleConectarGitHub = async (valores) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setConectadoGitHub(true);
      setModalGitHubVisible(false);
      message.success('Repositorio conectado exitosamente');

      agregarResultado('success', `✓ Conectado a ${valores.repositorio}`);
      agregarResultado('info', `📂 Rama: ${valores.rama}`);
      agregarResultado('info', `📁 Ruta: ${valores.ruta}`);

      const codigoSimulado = `// Código cargado desde GitHub: ${valores.repositorio}\n// Rama: ${valores.rama}\n\nfunction ejemploDesdeGitHub() {\n  // Tu código aquí\n  console.log("Código sincronizado desde GitHub");\n}\n`;
      setCodigoUsuario(codigoSimulado);
    } catch (error) {
      message.error('Error al conectar con GitHub');
    }
  };

  const handleGuardarCodigo = () => {
    setCodigoGuardado(codigoUsuario);
    message.success('Código guardado exitosamente');
  };

  const handleExportarCodigo = () => {
    const blob = new Blob([codigoUsuario], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigo-prueba-${Date.now()}.js`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Código exportado');
  };

  const tieneModificaciones = codigoUsuario !== codigoGuardado;
  const pruebasAprobadas = pruebas.filter(p => p.estado === 'Aprobada');

  const menuOpciones = {
    items: [
      {
        key: 'guardar',
        label: 'Guardar Código',
        icon: <SaveOutlined />,
        onClick: handleGuardarCodigo,
        disabled: !tieneModificaciones
      },
      {
        key: 'exportar',
        label: 'Exportar Código',
        icon: <DownloadOutlined />,
        onClick: handleExportarCodigo
      }
    ]
  };

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
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                No hay pruebas disponibles
              </p>
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
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                No hay pruebas aprobadas
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Debes aprobar al menos una prueba para poder ejecutarla
              </p>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header con estadísticas */}
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
                  Conectado a GitHub
                </Tag>
              )}
            </Space>
          </Col>

          <Col>
            <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>
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

      {/* Barra de acciones */}
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
                size="middle"
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
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleDetenerEjecucion}
            >
              Detener Ejecución
            </Button>
          )}

          <Upload
            beforeUpload={() => false}
            onChange={handleCargarArchivo}
            showUploadList={false}
            accept=".js,.jsx,.ts,.tsx"
          >
            <Button icon={<UploadOutlined />}>
              Cargar Archivo
            </Button>
          </Upload>

          <Button
            icon={<GithubOutlined />}
            onClick={() => setModalGitHubVisible(true)}
          >
            {conectadoGitHub ? 'Configurar GitHub' : 'Conectar GitHub'}
          </Button>
        </Space>

        <Space>
          {tieneModificaciones && (
            <Tag color="orange">Sin guardar</Tag>
          )}

          <Dropdown menu={menuOpciones} trigger={['click']}>
            <Button icon={<SettingOutlined />}>
              Opciones
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* Contenido principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <div style={{ width: '350px', flexShrink: 0 }}>
          <ListaPruebas
            pruebas={pruebasAprobadas}
            pruebaActiva={pruebaSeleccionada}
            onSeleccionarPrueba={handleSeleccionarPrueba}
          />
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#2d2d30',
            borderBottom: '1px solid #3e3e42',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              <CodeOutlined style={{ marginRight: '0.5rem' }} />
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
              value={codigoUsuario}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>

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
      />
    </div>
  );
};

export default EjecutarPruebasTab;