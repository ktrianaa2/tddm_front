import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Divider, Space, Row, Col, Card, Tag, Typography, Spin, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { getStoredToken, API_ENDPOINTS, getWithAuth } from '../../../../config';
import '../../../styles/forms.css';
import '../../../styles/buttons.css';

const { TextArea } = Input;
const { Title } = Typography;

// Mapeo de colores por defecto para los tipos
const defaultColors = {
    tipos: {
        'funcional': '#1890ff',
        'no-funcional': '#52c41a',
        'negocio': '#fa8c16',
        'tecnico': '#722ed1',
        'sistema': '#13c2c2',
        'interfaz': '#eb2f96'
    },
    prioridades: {
        'critica': '#ff4d4f',
        'alta': '#fa8c16',
        'media': '#fadb14',
        'baja': '#52c41a'
    },
    estados: {
        'pendiente': '#d9d9d9',
        'en-desarrollo': '#1890ff',
        'en-revision': '#fa8c16',
        'completado': '#52c41a',
        'cancelado': '#ff4d4f'
    }
};

const RequisitosForm = ({
    initialValues = {},
    onSubmit,
    onCancel,
    requisitosExistentes = [],
    catalogos = {},
    loading = false
}) => {
    const [form] = Form.useForm();
    const [relacionesRequisitos, setRelacionesRequisitos] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loadingRelaciones, setLoadingRelaciones] = useState(false);

    // Validar que los catálogos estén disponibles - CORREGIDO
    const catalogosValidos = catalogos && 
        Array.isArray(catalogos.tipos_requisito) && catalogos.tipos_requisito.length > 0 &&
        Array.isArray(catalogos.prioridades) && catalogos.prioridades.length > 0 &&
        Array.isArray(catalogos.estados) && catalogos.estados.length > 0 &&
        Array.isArray(catalogos.tipos_relacion) && catalogos.tipos_relacion.length > 0;

    console.log('Catálogos recibidos:', catalogos); // Debug
    console.log('Catálogos válidos:', catalogosValidos); // Debug

    // Funciones helper para trabajar con catálogos dinámicos - MEJORADAS
    const prepararOpcionesSelect = (items, tipo = 'general') => {
        if (!items || !Array.isArray(items)) {
            console.warn(`Items para ${tipo} no es un array válido:`, items);
            return [];
        }

        return items.map(item => {
            // Asegurar que el item tenga la estructura correcta
            const key = item.key || item.nombre?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
            return {
                value: item.id?.toString() || item.value?.toString(),
                label: item.nombre || 'Sin nombre',
                key: key,
                color: defaultColors[tipo]?.[key] || '#d9d9d9',
                descripcion: item.descripcion || '',
                nivel: item.nivel || undefined,
                ...item
            };
        });
    };

    // Obtener opciones de select para cada catálogo
    const tiposRequisito = prepararOpcionesSelect(catalogos.tipos_requisito || [], 'tipos');
    const prioridades = prepararOpcionesSelect(catalogos.prioridades || [], 'prioridades');
    const estados = prepararOpcionesSelect(catalogos.estados || [], 'estados');
    const tiposRelacion = prepararOpcionesSelect(catalogos.tipos_relacion || []);

    console.log('Opciones preparadas:', { tiposRequisito, prioridades, estados, tiposRelacion }); // Debug

    // Funciones helper para mapear entre keys y IDs - MEJORADAS
    const getTipoIdByKey = (key) => {
        const tipo = tiposRequisito.find(t => t.key === key);
        console.log(`Buscando tipo por key "${key}":`, tipo); // Debug
        return tipo ? tipo.value : undefined;
    };

    const getPrioridadIdByKey = (key) => {
        const prioridad = prioridades.find(p => p.key === key);
        console.log(`Buscando prioridad por key "${key}":`, prioridad); // Debug
        return prioridad ? prioridad.value : undefined;
    };

    const getEstadoIdByKey = (key) => {
        const estado = estados.find(e => e.key === key);
        console.log(`Buscando estado por key "${key}":`, estado); // Debug
        return estado ? estado.value : undefined;
    };

    // Cargar las relaciones existentes del requisito - SIN CAMBIOS
    const cargarRelacionesExistentes = async (requisitoId) => {
        if (!requisitoId) return [];

        setLoadingRelaciones(true);
        try {
            const token = getStoredToken();
            const response = await getWithAuth(`${API_ENDPOINTS.RELACIONES_REQUISITO}/${requisitoId}/`, token);

            const relacionesProcesadas = (response.relaciones || []).map(rel => ({
                id: rel.id || `temp_${Date.now()}_${Math.random()}`,
                requisito_id: rel.requisito_id,
                tipo_relacion: rel.tipo_relacion_id?.toString() || rel.tipo_relacion,
                descripcion: rel.descripcion || ''
            }));

            return relacionesProcesadas;
        } catch (error) {
            console.warn('Error cargando relaciones existentes:', error);
            return [];
        } finally {
            setLoadingRelaciones(false);
        }
    };

    useEffect(() => {
        const initializeForm = async () => {
            console.log('Inicializando formulario con:', { initialValues, catalogosValidos }); // Debug
            
            if (!catalogosValidos) {
                console.error('Catálogos no válidos, no se puede inicializar el formulario');
                return;
            }

            if (initialValues.id) {
                setIsEditing(true);

                // Preparar los valores para el formulario - MEJORADO
                const formValues = {
                    nombre: initialValues.nombre || '',
                    descripcion: initialValues.descripcion || '',
                    criterios: initialValues.criterios || '',
                    origen: initialValues.origen || '',
                    condiciones_previas: initialValues.condiciones_previas || '',
                };

                // Mapear tipo - intentar primero por ID, luego por key
                if (initialValues.tipo) {
                    // Si ya es un ID válido, usarlo directamente
                    const tipoExiste = tiposRequisito.find(t => t.value === initialValues.tipo.toString());
                    if (tipoExiste) {
                        formValues.tipo = initialValues.tipo.toString();
                    } else {
                        // Si no, intentar convertir de key a ID
                        formValues.tipo = getTipoIdByKey(initialValues.tipo);
                    }
                }

                // Mapear prioridad
                if (initialValues.prioridad) {
                    const prioridadExiste = prioridades.find(p => p.value === initialValues.prioridad.toString());
                    if (prioridadExiste) {
                        formValues.prioridad = initialValues.prioridad.toString();
                    } else {
                        formValues.prioridad = getPrioridadIdByKey(initialValues.prioridad);
                    }
                }

                // Mapear estado
                if (initialValues.estado) {
                    const estadoExiste = estados.find(e => e.value === initialValues.estado.toString());
                    if (estadoExiste) {
                        formValues.estado = initialValues.estado.toString();
                    } else {
                        formValues.estado = getEstadoIdByKey(initialValues.estado);
                    }
                }

                console.log('Valores del formulario preparados:', formValues); // Debug

                // Establecer los valores en el formulario
                form.setFieldsValue(formValues);

                // Cargar relaciones existentes
                const relacionesExistentes = await cargarRelacionesExistentes(initialValues.id);
                setRelacionesRequisitos(relacionesExistentes);
            } else {
                setIsEditing(false);
                // Valores por defecto para nuevo requisito - MEJORADO
                const valoresPorDefecto = {};
                
                // Buscar estado "pendiente" o usar el primero disponible
                const estadoPendiente = estados.find(e => e.key === 'pendiente') || estados[0];
                if (estadoPendiente) {
                    valoresPorDefecto.estado = estadoPendiente.value;
                }

                // Buscar prioridad "media" o usar la primera disponible
                const prioridadMedia = prioridades.find(p => p.key === 'media') || prioridades[0];
                if (prioridadMedia) {
                    valoresPorDefecto.prioridad = prioridadMedia.value;
                }

                console.log('Valores por defecto:', valoresPorDefecto); // Debug

                form.setFieldsValue(valoresPorDefecto);
                setRelacionesRequisitos([]);
            }
        };

        if (catalogosValidos) {
            initializeForm();
        }
    }, [initialValues, catalogos, form, catalogosValidos, tiposRequisito, prioridades, estados]);

    const handleSubmit = (values) => {
        console.log('Valores del formulario al enviar:', values); // Debug

        // Incluir las relaciones en los valores del formulario
        const finalValues = {
            ...values,
            relaciones_requisitos: relacionesRequisitos.map(rel => ({
                requisito_id: rel.requisito_id,
                tipo_relacion: rel.tipo_relacion,
                descripcion: rel.descripcion || ''
            }))
        };

        // Si es edición, incluir el ID
        if (isEditing && initialValues.id) {
            finalValues.id = initialValues.id;
        }

        console.log('Valores finales a enviar:', finalValues); // Debug
        onSubmit(finalValues);
    };

    // Funciones para relaciones - SIN CAMBIOS
    const agregarRelacionRequisito = () => {
        const nuevaRelacion = {
            id: `temp_${Date.now()}_${Math.random()}`,
            requisito_id: '',
            tipo_relacion: '',
            descripcion: ''
        };
        setRelacionesRequisitos([...relacionesRequisitos, nuevaRelacion]);
    };

    const eliminarRelacionRequisito = (id) => {
        setRelacionesRequisitos(relacionesRequisitos.filter(r => r.id !== id));
    };

    const actualizarRelacionRequisito = (id, campo, valor) => {
        setRelacionesRequisitos(relacionesRequisitos.map(r =>
            r.id === id ? { ...r, [campo]: valor } : r
        ));
    };

    // Funciones helper para colores - MEJORADAS
    const getColorTipo = (tipoKey) => {
        const tipo = tiposRequisito.find(t => t.key === tipoKey);
        return tipo ? tipo.color : '#d9d9d9';
    };

    const getColorPrioridad = (prioridadKey) => {
        const prioridad = prioridades.find(p => p.key === prioridadKey);
        return prioridad ? prioridad.color : '#d9d9d9';
    };

    const getRequisitoInfo = (requisitoId) => {
        return requisitosExistentes.find(r => r.id === requisitoId);
    };

    // Mostrar error si no hay catálogos válidos - MEJORADO
    if (!catalogosValidos) {
        return (
            <div style={{ padding: '2rem' }}>
                <Alert
                    message="Error en catálogos"
                    description={
                        <div>
                            <p>No se pueden cargar los catálogos necesarios para el formulario.</p>
                            <p><strong>Debug info:</strong></p>
                            <ul style={{ fontSize: '12px', marginTop: '10px' }}>
                                <li>Tipos de requisito: {catalogos?.tipos_requisito ? `${catalogos.tipos_requisito.length} items` : 'No disponible'}</li>
                                <li>Prioridades: {catalogos?.prioridades ? `${catalogos.prioridades.length} items` : 'No disponible'}</li>
                                <li>Estados: {catalogos?.estados ? `${catalogos.estados.length} items` : 'No disponible'}</li>
                                <li>Tipos de relación: {catalogos?.tipos_relacion ? `${catalogos.tipos_relacion.length} items` : 'No disponible'}</li>
                            </ul>
                            <Button 
                                type="primary" 
                                onClick={() => window.location.reload()}
                                style={{ marginTop: '10px' }}
                            >
                                Recargar página
                            </Button>
                        </div>
                    }
                    type="error"
                    showIcon
                />
            </div>
        );
    }

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

            <Spin spinning={loading || loadingRelaciones}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    {/* === SECCIÓN DE CAMPOS OBLIGATORIOS === */}
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
                                placeholder="Define las condiciones específicas que deben cumplirse para considerar el requisito satisfecho..."
                                showCount
                                maxLength={500}
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN DE CAMPOS OPCIONALES === */}
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
                                placeholder="Precondiciones necesarias para la implementación de este requisito..."
                                showCount
                                maxLength={300}
                            />
                        </Form.Item>
                    </div>

                    <Divider />

                    {/* === SECCIÓN DE RELACIONES CON REQUISITOS === */}
                    <div className="form-section">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <LinkOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
                            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                                Relaciones con otros Requisitos
                            </Title>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Define las relaciones de dependencia, conflicto o complemento con otros requisitos del sistema
                        </p>

                        {/* Lista de relaciones de requisitos */}
                        {relacionesRequisitos.map((relacion) => {
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
                                            onClick={() => eliminarRelacionRequisito(relacion.id)}
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
                                                    onChange={(value) => actualizarRelacionRequisito(relacion.id, 'tipo_relacion', value)}
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
                                                    onChange={(value) => actualizarRelacionRequisito(relacion.id, 'requisito_id', value)}
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    optionFilterProp="children"
                                                >
                                                    {requisitosExistentes
                                                        .filter(req => req.id !== initialValues.id)
                                                        .map(req => (
                                                            <Select.Option key={req.id} value={req.id}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <span style={{ fontWeight: 'medium' }}>{req.nombre}</span>
                                                                    <Space size={4}>
                                                                        <Tag
                                                                            color={getColorTipo(req.tipo)}
                                                                            style={{ margin: 0, fontSize: '10px' }}
                                                                        >
                                                                            {tiposRequisito.find(t => t.key === req.tipo)?.label}
                                                                        </Tag>
                                                                        {req.prioridad && (
                                                                            <Tag
                                                                                color={getColorPrioridad(req.prioridad)}
                                                                                style={{ margin: 0, fontSize: '10px' }}
                                                                            >
                                                                                {prioridades.find(p => p.key === req.prioridad)?.label}
                                                                            </Tag>
                                                                        )}
                                                                    </Space>
                                                                </div>
                                                            </Select.Option>
                                                        ))}
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
                                                    onChange={(e) => actualizarRelacionRequisito(relacion.id, 'descripcion', e.target.value)}
                                                    maxLength={200}
                                                    showCount
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })}

                        {/* Botón para agregar nueva relación */}
                        <Button
                            type="dashed"
                            onClick={agregarRelacionRequisito}
                            block
                            icon={<PlusOutlined />}
                            style={{ marginTop: relacionesRequisitos.length > 0 ? '1rem' : 0 }}
                        >
                            Agregar Relación con Requisito
                        </Button>

                        {/* Estado vacío */}
                        {relacionesRequisitos.length === 0 && (
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
                            <Button htmlType="submit" className="btn btn-primary" size="large" loading={loading}>
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