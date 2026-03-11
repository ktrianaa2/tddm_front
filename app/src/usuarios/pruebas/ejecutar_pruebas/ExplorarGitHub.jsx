import React, { useState, useCallback, useRef } from 'react';
import {
    Tree,
    Tabs,
    Button,
    Tooltip,
    Tag,
    Spin,
    Badge,
    Dropdown,
    Empty,
    Input,
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
    CheckOutlined,
    SwapOutlined,
    BranchesOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import '../../../styles/ejecutar-pruebas.css';

/* ── Iconos por extensión ─────────────────────────────────────────── */
// Nota: los colores de los iconos de lenguajes son colores de marca
// (JS amarillo, TS azul, etc.) y se mantienen fijos intencionalmente.
const getFileIcon = (nombre) => {
    const ext = nombre?.split('.').pop()?.toLowerCase();
    const s = { fontSize: '0.82rem' };
    if (['js', 'jsx'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#f0db4f' }} />;
    if (['ts', 'tsx'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#3178c6' }} />;
    if (['py'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#4b8bbe' }} />;
    if (['java', 'kt'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#f89820' }} />;
    if (['html', 'vue'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#e34c26' }} />;
    if (['css', 'scss', 'less'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#264de4' }} />;
    if (['json', 'yaml', 'yml'].includes(ext)) return <FileTextOutlined style={{ ...s, color: '#cb9820' }} />;
    if (['md', 'mdx'].includes(ext)) return <FileMarkdownOutlined style={{ ...s, color: 'var(--text-secondary)' }} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext))
        return <FileImageOutlined style={{ ...s, color: 'var(--success-color)' }} />;
    return <FileOutlined style={{ ...s, color: 'var(--text-tertiary)' }} />;
};

const getFolderIcon = (expanded) =>
    expanded
        ? <FolderOpenOutlined style={{ fontSize: '0.82rem', color: 'var(--warning-color)' }} />
        : <FolderOutlined style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }} />;

/* ── Procesar nodos: inyectar iconos y marcas de modificado ────────── */
const procesarNodos = (nodos, modificados = {}) =>
    nodos.map(nodo => ({
        ...nodo,
        icon: nodo.isLeaf ? getFileIcon(nodo.title) : undefined,
        title: (
            <span className="ep-tree-node-label">
                <span className={
                    modificados[nodo.path] !== undefined
                        ? 'ep-tree-node-name ep-tree-node-name--modified'
                        : 'ep-tree-node-name'
                }>
                    {nodo.title}
                </span>
                {modificados[nodo.path] !== undefined && (
                    <span className="ep-tree-node-dot">●</span>
                )}
            </span>
        ),
        children: nodo.children ? procesarNodos(nodo.children, modificados) : undefined,
    }));

/* ════════════════════════════════════════════════════════════════════ */

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
    onCambiarProyecto,
    onRecargarArbol,
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [llavesExpandidas, setLlavesExpandidas] = useState([]);
    const editorRef = useRef(null);

    /* ── Filtrado ─────────────────────────────────────────────────── */
    const filtrarNodos = useCallback((nodos, texto) => {
        if (!texto) return nodos;
        const t = texto.toLowerCase();
        return nodos.reduce((acc, nodo) => {
            if (nodo.isLeaf) {
                if (nodo.path.toLowerCase().includes(t)) acc.push(nodo);
            } else {
                const hijos = filtrarNodos(nodo.children || [], t);
                if (hijos.length > 0) acc.push({ ...nodo, children: hijos });
            }
            return acc;
        }, []);
    }, []);

    const nodosFiltrados = busqueda ? filtrarNodos(arbolArchivos, busqueda) : arbolArchivos;
    const nodosProcesados = procesarNodos(nodosFiltrados, archivosModificados);

    const handleBusqueda = (e) => {
        const val = e.target.value;
        setBusqueda(val);
        if (val) {
            const llaves = [];
            const recolectar = (nodos) => {
                nodos.forEach(n => {
                    if (!n.isLeaf) { llaves.push(n.key); if (n.children) recolectar(n.children); }
                });
            };
            recolectar(arbolArchivos);
            setLlavesExpandidas(llaves);
        } else {
            setLlavesExpandidas([]);
        }
    };

    /* ── Selección de nodo ────────────────────────────────────────── */
    const handleSelectNode = (_, info) => {
        const nodo = info.node;
        if (nodo.isLeaf) {
            onSeleccionarArchivo({
                path: nodo.path || nodo.key,
                title: typeof nodo.title === 'string' ? nodo.title : nodo.key.split('/').pop(),
                sha: nodo.sha,
                isLeaf: true,
            });
        } else {
            const key = nodo.key;
            setLlavesExpandidas(prev =>
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
            );
        }
    };

    /* ── Tabs del editor ──────────────────────────────────────────── */
    const itemsTabs = tabsAbiertos.map(tab => ({
        key: tab.path,
        label: (
            <span className="ep-tab-file-label">
                {getFileIcon(tab.title)}
                <span className={`ep-tab-file-name${archivosModificados[tab.path] !== undefined ? ' ep-tab-file-name--modified' : ''}`}>
                    {tab.title}
                </span>
                {archivosModificados[tab.path] !== undefined && (
                    <span className="ep-tab-modified-dot">●</span>
                )}
                <CloseOutlined
                    className="ep-tab-close-icon"
                    onClick={(e) => { e.stopPropagation(); onCerrarTab(tab.path); }}
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

    /* ── Loading: cargando repositorio ───────────────────────────── */
    if (loadingArbol) {
        return (
            <div className="ep-tree-loading">
                <Spin size="large" />
                <span className="ep-tree-loading-text">Cargando repositorio...</span>
            </div>
        );
    }

    const repoShort = githubConfig?.repositorio?.split('/')[1] || 'Repositorio';

    return (
        <div className="ep-explorer">

            {/* ══════════════════════════════════════════
                Panel izquierdo — árbol de archivos
                ══════════════════════════════════════════ */}
            <div className="ep-tree-panel">

                {/* Cabecera */}
                <div className="ep-tree-header">
                    <div className="ep-tree-header-info">
                        <GithubOutlined className="ep-tree-header-icon" />
                        <div style={{ minWidth: 0 }}>
                            <div className="ep-tree-repo-name" title={githubConfig?.repositorio}>
                                {repoShort}
                            </div>
                            <div className="ep-tree-branch">
                                <BranchesOutlined />
                                {githubConfig?.rama || 'main'}
                                {totalArchivosModificados > 0 && (
                                    <Badge
                                        count={totalArchivosModificados}
                                        size="small"
                                        className="ep-branch-badge"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="ep-tree-actions">
                        {onCambiarProyecto && (
                            <Tooltip title="Cambiar repositorio / rama">
                                <Button
                                    type="text" size="small"
                                    icon={<SwapOutlined />}
                                    onClick={onCambiarProyecto}
                                    className="ep-tree-action-btn"
                                />
                            </Tooltip>
                        )}
                        <Tooltip title="Recargar árbol">
                            <Button
                                type="text" size="small"
                                icon={<ReloadOutlined />}
                                onClick={onRecargarArbol}
                                className="ep-tree-action-btn"
                            />
                        </Tooltip>
                        <Tooltip title="Desconectar de GitHub">
                            <Button
                                type="text" size="small" danger
                                icon={<DisconnectOutlined />}
                                onClick={onDesconectar}
                                className="ep-tree-action-btn ep-tree-action-btn--danger"
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="ep-tree-search">
                    <Input
                        size="small"
                        placeholder="Buscar archivo..."
                        prefix={<SearchOutlined />}
                        value={busqueda}
                        onChange={handleBusqueda}
                        allowClear
                    />
                </div>

                {/* Árbol */}
                <div className="ep-tree-body">
                    {nodosProcesados.length === 0 ? (
                        <Empty
                            description={
                                <span className="ep-tree-empty-desc">
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
                            expandedKeys={llavesExpandidas}
                            onExpand={setLlavesExpandidas}
                            switcherIcon={({ expanded, isLeaf }) =>
                                isLeaf ? null : getFolderIcon(expanded)
                            }
                            onSelect={handleSelectNode}
                            className="ep-github-tree"
                        />
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                Panel derecho — editor Monaco
                ══════════════════════════════════════════ */}
            <div className="ep-editor-panel">

                {/* Barra de pestañas */}
                <div className="ep-tabs-bar">
                    <div className="ep-tabs-bar-inner">
                        {tabsAbiertos.length > 0 ? (
                            <Tabs
                                type="card"
                                size="small"
                                activeKey={archivoActivo?.path}
                                items={itemsTabs}
                                onChange={(path) => {
                                    const tab = tabsAbiertos.find(t => t.path === path);
                                    if (tab) onSeleccionarArchivo({ path: tab.path, title: tab.title, isLeaf: true });
                                }}
                                style={{ marginBottom: 0 }}
                                tabBarStyle={{ margin: 0, border: 'none', padding: 0 }}
                            />
                        ) : (
                            <span className="ep-editor-no-selection">
                                <CodeOutlined />
                                Selecciona un archivo del explorador
                            </span>
                        )}
                    </div>

                    {archivoActivo && (
                        <div className="ep-tabs-bar-actions">
                            <Dropdown menu={menuGuardar} trigger={['click']}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={tieneModificaciones ? <EditOutlined /> : <CheckOutlined />}
                                    className={tieneModificaciones ? 'ep-save-btn--modified' : 'ep-save-btn--saved'}
                                >
                                    {tieneModificaciones ? 'Sin guardar' : 'Guardado'}
                                </Button>
                            </Dropdown>
                        </div>
                    )}
                </div>

                {/* Editor Monaco */}
                <div className="ep-editor-wrapper">
                    {loadingArchivo && (
                        <div className="ep-editor-loading-overlay">
                            <Spin size="large" tip="Cargando archivo..." />
                        </div>
                    )}

                    {!archivoActivo && !loadingArchivo ? (
                        <div className="ep-editor-empty">
                            <CodeOutlined className="ep-editor-empty-icon" />
                            <span className="ep-editor-empty-title">
                                Selecciona un archivo para editarlo
                            </span>
                            <span className="ep-editor-empty-subtitle">
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
                                fontLigatures: true,
                            }}
                            path={archivoActivo?.path}
                        />
                    )}
                </div>

                {/* Barra de estado inferior — estilo VS Code */}
                {archivoActivo && (
                    <div className="ep-file-statusbar">
                        <span className="ep-file-statusbar-path">
                            {archivoActivo.path}
                        </span>
                        <div className="ep-file-statusbar-right">
                            {tieneModificaciones && (
                                <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>● Modificado</span>
                            )}
                            <span style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {archivoActivo.lenguaje || 'TEXT'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorarGitHub;