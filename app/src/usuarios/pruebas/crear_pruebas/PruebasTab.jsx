import React, { useState, useEffect } from 'react';
import VistaEspecificaciones from './VistaEspecificaciones';
import VistaResumenPruebas from './VistaResumenPruebas';
import ListaPruebas from './ListaPruebas';
import EditorPrueba from './EditorPrueba';
import ModalAdvertencia from './ModalAdvertencia';
import { useEspecificaciones } from '../../../hooks/useEspecificaciones';
import { usePruebas } from '../../../hooks/usePruebas';
import { Spin, message } from 'antd';

const PruebasTab = ({ proyecto, loading: externalLoading = false }) => {
  const proyectoId = proyecto?.proyecto_id;

  // Estados
  const [vistaActual, setVistaActual] = useState('inicial'); // 'inicial', 'resumen', 'editor'
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [generandoPruebas, setGenerandoPruebas] = useState(false);

  // Hooks personalizados
  const {
    requisitos,
    casosUso,
    historiasUsuario,
    loading: loadingEspecificaciones,
    cargarEspecificaciones
  } = useEspecificaciones(proyectoId);

  const {
    loading: loadingPruebas,
    pruebas,
    contadores,
    generarPrueba, // Función real de generación con IA
    cargarPruebas,
    recargarPruebas,
    eliminarPrueba,
    guardarPrueba
  } = usePruebas(proyectoId);

  const loading = externalLoading || loadingEspecificaciones || loadingPruebas;

  // Combinar especificaciones
  const todasEspecificaciones = [
    ...requisitos.map(req => ({
      ...req,
      tipo_especificacion: 'requisito',
      tipo_label: 'Requisito',
      color: 'blue'
    })),
    ...casosUso.map(cu => ({
      ...cu,
      tipo_especificacion: 'caso_uso',
      tipo_label: 'Caso de Uso',
      color: 'green'
    })),
    ...historiasUsuario.map(hu => ({
      ...hu,
      tipo_especificacion: 'historia_usuario',
      tipo_label: 'Historia de Usuario',
      color: 'purple'
    }))
  ];

  // Cargar datos al montar
  useEffect(() => {
    if (proyectoId) {
      cargarEspecificaciones();
      cargarPruebas();
    }
  }, [proyectoId]);

  // Determinar vista inicial basada en si hay pruebas
  useEffect(() => {
    if (pruebas.length > 0 && vistaActual === 'inicial') {
      setVistaActual('resumen');
    }
  }, [pruebas.length]);

  // Handlers
  const handleRecargarTodo = () => {
    cargarEspecificaciones();
    recargarPruebas();
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
      // Llamar a la función real de generación con IA
      const resultado = await generarPrueba();

      if (resultado && resultado.total_pruebas > 0) {
        setVistaActual('resumen');

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

  const handleCrearPrueba = () => {
    // Aquí podrías abrir un modal de creación o navegar a la vista de editor
    message.info('Funcionalidad de crear prueba manual - Por implementar');
  };

  const handleEditarPrueba = (prueba) => {
    setPruebaSeleccionada(prueba);
    setVistaActual('editor');
  };

  const handleSeleccionarPrueba = (prueba) => {
    setPruebaSeleccionada(prueba);
  };

  const handleVolverAResumen = () => {
    setPruebaSeleccionada(null);
    setVistaActual('resumen');
  };

  const handleEliminarPrueba = async (prueba) => {
    try {
      await eliminarPrueba(prueba.id_prueba);

      // Si era la prueba seleccionada, volver a resumen
      if (pruebaSeleccionada?.id_prueba === prueba.id_prueba) {
        handleVolverAResumen();
      }

      // Si no quedan pruebas, volver a vista inicial
      if (pruebas.length === 1) { // Solo quedaba esta que se eliminó
        setVistaActual('inicial');
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

  const handleDescartarCambios = () => {
    message.info('Cambios descartados');
  };

  const handleRegenerarPrueba = async (prueba) => {
    try {
      setGenerandoPruebas(true);

      message.loading('Regenerando prueba con IA...', 0);

      // Llamar a la función de generación
      // Esto generará nuevas pruebas basadas en las especificaciones actuales
      const resultado = await generarPrueba();

      message.destroy();

      if (resultado && resultado.total_pruebas > 0) {
        await recargarPruebas();
        message.success('Pruebas regeneradas exitosamente');

        // Volver a la vista de resumen para ver las nuevas pruebas
        handleVolverAResumen();
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

  // Loading inicial
  if (loading && todasEspecificaciones.length === 0 && pruebas.length === 0) {
    return (
      <div className="tabs-container">
        <div className="tabs-content-wrapper">
          <div className="tab-loading-state">
            <Spin size="large" className="tab-loading-spinner" />
            <div className="tab-loading-text">
              Cargando especificaciones y pruebas...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de generación de pruebas (loading)
  if (generandoPruebas) {
    return (
      <div className="tabs-container">
        <div className="tabs-content-wrapper">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh'
          }}>
            <Spin size="large" />
            <p style={{
              marginTop: '1.5rem',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              🤖 Generando pruebas con IA...
            </p>
            <p style={{
              marginTop: '0.5rem',
              fontSize: '0.95rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              maxWidth: '500px'
            }}>
              Analizando {todasEspecificaciones.length} especificación{todasEspecificaciones.length !== 1 ? 'es' : ''} del proyecto
              <br />
              <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
                Este proceso puede tomar algunos segundos...
              </small>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar vista según el estado actual
  if (vistaActual === 'inicial') {
    return (
      <>
        <VistaEspecificaciones
          especificaciones={todasEspecificaciones}
          requisitos={requisitos}
          casosUso={casosUso}
          historiasUsuario={historiasUsuario}
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

  if (vistaActual === 'resumen') {
    return (
      <VistaResumenPruebas
        pruebas={pruebas}
        contadores={contadores}
        loading={loading}
        onRecargar={recargarPruebas}
        onCrearPrueba={handleCrearPrueba}
        onEditarPrueba={handleEditarPrueba}
      />
    );
  }

  if (vistaActual === 'editor') {
    return (
      <div className="tabs-container">
        <div className="tabs-content-wrapper">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '1.5rem',
            height: 'calc(100vh - 200px)',
            minHeight: '600px'
          }}>
            <ListaPruebas
              pruebas={pruebas}
              pruebaActiva={pruebaSeleccionada}
              onSeleccionarPrueba={handleSeleccionarPrueba}
              onVolver={handleVolverAResumen}
            />

            <EditorPrueba
              prueba={pruebaSeleccionada}
              onEliminar={handleEliminarPrueba}
              onAprobar={handleAprobarPrueba}
              onGuardarCambios={handleGuardarCambios}
              onDescartarCambios={handleDescartarCambios}
              onRegenerar={handleRegenerarPrueba}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PruebasTab;