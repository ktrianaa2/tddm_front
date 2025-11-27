import React, { useState, useEffect } from 'react';
import { Button, Empty, Space, Popconfirm, message } from 'antd';
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

    // 💡 Función para formatear la prueba
    const formatearPrueba = (prueba) => {
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
 * * DATOS DE PRUEBA:
 * - Caso válido: ${detalle.datos_prueba?.ejemplos[0]?.caso || 'N/A'}
 * - Caso límite: ${detalle.datos_prueba?.ejemplos[1]?.caso || 'N/A'}
 */`;
    };
    // ----------------------------------------------------

    useEffect(() => {
        if (prueba) {
            const codigoFormateado = formatearPrueba(prueba);
            setCodigo(codigoFormateado);
            setCodigoOriginal(codigoFormateado);
            setHasChanges(false);
        }
    }, [prueba]);

    const handleEditorChange = (value) => {
        setCodigo(value || '');
        setHasChanges(value !== codigoOriginal);
    };

    const handleGuardar = () => {
        const pruebaAActualizar = {
            ...prueba,
            codigo_editado: codigo
        };

        onGuardarCambios(pruebaAActualizar);
        setCodigoOriginal(codigo);
        setHasChanges(false);
    };

    const handleDescartar = () => {
        setCodigo(codigoOriginal);
        setHasChanges(false);
        onDescartarCambios();
    };

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

            {/* Header: solo texto */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa'
            }}>
                <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.2rem',
                    fontWeight: 600
                }}>
                    {prueba.nombre}
                </h3>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.9rem',
                    color: '#666'
                }}>
                    <span><strong>Código:</strong> {prueba.codigo}</span>
                    <span><strong>Tipo:</strong> {prueba.tipo}</span>

                    {hasChanges && (
                        <span style={{ color: '#ff9800', fontWeight: 500 }}>
                            ● Cambios sin guardar
                        </span>
                    )}
                </div>
            </div>

            {/* Footer: botones abajo */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid #f0f0f0',
                background: '#fff',
                marginTop: 'auto'
            }}>
                <Space wrap>

                    <Popconfirm
                        title="¿Regenerar esta prueba?"
                        description="Se perderán los cambios no guardados"
                        onConfirm={() => onRegenerar(prueba)}
                        okText="Sí, regenerar"
                        cancelText="Cancelar"
                    >
                        <Button icon={<ReloadOutlined />} disabled={hasChanges}>
                            Regenerar
                        </Button>
                    </Popconfirm>

                    <Button
                        icon={<CloseOutlined />}
                        onClick={handleDescartar}
                        disabled={!hasChanges}
                    >
                        Descartar Cambios
                    </Button>

                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleGuardar}
                        disabled={!hasChanges}
                    >
                        Guardar Cambios
                    </Button>

                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => onAprobar(prueba)}
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
                        }
                    }}
                />
            </div>

            {/* Footer con información adicional */}
            <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #f0f0f0',
                background: '#fafafa',
                fontSize: '0.85rem',
                color: '#666'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                        💡 Usa Ctrl+S para guardar cambios
                    </span>
                    <span>
                        Generada automáticamente con IA
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EditorPrueba;