import React, { useState } from "react";
import { Form, Input, Button, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined, ProjectOutlined } from '@ant-design/icons';
import '../../styles/forms.css';
import '../../styles/buttons.css';

const { Title } = Typography;

const CrearProyecto = ({ onCreado, onBack, crearProyecto }) => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const result = await crearProyecto(values);
            if (result.success) {
                form.resetFields();
                onCreado();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (onBack) {
            onBack();
        }
    };

    return (
        <div className={`form-container ${loading ? 'form-loading' : ''}`}>
            <div className="form-header">
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    boxShadow: 'var(--shadow-primary)'
                }}>
                    <ProjectOutlined style={{ fontSize: '2rem', color: 'white' }} />
                </div>
                <Title level={3} className="form-title">Crear Nuevo Proyecto</Title>
                <p className="form-subtitle">
                    Completa la información para crear tu nuevo proyecto
                </p>
            </div>

            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                requiredMark={false}
            >
                <Form.Item
                    label={
                        <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-medium)' }}>
                            Nombre del Proyecto
                        </span>
                    }
                    name="nombre"
                    className="form-field"
                    rules={[
                        { required: true, message: "Por favor ingrese el nombre del proyecto" },
                        { min: 3, message: "El nombre debe tener al menos 3 caracteres" },
                        { max: 100, message: "El nombre no puede exceder 100 caracteres" }
                    ]}
                >
                    <Input
                        placeholder="Ej: Sistema de Gestión de Inventario"
                        size="large"
                        prefix={<ProjectOutlined style={{ color: 'var(--text-tertiary)' }} />}
                    />
                </Form.Item>

                <Form.Item
                    label={
                        <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-medium)' }}>
                            Descripción <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(opcional)</span>
                        </span>
                    }
                    name="descripcion"
                    className="form-field"
                    rules={[
                        { max: 500, message: "La descripción no puede exceder 500 caracteres" }
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Describe brevemente el propósito y alcance de tu proyecto..."
                        showCount
                        maxLength={500}
                        style={{ resize: 'none' }}
                    />
                </Form.Item>

                <div className="form-actions">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleCancel}
                        className="btn btn-secondary"
                        disabled={loading}
                        size="large"
                    >
                        Cancelar
                    </Button>
                    <Button
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                        className="btn btn-primary"
                        size="large"
                    >
                        {loading ? 'Creando...' : 'Crear Proyecto'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CrearProyecto;