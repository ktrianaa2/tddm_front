import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, InputNumber, Spin, Alert, Card, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

const HistoriasUsuarioForm = ({
    initialValues = {},
    onSubmit,
    onCancel,
    historiasExistentes = [],
    proyectoId,
    loading = false,

    // Datos de los catálogos
    prioridades = [],
    estados = [],
    unidadesEstimacion = [],

    // Estados de carga
    loadingPrioridades = false,
    loadingEstados = false,
    loadingUnidadesEstimacion = false,

    // Estados de error
    errorPrioridades = null,
    errorEstados = null,
    errorUnidadesEstimacion = null,

    // Funciones utilitarias
    retryFunctions = {}
}) => {
    const [form] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);
    const [estimaciones, setEstimaciones] = useState([]);

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

    const getItemByKey = useCallback((items, value) => {
        return items.find(item => item.value === value);
    }, []);

    useEffect(() => {
        // Verificar que los catálogos básicos estén disponibles
        const catalogosBasicosDisponibles = prioridades.length > 0 &&
            estados.length > 0 &&
            unidadesEstimacion.length > 0;

        if (!catalogosBasicosDisponibles) {
            return;
        }

        // Verificar si es edición o creación
        const historiaId = initialValues?.id;
        const esNuevaHistoria = !historiaId;

        if (historiaId) {
            // MODO EDICIÓN
            setIsEditing(true);

            // Preparar valores para edición
            const formValues = {
                descripcion_historia: initialValues.descripcion_historia || initialValues.descripcion || '',
                actor_rol: initialValues.actor_rol || '',
                funcionalidad_accion: initialValues.funcionalidad_accion || '',
                beneficio_razon: initialValues.beneficio_razon || '',
                criterios_aceptacion: initialValues.criterios_aceptacion || '',
                dependencias_relaciones: initialValues.dependencias_relaciones || '',
                componentes_relacionados: initialValues.componentes_relacionados || '',
                valor_negocio: initialValues.valor_negocio || '',
                notas_adicionales: initialValues.notas_adicionales || '',
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

            form.setFieldsValue(formValues);
            const estimacionesParaFormulario = [];
            // Procesar múltiples estimaciones (formato nuevo)
            if (initialValues.estimaciones && Array.isArray(initialValues.estimaciones) && initialValues.estimaciones.length > 0) {

                initialValues.estimaciones.forEach((est, index) => {

                    let unidadId = null;

                    // Intentar diferentes formas de obtener el ID de la unidad
                    if (est.tipo_estimacion_id) {
                        unidadId = est.tipo_estimacion_id.toString();
                    } else if (est.tipo_estimacion_nombre) {
                        // Buscar por nombre del tipo
                        unidadId = getIdByKeyOrId(unidadesEstimacion, est.tipo_estimacion_nombre);
                    } else if (est.unidad_estimacion) {
                        // Formato legacy
                        unidadId = getIdByKeyOrId(unidadesEstimacion, est.unidad_estimacion);
                    }

                    // Verificar que tenemos tanto unidad como valor válidos
                    if (unidadId && (est.valor !== null && est.valor !== undefined)) {
                        const estimacionFormulario = {
                            id: est.id || `existing_${Date.now()}_${index}`,
                            unidad_estimacion: unidadId,
                            valor: est.valor
                        };

                        estimacionesParaFormulario.push(estimacionFormulario);
                    }
                });
            }
            // Procesar estimación única (formato legacy de compatibilidad)
            else if (initialValues.estimacion_valor && initialValues.unidad_estimacion) {

                const unidadId = getIdByKeyOrId(unidadesEstimacion, initialValues.unidad_estimacion);

                if (unidadId) {
                    const estimacionFormulario = {
                        id: `existing_single_${Date.now()}`,
                        unidad_estimacion: unidadId,
                        valor: initialValues.estimacion_valor
                    };

                    estimacionesParaFormulario.push(estimacionFormulario);
                }
            }

            setEstimaciones(estimacionesParaFormulario);

        } else {
            // MODO CREACIÓN
            setIsEditing(false);

            const valoresPorDefecto = {};

            // Establecer valores por defecto
            const estadoPorDefecto = findByKeyOrId(estados, 'pendiente') || estados[0];
            if (estadoPorDefecto) {
                valoresPorDefecto.estado = estadoPorDefecto.value;
            }

            const prioridadPorDefecto = findByKeyOrId(prioridades, 'media') || prioridades[0];
            if (prioridadPorDefecto) {
                valoresPorDefecto.prioridad = prioridadPorDefecto.value;
            }

            form.setFieldsValue(valoresPorDefecto);
            setEstimaciones([]);
        }

    }, [
        initialValues?.id,
        prioridades.length,
        estados.length,
        unidadesEstimacion.length,
        findByKeyOrId,
        getIdByKeyOrId,
        form
    ]);

    const handleSubmit = (values) => {
        // Validación básica
        if (!values.descripcion_historia && (!values.actor_rol || !values.funcionalidad_accion || !values.beneficio_razon)) {
            message.error('Debes completar la descripción o todos los campos de la narrativa (Actor, Acción, Beneficio)');
            return;
        }

        if (!values.criterios_aceptacion || values.criterios_aceptacion.trim().length < 10) {
            message.error('Los criterios de aceptación son obligatorios y deben tener al menos 10 caracteres');
            return;
        }

        // Si no hay descripción pero sí hay narrativa completa, generarla automáticamente
        if (!values.descripcion_historia && values.actor_rol && values.funcionalidad_accion && values.beneficio_razon) {
            values.descripcion_historia = `Como ${values.actor_rol}, quiero ${values.funcionalidad_accion} para ${values.beneficio_razon}`;
        }
        const finalValues = {
            ...values,
            proyecto_id: proyectoId
        };

        // Procesar estimaciones desde el estado local
        if (estimaciones && Array.isArray(estimaciones) && estimaciones.length > 0) {
            const estimacionesProcesadas = estimaciones
                .filter(est => {
                    const tieneUnidad = est.unidad_estimacion && est.unidad_estimacion !== '';
                    const tieneValor = est.valor !== null && est.valor !== undefined && est.valor !== '';
                    const valorNumerico = parseFloat(est.valor);
                    const valorValido = !isNaN(valorNumerico) && valorNumerico > 0;
                    return tieneUnidad && tieneValor && valorValido;
                })
                .map(est => {
                    const estimacionParaBackend = {
                        tipo_estimacion_id: parseInt(est.unidad_estimacion),
                        valor: parseFloat(est.valor)
                    };
                    return estimacionParaBackend;
                });

            finalValues.estimaciones = estimacionesProcesadas;
        } else {
            finalValues.estimaciones = [];
        }

        // Mantener compatibilidad con campos individuales si solo hay una estimación
        if (finalValues.estimaciones.length === 1) {
            finalValues.estimacion_valor = finalValues.estimaciones[0].valor;
            finalValues.unidad_estimacion = finalValues.estimaciones[0].tipo_estimacion_id;
        }

        // Si estamos editando, incluir el ID
        if (isEditing && initialValues.id) {
            finalValues.id = initialValues.id;
        }
        // Llamar a la función onSubmit del componente padre
        onSubmit(finalValues);
    };

    // Funciones para estimaciones
    const agregarEstimacion = () => {
        const nuevaEstimacion = {
            id: `temp_${Date.now()}_${Math.random()}`,
            unidad_estimacion: '',
            valor: ''
        };
        setEstimaciones(prev => [...prev, nuevaEstimacion]);
    };

    const eliminarEstimacion = (id) => {
        setEstimaciones(prev => prev.filter(e => e.id !== id));
    };

    const actualizarEstimacion = (id, campo, valor) => {
        setEstimaciones(prev => prev.map(e =>
            e.id === id ? { ...e, [campo]: valor } : e
        ));
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2 className="form-title">
                    {isEditing ? "Editar Historia de Usuario" : "Nueva Historia de Usuario"}
                </h2>
                <p className="form-subtitle">
                    Completa la plantilla siguiendo el formato estándar de historias de usuario
                </p>
            </div>

            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >

                    {/* === SECCIÓN 1: NARRATIVA PRINCIPAL === */}
                    <div className="form-section">
                        <h3 className="form-section-title">Narrativa de la Historia *</h3>
                        <Row gutter={16}>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="actor_rol"
                                    label="Como (Actor/Rol)"
                                    rules={[{ required: true, message: 'El actor/rol es obligatorio' }]}
                                    className="form-field"
                                >
                                    <Input placeholder="Ej: Usuario registrado, Administrador" maxLength={50} showCount />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="funcionalidad_accion"
                                    label="Quiero (Acción/Funcionalidad)"
                                    rules={[{ required: true, message: 'La acción es obligatoria' }]}
                                    className="form-field"
                                >
                                    <Input placeholder="Ej: iniciar sesión en la aplicación" maxLength={100} showCount />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="beneficio_razon"
                                    label="Para (Beneficio/Razón)"
                                    rules={[{ required: true, message: 'El beneficio es obligatorio' }]}
                                    className="form-field"
                                >
                                    <Input placeholder="Ej: acceder a mis configuraciones" maxLength={100} showCount />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="descripcion_historia"
                            label="Descripción Completa"
                            className="form-field"
                            extra="Se genera automáticamente a partir de los campos anteriores, pero puedes editarla."
                        >
                            <TextArea
                                rows={3}
                                placeholder="Como usuario registrado, quiero iniciar sesión en la aplicación para acceder a mis datos..."
                                maxLength={300}
                                showCount
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN 2: CRITERIOS DE ACEPTACIÓN === */}
                    <div className="form-section">
                        <h3 className="form-section-title">Criterios de Aceptación *</h3>
                        <Form.Item
                            name="criterios_aceptacion"
                            rules={[{ required: true, message: 'Debes definir al menos un criterio de aceptación' }]}
                            className="form-field"
                        >
                            <TextArea
                                rows={6}
                                placeholder="- El usuario ingresa email y contraseña
- El sistema valida credenciales
- Si son correctas, redirige al dashboard
- Si son incorrectas, muestra error"
                                maxLength={800}
                                showCount
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN 3: INFORMACIÓN ADICIONAL === */}
                    <div className="form-section">
                        <h3 className="form-section-title">Información Adicional</h3>

                        <Row gutter={16}>
                            <Col xs={24} sm={8}>
                                <Form.Item name="prioridad" label="Prioridad" className="form-field">
                                    <Select
                                        placeholder="Nivel de importancia"
                                        loading={loadingPrioridades}
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.children.props.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
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
                                {errorPrioridades && (
                                    <Alert
                                        message="Error cargando prioridades"
                                        type="error"
                                        size="small"
                                        showIcon
                                    />
                                )}
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item name="estado" label="Estado de la Historia" className="form-field">
                                    <Select
                                        placeholder="Estado actual"
                                        loading={loadingEstados}
                                        showSearch
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.children.props.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
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
                                {errorEstados && (
                                    <Alert
                                        message="Error cargando estados"
                                        type="error"
                                        size="small"
                                        showIcon
                                    />
                                )}
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item name="valor_negocio" label="Valor de Negocio" className="form-field">
                                    <InputNumber
                                        placeholder="1 - 100"
                                        min={1}
                                        max={100}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="dependencias_relaciones" label="Dependencias / Relaciones" className="form-field">
                            <TextArea
                                rows={3}
                                placeholder="Ej: Depende de HU-001, parte de épica Autenticación"
                                maxLength={300}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item name="componentes_relacionados" label="Componentes Relacionados" className="form-field">
                            <Input placeholder="Ej: Módulo de autenticación, BD" maxLength={150} showCount />
                        </Form.Item>

                        <Form.Item name="notas_adicionales" label="Notas Adicionales" className="form-field">
                            <TextArea
                                rows={3}
                                placeholder="Mockups, consideraciones técnicas, información extra..."
                                maxLength={400}
                                showCount
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN 4: ESTIMACIONES === */}
                    <div className="form-section">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <CalculatorOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
                            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                                Estimaciones de Esfuerzo
                            </Title>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Define una o múltiples estimaciones usando diferentes unidades de medida (Story Points, Horas, T-Shirt Sizes, etc.)
                        </p>

                        {/* Lista de estimaciones */}
                        {estimaciones.map((estimacion) => {
                            const unidadInfo = getItemByKey(unidadesEstimacion, estimacion.unidad_estimacion);
                            return (
                                <Card
                                    key={estimacion.id}
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
                                            onClick={() => eliminarEstimacion(estimacion.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    }
                                >
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12}>
                                            <div className="form-field">
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '4px',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 'var(--font-weight-medium)',
                                                    fontSize: 'var(--font-size-sm)'
                                                }}>
                                                    Unidad de Estimación
                                                </label>
                                                <Select
                                                    placeholder="Selecciona unidad"
                                                    value={estimacion.unidad_estimacion}
                                                    onChange={(value) => actualizarEstimacion(estimacion.id, 'unidad_estimacion', value)}
                                                    style={{ width: '100%' }}
                                                    loading={loadingUnidadesEstimacion}
                                                    showSearch
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) =>
                                                        option.children.props.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                >
                                                    {unidadesEstimacion.map(ue => (
                                                        <Select.Option key={ue.value} value={ue.value} title={ue.descripcion}>
                                                            <Space>
                                                                <div
                                                                    style={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: '50%',
                                                                        backgroundColor: ue.color
                                                                    }}
                                                                />
                                                                {ue.label}
                                                            </Space>
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                                {unidadInfo && (
                                                    <div style={{
                                                        marginTop: '4px',
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        padding: '4px 8px',
                                                        background: 'var(--bg-light)',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--border-color)'
                                                    }}>
                                                        {unidadInfo.descripcion}
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <div className="form-field">
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '4px',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 'var(--font-weight-medium)',
                                                    fontSize: 'var(--font-size-sm)'
                                                }}>
                                                    Valor de Estimación
                                                </label>
                                                <InputNumber
                                                    placeholder="Valor estimado"
                                                    value={estimacion.valor}
                                                    onChange={(value) => actualizarEstimacion(estimacion.id, 'valor', value)}
                                                    min={0}
                                                    max={999}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })}

                        {/* Botón para agregar nueva estimación - solo si hay unidades de estimación cargadas */}
                        {unidadesEstimacion.length > 0 && (
                            <Button
                                type="dashed"
                                onClick={agregarEstimacion}
                                block
                                icon={<PlusOutlined />}
                                style={{ marginTop: estimaciones.length > 0 ? '1rem' : 0 }}
                            >
                                Agregar Estimación
                            </Button>
                        )}

                        {/* Mensaje de carga para unidades de estimación */}
                        {loadingUnidadesEstimacion && unidadesEstimacion.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '1rem',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-light)',
                                borderRadius: 'var(--border-radius)',
                                border: '1px dashed var(--border-color)'
                            }}>
                                <Spin size="small" />
                                <p style={{ marginTop: '8px', marginBottom: 0 }}>Cargando unidades de estimación...</p>
                            </div>
                        )}

                        {/* Mensaje de error para unidades de estimación */}
                        {errorUnidadesEstimacion && unidadesEstimacion.length === 0 && (
                            <Alert
                                message="Error cargando unidades de estimación"
                                description={
                                    <div>
                                        <p>{errorUnidadesEstimacion}</p>
                                        {retryFunctions.cargarUnidadesEstimacion && (
                                            <Button
                                                size="small"
                                                onClick={retryFunctions.cargarUnidadesEstimacion}
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
                        {estimaciones.length === 0 && !loadingUnidadesEstimacion && unidadesEstimacion.length > 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-light)',
                                borderRadius: 'var(--border-radius)',
                                border: '1px dashed var(--border-color)'
                            }}>
                                <CalculatorOutlined style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No hay estimaciones definidas para esta historia</p>
                                <p style={{ fontSize: 'var(--font-size-sm)' }}>
                                    Las estimaciones ayudan a planificar el desarrollo y asignar recursos
                                </p>
                            </div>
                        )}
                    </div>

                    <Divider />

                    {/* === ACCIONES === */}
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
                                {isEditing ? "Actualizar Historia" : "Crear Historia"}
                            </Button>
                        </Space>
                    </div>

                </Form>
            </Spin>
        </div>
    );
};

export default HistoriasUsuarioForm;