import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, Card, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined, CloseOutlined } from '@ant-design/icons';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

const tiposRequisito = [
    { value: 'funcional', label: 'Funcional', color: '#1890ff' },
    { value: 'no-funcional', label: 'No Funcional', color: '#52c41a' },
    { value: 'negocio', label: 'Negocio', color: '#fa8c16' },
    { value: 'tecnico', label: 'Técnico', color: '#722ed1' },
    { value: 'sistema', label: 'Sistema', color: '#13c2c2' },
    { value: 'interfaz', label: 'Interfaz', color: '#eb2f96' }
];

const prioridades = [
    { value: 'critica', label: 'Crítica', color: '#ff4d4f' },
    { value: 'alta', label: 'Alta', color: '#fa8c16' },
    { value: 'media', label: 'Media', color: '#fadb14' },
    { value: 'baja', label: 'Baja', color: '#52c41a' }
];

const estados = [
    { value: 'pendiente', label: 'Pendiente', color: '#d9d9d9' },
    { value: 'en-desarrollo', label: 'En desarrollo', color: '#1890ff' },
    { value: 'en-revision', label: 'En revisión', color: '#fa8c16' },
    { value: 'completado', label: 'Completado', color: '#52c41a' },
    { value: 'cancelado', label: 'Cancelado', color: '#ff4d4f' }
];

const tiposRelacion = [
    { value: 'depende', label: 'Depende de', description: 'Este requisito depende del requisito relacionado' },
    { value: 'bloquea', label: 'Bloquea a', description: 'Este requisito bloquea al requisito relacionado' },
    { value: 'conflicto', label: 'En conflicto con', description: 'Este requisito está en conflicto con el relacionado' },
    { value: 'complementa', label: 'Complementa a', description: 'Este requisito complementa al requisito relacionado' },
    { value: 'deriva', label: 'Deriva de', description: 'Este requisito deriva del requisito relacionado' },
    { value: 'refina', label: 'Refina a', description: 'Este requisito refina al requisito relacionado' }
];

const RequisitosForm = ({
    initialValues = {},
    onSubmit,
    onCancel,
    requisitosExistentes = [], // Lista de requisitos ya registrados
    onLoadRequisitos // Función para cargar requisitos si es necesario
}) => {
    const [form] = Form.useForm();
    const [relacionesRequisitos, setRelacionesRequisitos] = useState(initialValues.relaciones_requisitos || []);

    useEffect(() => {
        // Cargar requisitos existentes si es necesario
        if (onLoadRequisitos && requisitosExistentes.length === 0) {
            onLoadRequisitos();
        }
    }, [onLoadRequisitos, requisitosExistentes]);

    const handleSubmit = (values) => {
        // Incluir las relaciones en los valores del formulario
        const finalValues = {
            ...values,
            relaciones_requisitos: relacionesRequisitos
        };
        onSubmit(finalValues);
    };

    // Agregar nueva relación de requisito
    const agregarRelacionRequisito = () => {
        const nuevaRelacion = {
            id: Date.now(),
            requisito_id: '',
            tipo_relacion: '',
            descripcion: ''
        };
        setRelacionesRequisitos([...relacionesRequisitos, nuevaRelacion]);
    };

    // Eliminar relación de requisito
    const eliminarRelacionRequisito = (id) => {
        setRelacionesRequisitos(relacionesRequisitos.filter(r => r.id !== id));
    };

    // Actualizar relación de requisito
    const actualizarRelacionRequisito = (id, campo, valor) => {
        setRelacionesRequisitos(relacionesRequisitos.map(r =>
            r.id === id ? { ...r, [campo]: valor } : r
        ));
    };

    // Obtener el color del tipo de un requisito
    const getColorTipo = (tipo) => {
        const tipoObj = tiposRequisito.find(t => t.value === tipo);
        return tipoObj ? tipoObj.color : '#d9d9d9';
    };

    // Obtener el color de la prioridad de un requisito
    const getColorPrioridad = (prioridad) => {
        const prioridadObj = prioridades.find(p => p.value === prioridad);
        return prioridadObj ? prioridadObj.color : '#d9d9d9';
    };

    // Obtener información del requisito por ID
    const getRequisitoInfo = (requisitoId) => {
        return requisitosExistentes.find(r => r.id === requisitoId);
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2 className="form-title">
                    {initialValues.id ? "Editar Requisito" : "Crear Nuevo Requisito"}
                </h2>
                <p className="form-subtitle">
                    Los campos marcados con * son obligatorios según estándares de ingeniería de requisitos
                </p>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={handleSubmit}
                size="large"
            >
                {/* === SECCIÓN DE CAMPOS OBLIGATORIOS === */}
                <div className="form-section">
                    <h3 className="form-section-title">Información Básica (Obligatorio)</h3>

                    <Form.Item
                        name="nombre"
                        label="Nombre del Requisito *"
                        rules={[{ required: true, message: 'El nombre del requisito es obligatorio' }]}
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
                        rules={[{ required: true, message: 'La descripción del requisito es obligatoria' }]}
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
                        <Select placeholder="Selecciona el tipo de requisito">
                            {tiposRequisito.map(tipo => (
                                <Select.Option key={tipo.value} value={tipo.value}>
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
                        rules={[{ required: true, message: 'Los criterios de validación son obligatorios' }]}
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
                                <Select placeholder="Nivel de importancia">
                                    {prioridades.map(p => (
                                        <Select.Option key={p.value} value={p.value}>
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
                                <Select placeholder="Estado actual">
                                    {estados.map(e => (
                                        <Select.Option key={e.value} value={e.value}>
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
                                <Input placeholder="Ej: Cliente, Stakeholder, Análisis..." />
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

                    {/* Lista de relaciones de requisitos */}
                    {relacionesRequisitos.map((relacion) => {
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
                                                Requisito Relacionado
                                            </label>
                                            <Select
                                                placeholder="Seleccionar requisito"
                                                value={relacion.requisito_id}
                                                onChange={(value) => actualizarRelacionRequisito(relacion.id, 'requisito_id', value)}
                                                style={{ width: '100%' }}
                                                showSearch
                                                optionFilterProp="children"
                                            >
                                                {requisitosExistentes
                                                    .filter(req => req.id !== initialValues.id) // Filtrar el requisito actual
                                                    .map(req => (
                                                        <Select.Option key={req.id} value={req.id}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span style={{ fontWeight: 'medium' }}>{req.nombre}</span>
                                                                <Space size={4}>
                                                                    <Tag
                                                                        color={getColorTipo(req.tipo)}
                                                                        style={{ margin: 0, fontSize: '10px' }}
                                                                    >
                                                                        {tiposRequisito.find(t => t.value === req.tipo)?.label}
                                                                    </Tag>
                                                                    {req.prioridad && (
                                                                        <Tag
                                                                            color={getColorPrioridad(req.prioridad)}
                                                                            style={{ margin: 0, fontSize: '10px' }}
                                                                        >
                                                                            {prioridades.find(p => p.value === req.prioridad)?.label}
                                                                        </Tag>
                                                                    )}
                                                                </Space>
                                                            </div>
                                                        </Select.Option>
                                                    ))}
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

                    {/* Botón para agregar nueva relación */}
                    <Button
                        type="dashed"
                        onClick={agregarRelacionRequisito}
                        block
                        icon={<PlusOutlined />}
                        style={{ marginTop: relacionesRequisitos.length > 0 ? '1rem' : 0 }}
                    >
                        Agregar Relación con Requisito
                    </Button>

                    {/* Estado vacío */}
                    {relacionesRequisitos.length === 0 && (
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
                        <Button onClick={onCancel} className="btn btn-secondary" size="large">
                            Cancelar
                        </Button>
                        <Button htmlType="submit" className="btn btn-primary" size="large">
                            {initialValues.id ? "Actualizar Requisito" : "Crear Requisito"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </div>
    );
};

export default RequisitosForm;