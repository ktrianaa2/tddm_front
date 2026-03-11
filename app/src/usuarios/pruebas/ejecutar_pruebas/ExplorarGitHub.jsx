import React, { useState, useCallback, useRef } from 'react';
import {
    Tree,
    Tabs,
    Button,
    Tooltip,
    Tag,
    Spin,
    Space,
    Badge,
    Dropdown,
    Empty,
    Input
} from 'antd';
import {
    FolderOutlined,
    FolderOpenOutlined,
    FileOutlined,
    FileTextOutlined,
    CodeOutlined,
    SaveOutlined,
    UndoOutlined,
    CloseOutlined,
    SearchOutlined,
    GithubOutlined,
    DisconnectOutlined,
    ReloadOutlined,
    FileMarkdownOutlined,
    FileImageOutlined,
    EditOutlined,
    CheckOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';

// ── Helpers de iconos por tipo de archivo ─────────────────────────────────────
const getFileIcon = (nombre) => {
    const ext = nombre?.split('.').pop()?.toLowerCase();
    const estiloBase = { fontSize: '0.9rem' };

    if (['js', 'jsx', 'ts', 'tsx'].includes(ext))
        return <FileTextOutlined style={{ ...estiloBase, color: '#f0db4f' }} />;
    if (['py'].includes(ext))
        return <FileTextOutlined style={{ ...estiloBase, color: '#3776ab' }} />;
    if (['java', 'kt'].includes(ext))
        return <FileTextOutlined style={{ ...estiloBase, color: '#f89820' }} />;
    if (['html', 'vue'].includes(ext))
        return <FileTextOutlined style={{ ...estiloBase, color: '#e34c26' }} />;
    if (['css', 'scss', 'less'].includes(ext))
        return <FileTextOutlined style={{ ...estiloBase, color: '#264de4' }} />;
    if (['json', 'yaml', 'yml'].includes(ext))
        return <FileTextOutlined style={{ ...estiloBase, color: '#cb9820' }} />;
    if (['md', 'mdx'].includes(ext))
        return <FileMarkdownOutlined style={{ ...estiloBase, color: '#8c8c8c' }} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext))
        return <FileImageOutlined style={{ ...estiloBase, color: '#52c41a' }} />;
    return <FileOutlined style={{ ...estiloBase, color: '#8c8c8c' }} />;
};

const getFolderIcon = (expandido) =>
    expandido
        ? <FolderOpenOutlined style={{ color: '#faad14', fontSize: '0.9rem' }} />
        : <FolderOutlined style={{ color: '#faad14', fontSize: '0.9rem' }} />;

// ── Procesar nodos del árbol para inyectar iconos ─────────────────────────────
const procesarNodos = (nodos, modificados = {}) =>
    nodos.map(nodo => ({
        ...nodo,
        icon: nodo.isLeaf ? getFileIcon(nodo.title) : undefined,
        title: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                    color: modificados[nodo.path] !== undefined ? '#faad14' : 'inherit',
                    fontStyle: modificados[nodo.path] !== undefined ? 'italic' : 'normal',
                }}>
                    {nodo.title}
                </span>
                {modificados[nodo.path] !== undefined && (
                    <span style={{ color: '#faad14', fontSize: '0.7rem' }}>●</span>
                )}
            </span>
        ),
        children: nodo.children ? procesarNodos(nodo.children, modificados) : undefined,
    }));

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const ExplorarGitHub = ({
    githubConfig,
    arbolArchivos,
    loadingArbol,
    archivoActivo,
    codigoActivo,
    loadingArchivo,
    archivosModificados,
    tieneModificaciones,
    totalArchivosModificados,
    tabsAbiertos,
    onSeleccionarArchivo,
    onActualizarCodigo,
    onGuardarLocal,
    onDescartarCambios,
    onCerrarTab,
    onDesconectar,
    onRecargarArbol,
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [llaveExpandidas, setLlavesExpandidas] = useState([]);
    const editorRef = useRef(null);

    // ── Filtrado del árbol por búsqueda ───────────────────────────────────────
    const filtrarNodos = useCallback((nodos, texto) => {
        if (!texto) return nodos;
        const textoLower = texto.toLowerCase();

        return nodos.reduce((acc, nodo) => {
            if (nodo.isLeaf) {
                if (nodo.path.toLowerCase().includes(textoLower)) acc.push(nodo);
            } else {
                const hijosFiltr = filtrarNodos(nodo.children || [], texto);
                if (hijosFiltr.length > 0) {
                    acc.push({ ...nodo, children: hijosFiltr });
                }
            }
            return acc;
        }, []);
    }, []);

    const nodosFiltrados = busqueda
        ? filtrarNodos(arbolArchivos, busqueda)
        : arbolArchivos;

    const nodosProcesados = procesarNodos(nodosFiltrados, archivosModificados);

    // ── Expandir todos al buscar ──────────────────────────────────────────────
    const handleBusqueda = (e) => {
        const val = e.target.value;
        setBusqueda(val);
        if (val) {
            // Expandir todos los nodos carpeta para ver resultados
            const todasLasLlaves = [];
            const recolectarLlaves = (nodos) => {
                nodos.forEach(n => {
                    if (!n.isLeaf) {
                        todasLasLlaves.push(n.key);
                        if (n.children) recolectarLlaves(n.children);
                    }
                });
            };
            recolectarLlaves(arbolArchivos);
            setLlavesExpandidas(todasLasLlaves);
        } else {
            setLlavesExpandidas([]);
        }
    };

    // ── Tabs del editor ───────────────────────────────────────────────────────
    const itemsTabs = tabsAbiertos.map(tab => ({
        key: tab.path,
        label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {getFileIcon(tab.title)}
                <span style={{
                    color: archivosModificados[tab.path] !== undefined ? '#faad14' : 'inherit',
                    fontStyle: archivosModificados[tab.path] !== undefined ? 'italic' : 'normal',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                }}>
                    {tab.title}
                </span>
                {archivosModificados[tab.path] !== undefined && (
                    <span style={{ color: '#faad14', fontSize: '0.65rem' }}>●</span>
                )}
                <CloseOutlined
                    style={{ fontSize: '0.65rem', color: '#8c8c8c', marginLeft: '2px' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCerrarTab(tab.path);
                    }}
                />
            </span>
        ),
    }));

    const menuGuardar = {
        items: [
            {
                key: 'guardar',
                label: 'Guardar cambios localmente',
                icon: <SaveOutlined />,
                onClick: () => archivoActivo && onGuardarLocal(archivoActivo.path, codigoActivo),
                disabled: !tieneModificaciones,
            },
            {
                key: 'descartar',
                label: 'Descartar cambios',
                icon: <UndoOutlined />,
                onClick: () => archivoActivo && onDescartarCambios(archivoActivo.path),
                disabled: !tieneModificaciones,
                danger: true,
            },
        ],
    };

    // ── Render vacío ──────────────────────────────────────────────────────────
    if (loadingArbol) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e1e1e',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <Spin size="large" />
                <span style={{ color: '#8c8c8c' }}>Cargando repositorio...</span>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* ── PANEL IZQUIERDO: Árbol de archivos ─────────────────────────── */}
            <div style={{
                width: '280px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                background: '#252526',
                borderRight: '1px solid #3e3e42',
                overflow: 'hidden',
            }}>

                {/* Cabecera del explorador */}
                <div style={{
                    padding: '0.6rem 0.75rem',
                    background: '#2d2d30',
                    borderBottom: '1px solid #3e3e42',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                        <GithubOutlined style={{ color: '#cccccc', fontSize: '1rem', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                color: '#cccccc',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '140px',
                            }}>
                                {githubConfig?.repositorio?.split('/')[1] || 'Repositorio'}
                            </div>
                            <div style={{ color: '#8c8c8c', fontSize: '0.65rem' }}>
                                {githubConfig?.rama}
                                {totalArchivosModificados > 0 && (
                                    <Badge
                                        count={totalArchivosModificados}
                                        size="small"
                                        style={{ marginLeft: '6px', backgroundColor: '#faad14' }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <Space size={4}>
                        <Tooltip title="Recargar árbol">
                            <Button
                                type="text"
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={onRecargarArbol}
                                style={{ color: '#8c8c8c' }}
                            />
                        </Tooltip>
                        <Tooltip title="Desconectar de GitHub">
                            <Button
                                type="text"
                                size="small"
                                icon={<DisconnectOutlined />}
                                onClick={onDesconectar}
                                style={{ color: '#8c8c8c' }}
                                danger
                            />
                        </Tooltip>
                    </Space>
                </div>

                {/* Búsqueda */}
                <div style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid #3e3e42' }}>
                    <Input
                        size="small"
                        placeholder="Buscar archivo..."
                        prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                        value={busqueda}
                        onChange={handleBusqueda}
                        style={{
                            background: '#3c3c3c',
                            borderColor: '#555',
                            color: '#cccccc',
                            fontSize: '0.8rem',
                        }}
                        allowClear
                    />
                </div>

                {/* Árbol de archivos */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
                    {nodosProcesados.length === 0 ? (
                        <Empty
                            description={
                                <span style={{ color: '#8c8c8c', fontSize: '0.8rem' }}>
                                    {busqueda ? 'Sin resultados' : 'Repositorio vacío'}
                                </span>
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ marginTop: '2rem' }}
                        />
                    ) : (
                        <Tree
                            treeData={nodosProcesados}
                            showIcon
                            blockNode
                            selectedKeys={archivoActivo ? [archivoActivo.path] : []}
                            expandedKeys={llaveExpandidas}
                            onExpand={setLlavesExpandidas}
                            switcherIcon={({ expanded, isLeaf }) =>
                                isLeaf ? null : (getFolderIcon(expanded))
                            }
                            onSelect={(_, info) => {
                                const nodo = info.node;
                                if (nodo.isLeaf) {
                                    onSeleccionarArchivo({
                                        path: nodo.path || nodo.key,
                                        title: typeof nodo.title === 'string' ? nodo.title : nodo.key.split('/').pop(),
                                        sha: nodo.sha,
                                        isLeaf: true,
                                    });
                                }
                            }}
                            style={{
                                background: 'transparent',
                                color: '#cccccc',
                                fontSize: '0.82rem',
                            }}
                            className="github-tree"
                        />
                    )}
                </div>
            </div>

            {/* ── PANEL DERECHO: Editor ──────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Barra de tabs + acciones */}
                <div style={{
                    background: '#2d2d30',
                    borderBottom: '1px solid #3e3e42',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '40px',
                }}>
                    {/* Tabs de archivos abiertos */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {tabsAbiertos.length > 0 ? (
                            <Tabs
                                type="card"
                                size="small"
                                activeKey={archivoActivo?.path}
                                items={itemsTabs}
                                onChange={(path) => {
                                    const tab = tabsAbiertos.find(t => t.path === path);
                                    if (tab) {
                                        onSeleccionarArchivo({
                                            path: tab.path,
                                            title: tab.title,
                                            isLeaf: true,
                                        });
                                    }
                                }}
                                style={{ marginBottom: 0 }}
                                tabBarStyle={{
                                    margin: 0,
                                    background: '#2d2d30',
                                    border: 'none',
                                    padding: '0 0.5rem',
                                }}
                            />
                        ) : (
                            <span style={{ color: '#8c8c8c', fontSize: '0.8rem', padding: '0 1rem' }}>
                                <CodeOutlined style={{ marginRight: '0.4rem' }} />
                                Selecciona un archivo del explorador
                            </span>
                        )}
                    </div>

                    {/* Acciones del editor */}
                    {archivoActivo && (
                        <div style={{ padding: '0 0.75rem', display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                            <Dropdown menu={menuGuardar} trigger={['click']}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={tieneModificaciones ? <EditOutlined /> : <CheckOutlined />}
                                    style={{
                                        color: tieneModificaciones ? '#faad14' : '#52c41a',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {tieneModificaciones ? 'Sin guardar' : 'Guardado'}
                                </Button>
                            </Dropdown>
                        </div>
                    )}
                </div>

                {/* Editor Monaco */}
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {loadingArchivo && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(30,30,30,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                        }}>
                            <Spin size="large" tip="Cargando archivo..." />
                        </div>
                    )}

                    {!archivoActivo && !loadingArchivo ? (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#1e1e1e',
                            color: '#555',
                            gap: '0.75rem',
                        }}>
                            <CodeOutlined style={{ fontSize: '3rem', opacity: 0.3 }} />
                            <span style={{ fontSize: '0.9rem' }}>Selecciona un archivo para editarlo</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                Los cambios se guardan localmente y no se suben a GitHub
                            </span>
                        </div>
                    ) : (
                        <Editor
                            height="100%"
                            language={archivoActivo?.lenguaje || 'plaintext'}
                            value={codigoActivo}
                            onChange={(val) => onActualizarCodigo(val || '')}
                            onMount={(editor) => { editorRef.current = editor; }}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: true },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                                renderLineHighlight: 'all',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                folding: true,
                                bracketPairColorization: { enabled: true },
                            }}
                            path={archivoActivo?.path} // key para Monaco, evita confusión entre archivos
                        />
                    )}
                </div>

                {/* Barra de estado del archivo */}
                {archivoActivo && (
                    <div style={{
                        padding: '0.2rem 1rem',
                        background: '#007acc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'white',
                    }}>
                        <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '60%',
                        }}>
                            📄 {archivoActivo.path}
                        </span>
                        <Space size="small">
                            {tieneModificaciones && (
                                <Tag color="orange" style={{ fontSize: '0.65rem', lineHeight: '1.2' }}>
                                    Modificado localmente
                                </Tag>
                            )}
                            <span style={{ opacity: 0.85 }}>
                                {archivoActivo.lenguaje?.toUpperCase() || 'TEXTO'}
                            </span>
                        </Space>
                    </div>
                )}
            </div>

            {/* Estilos globales para el árbol */}
            <style>{`
        .github-tree .ant-tree-node-content-wrapper {
          display: inline-flex !important;
          align-items: center !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          color: #cccccc !important;
          min-height: 24px !important;
        }
        .github-tree .ant-tree-node-content-wrapper:hover {
          background: #2a2d2e !important;
          color: #ffffff !important;
        }
        .github-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
          background: #094771 !important;
          color: #ffffff !important;
        }
        .github-tree .ant-tree-switcher {
          color: #8c8c8c !important;
          line-height: 24px !important;
        }
        .github-tree .ant-tree-treenode {
          padding: 0 !important;
          line-height: 24px !important;
        }
        .github-tree .ant-tree-indent-unit {
          width: 16px !important;
        }
        .github-tree .ant-tree-iconEle {
          display: inline-flex !important;
          align-items: center !important;
        }
        /* Scrollbar oscuro */
        .github-tree ::-webkit-scrollbar { width: 6px; }
        .github-tree ::-webkit-scrollbar-track { background: transparent; }
        .github-tree ::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
      `}</style>
        </div>
    );
};

export default ExplorarGitHub;