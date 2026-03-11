import React, { useState, useEffect } from 'react';
import VistaGenerarPruebas from './VistaGenerarPruebas';
import ListaPruebas from './ListaPruebas';
import EditorPrueba from './EditorPrueba';
import ModalAdvertencia from '../../modales/ModalAdvertencia';
import ProgresoGeneracion from './ProgresoGeneracion';
import { useRequisitos } from '../../../hooks/useRequisitos';
import { useCasosUso } from '../../../hooks/useCasosdeUso';
import { useHistoriasUsuario } from '../../../hooks/useHistoriasdeUsuario';
import { usePruebas } from '../../../hooks/usePruebas';
import { useEsquemaBD } from '../../../hooks/useEsquemaBD';
import { Spin, message, Button, Empty, Card } from 'antd';
import { BugOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';
import '../../../styles/pruebas.css';

const PruebasTab = ({ proyecto, loading: externalLoading = false }) => {
  const proyectoId = proyecto?.proyecto_id;

  // Estados
  const [vistaActual, setVistaActual] = useState('inicial');
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [generandoPruebas, setGenerandoPruebas] = useState(false);
  const [tiposPendientes, setTiposPendientes] = useState(['unitaria']);

  // Hooks para especificaciones
  const {
    requisitos, loading: loadingRequisitos,
    cargarRequisitos, recargarTodo: recargarRequisitos,
  } = useRequisitos(proyectoId);

  const {
    casosUso, loading: loadingCasosUso,
    cargarCasosUso, recargarTodo: recargarCasosUso,
  } = useCasosUso(proyectoId);

  const {
    historiasUsuario, loading: loadingHistorias,
    cargarHistoriasUsuario, recargarTodo: recargarHistorias,
  } = useHistoriasUsuario(proyectoId);

  // Hook para pruebas
  const {
    loading: loadingPruebas, pruebas, contadores,
    estadosProgreso, mensajesPorTipo, pruebasPorTipo, progresoInfo,
    resetProgreso, generarPrueba, generarPruebasMultiple,
    cargarPruebas, recargarPruebas, eliminarPrueba, guardarPrueba,
    aprobarPrueba, setPruebas,
  } = usePruebas(proyectoId);

  // Hook para esquema BD
  const {
    loading: loadingEsquemaBD, tieneEsquema, cargarEsquemas,
  } = useEsquemaBD(proyectoId);

  const loadingEspecificaciones = loadingRequisitos || loadingCasosUso || loadingHistorias;
  const loading = externalLoading || loadingEspecificaciones || loadingPruebas || loadingEsquemaBD;

  const todasEspecificaciones = [
    ...requisitos.map(req => ({ ...req, tipo_especificacion: 'requisito' })),
    ...casosUso.map(cu => ({ ...cu, tipo_especificacion: 'caso_uso' })),
    ...historiasUsuario.map(hu => ({ ...hu, tipo_especificacion: 'historia_usuario' })),
  ];

  // CORRECCIÓN: solo pruebas no aprobadas para mostrar en la lista del editor
  const pruebasPendientes = pruebas.filter(
    p => p.estado?.toLowerCase() !== 'aprobada'
  );

  const tiposConPruebas = () => {
    const tipos = new Set();
    pruebas.forEach(p => {
      const tipo = (p.tipo_prueba || p.tipo || '').toLowerCase().trim();
      if (tipo) tipos.add(tipo);
    });
    return Array.from(tipos);
  };

  useEffect(() => {
    if (proyectoId) {
      cargarRequisitos();
      cargarCasosUso();
      cargarHistoriasUsuario();
      cargarPruebas();
      cargarEsquemas();
    }
  }, [proyectoId]);

  useEffect(() => {
    if (!loading && !generandoPruebas) {
      if (!tieneEsquema) setVistaActual('sin-esquema');
      else if (pruebas.length > 0) setVistaActual('gestion');
      else setVistaActual('inicial');
    }
  }, [loading, generandoPruebas, pruebas.length, tieneEsquema]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRecargarTodo = () => {
    recargarRequisitos(); recargarCasosUso(); recargarHistorias();
    recargarPruebas(); cargarEsquemas();
  };

  const handleIniciarGeneracionPruebas = (tipos) => {
    if (todasEspecificaciones.length === 0) {
      message.warning('No hay especificaciones disponibles para generar pruebas');
      return;
    }
    setTiposPendientes(tipos);
    setModalVisible(true);
  };

  const handleIrAGenerarMas = () => setVistaActual('generar-mas');

  const handleConfirmarGeneracion = async () => {
    setModalVisible(false);
    setGenerandoPruebas(true);
    resetProgreso();
    try {
      let resultado;
      if (tiposPendientes.length === 1) {
        resultado = await generarPrueba(tiposPendientes[0]);
      } else {
        resultado = await generarPruebasMultiple(tiposPendientes, proyecto?.nombre || '');
      }
      if (resultado && resultado.total_pruebas > 0) {
        const total = resultado.total_pruebas;
        message.success({
          content: `🎉 ${total} prueba${total > 1 ? 's' : ''} generada${total > 1 ? 's' : ''} exitosamente con IA`,
          duration: 5,
        });
      } else {
        message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones válidas.');
      }
    } catch (error) {
      console.error('Error en la generación de pruebas:', error);
      message.error({ content: 'Error al generar las pruebas. Intenta nuevamente.', duration: 4 });
    } finally {
      setGenerandoPruebas(false);
    }
  };

  const handleSeleccionarPrueba = (prueba) => setPruebaSeleccionada(prueba);

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleEliminarPrueba = async (prueba) => {
    try {
      await eliminarPrueba(prueba.id_prueba);
      if (pruebaSeleccionada?.id_prueba === prueba.id_prueba) {
        setPruebaSeleccionada(null);
      }
      message.success('Prueba eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la prueba:', error);
      message.error('Error al eliminar la prueba');
    }
  };

  // ── Aprobar ─────────────────────────────────────────────────────────────────
  // CORRECCIÓN: usar aprobarPrueba (endpoint dedicado /aprobar/) en vez de
  // guardarPrueba. Esto garantiza que SOLO cambia el estado, sin tocar
  // descripción ni ningún otro campo. Al aprobar, se deselecciona la prueba
  // porque sale de la lista de pendientes.
  const handleAprobarPrueba = async ({ id_prueba, id }) => {
    try {
      await aprobarPrueba({ id_prueba, id });
      // Deseleccionar: la prueba aprobada ya no aparece en la lista de pendientes
      setPruebaSeleccionada(null);
      message.success('Prueba aprobada exitosamente');
    } catch (error) {
      console.error('Error al aprobar la prueba:', error);
      message.error('Error al aprobar la prueba');
    }
  };

  // ── Guardar cambios de código ───────────────────────────────────────────────
  const handleGuardarCambios = async (pruebaActualizada) => {
    try {
      await guardarPrueba(pruebaActualizada);
      // Sincronizar la referencia local para que Descartar funcione
      // correctamente si el usuario sigue editando.
      setPruebaSeleccionada(prev => ({
        ...prev,
        prueba: {
          ...(prev?.prueba || {}),
          ...pruebaActualizada.prueba,
        },
      }));
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      throw error;
    }
  };

  const handleDescartarCambios = () => {
    // El editor ya restaura el código internamente.
  };

  const handleRegenerarPrueba = async (prueba) => {
    try {
      setGenerandoPruebas(true);
      resetProgreso();
      message.loading('Regenerando prueba con IA...', 0);
      const tipoPrueba = (prueba.tipo_prueba || prueba.tipo || 'unitaria').toLowerCase();
      const resultado = await generarPrueba(tipoPrueba);
      message.destroy();
      if (resultado && resultado.total_pruebas > 0) {
        await recargarPruebas();
        message.success('Pruebas regeneradas exitosamente');
        setPruebaSeleccionada(null);
      } else {
        message.warning('No se pudo regenerar la prueba');
      }
    } catch (error) {
      message.destroy();
      message.error('Error al regenerar la prueba');
      console.error(error);
    } finally {
      setGenerandoPruebas(false);
    }
  };

  // ── RENDERIZADO ─────────────────────────────────────────────────────────────

  if (loading && todasEspecificaciones.length === 0 && pruebas.length === 0) {
    return (
      <div className="tab-main-content">
        <div className="tab-loading-state">
          <Spin size="large" />
          <div className="tab-loading-text">Cargando datos del proyecto...</div>
        </div>
      </div>
    );
  }

  // Vista de progreso mientras se generan
  if (generandoPruebas) {
    return (
      <div className="tab-main-content pruebas-progreso-wrapper">
        <ProgresoGeneracion
          tipos={tiposPendientes}
          estadosPorTipo={estadosProgreso}
          mensajesPorTipo={mensajesPorTipo}
          pruebasPorTipo={pruebasPorTipo}
          proyectoNombre={progresoInfo?.proyectoNombre || proyecto?.nombre || ''}
          totalGeneradas={progresoInfo?.totalGeneradas ?? 0}
          mensajeGlobal={progresoInfo?.mensajeGlobal || ''}
        />
      </div>
    );
  }

  // Vista sin esquema BD
  if (vistaActual === 'sin-esquema') {
    return (
      <>
        <div className="tab-header">
          <div className="tab-header-content">
            <h3 className="tab-title">
              <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
              Gestión de Pruebas
            </h3>
            <p className="tab-subtitle">Crea y gestiona los casos de prueba de tu proyecto</p>
          </div>
          <div className="tab-header-actions">
            <Button icon={<ReloadOutlined />} onClick={handleRecargarTodo} loading={loading} className="btn btn-secondary">
              Actualizar
            </Button>
          </div>
        </div>

        <div className="tab-main-content">
          <Card className="sin-esquema-card">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p className="panel-vacio-titulo">Esquema de Base de Datos Requerido</p>
                  <p className="panel-vacio-subtitulo">
                    Para generar pruebas automáticas, primero debes crear o cargar
                    un esquema de base de datos en la pestaña <strong>Base de Datos</strong>.
                  </p>
                </div>
              }
            />
          </Card>
        </div>
      </>
    );
  }

  // Vista generar más
  if (vistaActual === 'generar-mas') {
    const existentes = tiposConPruebas();
    return (
      <>
        <VistaGenerarPruebas
          loading={loading}
          onRecargar={handleRecargarTodo}
          onIniciarPruebas={handleIniciarGeneracionPruebas}
          tiposExcluidos={existentes}
          onVolver={() => setVistaActual('gestion')}
        />
        <ModalAdvertencia
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onConfirm={handleConfirmarGeneracion}
          loading={false}
          especificacionesCount={todasEspecificaciones.length}
          tiposSeleccionados={tiposPendientes}
        />
      </>
    );
  }

  // Vista inicial — con esquema pero sin pruebas
  if (vistaActual === 'inicial') {
    return (
      <>
        <VistaGenerarPruebas
          loading={loading}
          onRecargar={handleRecargarTodo}
          onIniciarPruebas={handleIniciarGeneracionPruebas}
        />
        <ModalAdvertencia
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onConfirm={handleConfirmarGeneracion}
          loading={false}
          especificacionesCount={todasEspecificaciones.length}
          tiposSeleccionados={tiposPendientes}
        />
      </>
    );
  }

  // Vista de gestión — lista + editor
  if (vistaActual === 'gestion') {
    return (
      <div className="tab-main-content">
        <div className="tab-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tab-header-content">
            <h3 className="tab-title">
              <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
              Gestión de Pruebas
            </h3>
            <p className="tab-subtitle">
              {/* CORRECCIÓN: mostrar total y pendientes por separado */}
              {contadores.total} prueba{contadores.total !== 1 ? 's' : ''} en total
              {pruebasPendientes.length !== contadores.total && (
                <span className="pruebas-tipos-badge">
                  · {pruebasPendientes.length} pendiente{pruebasPendientes.length !== 1 ? 's' : ''}
                </span>
              )}
              {tiposConPruebas().length > 0 && (
                <span className="pruebas-tipos-badge">
                  ({tiposConPruebas().join(', ')})
                </span>
              )}
            </p>
          </div>
          <div className="tab-header-actions">
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={handleIrAGenerarMas}
              className="btn btn-primary"
            >
              Generar más pruebas
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRecargarTodo}
              loading={loading}
              className="btn btn-secondary"
            >
              Actualizar
            </Button>
          </div>
        </div>

        <div className="pruebas-grid-gestion">
          {/* CORRECCIÓN: pasar solo pruebas pendientes a la lista del editor */}
          <ListaPruebas
            pruebas={pruebasPendientes}
            pruebaActiva={pruebaSeleccionada}
            onSeleccionarPrueba={handleSeleccionarPrueba}
          />

          {pruebaSeleccionada ? (
            <EditorPrueba
              prueba={pruebaSeleccionada}
              onEliminar={handleEliminarPrueba}
              onAprobar={handleAprobarPrueba}
              onGuardarCambios={handleGuardarCambios}
              onDescartarCambios={handleDescartarCambios}
              onRegenerar={handleRegenerarPrueba}
            />
          ) : (
            <div className="panel-contenido">
              <Card className="panel-vacio-card">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p className="panel-vacio-titulo">Selecciona una prueba</p>
                      <p className="panel-vacio-subtitulo">
                        {pruebasPendientes.length === 0
                          ? '¡Todas las pruebas han sido aprobadas!'
                          : 'Elige una prueba de la lista para ver su contenido'
                        }
                      </p>
                    </div>
                  }
                />
              </Card>
            </div>
          )}
        </div>

        <ModalAdvertencia
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onConfirm={handleConfirmarGeneracion}
          loading={false}
          especificacionesCount={todasEspecificaciones.length}
          tiposSeleccionados={tiposPendientes}
        />
      </div>
    );
  }

  return null;
};

export default PruebasTab;