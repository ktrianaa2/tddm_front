import React, { useState, useEffect, useRef } from 'react';
import VistaEspecificaciones from './VistaEspecificaciones';
import VistaResumenPruebas from './VistaResumenPruebas';
import ListaPruebas from './ListaPruebas';
import EditorPrueba from './EditorPrueba';
import ModalAdvertencia from '../../modales/ModalAdvertencia';
import { useRequisitos } from '../../../hooks/useRequisitos';
import { useCasosUso } from '../../../hooks/useCasosdeUso';
import { useHistoriasUsuario } from '../../../hooks/useHistoriasdeUsuario';
import { usePruebas } from '../../../hooks/usePruebas';
import { Spin, message } from 'antd';
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

  // Consolidar estados de carga
  const loadingEspecificaciones = loadingRequisitos || loadingCasosUso || loadingHistorias;
  const loading = externalLoading || loadingEspecificaciones || loadingPruebas;

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
    }
  }, [proyectoId]);

  // ✅ FIX: Determinar vista basada en si hay pruebas
  // Se ejecuta cada vez que cambia el estado de carga o la cantidad de pruebas
  useEffect(() => {
    // Solo cambiar vista cuando ya no estemos cargando
    if (!loading && !loadingPruebas && !generandoPruebas) {
      if (pruebas.length > 0) {
        // Si hay pruebas, mostrar vista de gestión
        setVistaActual('gestion');
      } else {
        // Si no hay pruebas, mostrar vista inicial
        setVistaActual('inicial');
      }
    }
  }, [loading, loadingPruebas, pruebas.length, generandoPruebas]);

  // Handlers
  const handleRecargarTodo = () => {
    recargarRequisitos();
    recargarCasosUso();
    recargarHistorias();
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

  const handleCrearPrueba = () => {
    message.info('Funcionalidad de crear prueba manual - Por implementar');
  };

  const handleSeleccionarPrueba = (prueba) => {
    setPruebaSeleccionada(prueba);
  };

  const handleVolverAResumen = () => {
    setPruebaSeleccionada(null);
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
            Cargando especificaciones y pruebas...
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
          <div className="tab-loading-text">
            🤖 Generando pruebas con IA...
          </div>
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.95rem',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            Analizando {todasEspecificaciones.length} especificación{todasEspecificaciones.length !== 1 ? 'es' : ''} del proyecto
            <br />
            <small style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem', display: 'block' }}>
              Este proceso puede tomar algunos segundos...
            </small>
          </p>
        </div>
      </div>
    );
  }

  // === RENDERIZADO DE VISTAS ===

  // Vista inicial (especificaciones) - Sin pruebas generadas
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
            // Vista de resumen cuando no hay selección
            <div className="panel-contenido">
              <VistaResumenPruebas
                contadores={contadores}
                loading={loading}
                onRecargar={recargarPruebas}
                onCrearPrueba={handleCrearPrueba}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PruebasTab;