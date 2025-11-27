import React, { useState, useEffect } from 'react';
import VistaEspecificaciones from './VistaEspecificaciones';
import ListaPruebas from './ListaPruebas';
import EditorPrueba from './EditorPrueba';
import ModalAdvertencia from './ModalAdvertencia';
import { useEspecificaciones } from '../../../hooks/useEspecificaciones';
import { usePruebas } from '../../../hooks/usePruebas';
import { Spin, message } from 'antd';

const PruebasTab = ({ proyecto, loading: externalLoading = false }) => {
  const proyectoId = proyecto?.proyecto_id;

  // Estados
  const [vistaActual, setVistaActual] = useState('inicial');
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
    cargarPruebas,
    recargarPruebas, // ✅ Función para recargar manualmente
    setPruebas
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

  // ✅ Carga inicial - SOLO UNA VEZ
  useEffect(() => {
    if (proyectoId) {
      cargarEspecificaciones();
      cargarPruebas();
    }
  }, [proyectoId]); // ✅ Solo depende de proyectoId

  // ✅ Cambiar de vista cuando hay pruebas - SOLO UNA VEZ
  useEffect(() => {
    if (pruebas.length > 0 && vistaActual === 'inicial') {
      setVistaActual('pruebas');
      setPruebaSeleccionada(pruebas[0]);
    }
  }, [pruebas.length]); // ✅ Solo depende de la cantidad de pruebas

  // Handlers
  const handleRecargarTodo = () => {
    cargarEspecificaciones();
    recargarPruebas(); // ✅ Usar la función de recarga manual
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
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (pruebas.length === 0) {
        // Simulación: cargar pruebas de ejemplo
        await recargarPruebas();
      }
      
      setVistaActual('pruebas');
      message.success('Pruebas generadas exitosamente con IA (Simulación)');
    } catch (error) {
      message.error('Error al generar las pruebas');
      console.error(error);
    } finally {
      setGenerandoPruebas(false);
    }
  };

  const handleSeleccionarPrueba = (prueba) => {
    setPruebaSeleccionada(prueba);
  };

  const handleEliminarPrueba = async (prueba) => {
    try {
      setPruebas(pruebas.filter(p => p.id_prueba !== prueba.id_prueba));
      message.success('Prueba eliminada exitosamente');
      
      // ✅ Si eliminamos la prueba seleccionada, seleccionar otra
      if (pruebaSeleccionada?.id_prueba === prueba.id_prueba) {
        const pruebasRestantes = pruebas.filter(p => p.id_prueba !== prueba.id_prueba);
        setPruebaSeleccionada(pruebasRestantes.length > 0 ? pruebasRestantes[0] : null);
      }
    } catch (error) {
      message.error('Error al eliminar la prueba');
    }
  };

  const handleAprobarPrueba = async (prueba) => {
    try {
      const pruebaAprobada = { ...prueba, estado: 'aprobada' };
      setPruebas(pruebas.map(p => p.id_prueba === prueba.id_prueba ? pruebaAprobada : p));

      if (pruebaSeleccionada?.id_prueba === prueba.id_prueba) {
        setPruebaSeleccionada(pruebaAprobada);
      }
      
      message.success('Prueba aprobada exitosamente');
    } catch (error) {
      message.error('Error al aprobar la prueba');
    }
  };

  const handleGuardarCambios = async (pruebaActualizada) => {
    try {
      setPruebas(pruebas.map(p => 
        p.id_prueba === pruebaActualizada.id_prueba ? pruebaActualizada : p
      ));
      setPruebaSeleccionada(pruebaActualizada);
      
      message.success('Cambios guardados exitosamente');
    } catch (error) {
      message.error('Error al guardar los cambios');
    }
  };

  const handleDescartarCambios = () => {
    message.info('Cambios descartados');
  };

  const handleRegenerarPrueba = async (prueba) => {
    try {
      setGenerandoPruebas(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const nuevaPrueba = {
        ...prueba,
        nombre: `${prueba.nombre} (Regenerada)`,
        estado: 'borrador',
      };
      setPruebas(pruebas.map(p => p.id_prueba === prueba.id_prueba ? nuevaPrueba : p));
      setPruebaSeleccionada(nuevaPrueba);

      message.success('Prueba regenerada exitosamente');
    } catch (error) {
      message.error('Error al regenerar la prueba');
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
              fontSize: '1.1rem',
              color: 'var(--text-secondary)'
            }}>
              🤖 Generando pruebas con IA...
            </p>
            <p style={{
              marginTop: '0.5rem',
              fontSize: '0.95rem',
              color: 'var(--text-tertiary)'
            }}>
              Analizando todas las especificaciones en conjunto
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vistas principales
  return (
    <>
      {vistaActual === 'inicial' && pruebas.length === 0 ? (
        <VistaEspecificaciones
          especificaciones={todasEspecificaciones}
          requisitos={requisitos}
          casosUso={casosUso}
          historiasUsuario={historiasUsuario}
          loading={loading}
          onRecargar={handleRecargarTodo}
          onIniciarPruebas={handleIniciarGeneracionPruebas}
        />
      ) : (
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
      )}

      <ModalAdvertencia
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleConfirmarGeneracion}
        loading={false}
      />
    </>
  );
};

export default PruebasTab;