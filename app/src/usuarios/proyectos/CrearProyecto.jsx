import React, { useState } from "react";
import { Form, Input, Select, Button, message, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined, ProjectOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { getStoredToken, API_ENDPOINTS, postFormDataAuth } from "../../../config";
import '../../styles/forms.css';
import '../../styles/buttons.css';

const { Option } = Select;
const { Title } = Typography;

const CrearProyecto = ({ onCreado }) => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        setLoading(true);
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("nombre", values.nombre);
        formData.append("descripcion", values.descripcion || "");
        formData.append("estado", values.estado);

        try {
            const res = await postFormDataAuth(API_ENDPOINTS.CREAR_PROYECTO, formData, token);
            message.success(res.mensaje || "Proyecto creado exitosamente");
            onCreado();
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`form-container ${loading ? 'form-loading' : ''}`}>
            <div className="form-header">
                <ProjectOutlined style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
                <Title level={3} className="form-title">Crear Nuevo Proyecto</Title>
                <p className="form-subtitle">
                    Completa la información básica para crear tu nuevo proyecto
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
                        { required: true, message: "Por favor ingrese el nombre del proyecto" },
                        { min: 3, message: "El nombre debe tener al menos 3 caracteres" },
                        { max: 100, message: "El nombre no puede exceder 100 caracteres" }
                    ]}
                >
                    <Input
                        placeholder="Ingrese un nombre descriptivo para su proyecto"
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
                        placeholder="Descripción opcional del proyecto (máximo 500 caracteres)"
                        showCount
                        maxLength={500}
                    />
                </Form.Item>

                <Form.Item
                    label="Estado Inicial"
                    name="estado"
                    initialValue="Requisitos"
                    className="form-field"
                    rules={[
                        { required: true, message: "Por favor seleccione un estado" }
                    ]}
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
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                        className="btn btn-primary"
                    >
                        {loading ? 'Creando...' : 'Crear Proyecto'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CrearProyecto;