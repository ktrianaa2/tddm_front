import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, Select, Space, Button,
  Alert, Steps, Spin, Avatar, Divider, Tag, Popconfirm
} from 'antd';
import {
  GithubOutlined, LinkOutlined, FolderOutlined, BranchesOutlined,
  UserOutlined, CheckCircleOutlined, LockOutlined, UnlockOutlined,
  DeleteOutlined, ReloadOutlined, SwapOutlined
} from '@ant-design/icons';
import '../../../styles/ejecutar-pruebas.css';

const { Option } = Select;

/**
 * ModalGitHub
 *
 * Modos:
 * A) Sin token guardado  → Paso 0 (token) → 1 (repo/rama) → 2 (config)
 * B) Token guardado      → Paso 1 directamente; botón "Cambiar proyecto"
 *                          vuelve a paso 1; botón "Usar otro token" va a paso 0
 */
const ModalGitHub = ({
  visible,
  onCancel,
  onConectar,
  onEliminarConexion,
  loading = false,
  tieneConexionGuardada,
  githubUsuario,
  githubConfigGuardada,
  validarToken,
  listarRepositorios,
  listarRamas,
}) => {
  const [form] = Form.useForm();

  const pasoInicial = tieneConexionGuardada ? 1 : 0;
  const [paso, setPaso] = useState(pasoInicial);

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

  // ── Sincronizar al abrir ─────────────────────────────────────────
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

      if (tieneConexionGuardada && githubConfigGuardada?.token) {
        _cargarRepos(githubConfigGuardada.token);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tieneConexionGuardada]);

  const _cargarRepos = async (token) => {
    setLoadingRepos(true);
    try {
      const repos = await listarRepositorios(token);
      setRepositorios(repos);
    } catch { /* notificado por el hook */ } finally {
      setLoadingRepos(false);
    }
  };

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

  // ── Paso 0: validar token ────────────────────────────────────────
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
      await _cargarRepos(token);
      setPaso(1);
    } catch (error) {
      if (error?.errorFields) return;
      setErrorToken(error.message || 'Token inválido o sin permisos suficientes.');
    } finally {
      setValidandoToken(false);
    }
  };

  // ── Paso 1: seleccionar repo/rama ────────────────────────────────
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
    const valoresFinales = {
      ...datosConexion,
      token: datosConexion.token || githubConfigGuardada?.token,
      ruta,
      framework: 'pytest',
    };
    if (!valoresFinales.token || !valoresFinales.repositorio || !valoresFinales.rama) return;
    try {
      await onConectar(valoresFinales);
      resetTodo();
    } catch { /* manejado por el padre */ }
  };

  // ── Steps ────────────────────────────────────────────────────────
  const steps = [
    {
      title: 'Token',
      icon: tieneConexionGuardada
        ? <CheckCircleOutlined style={{ color: 'var(--success-color)' }} />
        : <GithubOutlined />,
    },
    { title: 'Repositorio', icon: <FolderOutlined /> },
    { title: 'Configuración', icon: <BranchesOutlined /> },
  ];

  return (
    <Modal
      title={
        <Space>
          <GithubOutlined style={{ fontSize: '1.2rem' }} />
          <span>Conectar con GitHub</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Steps current={paso} items={steps} size="small" style={{ marginBottom: '1.5rem' }} />

      <Form form={form} layout="vertical">

        {/* ── PASO 0: Token ── */}
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
                  <br /><small style={{ color: 'var(--text-secondary)' }}>Solo se mostrarán repositorios Python.</small>
                </span>
              }
              type="info"
              showIcon
              style={{ marginBottom: '1.25rem' }}
            />

            <Form.Item
              label="Personal Access Token"
              name="token"
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

        {/* ── PASO 1: Repo/Rama ── */}
        {paso === 1 && (
          <>
            {/* Banner conexión guardada */}
            {tieneConexionGuardada && usuarioGitHub && (
              <div className="ep-modal-saved-banner">
                <Avatar src={usuarioGitHub.avatar_url} icon={<UserOutlined />} size={40} />
                <div className="ep-modal-saved-banner-info">
                  <div className="ep-modal-saved-name">
                    <CheckCircleOutlined className="ep-modal-saved-name-icon" />
                    Conexión guardada — @{usuarioGitHub.login}
                  </div>
                  <div className="ep-modal-saved-subtitle">
                    Tu token está guardado. Elige el repositorio y rama.
                  </div>
                </div>
                <Popconfirm
                  title="¿Eliminar la conexión guardada?"
                  description="Deberás ingresar tu token la próxima vez."
                  onConfirm={() => { onEliminarConexion(); handleCancel(); }}
                  okText="Eliminar"
                  cancelText="Cancelar"
                  okType="danger"
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>Olvidar token</Button>
                </Popconfirm>
              </div>
            )}

            {/* Banner usuario recién validado */}
            {!tieneConexionGuardada && usuarioGitHub && (
              <div className="ep-modal-user-banner">
                <Avatar src={usuarioGitHub.avatar_url} icon={<UserOutlined />} size={40} />
                <div className="ep-modal-user-info">
                  <div className="ep-modal-user-name">
                    <CheckCircleOutlined className="ep-modal-user-name-check" />
                    {usuarioGitHub.name || usuarioGitHub.login}
                  </div>
                  <div className="ep-modal-user-handle">@{usuarioGitHub.login} · Token válido</div>
                </div>
                <Tag color="success" className="ep-modal-repos-badge">
                  🐍 {repositorios.length} repos Python
                </Tag>
              </div>
            )}

            <Form.Item
              label="Repositorio Python"
              name="repo_select"
              rules={[{ required: true, message: 'Selecciona un repositorio' }]}
            >
              <Select
                placeholder={loadingRepos ? 'Cargando...' : 'Selecciona un repositorio Python'}
                showSearch
                optionFilterProp="label"
                loading={loadingRepos}
                value={datosConexion.repositorio || undefined}
                onChange={handleSeleccionarRepo}
                notFoundContent={loadingRepos ? <Spin size="small" /> : 'Sin repositorios Python'}
                suffixIcon={loadingRepos ? <Spin size="small" /> : undefined}
              >
                {repositorios.map(repo => (
                  <Option key={repo.nombre} value={repo.nombre} label={repo.nombre}>
                    <Space size="small">
                      {repo.privado
                        ? <LockOutlined style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }} />
                        : <UnlockOutlined style={{ color: 'var(--success-color)', fontSize: '0.8rem' }} />}
                      <span>{repo.nombre}</span>
                      <Tag color="blue" style={{ fontSize: '0.68rem', margin: 0 }}>🐍 Python</Tag>
                    </Space>
                    {repo.descripcion && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {repo.descripcion}
                      </div>
                    )}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Rama"
              name="rama_select"
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
                    <BranchesOutlined style={{ marginRight: '0.4rem', color: 'var(--text-tertiary)' }} />
                    {r}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Opción para cambiar token */}
            {tieneConexionGuardada && (
              <div className="ep-modal-change-token-link">
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => setPaso(0)}
                >
                  Usar otro token
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── PASO 2: Configuración ── */}
        {paso === 2 && (
          <>
            <div className="ep-modal-repo-summary">
              <div className="ep-modal-repo-summary-title">
                <CheckCircleOutlined className="ep-modal-repo-summary-title-icon" />
                Repositorio seleccionado
              </div>
              <div className="ep-modal-repo-summary-row">
                <GithubOutlined />
                <strong>{datosConexion.repositorio}</strong>
              </div>
              <div className="ep-modal-repo-summary-row">
                <BranchesOutlined />
                Rama: <strong>{datosConexion.rama}</strong>
              </div>
            </div>

            <Form.Item
              label="Ruta raíz del proyecto"
              name="ruta"
              initialValue="/"
              tooltip="Carpeta desde la que se mostrará el explorador. Usa / para todo el repo."
            >
              <Input prefix={<FolderOutlined />} placeholder="/ para la raíz, o /src, /app, etc." />
            </Form.Item>

            <Form.Item label="Framework de pruebas" name="framework" initialValue="pytest">
              <Select disabled>
                <Option value="pytest">pytest</Option>
              </Select>
            </Form.Item>

            <Divider style={{ margin: '1rem 0' }} />
            <Alert
              message="ℹ️ Los cambios son solo locales"
              description="Puedes editar los archivos en el editor, pero los cambios no se subirán a GitHub."
              type="warning"
              showIcon
            />
          </>
        )}

        {/* ── Footer ── */}
        <div className="ep-modal-footer">
          <div className="ep-modal-footer-left">
            {paso > (tieneConexionGuardada ? 1 : 0) && (
              <Button
                onClick={() => setPaso(p => p - 1)}
                disabled={validandoToken || loading}
                className="btn btn-secondary"
              >
                Anterior
              </Button>
            )}
          </div>

          <div className="ep-modal-footer-right">
            <Button
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancelar
            </Button>

            {paso === 0 && (
              <Button
                type="primary"
                onClick={handleValidarToken}
                loading={validandoToken || loadingRepos}
                icon={<GithubOutlined />}
                className="btn btn-primary"
              >
                {validandoToken ? 'Validando...' : loadingRepos ? 'Cargando repos...' : 'Validar Token'}
              </Button>
            )}

            {paso === 1 && (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!datosConexion.repositorio || !datosConexion.rama || loadingRamas}
                className="btn btn-primary"
              >
                Siguiente
              </Button>
            )}

            {paso === 2 && (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                icon={<LinkOutlined />}
                className="btn btn-primary"
              >
                Conectar y Explorar
              </Button>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalGitHub;