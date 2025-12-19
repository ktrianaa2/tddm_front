import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Input, Switch, message, Space, Tag, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useCasosUso } from '../../../hooks/useCasosdeUso';
import '../../../styles/tabla-catalogos.css';

const { TextArea } = Input;
const { TabPane } = Tabs;

const CasosResumen = () => {
    const {
        catalogos,
        loadingCatalogos,
        errorCatalogos,
        cargarCatalogos
    } = useCasosUso(null, false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(false);
    const [tipoActual, setTipoActual] = useState('prioridades');
    const [itemActual, setItemActual] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        key: '',
        descripcion: '',
        nivel: '',
        tipo: '',
        activo: true
    });

    useEffect(() => {
        cargarCatalogos();
    }, []);

    const columnasPrioridades = [
        {
            title: 'ID',
            dataIndex: 'value',
            key: 'value',
            width: 80,
            align: 'center'
        },
        {
            title: 'Nombre',
            dataIndex: 'label',
            key: 'label',
            render: (text, record) => (
                <Space>
                    <Tag color={record.color}>{text}</Tag>
                </Space>
            )
        },
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            render: (text) => <code className="key-code">{text}</code>
        },
        {
            title: 'Nivel',
            dataIndex: 'nivel',
            key: 'nivel',
            width: 100,
            align: 'center'
        },
        {
            title: 'Descripción',
            dataIndex: 'descripcion',
            key: 'descripcion',
            ellipsis: true
        },
        {
            title: 'Estado',
            dataIndex: 'activo',
            key: 'activo',
            width: 100,
            align: 'center',
            render: (activo) => (
                <Tag color={activo ? 'success' : 'error'}>
                    {activo ? 'Activo' : 'Inactivo'}
                </Tag>
            )
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditar(record, 'prioridades')}
                    >
                        Editar
                    </Button>
                    <Popconfirm
                        title="¿Deshabilitar esta prioridad?"
                        description="Esta acción cambiará el estado del registro"
                        onConfirm={() => handleDeshabilitar(record, 'prioridades')}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Deshabilitar
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const columnasEstados = [
        {
            title: 'ID',
            dataIndex: 'value',
            key: 'value',
            width: 80,
            align: 'center'
        },
        {
            title: 'Nombre',
            dataIndex: 'label',
            key: 'label',
            render: (text, record) => (
                <Space>
                    <Tag color={record.color}>{text}</Tag>
                </Space>
            )
        },
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            render: (text) => <code className="key-code">{text}</code>
        },
        {
            title: 'Tipo',
            dataIndex: 'tipo',
            key: 'tipo',
            width: 120
        },
        {
            title: 'Descripción',
            dataIndex: 'descripcion',
            key: 'descripcion',
            ellipsis: true
        },
        {
            title: 'Estado',
            dataIndex: 'activo',
            key: 'activo',
            width: 100,
            align: 'center',
            render: (activo) => (
                <Tag color={activo ? 'success' : 'error'}>
                    {activo ? 'Activo' : 'Inactivo'}
                </Tag>
            )
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditar(record, 'estados')}
                    >
                        Editar
                    </Button>
                    <Popconfirm
                        title="¿Deshabilitar este estado?"
                        description="Esta acción cambiará el estado del registro"
                        onConfirm={() => handleDeshabilitar(record, 'estados')}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Deshabilitar
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const columnasTiposRelacion = [
        {
            title: 'ID',
            dataIndex: 'value',
            key: 'value',
            width: 80,
            align: 'center'
        },
        {
            title: 'Nombre',
            dataIndex: 'label',
            key: 'label',
            render: (text, record) => (
                <Space>
                    <Tag color={record.color}>{text}</Tag>
                </Space>
            )
        },
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            render: (text) => <code className="key-code">{text}</code>
        },
        {
            title: 'Descripción',
            dataIndex: 'descripcion',
            key: 'descripcion',
            ellipsis: true
        },
        {
            title: 'Estado',
            dataIndex: 'activo',
            key: 'activo',
            width: 100,
            align: 'center',
            render: (activo) => (
                <Tag color={activo ? 'success' : 'error'}>
                    {activo ? 'Activo' : 'Inactivo'}
                </Tag>
            )
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditar(record, 'tipos_relacion_cu')}
                    >
                        Editar
                    </Button>
                    <Popconfirm
                        title="¿Deshabilitar este tipo de relación?"
                        description="Esta acción cambiará el estado del registro"
                        onConfirm={() => handleDeshabilitar(record, 'tipos_relacion_cu')}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Deshabilitar
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const handleAgregar = (tipo) => {
        setTipoActual(tipo);
        setEditando(false);
        setItemActual(null);
        setFormData({
            nombre: '',
            key: '',
            descripcion: '',
            nivel: '',
            tipo: '',
            activo: true
        });
        setModalVisible(true);
    };

    const handleEditar = (record, tipo) => {
        setTipoActual(tipo);
        setEditando(true);
        setItemActual(record);
        setFormData({
            nombre: record.label || '',
            key: record.key || '',
            descripcion: record.descripcion || '',
            nivel: record.nivel || '',
            tipo: record.tipo || '',
            activo: record.activo !== false
        });
        setModalVisible(true);
    };

    const handleDeshabilitar = async (record, tipo) => {
        try {
            message.success(`${getTituloTipo(tipo)} deshabilitado correctamente`);
            await cargarCatalogos();
        } catch (error) {
            message.error(`Error al deshabilitar: ${error.message}`);
        }
    };

    const handleGuardar = async () => {
        if (!formData.nombre.trim()) {
            message.error('El nombre es obligatorio');
            return;
        }
        if (!formData.key.trim()) {
            message.error('El key es obligatorio');
            return;
        }

        try {
            if (editando) {
                message.success(`${getTituloTipo(tipoActual)} actualizado correctamente`);
            } else {
                message.success(`${getTituloTipo(tipoActual)} creado correctamente`);
            }
            setModalVisible(false);
            setFormData({
                nombre: '',
                key: '',
                descripcion: '',
                nivel: '',
                tipo: '',
                activo: true
            });
            await cargarCatalogos();
        } catch (error) {
            message.error(`Error al guardar: ${error.message}`);
        }
    };

    const getTituloTipo = (tipo) => {
        const titulos = {
            prioridades: 'Prioridad',
            estados: 'Estado',
            tipos_relacion_cu: 'Tipo de Relación'
        };
        return titulos[tipo] || tipo;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (errorCatalogos) {
        return (
            <div className="catalogos-container">
                <div className="catalogos-header">
                    <ApartmentOutlined className="catalogos-icon" />
                    <h2 className="catalogos-title">Gestión de Catálogos - Casos de Uso</h2>
                </div>
                <Card className="catalogos-card">
                    <div className="error-message">
                        Error al cargar catálogos: {errorCatalogos}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="catalogos-container">
            <div className="catalogos-header">
                <ApartmentOutlined className="catalogos-icon" />
                <h2 className="catalogos-title">Gestión de Catálogos - Casos de Uso</h2>
            </div>

            <Card className="catalogos-card">
                <Tabs defaultActiveKey="prioridades" type="card">
                    <TabPane tab="Prioridades" key="prioridades">
                        <div className="tab-actions">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => handleAgregar('prioridades')}
                            >
                                Agregar Prioridad
                            </Button>
                        </div>
                        <Table
                            className="catalogos-table"
                            columns={columnasPrioridades}
                            dataSource={catalogos?.prioridades || []}
                            loading={loadingCatalogos}
                            rowKey="value"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `Total: ${total} registros`
                            }}
                        />
                    </TabPane>

                    <TabPane tab="Estados" key="estados">
                        <div className="tab-actions">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => handleAgregar('estados')}
                            >
                                Agregar Estado
                            </Button>
                        </div>
                        <Table
                            className="catalogos-table"
                            columns={columnasEstados}
                            dataSource={catalogos?.estados || []}
                            loading={loadingCatalogos}
                            rowKey="value"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `Total: ${total} registros`
                            }}
                        />
                    </TabPane>

                    <TabPane tab="Tipos de Relación" key="tipos_relacion">
                        <div className="tab-actions">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => handleAgregar('tipos_relacion_cu')}
                            >
                                Agregar Tipo de Relación
                            </Button>
                        </div>
                        <Table
                            className="catalogos-table"
                            columns={columnasTiposRelacion}
                            dataSource={catalogos?.tipos_relacion_cu || []}
                            loading={loadingCatalogos}
                            rowKey="value"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `Total: ${total} registros`
                            }}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            <Modal
                title={`${editando ? 'Editar' : 'Agregar'} ${getTituloTipo(tipoActual)}`}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setFormData({
                        nombre: '',
                        key: '',
                        descripcion: '',
                        nivel: '',
                        tipo: '',
                        activo: true
                    });
                }}
                onOk={handleGuardar}
                okText={editando ? 'Actualizar' : 'Crear'}
                cancelText="Cancelar"
                width={600}
            >
                <div className="modal-form">
                    <div className="form-item">
                        <label className="form-label">Nombre *</label>
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            placeholder="Ingrese el nombre"
                        />
                    </div>

                    <div className="form-item">
                        <label className="form-label">Key *</label>
                        <Input
                            value={formData.key}
                            onChange={(e) => handleInputChange('key', e.target.value)}
                            placeholder="Ingrese el key (ej: muy-alta)"
                        />
                    </div>

                    <div className="form-item">
                        <label className="form-label">Descripción</label>
                        <TextArea
                            rows={3}
                            value={formData.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            placeholder="Ingrese una descripción"
                        />
                    </div>

                    {tipoActual === 'prioridades' && (
                        <div className="form-item">
                            <label className="form-label">Nivel *</label>
                            <Input
                                type="number"
                                value={formData.nivel}
                                onChange={(e) => handleInputChange('nivel', e.target.value)}
                                placeholder="Ingrese el nivel (1-5)"
                            />
                        </div>
                    )}

                    {tipoActual === 'estados' && (
                        <div className="form-item">
                            <label className="form-label">Tipo</label>
                            <Input
                                value={formData.tipo}
                                onChange={(e) => handleInputChange('tipo', e.target.value)}
                                placeholder="Tipo de elemento (ej: caso_uso)"
                            />
                        </div>
                    )}

                    <div className="form-item">
                        <label className="form-label">Activo</label>
                        <Switch
                            checked={formData.activo}
                            onChange={(checked) => handleInputChange('activo', checked)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CasosResumen;