import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, Select, Space, Button,
  Alert, Steps, Spin, Avatar, Divider, Tag, Popconfirm
} from 'antd';
import {
  GithubOutlined, LinkOutlined, FolderOutlined, BranchesOutlined,
  UserOutlined, CheckCircleOutlined, LockOutlined, UnlockOutlined,
  DeleteOutlined, ReloadOutlined
} from '@ant-design/icons';

const { Option } = Select;

/**
 * ModalGitHub
 *
 * Comportamiento según el estado de la conexión guardada:
 *
 * A) Sin conexión guardada (tieneConexionGuardada=false):
 *    Paso 0 → ingresar token → Paso 1 → repo/rama → Paso 2 → config
 *
 * B) Con conexión guardada (tieneConexionGuardada=true):
 *    Muestra directamente Paso 1 (repo/rama) con el usuario ya identificado.
 *    El usuario puede elegir "Usar otro token" para volver al Paso 0.
 */
const ModalGitHub = ({
  visible,
  onCancel,
  onConectar,
  onEliminarConexion,       // () => void — llama a desconectarGitHub del hook
  loading = false,
  tieneConexionGuardada,    // bool — viene del hook
  githubUsuario,            // { login, avatar_url } — viene del hook
  githubConfigGuardada,     // githubConfig del hook (tiene token)
  validarToken,
  listarRepositorios,
  listarRamas,
}) => {
  const [form] = Form.useForm();

  // Si hay conexión guardada, empezamos en el paso 1 directamente
  const pastoInicial = tieneConexionGuardada ? 1 : 0;
  const [paso, setPaso] = useState(pastoInicial);

  // Datos acumulados entre pasos
  const [datosConexion, setDatosConexion] = useState({
    token: githubConfigGuardada?.token || '',
    usuario: githubUsuario?.login || '',
    repositorio: '',
    rama: '',
    ruta: '/',
    framework: 'pytest',
  });

  const [validandoToken, setValidandoToken] = useState(false);
  const [usuarioGitHub, setUsuarioGitHub] = useState(githubUsuario || null);
  const [errorToken, setErrorToken] = useState('');

  const [repositorios, setRepositorios] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [ramas, setRamas] = useState([]);
  const [loadingRamas, setLoadingRamas] = useState(false);

  // ── Sincronizar estado inicial cuando cambia tieneConexionGuardada ────────
  useEffect(() => {
    if (visible) {
      const nuevoPaso = tieneConexionGuardada ? 1 : 0;
      setPaso(nuevoPaso);
      setDatosConexion({
        token: githubConfigGuardada?.token || '',
        usuario: githubUsuario?.login || '',
        repositorio: '',
        rama: '',
        ruta: '/',
        framework: 'pytest',
      });
      setUsuarioGitHub(githubUsuario || null);
      setErrorToken('');

      // Si hay conexión guardada, cargar repos automáticamente al abrir
      if (tieneConexionGuardada && githubConfigGuardada?.token) {
        cargarReposConToken(githubConfigGuardada.token);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tieneConexionGuardada]);

  const cargarReposConToken = async (token) => {
    setLoadingRepos(true);
    try {
      const repos = await listarRepositorios(token);
      setRepositorios(repos);
    } catch {
      // error ya notificado por el hook
    } finally {
      setLoadingRepos(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetTodo = () => {
    form.resetFields();
    setPaso(tieneConexionGuardada ? 1 : 0);
    setDatosConexion({ token: githubConfigGuardada?.token || '', usuario: githubUsuario?.login || '', repositorio: '', rama: '', ruta: '/', framework: 'pytest' });
    setUsuarioGitHub(githubUsuario || null);
    setErrorToken('');
    setRepositorios([]);
    setRamas([]);
  };

  const handleCancel = () => { resetTodo(); onCancel(); };

  // ── PASO 0: Validar nuevo token ──────────────────────────────────────────
  const handleValidarToken = async () => {
    try {
      const values = await form.validateFields(['token']);
      const token = values.token.trim();

      setValidandoToken(true);
      setErrorToken('');
      setUsuarioGitHub(null);
      setRepositorios([]);

      const userData = await validarToken(token);
      setUsuarioGitHub(userData);
      setDatosConexion(prev => ({ ...prev, token, usuario: userData.login }));

      await cargarReposConToken(token);

      if (repositorios.length === 0) {
        // cargarReposConToken ya pone el estado, comprobamos después
      }
      setPaso(1);
    } catch (error) {
      if (error?.errorFields) return;
      setErrorToken(error.message || 'Token inválido o sin permisos suficientes.');
    } finally {
      setValidandoToken(false);
    }
  };

  // ── Seleccionar repo → ramas ─────────────────────────────────────────────
  const handleSeleccionarRepo = async (repoFullName) => {
    setDatosConexion(prev => ({ ...prev, repositorio: repoFullName, rama: '' }));
    setRamas([]);
    setLoadingRamas(true);
    try {
      const token = datosConexion.token || githubConfigGuardada?.token;
      const ramasData = await listarRamas(token, repoFullName);
      setRamas(ramasData);
      const repoInfo = repositorios.find(r => r.nombre === repoFullName);
      const ramaDefault = repoInfo?.rama_default || 'main';
      const ramaElegida = ramasData.includes(ramaDefault) ? ramaDefault : ramasData[0];
      setDatosConexion(prev => ({ ...prev, rama: ramaElegida }));
      form.setFieldValue('rama_select', ramaElegida);
    } catch { /* notificado */ } finally {
      setLoadingRamas(false);
    }
  };

  const handleSeleccionarRama = (rama) => setDatosConexion(prev => ({ ...prev, rama }));

  const handleNext = () => {
    if (!datosConexion.repositorio) { form.setFields([{ name: 'repo_select', errors: ['Selecciona un repositorio'] }]); return; }
    if (!datosConexion.rama) { form.setFields([{ name: 'rama_select', errors: ['Selecciona una rama'] }]); return; }
    setPaso(2);
  };

  const handleSubmit = async () => {
    const ruta = form.getFieldValue('ruta') || '/';
    const valoresFinales = { ...datosConexion, token: datosConexion.token || githubConfigGuardada?.token, ruta, framework: 'pytest' };
    if (!valoresFinales.token || !valoresFinales.repositorio || !valoresFinales.rama) return;
    try {
      await onConectar(valoresFinales);
      resetTodo();
    } catch { /* manejado por el padre */ }
  };

  // ── Pasos del stepper ────────────────────────────────────────────────────
  // Si hay conexión guardada, el paso 0 (Token) está implícitamente completado
  const steps = tieneConexionGuardada
    ? [
      { title: 'Token', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
      { title: 'Repositorio', icon: <FolderOutlined /> },
      { title: 'Configuración', icon: <BranchesOutlined /> },
    ]
    : [
      { title: 'Token', icon: <GithubOutlined /> },
      { title: 'Repositorio', icon: <FolderOutlined /> },
      { title: 'Configuración', icon: <BranchesOutlined /> },
    ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GithubOutlined style={{ fontSize: '1.3rem' }} />
          <span>Conectar con GitHub</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Steps current={paso} items={steps} size="small" style={{ marginBottom: '1.5rem' }} />

      <Form form={form} layout="vertical">

        {/* ── PASO 0: Token (solo si NO hay conexión guardada) ─────────── */}
        {paso === 0 && (
          <>
            <Alert
              message="Token de Acceso Personal de GitHub"
              description={
                <span>
                  Genera un token en{' '}
                  <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer">
                    GitHub → Settings → Developer settings → Personal access tokens
                  </a>. Activa el scope <strong>repo</strong>.
                  <br /><small style={{ color: '#888' }}>Solo se mostrarán repositorios Python (para usar con pytest).</small>
                </span>
              }
              type="info" showIcon style={{ marginBottom: '1.25rem' }}
            />

            <Form.Item
              label="Personal Access Token" name="token"
              rules={[
                { required: true, message: 'El token es obligatorio' },
                { min: 20, message: 'El token parece demasiado corto' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" maxLength={200} />
            </Form.Item>

            {errorToken && (
              <Alert message={errorToken} type="error" showIcon style={{ marginBottom: '1rem' }} closable onClose={() => setErrorToken('')} />
            )}
          </>
        )}

        {/* ── PASO 1: Repositorio y rama ──────────────────────────────── */}
        {paso === 1 && (
          <>
            {/* Banner: conexión guardada */}
            {tieneConexionGuardada && usuarioGitHub && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px',
                marginBottom: '1.25rem',
              }}>
                <Avatar src={usuarioGitHub.avatar_url} icon={<UserOutlined />} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '0.4rem' }} />
                    Conexión guardada — @{usuarioGitHub.login}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Tu token está guardado de forma segura. Selecciona el proyecto.
                  </div>
                </div>
                <Popconfirm
                  title="¿Eliminar la conexión guardada?"
                  description="Deberás ingresar tu token la próxima vez."
                  onConfirm={() => { onEliminarConexion(); handleCancel(); }}
                  okText="Eliminar" cancelText="Cancelar" okType="danger"
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>Olvidar token</Button>
                </Popconfirm>
              </div>
            )}

            {/* Banner: usuario recién validado (flujo sin conexión guardada) */}
            {!tieneConexionGuardada && usuarioGitHub && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px',
                marginBottom: '1.25rem',
              }}>
                <Avatar src={usuarioGitHub.avatar_url} icon={<UserOutlined />} size={40} />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '0.4rem' }} />
                    {usuarioGitHub.name || usuarioGitHub.login}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>@{usuarioGitHub.login} · Token válido</div>
                </div>
                <Tag color="success" style={{ marginLeft: 'auto' }}>🐍 {repositorios.length} repos Python</Tag>
              </div>
            )}

            <Form.Item label="Repositorio Python" name="repo_select"
              rules={[{ required: true, message: 'Selecciona un repositorio' }]}
            >
              <Select
                placeholder={loadingRepos ? 'Cargando...' : 'Selecciona un repositorio Python'}
                showSearch optionFilterProp="label"
                loading={loadingRepos}
                value={datosConexion.repositorio || undefined}
                onChange={handleSeleccionarRepo}
                notFoundContent={loadingRepos ? <Spin size="small" /> : 'Sin repositorios Python'}
                suffixIcon={loadingRepos ? <Spin size="small" /> : undefined}
              >
                {repositorios.map(repo => (
                  <Option key={repo.nombre} value={repo.nombre} label={repo.nombre}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {repo.privado
                        ? <LockOutlined style={{ color: '#8c8c8c', fontSize: '0.8rem' }} />
                        : <UnlockOutlined style={{ color: '#52c41a', fontSize: '0.8rem' }} />}
                      <span style={{ flex: 1 }}>{repo.nombre}</span>
                      <Tag color="blue" style={{ fontSize: '0.7rem', margin: 0 }}>🐍 Python</Tag>
                    </div>
                    {repo.descripcion && (
                      <div style={{ fontSize: '0.75rem', color: '#8c8c8c', marginTop: '2px' }}>{repo.descripcion}</div>
                    )}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Rama" name="rama_select"
              rules={[{ required: true, message: 'Selecciona una rama' }]}
            >
              <Select
                placeholder={!datosConexion.repositorio ? 'Primero selecciona un repositorio' : loadingRamas ? 'Cargando ramas...' : 'Selecciona una rama'}
                disabled={!datosConexion.repositorio || loadingRamas}
                loading={loadingRamas}
                value={datosConexion.rama || undefined}
                onChange={handleSeleccionarRama}
                notFoundContent={loadingRamas ? <Spin size="small" /> : 'Sin ramas'}
              >
                {ramas.map(r => (
                  <Option key={r} value={r}>
                    <BranchesOutlined style={{ marginRight: '0.4rem', color: '#8c8c8c' }} />{r}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Opción para cambiar el token guardado */}
            {tieneConexionGuardada && (
              <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => setPaso(0)}>
                  Usar otro token
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── PASO 2: Configuración ─────────────────────────────────── */}
        {paso === 2 && (
          <>
            <div style={{
              padding: '0.75rem 1rem', background: '#f0f5ff',
              border: '1px solid #adc6ff', borderRadius: '6px', marginBottom: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '0.4rem' }} />
                Repositorio seleccionado
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <GithubOutlined style={{ marginRight: '0.4rem', color: '#8c8c8c' }} />
                <strong>{datosConexion.repositorio}</strong>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <BranchesOutlined style={{ marginRight: '0.4rem', color: '#8c8c8c' }} />
                Rama: <strong>{datosConexion.rama}</strong>
              </div>
            </div>

            <Form.Item label="Ruta raíz del proyecto" name="ruta" initialValue="/"
              tooltip="Carpeta desde la que se mostrará el explorador. Usa / para todo el repo."
            >
              <Input prefix={<FolderOutlined />} placeholder="/ para la raíz, o /src, /app, etc." />
            </Form.Item>

            <Form.Item label="Framework de pruebas" name="framework" initialValue="pytest">
              <Select disabled><Option value="pytest">pytest</Option></Select>
            </Form.Item>

            <Divider style={{ margin: '1rem 0' }} />
            <Alert
              message="ℹ️ Los cambios son solo locales"
              description="Puedes editar los archivos en el editor, pero los cambios no se subirán a GitHub."
              type="warning" showIcon
            />
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0',
        }}>
          <Space>
            {paso > (tieneConexionGuardada ? 1 : 0) && (
              <Button onClick={() => setPaso(p => p - 1)} disabled={validandoToken || loading}>
                Anterior
              </Button>
            )}
          </Space>

          <Space>
            <Button onClick={handleCancel} disabled={loading}>Cancelar</Button>

            {paso === 0 && (
              <Button type="primary" onClick={handleValidarToken}
                loading={validandoToken || loadingRepos} icon={<GithubOutlined />}
              >
                {validandoToken ? 'Validando...' : loadingRepos ? 'Cargando repos...' : 'Validar Token'}
              </Button>
            )}

            {paso === 1 && (
              <Button type="primary" onClick={handleNext}
                disabled={!datosConexion.repositorio || !datosConexion.rama || loadingRamas}
              >
                Siguiente
              </Button>
            )}

            {paso === 2 && (
              <Button type="primary" onClick={handleSubmit} loading={loading} icon={<LinkOutlined />}>
                Conectar y Explorar
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalGitHub;