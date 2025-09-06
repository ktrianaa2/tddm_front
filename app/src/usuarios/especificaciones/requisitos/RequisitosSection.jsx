import React, { useState } from "react";
import { Card, Button, List, Typography, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import RequisitosForm from "./RequisitosForm";
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { Title, Text } = Typography;

const RequisitosSection = () => {
    const [requisitos, setRequisitos] = useState([]);
    const [editing, setEditing] = useState(null); // null = lista, {} = creando, {id} = editando

    const handleGuardar = (values) => {
        if (editing?.id) {
            // editar
            setRequisitos(prev => prev.map(r => r.id === editing.id ? { ...r, ...values } : r));
        } else {
            // crear
            setRequisitos(prev => [...prev, { id: Date.now(), ...values }]);
        }
        setEditing(null);
    };

    const handleEliminar = (id) => {
        setRequisitos(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div>
            {editing ? (
                <RequisitosForm
                    initialValues={editing?.id ? editing : {}}
                    onSubmit={handleGuardar}
                    onCancel={() => setEditing(null)}
                />
            ) : (
                <>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>
                                <FileTextOutlined style={{ marginRight: "0.5rem", color: "#1890ff" }} />
                                Gestión de Requisitos
                            </Title>
                            <Text type="secondary">
                                {requisitos.length} requisito{requisitos.length !== 1 ? "s" : ""}
                            </Text>
                        </div>

                        <Button
                            className="btn btn-primary"
                            icon={<PlusOutlined />}
                            onClick={() => setEditing({})}
                        >
                            Agregar Requisito
                        </Button>

                    </div>

                    {/* Lista */}
                    {requisitos.length === 0 ? (
                        <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                            <FileTextOutlined style={{ fontSize: "3rem", color: "var(--text-disabled)", marginBottom: "1rem" }} />
                            <Title level={4} type="secondary">No hay requisitos definidos</Title>
                            <Text type="secondary">Comienza agregando el primer requisito</Text>
                        </Card>
                    ) : (
                        <Card>
                            <List
                                dataSource={requisitos}
                                renderItem={(r) => (
                                    <List.Item
                                        key={r.id}
                                        actions={[
                                            <Button className="btn btn-info btn-card" icon={<EditOutlined />} onClick={() => setEditing(r)}>
                                                Editar
                                            </Button>,
                                            <Button className="btn btn-danger btn-card" icon={<DeleteOutlined />} onClick={() => handleEliminar(r.id)}>
                                                Eliminar
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={<Text strong>{r.nombre}</Text>}
                                            description={r.descripcion}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default RequisitosSection;
