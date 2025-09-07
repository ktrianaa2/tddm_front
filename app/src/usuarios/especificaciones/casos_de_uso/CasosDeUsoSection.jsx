import React, { useState } from 'react';
import { Card, Button, List, Typography, Space, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import CasosUsoForm from './CasosUsoForm';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;

const CasosUsoSection = ({ proyecto }) => {
  const [casosUso, setCasosUso] = useState([]);
  const [editing, setEditing] = useState(null); // null = lista, {} = creando, {id} = editando

  const prioridades = [
    { value: 'muy-alta', label: 'Muy Alta' },
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
    { value: 'muy-baja', label: 'Muy Baja' }
  ];

  const handleGuardar = (values) => {
    if (editing?.id) {
      // editar
      setCasosUso(prev => prev.map(cu => cu.id === editing.id ? { ...cu, ...values } : cu));
    } else {
      // crear
      setCasosUso(prev => [...prev, {
        id: Date.now(),
        ...values,
        fechaCreacion: new Date().toLocaleDateString()
      }]);
    }
    setEditing(null);
  };

  return (
    <div>
      {editing ? (
        <CasosUsoForm
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
                <UserOutlined style={{ marginRight: '0.5rem', color: '#52c41a' }} />
                Gestión de Casos de Uso
              </Title>
              <Text type="secondary">
                {casosUso.length} caso{casosUso.length !== 1 ? 's' : ''} de uso en el proyecto
              </Text>
            </div>

            <Button
              className="btn btn-primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing({})}
            >
              Agregar Caso de Uso
            </Button>
          </div>

          {/* Lista */}
          {casosUso.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <UserOutlined style={{ fontSize: '3rem', color: 'var(--text-disabled)', marginBottom: '1rem' }} />
              <Title level={4} type="secondary">No hay casos de uso definidos</Title>
              <Text type="secondary">Comienza agregando el primer caso de uso de tu proyecto</Text>
            </Card>
          ) : (
            <Card>
              <List
                dataSource={casosUso}
                renderItem={(caso) => (
                  <List.Item
                    key={caso.id}
                    actions={[
                      <Button
                        className="btn btn-info btn-card"
                        icon={<EyeOutlined />}
                        onClick={() => handleVerDetalle(caso)}
                      >
                        Ver
                      </Button>,
                      <Button
                        className="btn btn-info btn-card"
                        icon={<EditOutlined />}
                        onClick={() => setEditing(caso)}
                      >
                        Editar
                      </Button>,
                      <Button
                        className="btn btn-danger btn-card"
                        icon={<DeleteOutlined />}
                        onClick={() => handleEliminar(caso.id)}
                      >
                        Eliminar
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Text strong>{caso.nombre}</Text>
                          {caso.prioridad && (
                            <Tag color={getPrioridadColor(caso.prioridad)}>
                              {prioridades.find(p => p.value === caso.prioridad)?.label}
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            {caso.descripcion?.length > 120
                              ? `${caso.descripcion.substring(0, 120)}...`
                              : caso.descripcion}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                            <strong>Actores:</strong> {caso.actores}
                          </Text>
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

export default CasosUsoSection;