import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, Card, Tag, Typography, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

/**
 * Componente de formulario PURO - Solo renderizado
 * Toda la lógica está en el hook useRequisitos
 */
const RequisitosForm = ({
    // Valores
    initialValues = {},
    relacionesRequisitos = [],
    requisitosExistentes = [],
    proyectoId,

    // Catálogos
    tiposRequisito = [],
    prioridades = [],
    estados = [],
    tiposRelacion = [],

    // Estados
    loading = false,
    loadingRelaciones = false,
    isEditing = false,

    // Funciones
    onSubmit,
    onCancel,
    onAgregarRelacion,
    onActualizarRelacion,
    onEliminarRelacion,
    getRequisitoInfo,
    getItemByKey,
    cargarRelacionesExistentes
}) => {
    const [form] = Form.useForm();

    // Inicializar formulario con valores
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    const handleSubmit = (values) => {
        onSubmit(values);
    };

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
                    {/* === INFORMACIÓN BÁSICA === */}
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
                                showSearch
                                optionFilterProp="children"
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
                                placeholder="Define las condiciones específicas que deben cumplirse..."
                                showCount
                                maxLength={500}
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === INFORMACIÓN ADICIONAL === */}
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
                                    <Select placeholder="Estado actual">
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
                                placeholder="Precondiciones necesarias para la implementación..."
                                showCount
                                maxLength={300}
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === RELACIONES === */}
                    <div className="form-section">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <LinkOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
                            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                                Relaciones con otros Requisitos
                            </Title>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Define las relaciones de dependencia, conflicto o complemento con otros requisitos
                        </p>

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
                                            onClick={() => onEliminarRelacion(relacion.id)}
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
                                                    onChange={(value) => onActualizarRelacion(relacion.id, 'tipo_relacion', value)}
                                                    style={{ width: '100%' }}
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
                                                    onChange={(value) => onActualizarRelacion(relacion.id, 'requisito_id', value)}
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    optionFilterProp="children"
                                                >
                                                    {requisitosExistentes
                                                        .filter(req => req.id !== initialValues.id)
                                                        .map(req => {
                                                            const tipoInfo = getItemByKey('tipos_requisito', req.tipo);
                                                            const prioridadInfo = getItemByKey('prioridades', req.prioridad);

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
                                                    onChange={(e) => onActualizarRelacion(relacion.id, 'descripcion', e.target.value)}
                                                    maxLength={200}
                                                    showCount
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })}

                        {tiposRelacion.length > 0 && !loadingRelaciones && (
                            <Button
                                type="dashed"
                                onClick={onAgregarRelacion}
                                block
                                icon={<PlusOutlined />}
                                style={{ marginTop: relacionesRequisitos.length > 0 ? '1rem' : 0 }}
                            >
                                Agregar Relación con Requisito
                            </Button>
                        )}

                        {relacionesRequisitos.length === 0 && !loadingRelaciones && tiposRelacion.length > 0 && (
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