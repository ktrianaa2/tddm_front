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

    // ── Obtener el código real de la prueba ──────────────────────────────────
    // Prioridad:
    //   1. codigo_editado  → el usuario ya editó y guardó manualmente
    //   2. codigo_pytest   → el código generado por IA y guardado en BD ✅
    //   3. Fallback mínimo → si la prueba no tiene ninguno de los dos
    const obtenerCodigoPrueba = useCallback((p) => {
        if (!p) return '';

        const detalle = normalizarPruebaJson(p.prueba);

        // 1. Si el usuario ya guardó una edición manual, mostrarla
        if (detalle.codigo_editado && typeof detalle.codigo_editado === 'string') {
            return detalle.codigo_editado;
        }

        // 2. Código real generado por IA (campo codigo_pytest en el JSON de BD)
        if (detalle.codigo_pytest && typeof detalle.codigo_pytest === 'string') {
            return detalle.codigo_pytest;
        }

        // 3. Fallback: encabezado mínimo para que el editor no quede vacío
        return `# ${p.nombre || 'Prueba sin nombre'}
# Código: ${p.codigo || 'N/A'}
# Tipo: ${p.tipo || p.tipo_prueba || 'N/A'}
# Estado: ${p.estado || 'Pendiente'}

# ⚠️ Esta prueba no tiene código generado todavía.
# Usa el botón "Regenerar" o escribe el código manualmente.
`;
    }, []);

    // ── Cargar código al cambiar de prueba ───────────────────────────────────
    useEffect(() => {
        if (!prueba) return;

        // DEBUG - quitar después
        console.log('=== DEBUG prueba ===');
        console.log('prueba.prueba tipo:', typeof prueba.prueba);
        console.log('prueba.prueba valor:', prueba.prueba);
        const detalle = normalizarPruebaJson(prueba.prueba);
        console.log('detalle normalizado:', detalle);
        console.log('codigo_pytest existe:', !!detalle.codigo_pytest);
        console.log('codigo_editado existe:', !!detalle.codigo_editado);
        // FIN DEBUG

        const codigoAMostrar = obtenerCodigoPrueba(prueba);
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

    // Indicar en el header si está mostrando una edición manual o el original de IA
    const detalle = normalizarPruebaJson(prueba.prueba);
    const tieneEdicionManual = !!(detalle.codigo_editado);

    return (
        <div className="editor-prueba">
            {/* ── Header ── */}
            <div className="editor-prueba__header">
                <div className="editor-prueba__header-top">
                    <h3 className="editor-prueba__titulo">{prueba.nombre}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Tag color={estadoTag.color}>{estadoTag.text}</Tag>
                        {tieneEdicionManual && (
                            <Tag color="purple" title="Este código ha sido editado manualmente">
                                Editado
                            </Tag>
                        )}
                    </div>
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