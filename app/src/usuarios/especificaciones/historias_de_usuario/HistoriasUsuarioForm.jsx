import React from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, InputNumber } from 'antd';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;

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

const HistoriasUsuarioForm = ({ initialValues = {}, onSubmit, onCancel }) => {
    const [form] = Form.useForm();

    const handleSubmit = (values) => {
        // Autogenerar descripción si no se escribe manualmente
        if (!values.descripcion_historia && values.actor_rol && values.funcionalidad_accion && values.beneficio_razon) {
            values.descripcion_historia = `Como ${values.actor_rol}, quiero ${values.funcionalidad_accion} para ${values.beneficio_razon}`;
        }
        onSubmit(values);
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2 className="form-title">
                    {initialValues.id ? "Editar Historia de Usuario" : "Nueva Historia de Usuario"}
                </h2>
                <p className="form-subtitle">
                    Completa la plantilla siguiendo el formato estándar de historias de usuario
                </p>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
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
                                <Select placeholder="Nivel de importancia">
                                    {prioridades.map(p => (
                                        <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item name="estado" label="Estado de la Historia" className="form-field">
                                <Select placeholder="Estado actual">
                                    {estados.map(e => (
                                        <Select.Option key={e.value} value={e.value}>{e.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item name="valor_negocio" label="Valor de Negocio" className="form-field">
                                <InputNumber placeholder="1 - 100" min={1} max={100} style={{ width: '100%' }} />
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

                {/* === SECCIÓN DE ESTIMACIONES === */}
                <div className="form-section">
                    <h3 className="form-section-title">Estimaciones</h3>

                    <Form.Item label="Unidad de Estimación" className="form-field">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Tipo</th>
                                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Estimación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unidadesEstimacion.map((ue) => (
                                    <tr key={ue.value}>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                            {ue.label}
                                        </td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                            <Form.Item
                                                name={['estimaciones', ue.value]}
                                                style={{ margin: 0 }}
                                            >
                                                <InputNumber
                                                    min={0}
                                                    max={999}
                                                    placeholder="Valor"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Form.Item>
                </div>


                {/* === ACCIONES === */}
                <div className="form-actions">
                    <Space size="middle">
                        <Button onClick={onCancel} className="btn btn-secondary" size="large">
                            Cancelar
                        </Button>
                        <Button htmlType="submit" className="btn btn-primary" size="large">
                            {initialValues.id ? "Actualizar Historia" : "Crear Historia"}
                        </Button>
                    </Space>
                </div>

            </Form>
        </div>
    );
};

export default HistoriasUsuarioForm;
