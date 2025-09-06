import React from 'react';
import { Form, Input, Select, Button, Divider, Space } from 'antd';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;

const tiposRequisito = [
    { value: 'funcional', label: 'Funcional' },
    { value: 'no-funcional', label: 'No Funcional' },
    { value: 'negocio', label: 'Negocio' },
    { value: 'tecnico', label: 'Técnico' }
];

const prioridades = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
];

const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en-desarrollo', label: 'En desarrollo' },
    { value: 'completado', label: 'Completado' }
];

const RequisitoForm = ({ initialValues = {}, onSubmit, onCancel }) => {
    const [form] = Form.useForm();

    return (
        <div className="form-container">
            <div className="form-header">
                <h2 className="form-title">
                    {initialValues.id ? "Editar Requisito" : "Crear Requisito"}
                </h2>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={onSubmit}
            >
                {/* === CAMPOS OBLIGATORIOS === */}
                <Form.Item
                    name="nombre"
                    label="Nombre del Requisito"
                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                    className="form-field"
                >
                    <Input placeholder="Ej: El sistema debe permitir login de usuarios" />
                </Form.Item>

                <Form.Item
                    name="descripcion"
                    label="Descripción del Requisito"
                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                    className="form-field"
                >
                    <TextArea rows={4} placeholder="Describe el requisito..." />
                </Form.Item>

                <Form.Item
                    name="tipo"
                    label="Tipo de Requisito"
                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                    className="form-field"
                >
                    <Select placeholder="Selecciona el tipo">
                        {tiposRequisito.map(tipo => (
                            <Select.Option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="criterios"
                    label="Criterios de validación/aceptación"
                    rules={[{ required: true, message: 'Campo obligatorio' }]}
                    className="form-field"
                >
                    <TextArea rows={3} placeholder="Condiciones que deben cumplirse..." />
                </Form.Item>

                <Divider />

                {/* === CAMPOS OPCIONALES === */}
                <Form.Item
                    name="prioridad"
                    label="Prioridad"
                    className="form-field"
                >
                    <Select placeholder="Selecciona la prioridad">
                        {prioridades.map(p => (
                            <Select.Option key={p.value} value={p.value}>
                                {p.label}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="estado"
                    label="Estado"
                    className="form-field"
                >
                    <Select placeholder="Selecciona el estado">
                        {estados.map(e => (
                            <Select.Option key={e.value} value={e.value}>
                                {e.label}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="origen"
                    label="Origen del requisito"
                    className="form-field"
                >
                    <Input placeholder="Ej: Stakeholder, Cliente, Documento X..." />
                </Form.Item>

                <Form.Item
                    name="relacionados"
                    label="Requisitos relacionados"
                    className="form-field"
                >
                    <Input placeholder="IDs o nombres de requisitos relacionados" />
                </Form.Item>

                <Form.Item
                    name="condiciones"
                    label="Condiciones previas"
                    className="form-field"
                >
                    <TextArea rows={2} placeholder="Precondiciones necesarias..." />
                </Form.Item>

                <div className="form-actions">
                    <Space>
                        <Button onClick={onCancel} className="btn btn-secondary">
                            Cancelar
                        </Button>
                        <Button htmlType="submit" className="btn btn-primary">
                            {initialValues.id ? "Actualizar" : "Crear"}
                        </Button>
                    </Space>
                </div>

            </Form>
        </div>
    );
};

export default RequisitoForm;
