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

    // 💡 Función para formatear la prueba en código
    const formatearPruebas = (prueba) => {
        if (!prueba) return '';

        // Usar el objeto anidado 'prueba' (detalle) si existe, sino usar el objeto de primer nivel (fallback)
        const detalle = prueba.prueba || prueba;

        // Convertir los pasos en comentarios de código para el editor
        const pasosComentarios = detalle.pasos?.map(p =>
            `    // Paso ${p.numero}: ${p.descripcion}`
        ).join('\n') || '    // No hay pasos definidos';

        // Convertir aserciones en comentarios
        const asercionesComentarios = detalle.criterios_aceptacion?.map(c =>
            `        // Criterio de Aceptación: ${c}`
        ).join('\n') || '        // Añadir aserciones';

        return `// ${detalle.nombre || prueba.nombre}
// Código: ${prueba.codigo}
// Tipo: ${detalle.tipo_prueba || prueba.tipo}
// Estado: ${prueba.estado || 'Pendiente'}

describe('${detalle.nombre || prueba.nombre}', () => {
    
    // ⬇️ PRECONDICIONES
    beforeEach(() => {
        // ${detalle.precondiciones?.join('\n        // ') || 'Inicializar entorno de prueba'}
    });

    // 🎯 OBJETIVO: ${detalle.objetivo || 'N/A'}

${pasosComentarios}

    test('debe cumplir con el flujo principal', async () => {
        // Arrange
        const entrada = {};
        
        // Act
        const resultado = await funcionBajoPrueba(entrada);
        
        // Assert
${asercionesComentarios}
        expect(resultado).toBeDefined();
    });
    
    // ⬆️ POSTCONDICIONES
    afterEach(() => {
        // ${detalle.postcondiciones?.join('\n        // ') || 'Limpiar recursos'}
    });
});

/*
 * ESPECIFICACIÓN RELACIONADA:
 * ${prueba.especificacion_relacionada || 'N/A'}
 * 
 * DATOS DE PRUEBA:
 * - Caso válido: ${detalle.datos_prueba?.ejemplos?.[0]?.caso || 'N/A'}
 * - Caso límite: ${detalle.datos_prueba?.ejemplos?.[1]?.caso || 'N/A'}
 * - Caso inválido: ${detalle.datos_prueba?.ejemplos?.[2]?.caso || 'N/A'}
 */`;
    };

    // Función mejorada para formatear prueba
    const formatearPrueba = (prueba) => {
        if (!prueba) return '';

        const detalle = prueba.prueba || prueba;

        const generarCodigoDesdePasos = () => {
            const pasos = detalle.pasos || [];

            if (!pasos.length || pasos[0]?.accion === 'undefined') {
                // Fallback si no hay pasos válidos
                return `    test('debe cumplir con el flujo principal', async () => {
        // ⚠️ Esta prueba necesita implementación
        // TODO: Implementar la lógica de prueba
        
        const entrada = ${detalle.datos_prueba?.entrada || '{}'};
        const resultado = await funcionBajoPrueba(entrada);
        
        expect(resultado).toBeDefined();
    });`;
            }

            // Generar código real desde los pasos
            let codigoTest = `    test('debe cumplir con ${detalle.objetivo || 'el flujo principal'}', async () => {\n`;
            codigoTest += `        // Arrange\n`;

            // Pasos de configuración (mocks, datos)
            const pasosArrange = pasos.filter(p =>
                p.accion.includes('const ') ||
                p.accion.includes('mock') ||
                p.paso <= 3
            );

            pasosArrange.forEach(paso => {
                codigoTest += `        ${paso.accion}\n`;
            });

            codigoTest += `\n        // Act\n`;

            // Pasos de ejecución
            const pasosAct = pasos.filter(p =>
                p.accion.includes('await ') &&
                !p.accion.includes('expect')
            );

            if (pasosAct.length > 0) {
                pasosAct.forEach(paso => {
                    codigoTest += `        ${paso.accion}\n`;
                });
            } else {
                // Si no hay paso Act explícito, usar el primero con await
                const pasoConAwait = pasos.find(p => p.accion.includes('await'));
                if (pasoConAwait) {
                    codigoTest += `        ${pasoConAwait.accion}\n`;
                }
            }

            codigoTest += `\n        // Assert\n`;

            // Pasos de verificación
            const pasosAssert = pasos.filter(p => p.accion.includes('expect('));

            if (pasosAssert.length > 0) {
                pasosAssert.forEach(paso => {
                    codigoTest += `        ${paso.accion}\n`;
                });
            } else {
                // Fallback: generar expects desde criterios
                (detalle.criterios_aceptacion || []).forEach((criterio, i) => {
                    codigoTest += `        // ${criterio}\n`;
                });
                codigoTest += `        expect(resultado).toBeDefined();\n`;
            }

            codigoTest += `    });`;

            return codigoTest;
        };

        // Precondiciones
        const precondicionesCode = (detalle.precondiciones || [])
            .map(p => `        // ${p}`)
            .join('\n') || '        // Configurar entorno de prueba';

        return `// ${detalle.nombre || prueba.nombre}
// Código: ${prueba.codigo}
// Tipo: ${detalle.tipo_prueba || prueba.tipo}
// Estado: ${prueba.estado || 'Pendiente'}

describe('${detalle.nombre || prueba.nombre}', () => {
    let mockRepositorio;
    let service;
    
    beforeEach(() => {
${precondicionesCode}
        
        mockRepositorio = {
            findByCodigo: jest.fn(),
            save: jest.fn()
        };
        
        service = new ProductoService(mockRepositorio);
    });

${generarCodigoDesdePasos()
            }

    afterEach(() => {
        jest.clearAllMocks();
    });
});

/*
 * ESPECIFICACIÓN: ${prueba.especificacion_relacionada || 'N/A'}
 * 
 * OBJETIVO: ${detalle.objetivo || 'N/A'}
 * 
 * DATOS DE PRUEBA:
 * Entrada: ${detalle.datos_prueba?.entrada || 'N/A'}
 * Salida: ${detalle.datos_prueba?.salida_esperada || 'N/A'}
 */`;
    };

    // Cargar código cuando cambia la prueba
    useEffect(() => {
        if (prueba) {
            // Si ya existe código editado, usar ese, sino formatear la prueba
            const codigoExistente = prueba.codigo_editado || formatearPrueba(prueba);
            setCodigo(codigoExistente);
            setCodigoOriginal(codigoExistente);
            setHasChanges(false);
        }
    }, [prueba?.id_prueba]); // Solo recargar si cambia el ID de la prueba

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
            // Preparar la prueba actualizada con el código editado
            const pruebaActualizada = {
                ...prueba,
                // Mantener el objeto prueba original pero agregar el código editado
                prueba: {
                    ...(prueba.prueba || {}),
                    codigo_editado: codigo,
                    fecha_ultima_edicion: new Date().toISOString()
                }
            };

            await onGuardarCambios(pruebaActualizada);

            // Actualizar el código original solo si se guardó exitosamente
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
            // Ctrl+S o Cmd+S (Mac)
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
                    defaultLanguage="javascript"
                    value={codigo}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
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
                        💡 <kbd>Ctrl+S</kbd> para guardar cambios
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