import React, { useState, useEffect, useCallback } from 'react';
import { Button, Empty, Space, Popconfirm, message, Tag } from 'antd';
import {
    DeleteOutlined,
    CheckOutlined,
    SaveOutlined,
    CloseOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';

const EditorPrueba = ({
    prueba,
    onEliminar,
    onAprobar,
    onGuardarCambios,
    onDescartarCambios,
    onRegenerar
}) => {
    const [codigo, setCodigo] = useState('');
    const [codigoOriginal, setCodigoOriginal] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Función para formatear prueba en Python/Pytest
    const formatearPrueba = (prueba) => {
        if (!prueba) return '';

        const detalle = prueba.prueba || prueba;

        const generarCodigoDesdePasos = () => {
            const pasos = detalle.pasos || [];

            if (!pasos.length || pasos[0]?.accion === 'undefined') {
                // Fallback si no hay pasos válidos
                return `def test_flujo_principal():
    """⚠️ Esta prueba necesita implementación"""
    # TODO: Implementar la lógica de prueba
    
    entrada = ${detalle.datos_prueba?.entrada || '{}'}
    resultado = funcion_bajo_prueba(entrada)
    
    assert resultado is not None`;
            }

            // Generar código real desde los pasos
            let codigoTest = `def test_${(detalle.objetivo || 'flujo_principal').toLowerCase().replace(/\s+/g, '_')}():\n`;
            codigoTest += `    """${detalle.objetivo || 'Verificar el flujo principal'}"""\n`;
            codigoTest += `    # Arrange\n`;

            // Pasos de configuración (mocks, datos)
            const pasosArrange = pasos.filter(p =>
                p.accion.includes('=') ||
                p.accion.includes('mock') ||
                p.accion.includes('Mock') ||
                p.paso <= 3
            );

            pasosArrange.forEach(paso => {
                codigoTest += `    ${paso.accion}\n`;
            });

            codigoTest += `\n    # Act\n`;

            // Pasos de ejecución
            const pasosAct = pasos.filter(p =>
                (p.accion.includes('=') && !p.accion.includes('assert')) ||
                p.accion.includes('llamar') ||
                p.accion.includes('ejecutar')
            );

            if (pasosAct.length > 0) {
                pasosAct.forEach(paso => {
                    codigoTest += `    ${paso.accion}\n`;
                });
            } else {
                // Si no hay paso Act explícito, generar uno genérico
                codigoTest += `    resultado = funcion_bajo_prueba(entrada)\n`;
            }

            codigoTest += `\n    # Assert\n`;

            // Pasos de verificación
            const pasosAssert = pasos.filter(p =>
                p.accion.includes('assert') ||
                p.accion.includes('verificar')
            );

            if (pasosAssert.length > 0) {
                pasosAssert.forEach(paso => {
                    codigoTest += `    ${paso.accion}\n`;
                });
            } else {
                // Fallback: generar asserts desde criterios
                (detalle.criterios_aceptacion || []).forEach((criterio) => {
                    codigoTest += `    # ${criterio}\n`;
                });
                codigoTest += `    assert resultado is not None\n`;
            }

            return codigoTest;
        };

        // Imports necesarios
        const imports = `import pytest
from unittest.mock import Mock, patch, MagicMock`;

        // Precondiciones como fixture
        const precondicionesCode = (detalle.precondiciones || [])
            .map(p => `    # ${p}`)
            .join('\n') || '    # Configurar entorno de prueba';

        // Fixtures si hay precondiciones
        const fixtureCode = detalle.precondiciones?.length ? `

@pytest.fixture
def setup_prueba():
    """Configuración inicial de la prueba"""
${precondicionesCode}
    
    mock_repositorio = Mock()
    mock_repositorio.find_by_codigo = Mock()
    mock_repositorio.save = Mock()
    
    service = ProductoService(mock_repositorio)
    
    yield {
        'service': service,
        'repositorio': mock_repositorio
    }
    
    # Limpieza (teardown)
    pass
` : '';

        return `# ${detalle.nombre || prueba.nombre}
# Código: ${prueba.codigo}
# Tipo: ${detalle.tipo_prueba || prueba.tipo}
# Estado: ${prueba.estado || 'Pendiente'}

${imports}

"""
ESPECIFICACIÓN: ${prueba.especificacion_relacionada || 'N/A'}

OBJETIVO: ${detalle.objetivo || 'N/A'}

DATOS DE PRUEBA:
- Entrada: ${detalle.datos_prueba?.entrada || 'N/A'}
- Salida: ${detalle.datos_prueba?.salida_esperada || 'N/A'}
"""
${fixtureCode}

class Test${(detalle.nombre || prueba.nombre).replace(/\s+/g, '')}:
    """Suite de pruebas para ${detalle.nombre || prueba.nombre}"""
    
    ${generarCodigoDesdePasos().split('\n').map(line => '    ' + line).join('\n')}`;
    };

    // Cargar código cuando cambia la prueba
    useEffect(() => {
        if (prueba) {
            const codigoExistente = prueba.codigo_editado || formatearPrueba(prueba);
            setCodigo(codigoExistente);
            setCodigoOriginal(codigoExistente);
            setHasChanges(false);
        }
    }, [prueba?.id_prueba]);

    // Manejar cambios en el editor
    const handleEditorChange = (value) => {
        setCodigo(value || '');
        setHasChanges(value !== codigoOriginal);
    };

    // Guardar cambios
    const handleGuardar = useCallback(async () => {
        if (!hasChanges || guardando) return;

        setGuardando(true);
        try {
            const pruebaActualizada = {
                ...prueba,
                prueba: {
                    ...(prueba.prueba || {}),
                    codigo_editado: codigo,
                    fecha_ultima_edicion: new Date().toISOString()
                }
            };

            await onGuardarCambios(pruebaActualizada);

            setCodigoOriginal(codigo);
            setHasChanges(false);
            message.success('Cambios guardados exitosamente');
        } catch (error) {
            console.error('Error al guardar:', error);
            message.error('Error al guardar los cambios');
        } finally {
            setGuardando(false);
        }
    }, [codigo, codigoOriginal, hasChanges, prueba, onGuardarCambios, guardando]);

    // Descartar cambios
    const handleDescartar = () => {
        setCodigo(codigoOriginal);
        setHasChanges(false);
        onDescartarCambios();
    };

    // Manejar atajo de teclado Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasChanges && !guardando) {
                    handleGuardar();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, guardando, handleGuardar]);

    // Aprobar prueba
    const handleAprobar = async () => {
        if (hasChanges) {
            message.warning('Guarda los cambios antes de aprobar la prueba');
            return;
        }
        await onAprobar(prueba);
    };

    // Estado vacío
    if (!prueba) {
        return (
            <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '3rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <Empty
                    description={
                        <div>
                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                Ninguna prueba seleccionada
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                Selecciona una prueba de la lista para visualizar su código
                            </p>
                        </div>
                    }
                />
            </div>
        );
    }

    // Obtener color según el estado
    const getEstadoTag = (estado) => {
        const estados = {
            'borrador': { color: 'default', text: 'Borrador' },
            'pendiente': { color: 'warning', text: 'Pendiente' },
            'aprobada': { color: 'success', text: 'Aprobada' },
            'rechazada': { color: 'error', text: 'Rechazada' }
        };
        return estados[estado?.toLowerCase()] || { color: 'default', text: estado || 'Sin estado' };
    };

    const estadoTag = getEstadoTag(prueba.estado);

    return (
        <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.2rem',
                        fontWeight: 600
                    }}>
                        {prueba.nombre}
                    </h3>
                    <Tag color={estadoTag.color}>{estadoTag.text}</Tag>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.9rem',
                    color: '#666',
                    flexWrap: 'wrap'
                }}>
                    <span><strong>Código:</strong> {prueba.codigo}</span>
                    <span><strong>Tipo:</strong> {prueba.tipo || prueba.tipo_prueba}</span>

                    {prueba.fecha_actualizacion && (
                        <span>
                            <strong>Actualizada:</strong> {new Date(prueba.fecha_actualizacion).toLocaleDateString()}
                        </span>
                    )}

                    {hasChanges && (
                        <span style={{
                            color: '#ff9800',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>●</span> Cambios sin guardar
                        </span>
                    )}
                </div>
            </div>

            {/* Editor Monaco */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                    height="100%"
                    defaultLanguage="python"
                    value={codigo}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                        folding: true,
                        renderWhitespace: 'selection',
                        bracketPairColorization: {
                            enabled: true
                        },
                        readOnly: guardando
                    }}
                />
            </div>

            {/* Footer con información */}
            <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #f0f0f0',
                background: '#fafafa',
                fontSize: '0.85rem',
                color: '#666'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                        💡 <kbd>Ctrl+S</kbd> para guardar cambios | 🐍 Python/Pytest
                    </span>
                    <span>
                        {prueba.especificacion_relacionada && `📋 ${prueba.especificacion_relacionada} `}
                    </span>
                </div>
            </div>

            {/* Barra de acciones */}
            <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #f0f0f0',
                background: '#fff'
            }}>
                <Space wrap>
                    <Popconfirm
                        title="¿Regenerar esta prueba?"
                        description="Se perderán los cambios no guardados"
                        onConfirm={() => onRegenerar(prueba)}
                        okText="Sí, regenerar"
                        cancelText="Cancelar"
                        disabled={hasChanges}
                    >
                        <Button
                            icon={<ReloadOutlined />}
                            disabled={hasChanges}
                            title={hasChanges ? 'Guarda los cambios antes de regenerar' : 'Regenerar prueba con IA'}
                        >
                            Regenerar
                        </Button>
                    </Popconfirm>

                    <Button
                        icon={<CloseOutlined />}
                        onClick={handleDescartar}
                        disabled={!hasChanges}
                    >
                        Descartar
                    </Button>

                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleGuardar}
                        disabled={!hasChanges}
                        loading={guardando}
                    >
                        Guardar
                    </Button>

                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={handleAprobar}
                        disabled={hasChanges}
                        title={hasChanges ? 'Guarda los cambios antes de aprobar' : 'Aprobar prueba'}
                    >
                        Aprobar
                    </Button>

                    <Popconfirm
                        title="¿Eliminar esta prueba?"
                        description="Esta acción no se puede deshacer"
                        onConfirm={() => onEliminar(prueba)}
                        okText="Sí, eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Eliminar
                        </Button>
                    </Popconfirm>
                </Space>
            </div>
        </div>
    );
};

export default EditorPrueba;