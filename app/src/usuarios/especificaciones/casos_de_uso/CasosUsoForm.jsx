import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, Typography, Card, Spin, Alert, Tag, message } from 'antd'; import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

const CasosUsoForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  casosUsoExistentes = [],
  proyectoId,
  loading = false,

  // Datos de los catálogos
  prioridades = [],
  estados = [],
  tiposRelacion = [],

  // Estados de carga
  loadingPrioridades = false,
  loadingTiposRelacion = false,
  loadingEstados = false,
  loadingRelaciones = false,

  // Estados de error
  errorPrioridades = null,
  errorTiposRelacion = null,

  // Funciones utilitarias
  cargarRelacionesExistentes,
  retryFunctions = {},
  onLoadCasosUso
}) => {
  const [form] = Form.useForm();
  const [actoresList, setActoresList] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [relacionesCargadas, setRelacionesCargadas] = useState(false);

  // Funciones helper para mapear entre keys y IDs
  const findByKeyOrId = useCallback((items, keyOrId) => {
    if (!keyOrId || !Array.isArray(items)) return null;

    const keyOrIdStr = keyOrId.toString().toLowerCase();

    // Buscar por ID exacto primero
    let found = items.find(item => item.value === keyOrId.toString());
    if (found) return found;

    // Buscar por key
    found = items.find(item => item.key === keyOrIdStr);
    if (found) return found;

    // Buscar por label normalizado
    found = items.find(item =>
      item.label && item.label.toLowerCase().replace(/\s+/g, '-') === keyOrIdStr
    );

    return found;
  }, []);

  const getIdByKeyOrId = useCallback((items, keyOrId) => {
    const found = findByKeyOrId(items, keyOrId);
    return found ? found.value : null;
  }, [findByKeyOrId]);

  const cargarRelaciones = useCallback(async (casoUsoId) => {
    if (!casoUsoId || !cargarRelacionesExistentes || relacionesCargadas) {
      return;
    }

    setRelacionesCargadas(true);

    try {
      const relacionesExistentes = await cargarRelacionesExistentes(casoUsoId);
      setRelaciones(relacionesExistentes || []);
    } catch (error) {
      setRelaciones([]);
    }
  }, [cargarRelacionesExistentes, relacionesCargadas]);

  // USEEFFECT principal
  useEffect(() => {
    // Verificar que los catálogos básicos estén disponibles
    const catalogosBasicosDisponibles = prioridades.length > 0 && estados.length > 0;
    if (!catalogosBasicosDisponibles) {
      return;
    }
    const casoUsoId = initialValues?.id;
    if (casoUsoId) {
      // MODO EDICIÓN
      setIsEditing(true);

      // Preparar valores para edición
      const formValues = {
        nombre: initialValues.nombre || '',
        actores: initialValues.actores || '',
        descripcion: initialValues.descripcion || '',
        precondiciones: initialValues.precondiciones || '',
        flujo_principal: initialValues.flujo_principal || [],
        flujos_alternativos: initialValues.flujos_alternativos || [],
        postcondiciones: initialValues.postcondiciones || '',
        requisitos_especiales: initialValues.requisitos_especiales || '',
        riesgos_consideraciones: initialValues.riesgos_consideraciones || ''
      };

      // Mapear prioridad
      if (initialValues.prioridad) {
        const prioridadId = getIdByKeyOrId(prioridades, initialValues.prioridad);
        if (prioridadId) {
          formValues.prioridad = prioridadId;
        }
      }

      // Mapear estado
      if (initialValues.estado) {
        const estadoId = getIdByKeyOrId(estados, initialValues.estado);
        if (estadoId) {
          formValues.estado = estadoId;
        }
      }

      // Procesar actores
      if (initialValues.actores) {
        const actores = typeof initialValues.actores === 'string'
          ? initialValues.actores.split(",").map(a => a.trim()).filter(Boolean)
          : Array.isArray(initialValues.actores) ? initialValues.actores : [];
        setActoresList(actores);
      }

      form.setFieldsValue(formValues);
      if (initialValues.relaciones && Array.isArray(initialValues.relaciones)) {
        const relacionesProcesadas = initialValues.relaciones.map(rel => {
          return {
            id: rel.id || `temp_${Date.now()}_${Math.random()}`,
            casoUsoRelacionado: (rel.casoUsoRelacionado || rel.caso_uso_destino_id || '').toString(),
            tipo: (rel.tipo || rel.tipo_relacion_id || '').toString(),
            descripcion: rel.descripcion || ''
          };
        });

        setRelaciones(relacionesProcesadas);
        setRelacionesCargadas(true);
      } else {
        // Solo cargar relaciones desde API si no vienen en initialValues
        if (tiposRelacion.length > 0 && !relacionesCargadas) {
          cargarRelaciones(casoUsoId);
        }
      }

    } else {
      // MODO CREACIÓN
      setIsEditing(false);
      setRelacionesCargadas(true);

      const valoresPorDefecto = {};

      // Establecer valores por defecto
      const prioridadPorDefecto = findByKeyOrId(prioridades, 'media') || prioridades[0];
      if (prioridadPorDefecto) {
        valoresPorDefecto.prioridad = prioridadPorDefecto.value;
      }

      const estadoPorDefecto = findByKeyOrId(estados, 'pendiente') || estados[0];
      if (estadoPorDefecto) {
        valoresPorDefecto.estado = estadoPorDefecto.value;
      }

      form.setFieldsValue(valoresPorDefecto);
      setRelaciones([]);
      setActoresList([]);
    }

  }, [
    initialValues?.id,
    prioridades.length,
    estados.length,
    tiposRelacion.length,
    JSON.stringify(initialValues?.relaciones)
  ]);

  useEffect(() => {
    if (onLoadCasosUso && casosUsoExistentes.length === 0) {
      onLoadCasosUso();
    }
  }, [onLoadCasosUso, casosUsoExistentes.length]);

  const handleSubmit = (values) => {
    const finalValues = {
      nombre: values.nombre || '',
      descripcion: values.descripcion || '',
      actores: values.actores || '',
      precondiciones: values.precondiciones || '',
      postcondiciones: values.postcondiciones || '',
      flujo_principal: values.flujo_principal || [],
      flujos_alternativos: values.flujos_alternativos || [],
      requisitos_especiales: values.requisitos_especiales || '',
      riesgos_consideraciones: values.riesgos_consideraciones || '',
      proyecto_id: proyectoId,
      prioridad: values.prioridad || '',
      estado: values.estado || '',

      relaciones: relaciones.map(rel => {
        // Validar que los valores sean números válidos
        const casoUsoRelacionado = parseInt(rel.casoUsoRelacionado);
        const tipo = parseInt(rel.tipo);

        if (isNaN(casoUsoRelacionado) || isNaN(tipo)) {
          return null;
        }

        return {
          casoUsoRelacionado: casoUsoRelacionado,
          tipo: tipo,
          descripcion: rel.descripcion || ''
        };
      }).filter(rel => rel !== null) // Filtrar relaciones inválidas
    };

    // Solo agregar ID si estamos editando
    if (isEditing && initialValues.id) {
      finalValues.id = initialValues.id;
    }

    // Validaciones del lado del cliente
    const errores = [];

    if (!finalValues.nombre || finalValues.nombre.trim().length < 3) {
      errores.push('El nombre debe tener al menos 3 caracteres');
    }

    if (!finalValues.actores || finalValues.actores.trim().length < 3) {
      errores.push('Debe especificar al menos un actor');
    }

    if (!finalValues.descripcion || finalValues.descripcion.trim().length < 10) {
      errores.push('La descripción debe tener al menos 10 caracteres');
    }

    if (!finalValues.precondiciones || finalValues.precondiciones.trim().length < 5) {
      errores.push('Las precondiciones deben tener al menos 5 caracteres');
    }

    if (!finalValues.flujo_principal || finalValues.flujo_principal.length === 0) {
      errores.push('Debe definir al menos un paso en el flujo principal');
    }

    if (!finalValues.proyecto_id) {
      errores.push('El proyecto_id es obligatorio');
    }

    if (errores.length > 0) {
      message.error(`Errores de validación: ${errores.join(', ')}`);
      return;
    }

    onSubmit(finalValues);
  };

  // Convierte el input de actores en lista usable
  const handleActoresChange = (value) => {
    const actores = value.split(",").map(a => a.trim()).filter(Boolean);
    setActoresList(actores);
  };

  // Funciones para relaciones
  const agregarRelacion = () => {
    const nuevaRelacion = {
      id: `temp_${Date.now()}_${Math.random()}`,
      tipo: '',
      casoUsoRelacionado: '',
      descripcion: ''
    };
    setRelaciones(prev => [...prev, nuevaRelacion]);
  };

  const eliminarRelacion = (id) => {
    setRelaciones(prev => prev.filter(r => r.id !== id));
  };

  const actualizarRelacion = (id, campo, valor) => {
    setRelaciones(prev => prev.map(r =>
      r.id === id ? { ...r, [campo]: valor } : r
    ));
  };

  // Funciones helper para obtener información
  const getItemByKey = useCallback((items, key) => {
    return items.find(item => item.key === key);
  }, []);

  const getCasoUsoInfo = useCallback((casoUsoId) => {
    return casosUsoExistentes.find(cu => cu.id.toString() === casoUsoId.toString());
  }, [casosUsoExistentes]);

  return (
    <div className="form-container">
      <div className="form-header">
        <h2 className="form-title">
          {isEditing ? "Editar Caso de Uso" : "Crear Nuevo Caso de Uso"}
        </h2>
        <p className="form-subtitle">
          Los campos marcados con * son obligatorios según estándares de UML y análisis de sistemas
        </p>
      </div>

      {/* Alertas de error */}
      {(errorPrioridades || errorTiposRelacion) && (
        <Alert
          message="Error al cargar catálogos"
          description="Algunos catálogos no se pudieron cargar. Puedes continuar con valores por defecto."
          type="warning"
          action={
            <Button
              size="small"
              onClick={() => retryFunctions.cargarTodosCatalogos && retryFunctions.cargarTodosCatalogos()}
            >
              Reintentar
            </Button>
          }
          style={{ marginBottom: '1rem' }}
          closable
        />
      )}

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {/* === INFORMACIÓN BÁSICA === */}
          <div className="form-section">
            <h3 className="form-section-title">Información Básica (Obligatorio)</h3>

            <Form.Item
              name="nombre"
              label="Nombre del Caso de Uso *"
              rules={[
                { required: true, message: 'El nombre del caso de uso es obligatorio' },
                { min: 5, message: 'El nombre debe tener al menos 5 caracteres' },
                { max: 80, message: 'El nombre no puede exceder 80 caracteres' }
              ]}
              className="form-field"
            >
              <Input
                placeholder="Ej: Iniciar sesión en el sistema"
                showCount
                maxLength={80}
              />
            </Form.Item>

            <Form.Item
              name="actores"
              label="Actor(es) Involucrado(s) *"
              rules={[
                { required: true, message: 'Debe especificar al menos un actor' },
                { min: 3, message: 'Debe especificar al menos un actor válido' }
              ]}
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
              rules={[
                { required: true, message: 'La descripción del caso de uso es obligatoria' },
                { min: 10, message: 'La descripción debe tener al menos 10 caracteres' },
                { max: 500, message: 'La descripción no puede exceder 500 caracteres' }
              ]}
              className="form-field"
            >
              <TextArea
                rows={4}
                placeholder="Explica el propósito y meta de este caso de uso..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="precondiciones"
              label="Precondiciones *"
              rules={[
                { required: true, message: 'Las precondiciones son obligatorias' },
                { min: 5, message: 'Las precondiciones deben tener al menos 5 caracteres' },
                { max: 400, message: 'Las precondiciones no pueden exceder 400 caracteres' }
              ]}
              className="form-field"
            >
              <TextArea
                rows={3}
                placeholder="Condiciones previas para ejecutar el caso de uso..."
                showCount
                maxLength={400}
              />
            </Form.Item>
            <Form.Item
              name="postcondiciones"
              label="Postcondiciones"
              rules={[
                { max: 400, message: 'Las postcondiciones no pueden exceder 400 caracteres' }
              ]}
              className="form-field"
            >
              <TextArea
                rows={3}
                placeholder="Estado del sistema después de ejecutar el caso de uso..."
                showCount
                maxLength={400}
              />
            </Form.Item>

            {/* === FLUJO PRINCIPAL DINÁMICO === */}
            <Form.Item
              label="Flujo Principal/Escenario Principal *"
              required
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(new Error('Debe definir al menos un paso en el flujo principal'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
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
                          rules={[
                            { required: true, message: 'Describa la acción' },
                            { min: 5, message: 'La acción debe tener al menos 5 caracteres' }
                          ]}
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="Acción del paso" maxLength={200} />
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
          </div>

          <Divider />

          {/* === INFORMACIÓN ADICIONAL === */}
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
                          rules={[
                            { required: true, message: 'Describa la acción' },
                            { min: 5, message: 'La acción debe tener al menos 5 caracteres' }
                          ]}
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="Acción alternativa" maxLength={200} />
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

            {/* Prioridad - usando datos de la API */}
            <Form.Item name="prioridad" label="Prioridad/Frecuencia de Uso" className="form-field">
              <Select
                placeholder="Nivel de importancia"
                loading={loadingPrioridades}
                notFoundContent={loadingPrioridades ? <Spin size="small" /> : "Sin datos"}
                showSearch
                optionFilterProp="children"
              >
                {prioridades.map(p => (
                  <Select.Option key={p.value} value={p.value} title={p.descripcion}>
                    <Space>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: p.color
                        }}
                      />
                      {p.label}
                      {p.nivel && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          (Nivel {p.nivel})
                        </span>
                      )}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="estado"
              label="Estado del Caso de Uso"
              className="form-field"
            >
              <Select
                placeholder="Estado actual"
                loading={loadingEstados}
              >
                {estados.map(e => (
                  <Select.Option key={e.value} value={e.value} title={e.descripcion}>
                    <Space>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: e.color
                        }}
                      />
                      {e.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="requisitos_especiales" label="Requisitos Especiales/No Funcionales" className="form-field">
              <TextArea
                rows={4}
                placeholder="Restricciones, rendimiento, seguridad, usabilidad..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item name="riesgos_consideraciones" label="Riesgos y Consideraciones Éticas" className="form-field">
              <TextArea
                rows={3}
                placeholder="Posibles riesgos o consideraciones éticas..."
                showCount
                maxLength={400}
              />
            </Form.Item>
          </div>

          <Divider />

          {/* === SECCIÓN DE RELACIONES === */}
          <div className="form-section">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <LinkOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
              <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                Relaciones con otros Casos de Uso
              </Title>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Define las relaciones UML entre este caso de uso y otros casos de uso existentes (Include, Extend, Generalización)
            </p>

            {/* Mostrar loading solo si está cargando relaciones por primera vez */}
            {loadingRelaciones && relaciones.length === 0 && isEditing && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-light)',
                borderRadius: 'var(--border-radius)',
                border: '1px dashed var(--border-color)'
              }}>
                <Spin size="small" />
                <p style={{ marginTop: '8px', marginBottom: 0 }}>Cargando relaciones existentes...</p>
              </div>
            )}

            {/* Lista de relaciones - Solo mostrar si no está cargando */}
            {!loadingRelaciones && relaciones.map((relacion) => {
              const casoUsoInfo = getCasoUsoInfo(relacion.casoUsoRelacionado);
              return (
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
                          loading={loadingTiposRelacion}
                          notFoundContent={loadingTiposRelacion ? <Spin size="small" /> : "Sin datos"}
                        >
                          {tiposRelacion.map(tr => (
                            <Select.Option key={tr.value} value={tr.value} title={tr.descripcion}>
                              <Space>
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: tr.color
                                  }}
                                />
                                {tr.label}
                              </Space>
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
                          filterOption={(input, option) => {
                            const children = option.children;
                            if (typeof children === 'string') {
                              return children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                            }
                            const nombre = children.props?.children?.[0]?.props?.children?.[0] || '';
                            return nombre.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                          }}
                        >
                          {casosUsoExistentes
                            .filter(cu => cu.id !== initialValues.id)
                            .map(cu => {
                              const prioridadInfo = getItemByKey(prioridades, cu.prioridad);
                              return (
                                <Select.Option key={cu.id} value={cu.id.toString()}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'medium' }}>{cu.nombre}</span>
                                    {prioridadInfo && (
                                      <Tag
                                        color={prioridadInfo.color}
                                        style={{ margin: 0, fontSize: '10px' }}
                                      >
                                        {prioridadInfo.label}
                                      </Tag>
                                    )}
                                  </div>
                                </Select.Option>
                              );
                            })}
                        </Select>
                        {casoUsoInfo && (
                          <div style={{
                            marginTop: '4px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            padding: '4px 8px',
                            background: 'var(--bg-light)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)'
                          }}>
                            {casoUsoInfo.descripcion && casoUsoInfo.descripcion.length > 80
                              ? `${casoUsoInfo.descripcion.substring(0, 80)}...`
                              : casoUsoInfo.descripcion}
                          </div>
                        )}
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
              );
            })}

            {/* Botón para agregar nueva relación - solo si hay tipos de relación cargados */}
            {tiposRelacion.length > 0 && !loadingRelaciones && (
              <Button
                type="dashed"
                onClick={agregarRelacion}
                block
                icon={<PlusOutlined />}
                style={{ marginTop: relaciones.length > 0 ? '1rem' : 0 }}
              >
                Agregar Nueva Relación
              </Button>
            )}

            {/* Mensaje de carga para tipos de relación */}
            {loadingTiposRelacion && tiposRelacion.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-light)',
                borderRadius: 'var(--border-radius)',
                border: '1px dashed var(--border-color)'
              }}>
                <Spin size="small" />
                <p style={{ marginTop: '8px', marginBottom: 0 }}>Cargando tipos de relación...</p>
              </div>
            )}

            {/* Mensaje de error para tipos de relación */}
            {errorTiposRelacion && tiposRelacion.length === 0 && (
              <Alert
                message="Error cargando tipos de relación"
                description={
                  <div>
                    <p>{errorTiposRelacion}</p>
                    {retryFunctions.cargarTiposRelacion && (
                      <Button
                        size="small"
                        onClick={retryFunctions.cargarTiposRelacion}
                        style={{ marginTop: '8px' }}
                      >
                        Reintentar
                      </Button>
                    )}
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginTop: '1rem' }}
              />
            )}

            {/* Estado vacío */}
            {relaciones.length === 0 && !loadingTiposRelacion && !loadingRelaciones && tiposRelacion.length > 0 && (
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
                  Las relaciones UML ayudan a definir cómo este caso de uso se conecta con otros (Include, Extend, Generalización)
                </p>
              </div>
            )}
          </div>

          <Divider />

          <div className="form-actions">
            <Space size="middle">
              <Button onClick={onCancel} className="btn btn-secondary" size="large" disabled={loading}>
                Cancelar
              </Button>
              <Button
                htmlType="submit"
                className="btn btn-primary"
                size="large"
                loading={loading}
              >
                {isEditing ? "Actualizar Caso de Uso" : "Crear Caso de Uso"}
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>
    </div>
  );
};

export default CasosUsoForm;