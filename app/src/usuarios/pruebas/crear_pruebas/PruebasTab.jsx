import React, { useState, useEffect, useRef } from 'react';
import VistaGenerarPruebas from './VistaGenerarPruebas';
import ListaPruebas from './ListaPruebas';
import EditorPrueba from './EditorPrueba';
import ModalAdvertencia from '../../modales/ModalAdvertencia';
import { useRequisitos } from '../../../hooks/useRequisitos';
import { useCasosUso } from '../../../hooks/useCasosdeUso';
import { useHistoriasUsuario } from '../../../hooks/useHistoriasdeUsuario';
import { usePruebas } from '../../../hooks/usePruebas';
import { useEsquemaBD } from '../../../hooks/useEsquemaBD';
import { Spin, message, Button, Empty, Card } from 'antd';
import { BugOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons';
import '../../../styles/tabs.css';
import '../../../styles/buttons.css';

const PruebasTab = ({ proyecto, loading: externalLoading = false }) => {
  const proyectoId = proyecto?.proyecto_id;

  // Estados
  const [vistaActual, setVistaActual] = useState('inicial');
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [generandoPruebas, setGenerandoPruebas] = useState(false);

  // Hooks personalizados para especificaciones
  const {
    requisitos,
    loading: loadingRequisitos,
    cargarRequisitos,
    recargarTodo: recargarRequisitos
  } = useRequisitos(proyectoId);

  const {
    casosUso,
    loading: loadingCasosUso,
    cargarCasosUso,
    recargarTodo: recargarCasosUso
  } = useCasosUso(proyectoId);

  const {
    historiasUsuario,
    loading: loadingHistorias,
    cargarHistoriasUsuario,
    recargarTodo: recargarHistorias
  } = useHistoriasUsuario(proyectoId);

  // Hook para pruebas
  const {
    loading: loadingPruebas,
    pruebas,
    contadores,
    generarPrueba,
    cargarPruebas,
    recargarPruebas,
    eliminarPrueba,
    guardarPrueba
  } = usePruebas(proyectoId);

  // Hook para esquema BD
  const {
    loading: loadingEsquemaBD,
    tieneEsquema,
    cargarEsquemas
  } = useEsquemaBD(proyectoId);

  // Consolidar estados de carga
  const loadingEspecificaciones = loadingRequisitos || loadingCasosUso || loadingHistorias;
  const loading = externalLoading || loadingEspecificaciones || loadingPruebas || loadingEsquemaBD;

  // Combinar especificaciones con mapeo correcto de campos
  const todasEspecificaciones = [
    ...requisitos.map(req => ({
      ...req,
      requisito_id: req.id,
      tipo_especificacion: 'requisito',
      tipo_label: 'Requisito',
      color: 'blue'
    })),
    ...casosUso.map(cu => ({
      ...cu,
      caso_uso_id: cu.id,
      tipo_especificacion: 'caso_uso',
      tipo_label: 'Caso de Uso',
      color: 'green'
    })),
    ...historiasUsuario.map(hu => ({
      ...hu,
      historia_id: hu.id,
      descripcion_historia: hu.titulo,
      tipo_especificacion: 'historia_usuario',
      tipo_label: 'Historia de Usuario',
      color: 'purple'
    }))
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

  // ✅ Determinar vista basada en estado
  useEffect(() => {
    // Solo cambiar vista cuando ya no estemos cargando
    if (!loading && !generandoPruebas) {
      // 1. Si no hay esquema BD, mostrar mensaje
      if (!tieneEsquema) {
        setVistaActual('sin-esquema');
      }
      // 2. Si hay pruebas, mostrar gestión
      else if (pruebas.length > 0) {
        setVistaActual('gestion');
      }
      // 3. Si hay esquema pero no hay pruebas, mostrar especificaciones
      else {
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

  const handleIniciarGeneracionPruebas = () => {
    if (todasEspecificaciones.length === 0) {
      message.warning('No hay especificaciones disponibles para generar pruebas');
      return;
    }
    setModalVisible(true);
  };

  const handleConfirmarGeneracion = async () => {
    setModalVisible(false);
    setGenerandoPruebas(true);

    try {
      const resultado = await generarPrueba();

      if (resultado && resultado.total_pruebas > 0) {
        await recargarPruebas();
        // La vista cambiará automáticamente por el useEffect

        message.success({
          content: `🎉 ${resultado.total_pruebas} prueba${resultado.total_pruebas > 1 ? 's' : ''} generada${resultado.total_pruebas > 1 ? 's' : ''} exitosamente con IA`,
          duration: 5,
        });
      } else {
        message.warning('No se pudieron generar pruebas. Verifica que el proyecto tenga especificaciones válidas.');
      }
    } catch (error) {
      console.error('Error en la generación de pruebas:', error);
      message.error({
        content: 'Error al generar las pruebas. Intenta nuevamente.',
        duration: 4,
      });
    } finally {
      setGenerandoPruebas(false);
    }
  };

  const handleSeleccionarPrueba = (prueba) => {
    setPruebaSeleccionada(prueba);
  };

  const handleEliminarPrueba = async (prueba) => {
    try {
      await eliminarPrueba(prueba.id_prueba);

      // Si era la prueba seleccionada, deseleccionar
      if (pruebaSeleccionada?.id_prueba === prueba.id_prueba) {
        setPruebaSeleccionada(null);
      }

      // La vista cambiará automáticamente si era la última prueba
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

  const handleDescartarCambios = () => {
    message.info('Cambios descartados');
  };

  const handleRegenerarPrueba = async (prueba) => {
    try {
      setGenerandoPruebas(true);
      message.loading('Regenerando prueba con IA...', 0);

      const resultado = await generarPrueba();
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

  // === RENDERIZADO DE ESTADOS ===

  // Loading inicial
  if (loading && todasEspecificaciones.length === 0 && pruebas.length === 0) {
    return (
      <div className="tab-main-content">
        <div className="tab-loading-state">
          <Spin size="large" />
          <div className="tab-loading-text">
            Cargando datos del proyecto...
          </div>
        </div>
      </div>
    );
  }

  // Vista de generación de pruebas (loading)
  if (generandoPruebas) {
    return (
      <div className="tab-main-content">
        <div className="tab-loading-state">
          <Spin size="large" />
          <p className="tab-loading-text">
            🤖 Generando pruebas con IA...
          </p>
          <div>
            <p className="tab-empty-description">
              Analizando {todasEspecificaciones.length} especificación{todasEspecificaciones.length !== 1 ? 'es' : ''} del proyecto
              <br />
              <small className="tab-empty-description">
                Este proceso puede tomar algunos segundos...
              </small>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === RENDERIZADO DE VISTAS ===

  // Vista sin esquema BD
  if (vistaActual === 'sin-esquema') {
    return (
      <>
        {/* Header */}
        <div className="tab-header">
          <div className="tab-header-content">
            <h3 className="tab-title">
              <BugOutlined style={{ marginRight: 'var(--space-sm)' }} />
              Gestión de Pruebas
            </h3>
            <p className="tab-subtitle">
              Crea y gestiona los casos de prueba de tu proyecto
            </p>
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

        {/* Contenido principal */}
        <div className="tab-main-content">
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
                    Esquema de Base de Datos Requerido
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}>
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

  // Vista inicial - Con esquema pero sin pruebas
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
        />
      </>
    );
  }

  // Vista de gestión de pruebas - Layout con lista izquierda y contenido derecho
  if (vistaActual === 'gestion') {
    return (
      <div className="tab-main-content">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: 'var(--space-xl)',
          height: 'calc(100vh - 200px)',
          minHeight: '600px'
        }}>
          {/* Lista de pruebas - SIEMPRE VISIBLE */}
          <ListaPruebas
            pruebas={pruebas}
            pruebaActiva={pruebaSeleccionada}
            onSeleccionarPrueba={handleSeleccionarPrueba}
          />

          {/* Contenido derecho - CAMBIA según selección */}
          {pruebaSeleccionada ? (
            // Editor cuando hay una prueba seleccionada
            <EditorPrueba
              prueba={pruebaSeleccionada}
              onEliminar={handleEliminarPrueba}
              onAprobar={handleAprobarPrueba}
              onGuardarCambios={handleGuardarCambios}
              onDescartarCambios={handleDescartarCambios}
              onRegenerar={handleRegenerarPrueba}
            />
          ) : (
            // Vista vacía cuando no hay selección
            <div className="panel-contenido">
              <Card style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
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
                        Selecciona una prueba
                      </p>
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}>
                        Elige una prueba de la lista para ver su contenido
                      </p>
                    </div>
                  }
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PruebasTab;