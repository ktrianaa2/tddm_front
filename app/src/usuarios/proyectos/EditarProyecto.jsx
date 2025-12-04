import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined, EditOutlined, ProjectOutlined } from '@ant-design/icons';
import '../../styles/forms.css';
import '../../styles/buttons.css';

const { Title } = Typography;

const EditarProyecto = ({ proyecto, onEditado, onBack, editarProyecto }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (proyecto) {
            form.setFieldsValue({
                nombre: proyecto.nombre,
                descripcion: proyecto.descripcion
            });
        }
    }, [proyecto, form]);

    const handleSubmit = async (values) => {
        if (!proyecto?.proyecto_id) {
            message.error("Error: No se encontró el ID del proyecto");
            return;
        }

        setLoading(true);
        try {
            const result = await editarProyecto(proyecto.proyecto_id, values);
            if (result.success) {
                onEditado();
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

    if (!proyecto) {
        return (
            <div className="form-container">
                <div className="form-header">
                    <Title level={3}>Error</Title>
                    <p>No se pudo cargar la información del proyecto</p>
                </div>
                <Button onClick={handleCancel}>
                    Regresar
                </Button>
            </div>
        );
    }

    return (
        <div className={`form-container ${loading ? 'form-loading' : ''}`}>
            <div className="form-header">
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, var(--warning-color), var(--warning-hover))',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                }}>
                    <EditOutlined style={{ fontSize: '2rem', color: 'white' }} />
                </div>
                <Title level={3} className="form-title">Editar Proyecto</Title>
                <p className="form-subtitle">
                    Modifica la información de <strong>"{proyecto.nombre}"</strong>
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
                        { required: true, message: "El nombre es requerido" },
                        { min: 3, message: "El nombre debe tener al menos 3 caracteres" },
                        { max: 100, message: "El nombre no puede exceder 100 caracteres" }
                    ]}
                >
                    <Input
                        placeholder="Nombre del proyecto"
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
                        placeholder="Descripción del proyecto..."
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
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditarProyecto;