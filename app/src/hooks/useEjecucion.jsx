import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import {
    getStoredToken,
    API_ENDPOINTS,
    getWithAuth,
    postJSONAuth,
    deleteWithAuth,
} from '../../config'; // ajusta la ruta según tu estructura

/**
 * useEjecucion
 *
 * Novedad: persistencia de la conexión GitHub.
 * - Al montar, consulta GET /app/github/conexion/obtener/ para ver si ya
 *   hay una conexión guardada. Si existe, reconecta automáticamente.
 * - Al conectar, guarda el token encriptado en el backend (POST /guardar/).
 * - Al desconectar, hace soft-delete en el backend (DELETE /eliminar/).
 *
 * El token GitHub NUNCA se guarda en localStorage ni sessionStorage.
 * Solo viaja encriptado entre el backend Django (BD) y esta sesión en memoria.
 *
 * GitHub API usa Basic Auth para evitar el bloqueo CORS:
 *   Authorization: Basic base64("token:PAT")  ← pasa CORS ✓
 */
export const useEjecucion = () => {
    // ── Estado GitHub ────────────────────────────────────────────────────────
    const [conectadoGitHub, setConectadoGitHub] = useState(false);
    const [githubConfig, setGithubConfig] = useState(null);
    const [loadingGitHub, setLoadingGitHub] = useState(false);

    // true mientras se verifica la conexión guardada al montar
    const [verificandoConexion, setVerificandoConexion] = useState(true);

    // Metadatos del usuario GitHub (para mostrar avatar/nombre en la UI)
    const [githubUsuario, setGithubUsuario] = useState(null);

    // ── Árbol de archivos ────────────────────────────────────────────────────
    const [arbolArchivos, setArbolArchivos] = useState([]);
    const [loadingArbol, setLoadingArbol] = useState(false);

    // ── Archivo activo ───────────────────────────────────────────────────────
    const [archivoActivo, setArchivoActivo] = useState(null);
    const [codigoActivo, setCodigoActivo] = useState('');
    const [codigoOriginal, setCodigoOriginal] = useState('');
    const [loadingArchivo, setLoadingArchivo] = useState(false);

    // ── Archivos con cambios locales ─────────────────────────────────────────
    const [archivosModificados, setArchivosModificados] = useState({});

    // ── Tabs abiertos ────────────────────────────────────────────────────────
    const [tabsAbiertos, setTabsAbiertos] = useState([]);

    // ─────────────────────────────────────────────────────────────────────────
    // AL MONTAR: intentar recuperar conexión guardada en el backend
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const recuperarConexionGuardada = async () => {
            const jwtToken = getStoredToken();
            if (!jwtToken) {
                setVerificandoConexion(false);
                return;
            }

            try {
                const data = await getWithAuth(API_ENDPOINTS.GITHUB_OBTENER_CONEXION, jwtToken);

                if (data?.conexion) {
                    const { token, github_usuario, github_avatar } = data.conexion;

                    setGithubUsuario({ login: github_usuario, avatar_url: github_avatar });

                    // Reconectar silenciosamente sin mostrar el modal
                    // githubConfig solo tiene token y usuario; el repo/rama se selecciona
                    // en el modal simplificado que se muestra cuando hay conexión guardada
                    setGithubConfig({
                        token,
                        usuario: github_usuario,
                        // repositorio y rama se completarán cuando el usuario los elija
                        repositorio: null,
                        rama: null,
                        ruta: '/',
                        framework: 'pytest',
                    });

                    // No marcamos conectadoGitHub=true todavía:
                    // el usuario aún debe elegir repositorio y rama.
                    // El modal detectará que hay token guardado y mostrará el paso 1 directamente.
                }
            } catch {
                // Si falla (token expirado, red, etc.) simplemente no hay conexión guardada
            } finally {
                setVerificandoConexion(false);
            }
        };

        recuperarConexionGuardada();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // GITHUB API HELPER — Basic Auth para evitar bloqueo CORS
    // ─────────────────────────────────────────────────────────────────────────
    const githubFetch = useCallback(async (url, token) => {
        const credenciales = btoa(`token:${token}`);
        const res = await fetch(url, {
            headers: {
                Authorization: `Basic ${credenciales}`,
                Accept: 'application/vnd.github+json',
            },
        });

        if (!res.ok) {
            let mensajeError = `Error ${res.status}`;
            try {
                const err = await res.json();
                mensajeError = err.message || mensajeError;
            } catch { /* ignorar */ }

            if (res.status === 401) throw new Error('Token inválido o expirado. Verifica que tenga el scope "repo".');
            if (res.status === 403) throw new Error('Sin permisos. El token necesita el scope "repo".');
            if (res.status === 404) throw new Error('Recurso no encontrado. Verifica el repositorio y la rama.');
            throw new Error(mensajeError);
        }

        return res.json();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // BACKEND HELPERS — guardar / eliminar conexión en Django
    // ─────────────────────────────────────────────────────────────────────────

    const _guardarConexionBackend = useCallback(async (tokenGitHub, githubLogin, githubAvatar) => {
        const jwtToken = getStoredToken();
        if (!jwtToken) return;
        try {
            await postJSONAuth(API_ENDPOINTS.GITHUB_GUARDAR_CONEXION, {
                token: tokenGitHub,
                github_usuario: githubLogin,
                github_avatar: githubAvatar || '',
            }, jwtToken);
        } catch (err) {
            // No es crítico — la conexión funciona en memoria aunque no se persista
            console.warn('No se pudo guardar la conexión GitHub en el backend:', err.message);
        }
    }, []);

    const _eliminarConexionBackend = useCallback(async () => {
        const jwtToken = getStoredToken();
        if (!jwtToken) return;
        try {
            await deleteWithAuth(API_ENDPOINTS.GITHUB_ELIMINAR_CONEXION, jwtToken);
        } catch (err) {
            console.warn('No se pudo eliminar la conexión GitHub del backend:', err.message);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDAR TOKEN Y LISTAR REPOS/RAMAS
    // ─────────────────────────────────────────────────────────────────────────

    const validarToken = useCallback(async (token) => {
        const data = await githubFetch('https://api.github.com/user', token);
        return data; // { login, avatar_url, name, ... }
    }, [githubFetch]);

    const listarRepositorios = useCallback(async (token) => {
        setLoadingGitHub(true);
        try {
            const data = await githubFetch(
                'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
                token
            );
            // Solo repos Python
            return data
                .filter(r => ['python', ''].includes((r.language || '').toLowerCase()))
                .map(r => ({
                    id: r.id,
                    nombre: r.full_name,
                    descripcion: r.description,
                    privado: r.private,
                    rama_default: r.default_branch,
                    lenguaje: r.language || 'Python',
                    actualizado: r.updated_at,
                }));
        } catch (error) {
            message.error(`Error listando repositorios: ${error.message}`);
            throw error;
        } finally {
            setLoadingGitHub(false);
        }
    }, [githubFetch]);

    const listarRamas = useCallback(async (token, repoFullName) => {
        try {
            const data = await githubFetch(
                `https://api.github.com/repos/${repoFullName}/branches?per_page=100`,
                token
            );
            return data.map(b => b.name);
        } catch (error) {
            message.error(`Error listando ramas: ${error.message}`);
            throw error;
        }
    }, [githubFetch]);

    // ─────────────────────────────────────────────────────────────────────────
    // ÁRBOL DE ARCHIVOS — solo Python
    // ─────────────────────────────────────────────────────────────────────────

    const esArchivoPython = (nombre) => {
        const ext = nombre.split('.').pop()?.toLowerCase();
        return ['py', 'pyi', 'pyx', 'cfg', 'toml', 'ini', 'txt', 'md', 'rst', 'yaml', 'yml', 'json', 'env'].includes(ext)
            || ['requirements', 'pytest.ini', 'setup.cfg', 'pyproject.toml', '.env', 'Makefile', 'Dockerfile'].includes(nombre);
    };

    const _construirArbol = useCallback((items) => {
        const filtrados = items.filter(i => i.type === 'tree' || esArchivoPython(i.path.split('/').pop()));
        const mapa = {};
        const raiz = [];

        [...filtrados]
            .sort((a, b) => a.type === b.type ? a.path.localeCompare(b.path) : a.type === 'tree' ? -1 : 1)
            .forEach(item => {
                const partes = item.path.split('/');
                const nodo = {
                    key: item.path,
                    title: partes[partes.length - 1],
                    path: item.path,
                    sha: item.sha,
                    isLeaf: item.type === 'blob',
                    type: item.type === 'blob' ? 'file' : 'folder',
                    children: item.type === 'tree' ? [] : undefined,
                    size: item.size,
                };
                mapa[item.path] = nodo;
                const parentPath = partes.slice(0, -1).join('/');
                if (partes.length === 1 || !mapa[parentPath]) {
                    raiz.push(nodo);
                } else {
                    mapa[parentPath].children.push(nodo);
                }
            });

        const podar = (nodos) => nodos.filter(n => {
            if (n.isLeaf) return true;
            n.children = podar(n.children || []);
            return n.children.length > 0;
        });

        return podar(raiz);
    }, []);

    const cargarArbolArchivos = useCallback(async (token, repoFullName, rama) => {
        setLoadingArbol(true);
        setArbolArchivos([]);
        try {
            const branchData = await githubFetch(
                `https://api.github.com/repos/${repoFullName}/branches/${encodeURIComponent(rama)}`,
                token
            );
            const treeSha = branchData.commit.commit.tree.sha;
            const treeData = await githubFetch(
                `https://api.github.com/repos/${repoFullName}/git/trees/${treeSha}?recursive=1`,
                token
            );
            if (treeData.truncated) message.warning('Repositorio muy grande; mostrando archivos Python encontrados.');
            const arbol = _construirArbol(treeData.tree || []);
            setArbolArchivos(arbol);
            return arbol;
        } catch (error) {
            message.error(`Error cargando árbol: ${error.message}`);
            throw error;
        } finally {
            setLoadingArbol(false);
        }
    }, [githubFetch, _construirArbol]);

    // ─────────────────────────────────────────────────────────────────────────
    // CONTENIDO DE ARCHIVOS
    // ─────────────────────────────────────────────────────────────────────────

    const detectarLenguaje = (nombre) => {
        const ext = nombre.split('.').pop()?.toLowerCase();
        return {
            py: 'python', pyi: 'python', pyx: 'python', toml: 'toml', cfg: 'ini',
            ini: 'ini', txt: 'plaintext', md: 'markdown', rst: 'plaintext',
            yaml: 'yaml', yml: 'yaml', json: 'json', sh: 'shell'
        }[ext] || 'python';
    };

    const _agregarTab = (nodo) => {
        setTabsAbiertos(prev =>
            prev.find(t => t.path === nodo.path) ? prev : [...prev, { path: nodo.path, title: nodo.title }]
        );
    };

    const cargarArchivo = useCallback(async (nodo) => {
        if (!nodo?.isLeaf) return;

        if (archivosModificados[nodo.path] !== undefined) {
            setArchivoActivo({ ...nodo, lenguaje: detectarLenguaje(nodo.title) });
            setCodigoActivo(archivosModificados[nodo.path]);
            setCodigoOriginal(archivosModificados[nodo.path]);
            _agregarTab(nodo);
            return;
        }

        setLoadingArchivo(true);
        setArchivoActivo({ ...nodo, lenguaje: detectarLenguaje(nodo.title) });
        setCodigoActivo('');

        try {
            const { token, repositorio, rama } = githubConfig;
            const data = await githubFetch(
                `https://api.github.com/repos/${repositorio}/contents/${nodo.path}?ref=${encodeURIComponent(rama)}`,
                token
            );
            let contenido = '';
            if (data.encoding === 'base64') {
                const binStr = atob(data.content.replace(/\n/g, ''));
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                contenido = new TextDecoder('utf-8').decode(bytes);
            } else {
                contenido = data.content || '';
            }
            setCodigoActivo(contenido);
            setCodigoOriginal(contenido);
            _agregarTab(nodo);
        } catch (error) {
            message.error(`Error al cargar el archivo: ${error.message}`);
            setCodigoActivo(`# Error al cargar el archivo: ${error.message}`);
        } finally {
            setLoadingArchivo(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [githubConfig, archivosModificados, githubFetch]);

    // ─────────────────────────────────────────────────────────────────────────
    // EDICIÓN LOCAL
    // ─────────────────────────────────────────────────────────────────────────

    const guardarCambiosLocales = useCallback((path, contenido) => {
        setArchivosModificados(prev => ({ ...prev, [path]: contenido }));
        setCodigoOriginal(contenido);
        message.success('Cambios guardados localmente');
    }, []);

    const descartarCambios = useCallback((path) => {
        setArchivosModificados(prev => { const n = { ...prev }; delete n[path]; return n; });
        message.info('Cambios descartados');
        if (archivoActivo?.path === path) {
            const snap = { ...archivoActivo };
            setTimeout(() => cargarArchivo(snap), 50);
        }
    }, [archivoActivo, cargarArchivo]);

    const actualizarCodigoActivo = useCallback((v) => setCodigoActivo(v), []);

    // ─────────────────────────────────────────────────────────────────────────
    // TABS
    // ─────────────────────────────────────────────────────────────────────────

    const cerrarTab = useCallback((path) => {
        setTabsAbiertos(prev => {
            const nuevos = prev.filter(t => t.path !== path);
            if (archivoActivo?.path === path) {
                if (nuevos.length === 0) { setArchivoActivo(null); setCodigoActivo(''); }
                else {
                    const idx = prev.findIndex(t => t.path === path);
                    const sig = nuevos[Math.max(0, idx - 1)];
                    setTimeout(() => cargarArchivo({ path: sig.path, title: sig.title, isLeaf: true }), 0);
                }
            }
            return nuevos;
        });
    }, [archivoActivo, cargarArchivo]);

    // ─────────────────────────────────────────────────────────────────────────
    // CONECTAR — completo (token + repo + rama)
    // ─────────────────────────────────────────────────────────────────────────

    const conectarGitHub = useCallback(async (valores) => {
        setLoadingGitHub(true);
        try {
            const config = {
                token: valores.token,
                usuario: valores.usuario,
                repositorio: valores.repositorio,
                rama: valores.rama,
                ruta: valores.ruta || '/',
                framework: 'pytest',
            };
            setGithubConfig(config);

            // 1. Guardar token en el backend (encriptado)
            await _guardarConexionBackend(config.token, config.usuario, githubUsuario?.avatar_url || '');

            // 2. Cargar árbol del repo seleccionado
            await cargarArbolArchivos(config.token, config.repositorio, config.rama);

            setConectadoGitHub(true);
            message.success(`Conectado a ${config.repositorio} (${config.rama})`);
            return config;
        } catch (error) {
            message.error(`Error al conectar: ${error.message}`);
            throw error;
        } finally {
            setLoadingGitHub(false);
        }
    }, [cargarArbolArchivos, _guardarConexionBackend, githubUsuario]);

    // ─────────────────────────────────────────────────────────────────────────
    // DESCONECTAR — limpia estado y elimina del backend
    // ─────────────────────────────────────────────────────────────────────────

    const desconectarGitHub = useCallback(async () => {
        await _eliminarConexionBackend();
        setConectadoGitHub(false);
        setGithubConfig(null);
        setGithubUsuario(null);
        setArbolArchivos([]);
        setArchivoActivo(null);
        setCodigoActivo('');
        setCodigoOriginal('');
        setArchivosModificados({});
        setTabsAbiertos([]);
        message.info('Conexión GitHub eliminada');
    }, [_eliminarConexionBackend]);

    // ─────────────────────────────────────────────────────────────────────────

    const tieneConexionGuardada = !!(githubConfig?.token && !conectadoGitHub);
    const tieneModificaciones = archivoActivo ? archivosModificados[archivoActivo.path] !== undefined : false;
    const totalArchivosModificados = Object.keys(archivosModificados).length;

    return {
        // Estado
        conectadoGitHub,
        githubConfig,
        githubUsuario,
        loadingGitHub,
        verificandoConexion,
        tieneConexionGuardada,   // ← true cuando hay token guardado pero aún no eligió repo

        // Árbol
        arbolArchivos, loadingArbol,

        // Archivo activo
        archivoActivo, codigoActivo, codigoOriginal, loadingArchivo,

        // Modificaciones
        archivosModificados, tieneModificaciones, totalArchivosModificados,

        // Tabs
        tabsAbiertos, cerrarTab,

        // Acciones GitHub
        validarToken, listarRepositorios, listarRamas,
        conectarGitHub, desconectarGitHub,
        cargarArbolArchivos, cargarArchivo,

        // Acciones editor
        actualizarCodigoActivo, guardarCambiosLocales, descartarCambios,
        detectarLenguaje,
    };
};

export default useEjecucion;