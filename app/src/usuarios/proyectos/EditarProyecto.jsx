import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message, Typography, Skeleton } from "antd";
import { ArrowLeftOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from "react-router-dom";
import { getStoredToken, API_ENDPOINTS, postFormDataAuth, getWithAuth } from "../../../config";
import '../../styles/forms.css';
import '../../styles/buttons.css';

const { Option } = Select;
const { Title } = Typography;

const EditarProyecto = ({ onEditado }) => {
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [projectData, setProjectData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProyecto = async () => {
            try {
                setLoadingData(true);
                const token = getStoredToken();
                const res = await getWithAuth(`${API_ENDPOINTS.OBTENER_PROYECTO}/${id}/`, token);
                setProjectData(res);
                form.setFieldsValue({
                    nombre: res.nombre,
                    descripcion: res.descripcion,
                    estado: res.estado
                });
            } catch (error) {
                message.error("Error al cargar el proyecto");
                navigate('/dashboard');
            } finally {
                setLoadingData(false);
            }
        };
        fetchProyecto();
    }, [id, form, navigate]);

    const handleSubmit = async (values) => {
        setLoading(true);
        const token = getStoredToken();
        const formData = new FormData();
        formData.append("nombre", values.nombre);
        formData.append("descripcion", values.descripcion || "");
        formData.append("estado", values.estado);

        try {
            const res = await postFormDataAuth(`${API_ENDPOINTS.EDITAR_PROYECTO}/${id}/`, formData, token);
            message.success(res.mensaje || "Proyecto actualizado exitosamente");
            onEditado();
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="form-container">
                <div className="form-header">
                    <Skeleton.Button active size="large" shape="round" style={{ width: 200, height: 40 }} />
                    <Skeleton.Input active size="small" style={{ width: 300, marginTop: 8 }} />
                </div>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    return (
        <div className={`form-container ${loading ? 'form-loading' : ''}`}>
            <div className="form-header">
                <EditOutlined style={{ fontSize: '2rem', color: 'var(--warning-color)', marginBottom: '0.5rem' }} />
                <Title level={3} className="form-title">Editar Proyecto</Title>
                <p className="form-subtitle">
                    Modifica la información de "{projectData?.nombre}"
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
                        onClick={() => navigate('/dashboard')}
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