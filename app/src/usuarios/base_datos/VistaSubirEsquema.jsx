import React, { useState } from 'react';
import {
  Card,
  Button,
  Upload,
  Form,
  Input,
  message,
  Space,
  Alert,
  Progress
} from 'antd';
import {
  InboxOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import '../../styles/tabs.css';
import '../../styles/buttons.css';

const VistaSubirEsquema = ({
  proyectoId,
  onEsquemaCargado,
  onCancelar
}) => {
  const [form] = Form.useForm();
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);

  const formatosSoportados = [
    'application/sql',
    'text/sql',
    'application/json',
    'text/plain',
    'application/xml',
    'text/xml'
  ];

  const extensionesPermitidas = ['.sql', '.json', '.xml', '.txt'];

  const beforeUpload = (file) => {
    // Validar extensión
    const nombreArchivo = file.name.toLowerCase();
    const tieneExtensionValida = extensionesPermitidas.some(ext =>
      nombreArchivo.endsWith(ext)
    );

    if (!tieneExtensionValida) {
      message.error(`Solo se permiten archivos: ${extensionesPermitidas.join(', ')}`);
      return false;
    }

    // Validar tamaño (máximo 10MB)
    const es10MB = file.size / 1024 / 1024 < 10;
    if (!es10MB) {
      message.error('El archivo debe ser menor a 10MB');
      return false;
    }

    return false; // Evitar que se suba automáticamente
  };

  const handleChangeUpload = ({ fileList: newFileList }) => {
    setArchivos(newFileList);
  };

  const handleGuardarEsquema = async (values) => {
    if (archivos.length === 0) {
      message.error('Por favor selecciona un archivo');
      return;
    }

    const archivo = archivos[0].originFileObj;

    // Leer contenido del archivo
    const reader = new FileReader();

    reader.onload = async (e) => {
      setCargando(true);
      setPorcentaje(0);

      try {
        // Simular progreso
        const intervalo = setInterval(() => {
          setPorcentaje(prev => {
            if (prev >= 90) {
              clearInterval(intervalo);
              return 90;
            }
            return prev + Math.random() * 30;
          });
        }, 300);

        const contenidoArchivo = e.target.result;

        // TODO: Reemplazar con tu endpoint real
        const response = await fetch(`/api/proyectos/${proyectoId}/esquema-bd/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: values.nombreEsquema || archivo.name,
            descripcion: values.descripcion || '',
            contenido: contenidoArchivo,
            nombreArchivo: archivo.name,
            tipoArchivo: archivo.type
          })
        });

        clearInterval(intervalo);
        setPorcentaje(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al cargar esquema');
        }

        message.success('Esquema cargado exitosamente');
        onEsquemaCargado();
      } catch (error) {
        console.error('Error:', error);
        message.error(error.message || 'Error al cargar el archivo');
        setPorcentaje(0);
      } finally {
        setCargando(false);
      }
    };

    reader.readAsText(archivo);
  };

  return (
    <div className="tab-main-content">
      <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)'
        }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
            Subir Esquema de Base de Datos
          </h2>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onCancelar}
            className="btn btn-secondary"
          >
            Volver
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleGuardarEsquema}
        >
          {/* Información de formatos */}
          <Alert
            message="Formatos Soportados"
            description={
              <div>
                <p style={{ margin: '0.5rem 0' }}>
                  Puedes subir archivos en los siguientes formatos:
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  <li><strong>.SQL</strong> - Scripts SQL estándar</li>
                  <li><strong>.JSON</strong> - Esquemas en formato JSON</li>
                  <li><strong>.XML</strong> - Definiciones XML de esquema</li>
                  <li><strong>.TXT</strong> - Texto plano con definiciones</li>
                </ul>
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Tamaño máximo: 10MB
                </p>
              </div>
            }
            type="info"
            showIcon
            style={{
              marginBottom: 'var(--space-lg)',
              borderRadius: 'var(--border-radius-lg)'
            }}
          />

          {/* Upload */}
          <Card
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)',
              marginBottom: 'var(--space-lg)'
            }}
          >
            <Form.Item
              label="Seleccionar Archivo"
              name="archivo"
            >
              <Upload.Dragger
                name="archivo"
                multiple={false}
                beforeUpload={beforeUpload}
                onChange={handleChangeUpload}
                fileList={archivos}
                accept={extensionesPermitidas.join(',')}
              >
                <p style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
                  <InboxOutlined />
                </p>
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  Formatos soportados: SQL, JSON, XML, TXT (máximo 10MB)
                </p>
              </Upload.Dragger>
            </Form.Item>
          </Card>

          {/* Información del esquema */}
          {archivos.length > 0 && (
            <Card
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <Form.Item
                label="Nombre del Esquema (opcional)"
                name="nombreEsquema"
                tooltip="Si no especificas un nombre, se usará el nombre del archivo"
              >
                <Input
                  placeholder={`ej: ${archivos[0]?.name || 'nombre_esquema'}`}
                  defaultValue={archivos[0]?.name?.split('.')[0]}
                />
              </Form.Item>

              <Form.Item
                label="Descripción (opcional)"
                name="descripcion"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Describe el propósito de este esquema..."
                />
              </Form.Item>
            </Card>
          )}

          {/* Progreso */}
          {porcentaje > 0 && porcentaje < 100 && (
            <Card
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <Progress percent={Math.round(porcentaje)} />
              <p style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)'
              }}>
                Procesando archivo...
              </p>
            </Card>
          )}

          {/* Éxito */}
          {porcentaje === 100 && (
            <Card
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 'var(--border-radius-lg)',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                color: '#52c41a'
              }}>
                <CheckCircleOutlined style={{ fontSize: '1.5rem' }} />
                <p style={{ margin: 0 }}>
                  Archivo procesado exitosamente
                </p>
              </div>
            </Card>
          )}

          {/* Botones de acción */}
          <Card
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)'
            }}
          >
            <Space>
              <Button
                onClick={onCancelar}
                className="btn btn-secondary"
                disabled={cargando}
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                disabled={archivos.length === 0 || cargando}
                loading={cargando}
                className="btn btn-primary"
              >
                Guardar Esquema
              </Button>
            </Space>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default VistaSubirEsquema;