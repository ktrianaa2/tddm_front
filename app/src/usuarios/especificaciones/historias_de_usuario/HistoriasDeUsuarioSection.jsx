import React, { useState } from 'react';
import { Card, Button, List, Typography, Space, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import HistoriasUsuarioForm from './HistoriasUsuarioForm';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;

const HistoriasUsuarioSection = ({ proyecto }) => {
  const [historias, setHistorias] = useState([]);
  const [editing, setEditing] = useState(null); // null = lista, {} = creando, {id} = editando

  const prioridades = [
    { value: 'muy-alta', label: 'Muy Alta' },
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
  ];

  const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en-progreso', label: 'En Progreso' },
    { value: 'completada', label: 'Completada' },
    { value: 'bloqueada', label: 'Bloqueada' }
  ];

  const unidadesEstimacion = [
    { value: 'story-points', label: 'Story Points' },
    { value: 'horas', label: 'Horas' },
    { value: 'dias', label: 'Días' },
    { value: 'costo', label: 'Costo ($)' }
  ];

  const handleGuardar = (values) => {
    if (editing?.id) {
      // editar
      setHistorias(prev => prev.map(h => h.id === editing.id ? { ...h, ...values } : h));
    } else {
      // crear
      setHistorias(prev => [...prev, {
        id: Date.now(),
        ...values,
        fechaCreacion: new Date().toLocaleDateString()
      }]);
    }
    setEditing(null);
  };

  const handleEliminar = (id) => {
    Modal.confirm({
      title: '¿Estás seguro de eliminar esta historia de usuario?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => {
        setHistorias(prev => prev.filter(h => h.id !== id));
      }
    });
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'muy-alta': 'red',
      'alta': 'orange',
      'media': 'gold',
      'baja': 'green'
    };
    return colors[prioridad] || 'default';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': 'default',
      'en-progreso': 'processing',
      'completada': 'success',
      'bloqueada': 'error'
    };
    return colors[estado] || 'default';
  };

  const handleVerDetalle = (historia) => {
    Modal.info({
      title: 'Historia de Usuario',
      content: (
        <div>
          <div style={{ backgroundColor: '#f0f2f5', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '16px', fontStyle: 'italic' }}>
              "{historia.descripcion_historia}"
            </Text>
          </div>

          {historia.actor_rol && <p><strong>Actor/Rol:</strong> {historia.actor_rol}</p>}
          {historia.funcionalidad_accion && <p><strong>Funcionalidad:</strong> {historia.funcionalidad_accion}</p>}
          {historia.beneficio_razon && <p><strong>Beneficio:</strong> {historia.beneficio_razon}</p>}

          <p><strong>Criterios de Aceptación:</strong></p>
          <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
            {historia.criterios_aceptacion}
          </div>

          {historia.dependencias_relaciones && <p><strong>Dependencias:</strong> {historia.dependencias_relaciones}</p>}
          {historia.componentes_relacionados && <p><strong>Componentes:</strong> {historia.componentes_relacionados}</p>}

          {(historia.unidad_estimacion && historia.estimacion_valor) && (
            <p><strong>Estimación:</strong> {historia.estimacion_valor} {unidadesEstimacion.find(u => u.value === historia.unidad_estimacion)?.label}</p>
          )}

          {historia.valor_negocio && <p><strong>Valor de Negocio:</strong> {historia.valor_negocio}/100</p>}

          {historia.prioridad && (
            <p><strong>Prioridad:</strong>
              <Tag color={getPrioridadColor(historia.prioridad)} style={{ marginLeft: '0.5rem' }}>
                {prioridades.find(p => p.value === historia.prioridad)?.label}
              </Tag>
            </p>
          )}

          {historia.estado && (
            <p><strong>Estado:</strong>
              <Tag color={getEstadoColor(historia.estado)} style={{ marginLeft: '0.5rem' }}>
                {estados.find(e => e.value === historia.estado)?.label}
              </Tag>
            </p>
          )}

          {historia.notas_adicionales && (
            <>
              <p><strong>Notas Adicionales:</strong></p>
              <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                {historia.notas_adicionales}
              </div>
            </>
          )}

          <p><strong>Fecha de creación:</strong> {historia.fechaCreacion}</p>
        </div>
      ),
      width: 800
    });
  };

  // Extraer el título de la descripción de la historia (primeras palabras hasta 50 caracteres)
  const extraerTitulo = (descripcionHistoria) => {
    if (!descripcionHistoria) return 'Sin título';
    return descripcionHistoria.length > 50
      ? `${descripcionHistoria.substring(0, 50)}...`
      : descripcionHistoria;
  };

  return (
    <div>
      {editing ? (
        <HistoriasUsuarioForm
          initialValues={editing?.id ? editing : {}}
          onSubmit={handleGuardar}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                <BookOutlined style={{ marginRight: '0.5rem', color: '#722ed1' }} />
                Gestión de Historias de Usuario
              </Title>
              <Text type="secondary">
                {historias.length} historia{historias.length !== 1 ? 's' : ''} de usuario en el proyecto
              </Text>
            </div>

            <Button
              className="btn btn-primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing({})}
            >
              Agregar Historia de Usuario
            </Button>
          </div>

          {/* Lista */}
          {historias.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <BookOutlined style={{ fontSize: '3rem', color: 'var(--text-disabled)', marginBottom: '1rem' }} />
              <Title level={4} type="secondary">No hay historias de usuario definidas</Title>
              <Text type="secondary">Comienza agregando la primera historia de usuario de tu proyecto</Text>
            </Card>
          ) : (
            <Card>
              <List
                dataSource={historias}
                renderItem={(historia) => (
                  <List.Item
                    key={historia.id}
                    actions={[
                      <Button
                        className="btn btn-info btn-card"
                        icon={<EyeOutlined />}
                        onClick={() => handleVerDetalle(historia)}
                      >
                        Ver
                      </Button>,
                      <Button
                        className="btn btn-info btn-card"
                        icon={<EditOutlined />}
                        onClick={() => setEditing(historia)}
                      >
                        Editar
                      </Button>,
                      <Button
                        className="btn btn-danger btn-card"
                        icon={<DeleteOutlined />}
                        onClick={() => handleEliminar(historia.id)}
                      >
                        Eliminar
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Text strong>{extraerTitulo(historia.descripcion_historia)}</Text>
                          {historia.prioridad && (
                            <Tag color={getPrioridadColor(historia.prioridad)}>
                              {prioridades.find(p => p.value === historia.prioridad)?.label}
                            </Tag>
                          )}
                          {historia.estado && (
                            <Tag color={getEstadoColor(historia.estado)}>
                              {estados.find(e => e.value === historia.estado)?.label}
                            </Tag>
                          )}
                          {(historia.unidad_estimacion && historia.estimacion_valor) && (
                            <Tag color="blue">
                              {historia.estimacion_valor} {historia.unidad_estimacion === 'story-points' ? 'SP' :
                                historia.unidad_estimacion === 'horas' ? 'hrs' :
                                  historia.unidad_estimacion === 'dias' ? 'días' : '$'}
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontStyle: 'italic' }}>
                            {historia.descripcion_historia?.length > 150
                              ? `${historia.descripcion_historia.substring(0, 150)}...`
                              : historia.descripcion_historia}
                          </Text>
                          {historia.actor_rol && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                <strong>Actor:</strong> {historia.actor_rol}
                              </Text>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default HistoriasUsuarioSection;