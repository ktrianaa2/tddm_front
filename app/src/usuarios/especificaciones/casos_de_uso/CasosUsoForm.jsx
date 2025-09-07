import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, Typography, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

const prioridades = [
  { value: 'muy-alta', label: 'Muy Alta' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
  { value: 'muy-baja', label: 'Muy Baja' }
];

const tiposRelacion = [
  { value: 'include', label: 'Include (Inclusión)', description: 'El CU incluye obligatoriamente otro CU' },
  { value: 'extend', label: 'Extend (Extensión)', description: 'El CU puede extender otro CU bajo condiciones' },
  { value: 'generalizacion', label: 'Generalización', description: 'El CU es una especialización de otro CU padre' },
  { value: 'dependencia', label: 'Dependencia', description: 'El CU depende de otro CU para su ejecución' }
];

const CasosUsoForm = ({ 
  initialValues = {}, 
  onSubmit, 
  onCancel,
  casosUsoExistentes = [], // Lista de casos de uso ya registrados
  onLoadCasosUso // Función para cargar casos de uso si es necesario
}) => {
  const [form] = Form.useForm();
  const [actoresList, setActoresList] = useState([]);
  const [relaciones, setRelaciones] = useState(initialValues.relaciones || []);

  useEffect(() => {
    // Cargar casos de uso existentes si es necesario
    if (onLoadCasosUso && casosUsoExistentes.length === 0) {
      onLoadCasosUso();
    }
  }, [onLoadCasosUso, casosUsoExistentes]);

  const handleSubmit = (values) => {
    // Incluir las relaciones en los valores del formulario
    const finalValues = {
      ...values,
      relaciones: relaciones
    };
    onSubmit(finalValues);
  };

  // Convierte el input de actores en lista usable
  const handleActoresChange = (value) => {
    const actores = value.split(",").map(a => a.trim()).filter(Boolean);
    setActoresList(actores);
  };

  // Agregar nueva relación
  const agregarRelacion = () => {
    const nuevaRelacion = {
      id: Date.now(),
      tipo: '',
      casoUsoRelacionado: '',
      descripcion: ''
    };
    setRelaciones([...relaciones, nuevaRelacion]);
  };

  // Eliminar relación
  const eliminarRelacion = (id) => {
    setRelaciones(relaciones.filter(r => r.id !== id));
  };

  // Actualizar relación
  const actualizarRelacion = (id, campo, valor) => {
    setRelaciones(relaciones.map(r => 
      r.id === id ? { ...r, [campo]: valor } : r
    ));
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2 className="form-title">
          {initialValues.id ? "Editar Caso de Uso" : "Crear Nuevo Caso de Uso"}
        </h2>
        <p className="form-subtitle">
          Los campos marcados con * son obligatorios según estándares de UML y análisis de sistemas
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
        size="large"
      >
        {/* === INFORMACIÓN BÁSICA === */}
        <div className="form-section">
          <h3 className="form-section-title">Información Básica (Obligatorio)</h3>

          <Form.Item
            name="nombre"
            label="Nombre del Caso de Uso *"
            rules={[{ required: true, message: 'El nombre del caso de uso es obligatorio' }]}
            className="form-field"
          >
            <Input placeholder="Ej: Iniciar sesión en el sistema" showCount maxLength={80} />
          </Form.Item>

          <Form.Item
            name="actores"
            label="Actor(es) Involucrado(s) *"
            rules={[{ required: true, message: 'Debe especificar al menos un actor' }]}
            className="form-field"
          >
            <Input
              placeholder="Ej: Usuario, Sistema, Administrador (separados por comas)"
              showCount
              maxLength={150}
              onChange={(e) => handleActoresChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción/Objetivo del Caso de Uso *"
            rules={[{ required: true, message: 'La descripción del caso de uso es obligatoria' }]}
            className="form-field"
          >
            <TextArea rows={4} placeholder="Explica el propósito y meta de este caso de uso..." showCount maxLength={500} />
          </Form.Item>

          {/* === FLUJO PRINCIPAL DINÁMICO === */}
          <Form.Item label="Flujo Principal/Escenario Principal *" required>
            <Form.List name="flujo_principal">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'actor']}
                        rules={[{ required: true, message: 'Seleccione un actor' }]}
                      >
                        <Select placeholder="Actor" style={{ width: 150 }}>
                          {actoresList.map((actor, idx) => (
                            <Select.Option key={idx} value={actor}>{actor}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'accion']}
                        rules={[{ required: true, message: 'Describa la acción' }]}
                        style={{ flex: 1 }}
                      >
                        <Input placeholder="Acción del paso" />
                      </Form.Item>
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Agregar Paso
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            name="precondiciones"
            label="Precondiciones *"
            rules={[{ required: true, message: 'Las precondiciones son obligatorias' }]}
            className="form-field"
          >
            <TextArea rows={3} placeholder="Condiciones previas para ejecutar el caso de uso..." showCount maxLength={400} />
          </Form.Item>
        </div>

        <Divider />

        {/* === OPCIONALES === */}
        <div className="form-section">
          <h3 className="form-section-title">Información Adicional (Opcional)</h3>

          {/* === FLUJOS ALTERNATIVOS DINÁMICOS === */}
          <Form.Item label="Flujos Alternativos/Escenarios Alternativos">
            <Form.List name="flujos_alternativos">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'actor']}
                        rules={[{ required: true, message: 'Seleccione un actor' }]}
                      >
                        <Select placeholder="Actor" style={{ width: 150 }}>
                          {actoresList.map((actor, idx) => (
                            <Select.Option key={idx} value={actor}>{actor}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'accion']}
                        rules={[{ required: true, message: 'Describa la acción' }]}
                        style={{ flex: 1 }}
                      >
                        <Input placeholder="Acción alternativa" />
                      </Form.Item>
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Agregar Paso Alternativo
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          {/* Prioridad */}
          <Form.Item name="prioridad" label="Prioridad/Frecuencia de Uso" className="form-field">
            <Select placeholder="Nivel de importancia">
              {prioridades.map(p => <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>)}
            </Select>
          </Form.Item>
        </div>

        <Divider />

        {/* === SECCIÓN DE RELACIONES INTEGRADA === */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <LinkOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
              Relaciones con otros Casos de Uso
            </Title>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Define las relaciones UML entre este caso de uso y otros casos de uso existentes
          </p>

          {/* Lista de relaciones */}
          {relaciones.map((relacion) => (
            <Card 
              key={relacion.id}
              size="small"
              style={{ 
                marginBottom: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
              extra={
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => eliminarRelacion(relacion.id)}
                >
                  Eliminar
                </Button>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <div className="form-field">
                    <label style={{ 
                      display: 'block',
                      marginBottom: '4px',
                      color: 'var(--text-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Tipo de Relación
                    </label>
                    <Select
                      placeholder="Seleccionar tipo"
                      value={relacion.tipo}
                      onChange={(value) => actualizarRelacion(relacion.id, 'tipo', value)}
                      style={{ width: '100%' }}
                    >
                      {tiposRelacion.map(tr => (
                        <Select.Option key={tr.value} value={tr.value} title={tr.description}>
                          {tr.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="form-field">
                    <label style={{ 
                      display: 'block',
                      marginBottom: '4px',
                      color: 'var(--text-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Caso de Uso Relacionado
                    </label>
                    <Select
                      placeholder="Seleccionar CU"
                      value={relacion.casoUsoRelacionado}
                      onChange={(value) => actualizarRelacion(relacion.id, 'casoUsoRelacionado', value)}
                      style={{ width: '100%' }}
                      showSearch
                      optionFilterProp="children"
                    >
                      {casosUsoExistentes.map(cu => (
                        <Select.Option key={cu.id} value={cu.id}>
                          {cu.nombre}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="form-field">
                    <label style={{ 
                      display: 'block',
                      marginBottom: '4px',
                      color: 'var(--text-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Descripción de la Relación
                    </label>
                    <Input
                      placeholder="Describe la relación..."
                      value={relacion.descripcion}
                      onChange={(e) => actualizarRelacion(relacion.id, 'descripcion', e.target.value)}
                      maxLength={200}
                      showCount
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          ))}

          {/* Botón para agregar nueva relación */}
          <Button 
            type="dashed" 
            onClick={agregarRelacion} 
            block 
            icon={<PlusOutlined />}
            style={{ marginTop: relaciones.length > 0 ? '1rem' : 0 }}
          >
            Agregar Nueva Relación
          </Button>

          {/* Información adicional */}
          {relaciones.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-light)',
              borderRadius: 'var(--border-radius)',
              border: '1px dashed var(--border-color)'
            }}>
              <LinkOutlined style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
              <p>No hay relaciones definidas</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                Las relaciones UML ayudan a definir cómo este caso de uso se conecta con otros
              </p>
            </div>
          )}
        </div>

        <Divider />

        {/* Otras secciones opcionales */}
        <div className="form-section">
          <h3 className="form-section-title">Requisitos y Consideraciones</h3>

          <Form.Item name="requisitos_especiales" label="Requisitos Especiales/No Funcionales" className="form-field">
            <TextArea rows={4} placeholder="Restricciones, rendimiento, seguridad, usabilidad..." showCount maxLength={500} />
          </Form.Item>

          <Form.Item name="riesgos_consideraciones" label="Riesgos y Consideraciones Éticas" className="form-field">
            <TextArea rows={3} placeholder="Posibles riesgos o consideraciones éticas..." showCount maxLength={400} />
          </Form.Item>
        </div>

        <Divider />

        <div className="form-actions">
          <Space size="middle">
            <Button onClick={onCancel} className="btn btn-secondary" size="large">
              Cancelar
            </Button>
            <Button htmlType="submit" className="btn btn-primary" size="large">
              {initialValues.id ? "Actualizar Caso de Uso" : "Crear Caso de Uso"}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default CasosUsoForm;