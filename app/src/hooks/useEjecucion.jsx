import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import {
    getStoredToken,
    API_ENDPOINTS,
    API_BASE_URL,
    getWithAuth,
    postJSONAuth,
    deleteWithAuth,
} from '../../config';

export const useEjecucion = () => {
    // ── Estado GitHub ────────────────────────────────────────────────────────
    const [conectadoGitHub, setConectadoGitHub] = useState(false);
    const [githubConfig, setGithubConfig] = useState(null);
    const [loadingGitHub, setLoadingGitHub] = useState(false);
    const [verificandoConexion, setVerificandoConexion] = useState(true);
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

    // ── Estado de ejecución pytest ───────────────────────────────────────────
    const [ejecutando, setEjecutando] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        pasadas: 0,
        fallidas: 0,
        pendientes: 0,
        tiempo: 0,
    });
    const abortControllerRef = useRef(null);

    // ─────────────────────────────────────────────────────────────────────────
    // AL MONTAR: recuperar conexión GitHub guardada
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const recuperarConexionGuardada = async () => {
            const jwtToken = getStoredToken();
            if (!jwtToken) { setVerificandoConexion(false); return; }

            try {
                const data = await getWithAuth(API_ENDPOINTS.GITHUB_OBTENER_CONEXION, jwtToken);
                if (data?.conexion) {
                    const { token, github_usuario, github_avatar } = data.conexion;
                    setGithubUsuario({ login: github_usuario, avatar_url: github_avatar });
                    setGithubConfig({
                        token,
                        usuario: github_usuario,
                        repositorio: null,
                        rama: null,
                        ruta: '/',
                        framework: 'pytest',
                    });
                }
            } catch {
                // Sin conexión guardada — silencioso
            } finally {
                setVerificandoConexion(false);
            }
        };

        recuperarConexionGuardada();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // GITHUB API HELPER
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
            try { const err = await res.json(); mensajeError = err.message || mensajeError; } catch { /* ignorar */ }
            if (res.status === 401) throw new Error('Token inválido o expirado. Verifica que tenga el scope "repo".');
            if (res.status === 403) throw new Error('Sin permisos. El token necesita el scope "repo".');
            if (res.status === 404) throw new Error('Recurso no encontrado. Verifica el repositorio y la rama.');
            throw new Error(mensajeError);
        }

        return res.json();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // BACKEND HELPERS — conexión GitHub
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
            console.warn('No se pudo guardar la conexión GitHub:', err.message);
        }
    }, []);

    const _eliminarConexionBackend = useCallback(async () => {
        const jwtToken = getStoredToken();
        if (!jwtToken) return;
        try {
            await deleteWithAuth(API_ENDPOINTS.GITHUB_ELIMINAR_CONEXION, jwtToken);
        } catch (err) {
            console.warn('No se pudo eliminar la conexión GitHub:', err.message);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDAR TOKEN / REPOSITORIOS / RAMAS
    // ─────────────────────────────────────────────────────────────────────────
    const validarToken = useCallback(async (token) => {
        return githubFetch('https://api.github.com/user', token);
    }, [githubFetch]);

    const listarRepositorios = useCallback(async (token) => {
        setLoadingGitHub(true);
        try {
            const data = await githubFetch(
                'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
                token
            );
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
    // ÁRBOL DE ARCHIVOS
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
                if (partes.length === 1 || !mapa[parentPath]) raiz.push(nodo);
                else mapa[parentPath].children.push(nodo);
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
    // CONECTAR / DESCONECTAR GitHub
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
            await _guardarConexionBackend(config.token, config.usuario, githubUsuario?.avatar_url || '');
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
    // HELPERS DE CONSOLA
    // ─────────────────────────────────────────────────────────────────────────
    const _agregarResultado = useCallback((tipo, mensaje) => {
        const timestamp = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        setResultados(prev => [...prev, { tipo, mensaje, timestamp }]);
    }, []);

    const _volcarResultados = useCallback((lista) => {
        const timestamp = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        setResultados(prev => [
            ...prev,
            ...lista.map(r => ({ tipo: r.tipo, mensaje: r.mensaje, timestamp })),
        ]);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // EJECUCIÓN DE PRUEBAS
    // ─────────────────────────────────────────────────────────────────────────
    const ejecutarPruebas = useCallback(async (
        pruebasSeleccionadas,
        codigoAdicional = '',
        timeout = 120,
        modoEjecucion = 'prueba_sola',
    ) => {
        if (!pruebasSeleccionadas || pruebasSeleccionadas.length === 0) {
            message.warning('Selecciona al menos una prueba para ejecutar');
            return;
        }

        setEjecutando(true);
        setResultados([]);

        const codigos = pruebasSeleccionadas.map(p => p.codigo).join(', ');
        const modoLabel = modoEjecucion === 'sobre_codigo' ? '⚙️ Sobre código real' : '🔴 Prueba sola (red phase)';

        _agregarResultado('info', '╔══════════════════════════════════════════════╗');
        _agregarResultado('info', `║  Ejecutando ${pruebasSeleccionadas.length} prueba(s): ${codigos}`);
        _agregarResultado('info', `║  Modo: ${modoLabel}`);
        _agregarResultado('info', '╚══════════════════════════════════════════════╝');
        _agregarResultado('info', '⏳ Enviando al servidor...');

        abortControllerRef.current = new AbortController();

        try {
            const jwtToken = getStoredToken();
            const inicio = Date.now();

            // ── Construir body según el modo ─────────────────────────────────
            const requestBody = {
                prueba_ids: pruebasSeleccionadas.map(p => p.id || p.id_prueba),
                codigo_adicional: codigoAdicional || '',
                timeout,
                modo_ejecucion: modoEjecucion,
            };

            if (modoEjecucion === 'sobre_codigo') {
                // GREEN PHASE: enviar contexto del repo para que los imports
                // del proyecto se resuelvan con el código real.
                if (
                    conectadoGitHub &&
                    githubConfig?.token &&
                    githubConfig?.repositorio &&
                    githubConfig?.rama
                ) {
                    requestBody.github_token = githubConfig.token;
                    requestBody.github_repo = githubConfig.repositorio;
                    requestBody.github_rama = githubConfig.rama;
                }
                // Si hay código manual (sin GitHub), ya va en codigoAdicional.

            } else {
                // RED PHASE: NO enviar nada del repo ni código adicional.
                // Las pruebas deben fallar con ImportError porque los módulos
                // del proyecto no existen en el entorno aislado.
                // El backend NO debe aplicar auto-mock en este modo.
                requestBody.codigo_adicional = ''; // ignorar cualquier código del editor
                requestBody.sin_mock = true; // ← nuevo flag: deshabilita auto-mock
            }

            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.EJECUTAR_PRUEBAS}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                    body: JSON.stringify(requestBody),
                    signal: abortControllerRef.current.signal,
                }
            );

            const data = await response.json();
            const tiempoTotal = ((Date.now() - inicio) / 1000).toFixed(2);

            if (!response.ok) {
                _agregarResultado('error', `❌ Error del servidor (${response.status}): ${data.error || 'Error desconocido'}`);
                return;
            }

            if (data.resultados?.length > 0) {
                _volcarResultados(data.resultados);
            }

            const resumen = data.resumen || {};
            _agregarResultado('log', '');
            _agregarResultado('log', '══════════════════════════════════════════════');

            if (modoEjecucion === 'prueba_sola') {
                // En red phase, el resultado esperado es que fallen
                if (!resumen.ok) {
                    _agregarResultado('success', '🔴 RED PHASE CONFIRMADA — las pruebas fallan sin código real');
                    _agregarResultado('info', '   Esto es correcto en TDD. Ahora implementa el código y ejecuta en "Sobre código".');
                    message.success('Red phase confirmada — las pruebas fallan como se espera');
                } else {
                    _agregarResultado('warning', '⚠️  Las pruebas PASARON sin código real');
                    _agregarResultado('warning', '   Verifica que la prueba realmente importe desde el proyecto (from modulo import Clase).');
                    _agregarResultado('warning', '   Si la clase está definida inline dentro del test, no es TDD real.');
                    message.warning('Las pruebas pasaron sin código — revisa que la prueba importe del proyecto');
                }
            } else {
                // En green phase, el resultado esperado es que pasen
                if (resumen.ok) {
                    _agregarResultado('success', '🟢 GREEN PHASE — el código cumple lo que especifican las pruebas');
                    message.success(`🎉 ${resumen.pasadas} prueba(s) pasaron en ${data.tiempo_ejecucion}`);
                } else {
                    _agregarResultado('error', '❌ Las pruebas fallan contra el código real');
                    if (resumen.pasadas > 0) _agregarResultado('success', `  ✓ Pasadas:  ${resumen.pasadas}`);
                    _agregarResultado('error', `  ✗ Fallidas: ${resumen.fallidas}`);
                    _agregarResultado('info', '   Revisa la implementación en el repo o el código pegado en el editor.');
                    message.error(`${resumen.fallidas} prueba(s) fallan contra el código real`);
                }
            }

            _agregarResultado('info', `⏱️  Tiempo total: ${data.tiempo_ejecucion || tiempoTotal + 's'}`);

            setEstadisticas(prev => ({
                pasadas: prev.pasadas + (resumen.pasadas || 0),
                fallidas: prev.fallidas + (resumen.fallidas || 0),
                pendientes: Math.max(0, prev.pendientes - pruebasSeleccionadas.length),
                tiempo: prev.tiempo + parseFloat(data.tiempo_ejecucion || tiempoTotal),
            }));

            if (data.pruebas_sin_codigo?.length > 0) {
                message.warning(`${data.pruebas_sin_codigo.length} prueba(s) omitidas sin código`);
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                _agregarResultado('warning', '⚠️  Ejecución detenida por el usuario');
                message.info('Ejecución detenida');
            } else {
                _agregarResultado('error', `💥 Error de red: ${err.message}`);
                message.error('Error al conectar con el servidor');
            }
        } finally {
            setEjecutando(false);
            abortControllerRef.current = null;
        }
    }, [_agregarResultado, _volcarResultados, conectadoGitHub, githubConfig]);

    // ─────────────────────────────────────────────────────────────────────────
    // CONTROLES DE EJECUCIÓN
    // ─────────────────────────────────────────────────────────────────────────
    const detenerEjecucion = useCallback(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setEjecutando(false);
    }, []);

    const limpiarResultados = useCallback(() => setResultados([]), []);

    const inicializarPendientes = useCallback((totalAprobadas) => {
        setEstadisticas(prev => ({ ...prev, pendientes: totalAprobadas }));
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // VALORES DERIVADOS
    // ─────────────────────────────────────────────────────────────────────────
    const tieneConexionGuardada = !!(githubConfig?.token && !conectadoGitHub);
    const tieneModificaciones = archivoActivo
        ? archivosModificados[archivoActivo.path] !== undefined
        : false;
    const totalArchivosModificados = Object.keys(archivosModificados).length;

    return {
        // ── GitHub ──────────────────────────────────────────────────────────
        conectadoGitHub, githubConfig, githubUsuario, loadingGitHub,
        verificandoConexion, tieneConexionGuardada,

        // ── Árbol ───────────────────────────────────────────────────────────
        arbolArchivos, loadingArbol,

        // ── Archivo activo ───────────────────────────────────────────────────
        archivoActivo, codigoActivo, codigoOriginal, loadingArchivo,

        // ── Modificaciones ───────────────────────────────────────────────────
        archivosModificados, tieneModificaciones, totalArchivosModificados,

        // ── Tabs ─────────────────────────────────────────────────────────────
        tabsAbiertos, cerrarTab,

        // ── Acciones GitHub ──────────────────────────────────────────────────
        validarToken, listarRepositorios, listarRamas,
        conectarGitHub, desconectarGitHub,
        cargarArbolArchivos, cargarArchivo,

        // ── Acciones editor ──────────────────────────────────────────────────
        actualizarCodigoActivo, guardarCambiosLocales, descartarCambios, detectarLenguaje,

        // ── Ejecución pytest ─────────────────────────────────────────────────
        ejecutando, resultados, estadisticas,
        ejecutarPruebas, detenerEjecucion, limpiarResultados, inicializarPendientes,
    };
};

export default useEjecucion;