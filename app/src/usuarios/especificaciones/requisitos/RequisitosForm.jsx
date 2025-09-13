import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, Card, Tag, Typography, Spin, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

const RequisitosForm = ({
    initialValues = {},
    onSubmit,
    onCancel,
    requisitosExistentes = [],
    proyectoId,
    loading = false,

    // Datos de los catálogos
    tiposRequisito = [],
    prioridades = [],
    estados = [],
    tiposRelacion = [],

    // Estados de carga
    loadingTipos = false,
    loadingPrioridades = false,
    loadingEstados = false,
    loadingTiposRelacion = false,
    loadingRelaciones = false,

    // Estados de error
    errorTipos = null,
    errorPrioridades = null,
    errorEstados = null,
    errorTiposRelacion = null,

    // Funciones utilitarias
    cargarRelacionesExistentes,
    retryFunctions = {}
}) => {
    const [form] = Form.useForm();
    const [relacionesRequisitos, setRelacionesRequisitos] = useState([]);
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

    const cargarRelaciones = useCallback(async (requisitoId) => {
        if (!requisitoId || !cargarRelacionesExistentes || relacionesCargadas) {
            console.log('Saltando carga de relaciones:', {
                requisitoId,
                tieneFunction: !!cargarRelacionesExistentes,
                relacionesCargadas
            });
            return;
        }

        console.log('Cargando relaciones para requisito:', requisitoId);
        setRelacionesCargadas(true); // MARCAR COMO CARGADAS para evitar bucles

        try {
            const relacionesExistentes = await cargarRelacionesExistentes(requisitoId);
            setRelacionesRequisitos(relacionesExistentes || []);
            console.log('Relaciones cargadas exitosamente:', relacionesExistentes);
        } catch (error) {
            console.error('Error al cargar relaciones:', error);
            // No mostrar error al usuario si es problema de CORS/conexión
            if (!error.message.includes('CORS') && !error.message.includes('conexión')) {
                // Solo loggear el error, no interferir con la UI
            }
            setRelacionesRequisitos([]); // Establecer array vacío en caso de error
        }
    }, [cargarRelacionesExistentes, relacionesCargadas]);

    // USEEFFECT CORREGIDO - Con dependencias específicas y sin bucles
    useEffect(() => {
        console.log('useEffect - Inicialización del formulario');
        console.log('Datos disponibles:', {
            tiposRequisito: tiposRequisito.length,
            prioridades: prioridades.length,
            estados: estados.length,
            tiposRelacion: tiposRelacion.length,
            initialValues: initialValues?.id ? 'Con ID' : 'Sin ID'
        });

        // Verificar que los catálogos básicos estén disponibles
        const catalogosBasicosDisponibles = tiposRequisito.length > 0 &&
            prioridades.length > 0 &&
            estados.length > 0;

        if (!catalogosBasicosDisponibles) {
            console.log('Esperando catálogos básicos...');
            return;
        }

        // Resetear flag de relaciones si cambia el requisito
        const requisitoId = initialValues?.id;
        const esNuevoRequisito = !requisitoId;

        if (esNuevoRequisito || !relacionesCargadas) {
            setRelacionesCargadas(false);
        }

        if (requisitoId) {
            // MODO EDICIÓN
            setIsEditing(true);
            console.log('Configurando modo edición para requisito:', requisitoId);

            // Preparar valores para edición
            const formValues = {
                nombre: initialValues.nombre || '',
                descripcion: initialValues.descripcion || '',
                criterios: initialValues.criterios || '',
                origen: initialValues.origen || '',
                condiciones_previas: initialValues.condiciones_previas || '',
            };

            // Mapear tipo de requisito
            if (initialValues.tipo) {
                const tipoId = getIdByKeyOrId(tiposRequisito, initialValues.tipo);
                if (tipoId) {
                    formValues.tipo = tipoId;
                    console.log(`Tipo mapeado: ${initialValues.tipo} -> ${tipoId}`);
                }
            }

            // Mapear prioridad
            if (initialValues.prioridad) {
                const prioridadId = getIdByKeyOrId(prioridades, initialValues.prioridad);
                if (prioridadId) {
                    formValues.prioridad = prioridadId;
                    console.log(`Prioridad mapeada: ${initialValues.prioridad} -> ${prioridadId}`);
                }
            }

            // Mapear estado
            if (initialValues.estado) {
                const estadoId = getIdByKeyOrId(estados, initialValues.estado);
                if (estadoId) {
                    formValues.estado = estadoId;
                    console.log(`Estado mapeado: ${initialValues.estado} -> ${estadoId}`);
                }
            }

            console.log('Estableciendo valores del formulario:', formValues);
            form.setFieldsValue(formValues);

            // Cargar relaciones si tiene tipos de relación disponibles y no han sido cargadas
            if (tiposRelacion.length > 0 && !relacionesCargadas) {
                cargarRelaciones(requisitoId);
            }

        } else {
            // MODO CREACIÓN
            setIsEditing(false);
            setRelacionesCargadas(true);
            console.log('Configurando modo creación');

            const valoresPorDefecto = {};

            // Establecer valores por defecto
            const estadoPorDefecto = findByKeyOrId(estados, 'pendiente') || estados[0];
            if (estadoPorDefecto) {
                valoresPorDefecto.estado = estadoPorDefecto.value;
                console.log('Estado por defecto:', estadoPorDefecto);
            }

            const prioridadPorDefecto = findByKeyOrId(prioridades, 'media') || prioridades[0];
            if (prioridadPorDefecto) {
                valoresPorDefecto.prioridad = prioridadPorDefecto.value;
                console.log('Prioridad por defecto:', prioridadPorDefecto);
            }

            form.setFieldsValue(valoresPorDefecto);
            setRelacionesRequisitos([]);
        }

    }, [
        // DEPENDENCIAS ESPECÍFICAS - No incluir funciones que cambien en cada render
        initialValues?.id,
        tiposRequisito.length,
        prioridades.length,
        estados.length,
        tiposRelacion.length,
    ]);

    useEffect(() => {
        // Solo resetear relacionesCargadas cuando cambie el ID del requisito
        const requisitoId = initialValues?.id;
        if (requisitoId && !relacionesCargadas && tiposRelacion.length > 0) {
            setRelacionesCargadas(false);
        }
    }, [initialValues?.id]);

    const handleSubmit = (values) => {
        console.log('Valores del formulario al enviar:', values);

        const finalValues = {
            ...values,
            proyecto_id: proyectoId,
            relaciones_requisitos: relacionesRequisitos.map(rel => ({
                requisito_id: parseInt(rel.requisito_id),
                tipo_relacion: parseInt(rel.tipo_relacion),
                descripcion: rel.descripcion || ''
            })).filter(rel => rel.requisito_id && rel.tipo_relacion)
        };

        if (isEditing && initialValues.id) {
            finalValues.id = initialValues.id;
        }

        console.log('Valores finales a enviar:', finalValues);
        onSubmit(finalValues);
    };

    // Funciones para relaciones
    const agregarRelacionRequisito = () => {
        const nuevaRelacion = {
            id: `temp_${Date.now()}_${Math.random()}`,
            requisito_id: '',
            tipo_relacion: '',
            descripcion: ''
        };
        setRelacionesRequisitos(prev => [...prev, nuevaRelacion]);
    };

    const eliminarRelacionRequisito = (id) => {
        setRelacionesRequisitos(prev => prev.filter(r => r.id !== id));
    };

    const actualizarRelacionRequisito = (id, campo, valor) => {
        setRelacionesRequisitos(prev => prev.map(r =>
            r.id === id ? { ...r, [campo]: valor } : r
        ));
    };

    // Funciones helper para obtener información
    const getItemByKey = useCallback((items, key) => {
        return items.find(item => item.key === key);
    }, []);

    const getRequisitoInfo = useCallback((requisitoId) => {
        return requisitosExistentes.find(r => r.id.toString() === requisitoId.toString());
    }, [requisitosExistentes]);

    return (
        <div className="form-container">
            <div className="form-header">
                <h2 className="form-title">
                    {isEditing ? "Editar Requisito" : "Crear Nuevo Requisito"}
                </h2>
                <p className="form-subtitle">
                    Los campos marcados con * son obligatorios según estándares de ingeniería de requisitos
                </p>
            </div>

            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    {/* === SECCIÓN DE CAMPOS OBLIGATORIOS === */}
                    <div className="form-section">
                        <h3 className="form-section-title">Información Básica (Obligatorio)</h3>

                        <Form.Item
                            name="nombre"
                            label="Nombre del Requisito *"
                            rules={[
                                { required: true, message: 'El nombre del requisito es obligatorio' },
                                { min: 5, message: 'El nombre debe tener al menos 5 caracteres' },
                                { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
                            ]}
                            className="form-field"
                        >
                            <Input
                                placeholder="Ej: El sistema debe permitir autenticación de usuarios"
                                showCount
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="descripcion"
                            label="Descripción del Requisito *"
                            rules={[
                                { required: true, message: 'La descripción del requisito es obligatoria' },
                                { min: 10, message: 'La descripción debe tener al menos 10 caracteres' },
                                { max: 500, message: 'La descripción no puede exceder 500 caracteres' }
                            ]}
                            className="form-field"
                        >
                            <TextArea
                                rows={4}
                                placeholder="Describe detalladamente qué debe cumplir el requisito..."
                                showCount
                                maxLength={500}
                            />
                        </Form.Item>

                        <Form.Item
                            name="tipo"
                            label="Tipo de Requisito *"
                            rules={[{ required: true, message: 'El tipo de requisito es obligatorio' }]}
                            className="form-field"
                        >
                            <Select
                                placeholder="Selecciona el tipo de requisito"
                                loading={loadingTipos}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option.children.props.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {tiposRequisito.map(tipo => (
                                    <Select.Option key={tipo.value} value={tipo.value} title={tipo.descripcion}>
                                        <Space>
                                            <div
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: tipo.color
                                                }}
                                            />
                                            {tipo.label}
                                        </Space>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="criterios"
                            label="Criterios de Validación/Aceptación *"
                            rules={[
                                { required: true, message: 'Los criterios de validación son obligatorios' },
                                { min: 10, message: 'Los criterios deben tener al menos 10 caracteres' },
                                { max: 500, message: 'Los criterios no pueden exceder 500 caracteres' }
                            ]}
                            className="form-field"
                        >
                            <TextArea
                                rows={4}
                                placeholder="Define las condiciones específicas que deben cumplirse para considerar el requisito satisfecho..."
                                showCount
                                maxLength={500}
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN DE CAMPOS OPCIONALES === */}
                    <div className="form-section">
                        <h3 className="form-section-title">Información Adicional (Opcional)</h3>

                        <Row gutter={16}>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="prioridad"
                                    label="Prioridad"
                                    className="form-field"
                                >
                                    <Select
                                        placeholder="Nivel de importancia"
                                        loading={loadingPrioridades}
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
                            </Col>

                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="estado"
                                    label="Estado del Requisito"
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
                            </Col>

                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="origen"
                                    label="Origen del Requisito"
                                    className="form-field"
                                >
                                    <Input placeholder="Ej: Cliente, Stakeholder, Análisis..." maxLength={100} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="condiciones_previas"
                            label="Condiciones Previas"
                            className="form-field"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Precondiciones necesarias para la implementación de este requisito..."
                                showCount
                                maxLength={300}
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN DE RELACIONES CON REQUISITOS === */}
                    <div className="form-section">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <LinkOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
                            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                                Relaciones con otros Requisitos
                            </Title>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Define las relaciones de dependencia, conflicto o complemento con otros requisitos del sistema
                        </p>

                        {/* Mostrar loading solo si está cargando relaciones por primera vez */}
                        {loadingRelaciones && relacionesRequisitos.length === 0 && isEditing && (
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

                        {/* Lista de relaciones de requisitos - Solo mostrar si no está cargando */}
                        {!loadingRelaciones && relacionesRequisitos.map((relacion) => {
                            const requisitoInfo = getRequisitoInfo(relacion.requisito_id);
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
                                            onClick={() => eliminarRelacionRequisito(relacion.id)}
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
                                                    placeholder="Tipo de relación"
                                                    value={relacion.tipo_relacion}
                                                    onChange={(value) => actualizarRelacionRequisito(relacion.id, 'tipo_relacion', value)}
                                                    style={{ width: '100%' }}
                                                    loading={loadingTiposRelacion}
                                                >
                                                    {tiposRelacion.map(tr => (
                                                        <Select.Option key={tr.value} value={tr.value} title={tr.descripcion}>
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
                                                    Requisito Relacionado
                                                </label>
                                                <Select
                                                    placeholder="Seleccionar requisito"
                                                    value={relacion.requisito_id}
                                                    onChange={(value) => actualizarRelacionRequisito(relacion.id, 'requisito_id', value)}
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) => {
                                                        const children = option.children;
                                                        if (typeof children === 'string') {
                                                            return children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                        }
                                                        // Para elementos más complejos, buscar en el texto del nombre
                                                        const nombre = children.props?.children?.[0]?.props?.children?.[0] || '';
                                                        return nombre.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                                    }}
                                                >
                                                    {requisitosExistentes
                                                        .filter(req => req.id !== initialValues.id)
                                                        .map(req => {
                                                            const tipoInfo = getItemByKey(tiposRequisito, req.tipo);
                                                            const prioridadInfo = getItemByKey(prioridades, req.prioridad);

                                                            return (
                                                                <Select.Option key={req.id} value={req.id.toString()}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                        <span style={{ fontWeight: 'medium' }}>{req.nombre}</span>
                                                                        <Space size={4}>
                                                                            {tipoInfo && (
                                                                                <Tag
                                                                                    color={tipoInfo.color}
                                                                                    style={{ margin: 0, fontSize: '10px' }}
                                                                                >
                                                                                    {tipoInfo.label}
                                                                                </Tag>
                                                                            )}
                                                                            {prioridadInfo && (
                                                                                <Tag
                                                                                    color={prioridadInfo.color}
                                                                                    style={{ margin: 0, fontSize: '10px' }}
                                                                                >
                                                                                    {prioridadInfo.label}
                                                                                </Tag>
                                                                            )}
                                                                        </Space>
                                                                    </div>
                                                                </Select.Option>
                                                            );
                                                        })}
                                                </Select>
                                                {requisitoInfo && (
                                                    <div style={{
                                                        marginTop: '4px',
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        padding: '4px 8px',
                                                        background: 'var(--bg-light)',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--border-color)'
                                                    }}>
                                                        {requisitoInfo.descripcion && requisitoInfo.descripcion.length > 80
                                                            ? `${requisitoInfo.descripcion.substring(0, 80)}...`
                                                            : requisitoInfo.descripcion}
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
                                                    onChange={(e) => actualizarRelacionRequisito(relacion.id, 'descripcion', e.target.value)}
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
                                onClick={agregarRelacionRequisito}
                                block
                                icon={<PlusOutlined />}
                                style={{ marginTop: relacionesRequisitos.length > 0 ? '1rem' : 0 }}
                            >
                                Agregar Relación con Requisito
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
                        {relacionesRequisitos.length === 0 && !loadingTiposRelacion && !loadingRelaciones && tiposRelacion.length > 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-light)',
                                borderRadius: 'var(--border-radius)',
                                border: '1px dashed var(--border-color)'
                            }}>
                                <LinkOutlined style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No hay relaciones con otros requisitos definidas</p>
                                <p style={{ fontSize: 'var(--font-size-sm)' }}>
                                    Las relaciones ayudan a entender las dependencias y conflictos entre requisitos
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
                                {isEditing ? "Actualizar Requisito" : "Crear Requisito"}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Spin>
        </div>
    );
};

export default RequisitosForm;