import React, { useState, useEffect, useRef } from 'react';
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
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

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
    requisitos,
    loading: loadingRequisitos,
    cargarRequisitos,
    recargarTodo: recargarRequisitos,
  } = useRequisitos(proyectoId);

  const {
    casosUso,
    loading: loadingCasosUso,
    cargarCasosUso,
    recargarTodo: recargarCasosUso,
  } = useCasosUso(proyectoId);

  const {
    historiasUsuario,
    loading: loadingHistorias,
    cargarHistoriasUsuario,
    recargarTodo: recargarHistorias,
  } = useHistoriasUsuario(proyectoId);

  // Hook para pruebas
  const {
    loading: loadingPruebas,
    pruebas,
    contadores,
    estadosProgreso,
    progresoInfo,
    resetProgreso,
    generarPrueba,
    generarPruebasMultiple,
    cargarPruebas,
    recargarPruebas,
    eliminarPrueba,
    guardarPrueba,
  } = usePruebas(proyectoId);

  // Hook para esquema BD
  const {
    loading: loadingEsquemaBD,
    tieneEsquema,
    cargarEsquemas,
  } = useEsquemaBD(proyectoId);

  const loadingEspecificaciones = loadingRequisitos || loadingCasosUso || loadingHistorias;
  const loading = externalLoading || loadingEspecificaciones || loadingPruebas || loadingEsquemaBD;

  const todasEspecificaciones = [
    ...requisitos.map(req => ({ ...req, tipo_especificacion: 'requisito' })),
    ...casosUso.map(cu => ({ ...cu, tipo_especificacion: 'caso_uso' })),
    ...historiasUsuario.map(hu => ({ ...hu, tipo_especificacion: 'historia_usuario' })),
  ];

  // Cargar datos al montar
  useEffect(() => {
    if (proyectoId) {
      cargarRequisitos();
      cargarCasosUso();
      cargarHistoriasUsuario();
      cargarPruebas();
      cargarEsquemas();
    }
  }, [proyectoId]);

  // Determinar vista basada en estado
  useEffect(() => {
    if (!loading && !generandoPruebas) {
      if (!tieneEsquema) {
        setVistaActual('sin-esquema');
      } else if (pruebas.length > 0) {
        setVistaActual('gestion');
      } else {
        setVistaActual('inicial');
      }
    }
  }, [loading, generandoPruebas, pruebas.length, tieneEsquema]);

  // Handlers
  const handleRecargarTodo = () => {
    recargarRequisitos();
    recargarCasosUso();
    recargarHistorias();
    recargarPruebas();
    cargarEsquemas();
  };

  const handleIniciarGeneracionPruebas = (tipos) => {
    if (todasEspecificaciones.length === 0) {
      message.warning('No hay especificaciones disponibles para generar pruebas');
      return;
    }
    setTiposPendientes(tipos);
    setModalVisible(true);
  };

  const handleConfirmarGeneracion = async () => {
    setModalVisible(false);
    setGenerandoPruebas(true);
    resetProgreso(); // ← limpiar estados anteriores

    try {
      let resultado;

      if (tiposPendientes.length === 1) {
        resultado = await generarPrueba(tiposPendientes[0]);
      } else {
        resultado = await generarPruebasMultiple(tiposPendientes, proyecto?.nombre || '');
      }

      if (resultado && (resultado.total_pruebas > 0)) {
        await recargarPruebas();

        const totalMsg = resultado.total_pruebas;
        message.success({
          content: `🎉 ${totalMsg} prueba${totalMsg > 1 ? 's' : ''} generada${totalMsg > 1 ? 's' : ''} exitosamente con IA`,
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

  const handleEliminarPrueba = async (prueba) => {
    try {
      await eliminarPrueba(prueba.id_prueba);
      if (pruebaSeleccionada?.id_prueba === prueba.id_prueba) {
        setPruebaSeleccionada(null);
      }
    } catch (error) {
      console.error('Error al eliminar la prueba:', error);
    }
  };

  const handleAprobarPrueba = async (prueba) => {
    try {
      const pruebaAprobada = { ...prueba, estado: 'Aprobada' };
      setPruebaSeleccionada(pruebaAprobada);
      await guardarPrueba(pruebaAprobada);
      message.success('Prueba aprobada exitosamente');
    } catch (error) {
      console.error('Error al aprobar la prueba:', error);
      setPruebaSeleccionada(prueba);
    }
  };

  const handleGuardarCambios = async (pruebaActualizada) => {
    try {
      await guardarPrueba(pruebaActualizada);
      setPruebaSeleccionada(pruebaActualizada);
      message.success('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
    }
  };

  const handleDescartarCambios = () => message.info('Cambios descartados');

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

  // === RENDERIZADO ===

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

  if (generandoPruebas) {
    return (
      <div className="tab-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <ProgresoGeneracion
          tipos={tiposPendientes}
          estadosPorTipo={estadosProgreso}
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

        <div className="tab-main-content">
          <Card style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Esquema de Base de Datos Requerido
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: 'var(--space-xl)',
          height: 'calc(100vh - 200px)',
          minHeight: '600px',
        }}>
          <ListaPruebas
            pruebas={pruebas}
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
              <Card style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Selecciona una prueba
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Elige una prueba de la lista para ver su contenido
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