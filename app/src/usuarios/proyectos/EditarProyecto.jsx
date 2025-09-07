import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { getStoredToken, API_ENDPOINTS, postFormDataAuth } from "../../../config";
import '../../styles/forms.css';
import '../../styles/buttons.css';

const { Option } = Select;
const { Title } = Typography;

const EditarProyecto = ({ proyecto, onEditado, onBack }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (proyecto) {
            form.setFieldsValue({
                nombre: proyecto.nombre,
                descripcion: proyecto.descripcion,
                estado: proyecto.estado
            });
        }
    }, [proyecto, form]);

    const handleSubmit = async (values) => {
        if (!proyecto?.proyecto_id) {
            message.error("Error: No se encontró el ID del proyecto");
            return;
        }

        setLoading(true);
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("nombre", values.nombre);
        formData.append("descripcion", values.descripcion || "");
        formData.append("estado", values.estado);

        try {
            const res = await postFormDataAuth(
                `${API_ENDPOINTS.EDITAR_PROYECTO}/${proyecto.proyecto_id}/`, 
                formData, 
                token
            );
            message.success(res.mensaje || "Proyecto actualizado exitosamente");
            onEditado();
        } catch (error) {
            message.error(error.message);
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
                <EditOutlined style={{ fontSize: '2rem', color: 'var(--warning-color)', marginBottom: '0.5rem' }} />
                <Title level={3} className="form-title">Editar Proyecto</Title>
                <p className="form-subtitle">
                    Modifica la información de "{proyecto.nombre}"
                </p>
            </div>

            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                requiredMark={false}
            >
                <Form.Item
                    label="Nombre del Proyecto"
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
                    />
                </Form.Item>

                <Form.Item
                    label="Descripción"
                    name="descripcion"
                    className="form-field"
                    rules={[
                        { max: 500, message: "La descripción no puede exceder 500 caracteres" }
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Descripción del proyecto (opcional)"
                        showCount
                        maxLength={500}
                    />
                </Form.Item>

                <Form.Item
                    label="Estado del Proyecto"
                    name="estado"
                    className="form-field"
                    rules={[{ required: true, message: "El estado es requerido" }]}
                >
                    <Select size="large">
                        <Option value="Requisitos">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: 'var(--primary-color)',
                                    borderRadius: '50%'
                                }}></span>
                                Requisitos
                            </div>
                        </Option>
                        <Option value="Generación">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: 'var(--success-color)',
                                    borderRadius: '50%'
                                }}></span>
                                Generación
                            </div>
                        </Option>
                    </Select>
                </Form.Item>

                <div className="form-actions">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleCancel}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                        className="btn btn-primary"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditarProyecto;