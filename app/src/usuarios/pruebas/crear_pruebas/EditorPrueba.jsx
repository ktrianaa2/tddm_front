import React, { useState, useEffect, useCallback } from 'react';
import { Button, Empty, Popconfirm, message, Tag } from 'antd';
import {
    DeleteOutlined,
    CheckOutlined,
    SaveOutlined,
    CloseOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import "../../../styles/pruebas.css";
import '../../../styles/buttons.css';

// ── Helper: normalizar campo prueba a dict ────────────────────────────────────
// Maneja: dict directo, string JSON simple, string doblemente escapado.
// Siempre devuelve un objeto plano {}.
const normalizarPruebaJson = (valor) => {
    if (valor === null || valor === undefined) return {};
    if (typeof valor === 'object' && !Array.isArray(valor)) return valor;
    if (typeof valor === 'string') {
        let parsed = valor;
        for (let i = 0; i < 3; i++) {
            try {
                parsed = JSON.parse(parsed);
                if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                    return parsed;
                }
            } catch {
                return {};
            }
        }
    }
    return {};
};

const EditorPrueba = ({
    prueba,
    onEliminar,
    onAprobar,
    onGuardarCambios,
    onDescartarCambios,
    onRegenerar
}) => {
    const [codigo, setCodigo] = useState('');
    const [codigoGuardado, setCodigoGuardado] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [aprobando, setAprobando] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    // ── Formatear prueba JSON → texto Python/Pytest ──────────────────────────
    const formatearPrueba = useCallback((p) => {
        if (!p) return '';

        const detalle = p.prueba || p;

        const generarCodigoDesdePasos = () => {
            const pasos = detalle.pasos || [];

            if (!pasos.length || pasos[0]?.accion === 'undefined') {
                return `def test_flujo_principal():
    """⚠️ Esta prueba necesita implementación"""
    # TODO: Implementar la lógica de prueba
    
    entrada = ${detalle.datos_prueba?.entrada || '{}'}
    resultado = funcion_bajo_prueba(entrada)
    
    assert resultado is not None`;
            }

            let codigoTest = `def test_${(detalle.objetivo || 'flujo_principal').toLowerCase().replace(/\s+/g, '_')}():\n`;
            codigoTest += `    """${detalle.objetivo || 'Verificar el flujo principal'}"""\n`;
            codigoTest += `    # Arrange\n`;

            const pasosArrange = pasos.filter(ps =>
                ps.accion.includes('=') || ps.accion.includes('mock') ||
                ps.accion.includes('Mock') || ps.paso <= 3
            );
            pasosArrange.forEach(ps => { codigoTest += `    ${ps.accion}\n`; });

            codigoTest += `\n    # Act\n`;
            const pasosAct = pasos.filter(ps =>
                (ps.accion.includes('=') && !ps.accion.includes('assert')) ||
                ps.accion.includes('llamar') || ps.accion.includes('ejecutar')
            );
            if (pasosAct.length > 0) {
                pasosAct.forEach(ps => { codigoTest += `    ${ps.accion}\n`; });
            } else {
                codigoTest += `    resultado = funcion_bajo_prueba(entrada)\n`;
            }

            codigoTest += `\n    # Assert\n`;
            const pasosAssert = pasos.filter(ps =>
                ps.accion.includes('assert') || ps.accion.includes('verificar')
            );
            if (pasosAssert.length > 0) {
                pasosAssert.forEach(ps => { codigoTest += `    ${ps.accion}\n`; });
            } else {
                (detalle.criterios_aceptacion || []).forEach(criterio => {
                    codigoTest += `    # ${criterio}\n`;
                });
                codigoTest += `    assert resultado is not None\n`;
            }
            return codigoTest;
        };

        const imports = `import pytest\nfrom unittest.mock import Mock, patch, MagicMock`;
        const precondicionesCode = (detalle.precondiciones || [])
            .map(pc => `    # ${pc}`).join('\n') || '    # Configurar entorno de prueba';

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

        return `# ${detalle.nombre || p.nombre}
# Código: ${p.codigo}
# Tipo: ${detalle.tipo_prueba || p.tipo}
# Estado: ${p.estado || 'Pendiente'}

${imports}

"""
ESPECIFICACIÓN: ${p.especificacion_relacionada || 'N/A'}

OBJETIVO: ${detalle.objetivo || 'N/A'}

DATOS DE PRUEBA:
- Entrada: ${detalle.datos_prueba?.entrada || 'N/A'}
- Salida: ${detalle.datos_prueba?.salida_esperada || 'N/A'}
"""
${fixtureCode}

class Test${(detalle.nombre || p.nombre).replace(/\s+/g, '')}:
    """Suite de pruebas para ${detalle.nombre || p.nombre}"""
    
    ${generarCodigoDesdePasos().split('\n').map(line => '    ' + line).join('\n')}`;
    }, []);

    // ── Cargar código al cambiar de prueba ───────────────────────────────────
    // Normaliza el campo prueba (dict, string JSON, o doble-escape),
    // luego busca codigo_editado. Si existe lo muestra tal cual.
    // Si no, genera el código formateado desde los pasos del JSON.
    useEffect(() => {
        if (!prueba) return;

        const pruebaJson = normalizarPruebaJson(prueba.prueba);
        const codigoEditadoPrevio = pruebaJson?.codigo_editado;

        const codigoAMostrar =
            codigoEditadoPrevio && typeof codigoEditadoPrevio === 'string'
                ? codigoEditadoPrevio
                : formatearPrueba(prueba);

        setCodigo(codigoAMostrar);
        setCodigoGuardado(codigoAMostrar);
        setHasChanges(false);
    }, [prueba?.id_prueba]);

    // ── Editor change ────────────────────────────────────────────────────────
    const handleEditorChange = (value) => {
        const nuevoValor = value || '';
        setCodigo(nuevoValor);
        setHasChanges(nuevoValor !== codigoGuardado);
    };

    // ── Guardar ──────────────────────────────────────────────────────────────
    // Solo envía { prueba: { codigo_editado, fecha_ultima_edicion } } al backend.
    // El backend hace .update() sobre el JSON original en BD, preservando todos
    // los campos (pasos, objetivo, criterios, etc.) y siempre guarda como
    // string JSON (evitando el bug de JSONField + psycopg2).
    const handleGuardar = useCallback(async () => {
        if (!hasChanges || guardando) return;
        setGuardando(true);
        try {
            const pruebaActualizada = {
                id_prueba: prueba.id_prueba,
                id: prueba.id,
                _soloCodigoEditado: true,
                prueba: {
                    codigo_editado: codigo,
                    fecha_ultima_edicion: new Date().toISOString(),
                },
            };
            await onGuardarCambios(pruebaActualizada);
            setCodigoGuardado(codigo);
            setHasChanges(false);
        } catch (error) {
            console.error('Error al guardar:', error);
            message.error('Error al guardar los cambios');
        } finally {
            setGuardando(false);
        }
    }, [codigo, codigoGuardado, hasChanges, prueba, onGuardarCambios, guardando]);

    // ── Descartar ────────────────────────────────────────────────────────────
    const handleDescartar = () => {
        setCodigo(codigoGuardado);
        setHasChanges(false);
        if (onDescartarCambios) onDescartarCambios();
    };

    // ── Ctrl+S ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasChanges && !guardando) handleGuardar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, guardando, handleGuardar]);

    // ── Aprobar ──────────────────────────────────────────────────────────────
    const handleAprobar = async () => {
        if (hasChanges) {
            message.warning('Guarda los cambios antes de aprobar');
            return;
        }
        setAprobando(true);
        try {
            await onAprobar({ id_prueba: prueba.id_prueba, id: prueba.id });
        } catch (error) {
            console.error('Error al aprobar:', error);
            message.error('Error al aprobar la prueba');
        } finally {
            setAprobando(false);
        }
    };

    // ── Eliminar ─────────────────────────────────────────────────────────────
    const handleEliminar = async () => {
        setEliminando(true);
        try {
            await onEliminar(prueba);
        } catch (error) {
            console.error('Error al eliminar:', error);
            message.error('Error al eliminar la prueba');
        } finally {
            setEliminando(false);
        }
    };

    // ── Estado vacío ─────────────────────────────────────────────────────────
    if (!prueba) {
        return (
            <div className="editor-prueba__vacio">
                <Empty
                    description={
                        <div>
                            <p className="editor-prueba__vacio-titulo">Ninguna prueba seleccionada</p>
                            <p className="editor-prueba__vacio-subtitulo">
                                Selecciona una prueba de la lista para visualizar su código
                            </p>
                        </div>
                    }
                />
            </div>
        );
    }

    const getEstadoTag = (estado) => {
        const estados = {
            'borrador': { color: 'default', text: 'Borrador' },
            'pendiente': { color: 'warning', text: 'Pendiente' },
            'aprobada': { color: 'success', text: 'Aprobada' },
            'rechazada': { color: 'error', text: 'Rechazada' },
        };
        return estados[estado?.toLowerCase()] || { color: 'default', text: estado || 'Sin estado' };
    };

    const estadoTag = getEstadoTag(prueba.estado);
    const esAprobada = prueba.estado?.toLowerCase() === 'aprobada';

    return (
        <div className="editor-prueba">
            {/* ── Header ── */}
            <div className="editor-prueba__header">
                <div className="editor-prueba__header-top">
                    <h3 className="editor-prueba__titulo">{prueba.nombre}</h3>
                    <Tag color={estadoTag.color}>{estadoTag.text}</Tag>
                </div>
                <div className="editor-prueba__meta">
                    <span><strong>Código:</strong> {prueba.codigo}</span>
                    <span><strong>Tipo:</strong> {prueba.tipo || prueba.tipo_prueba}</span>
                    {prueba.fecha_actualizacion && (
                        <span>
                            <strong>Actualizada:</strong>{' '}
                            {new Date(prueba.fecha_actualizacion).toLocaleDateString()}
                        </span>
                    )}
                    {hasChanges && (
                        <span className="editor-prueba__cambios-pendientes">
                            <span style={{ fontSize: '1.2rem' }}>●</span> Cambios sin guardar
                        </span>
                    )}
                </div>
            </div>

            {/* ── Monaco Editor ── */}
            <div className="editor-prueba__monaco">
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
                        bracketPairColorization: { enabled: true },
                        readOnly: guardando || aprobando,
                    }}
                />
            </div>

            {/* ── Footer info ── */}
            <div className="editor-prueba__footer-info">
                <div className="editor-prueba__footer-info-inner">
                    <span>💡 <kbd>Ctrl+S</kbd> para guardar cambios | 🐍 Python/Pytest</span>
                    <span>
                        {prueba.especificacion_relacionada && `📋 ${prueba.especificacion_relacionada}`}
                    </span>
                </div>
            </div>

            {/* ── Barra de acciones ── */}
            <div className="editor-prueba__acciones">

                <Popconfirm
                    title="¿Regenerar esta prueba?"
                    description="Se perderán los cambios no guardados y el código actual"
                    onConfirm={() => onRegenerar(prueba)}
                    okText="Sí, regenerar"
                    cancelText="Cancelar"
                    disabled={hasChanges || esAprobada}
                >
                    <Button
                        icon={<ReloadOutlined />}
                        disabled={hasChanges || esAprobada}
                        className="btn btn-secondary"
                        title={
                            esAprobada
                                ? 'No se puede regenerar una prueba aprobada'
                                : hasChanges
                                    ? 'Guarda los cambios antes de regenerar'
                                    : 'Regenerar prueba con IA'
                        }
                    >
                        Regenerar
                    </Button>
                </Popconfirm>

                <Button
                    icon={<CloseOutlined />}
                    onClick={handleDescartar}
                    disabled={!hasChanges || guardando}
                    className="btn btn-secondary"
                    title="Descartar cambios y volver al último código guardado"
                >
                    Descartar
                </Button>

                <Button
                    icon={<SaveOutlined />}
                    onClick={handleGuardar}
                    disabled={!hasChanges || guardando}
                    loading={guardando}
                    className="btn btn-primary"
                    title="Guardar cambios (Ctrl+S)"
                >
                    Guardar
                </Button>

                {!esAprobada && (
                    <Button
                        icon={<CheckOutlined />}
                        onClick={handleAprobar}
                        disabled={hasChanges || aprobando}
                        loading={aprobando}
                        className="btn btn-aprobar"
                        title={
                            hasChanges
                                ? 'Guarda los cambios antes de aprobar'
                                : 'Aprobar prueba'
                        }
                    >
                        Aprobar
                    </Button>
                )}

                <Popconfirm
                    title="¿Eliminar esta prueba?"
                    description="Esta acción no se puede deshacer"
                    onConfirm={handleEliminar}
                    okText="Sí, eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    disabled={eliminando}
                >
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={eliminando}
                        className="btn btn-danger"
                        title="Eliminar prueba"
                    >
                        Eliminar
                    </Button>
                </Popconfirm>
            </div>
        </div>
    );
};

export default EditorPrueba;