import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, Button, Row, Col, Empty, Spin, message, Slider } from 'antd';
import {
    DownloadOutlined,
    ReloadOutlined,
    UserOutlined,
    BookOutlined,
    FileTextOutlined,
    ZoomInOutlined,
    ZoomOutOutlined
} from '@ant-design/icons';
import mermaid from 'mermaid';
import '../../styles/tabs.css';
import '../../styles/diagrams.css';

const DiagramasUMLSection = ({
    requisitos = [],
    casosUso = [],
    historiasUsuario = [],
    loading = false
}) => {
    const [tipoDiagrama, setTipoDiagrama] = useState('casos-uso');
    const [codigoMermaid, setCodigoMermaid] = useState('');
    const [diagramLoading, setDiagramLoading] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [showZoomSlider, setShowZoomSlider] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);

    // Generar diagrama de casos de uso
    const generarDiagramaCasosUso = () => {
        if (casosUso.length === 0) return '';

        let diagrama = 'graph TD\n';
        diagrama += '    subgraph Actores\n';

        const actoresSet = new Set();
        casosUso.forEach(cu => {
            if (cu.actores) {
                const actores = cu.actores.split(',').map(a => a.trim());
                actores.forEach(actor => {
                    if (actor) actoresSet.add(actor);
                });
            }
        });

        const actoresArray = Array.from(actoresSet);
        actoresArray.forEach((actor, index) => {
            const actorId = `A${index + 1}`;
            diagrama += `        ${actorId}["👤 ${actor}"]\n`;
        });
        diagrama += '    end\n\n';

        diagrama += '    subgraph CasosDeUso["Casos de Uso"]\n';

        casosUso.forEach((cu, index) => {
            const cuId = `CU${index + 1}`;
            const prioridad = cu.prioridad ? ` [${cu.prioridad}]` : '';
            diagrama += `        ${cuId}["${cu.nombre}${prioridad}"]\n`;
        });
        diagrama += '    end\n\n';

        casosUso.forEach((cu, index) => {
            const cuId = `CU${index + 1}`;
            if (cu.actores) {
                const actores = cu.actores.split(',').map(a => a.trim());
                actores.forEach(actor => {
                    const actorId = `A${actoresArray.indexOf(actor) + 1}`;
                    diagrama += `    ${actorId} -->|interactúa| ${cuId}\n`;
                });
            }
        });

        if (casosUso.some(cu => cu.relaciones && cu.relaciones.length > 0)) {
            diagrama += '\n    subgraph Relaciones["Relaciones entre CU"]\n';
            casosUso.forEach((cu, index) => {
                const cuId = `CU${index + 1}`;
                if (cu.relaciones && Array.isArray(cu.relaciones)) {
                    cu.relaciones.forEach(rel => {
                        const tipoRel = rel.tipo || 'relacionado';
                        diagrama += `        ${cuId} -->|${tipoRel}| Rel["Relación"]\n`;
                    });
                }
            });
            diagrama += '    end\n';
        }

        return diagrama;
    };

    // Generar diagrama de requisitos
    const generarDiagramaRequisitos = () => {
        if (requisitos.length === 0) return '';

        let diagrama = 'graph TD\n';
        diagrama += '    subgraph RequisitosFunc["Requisitos Funcionales"]\n';

        const reqFuncionales = requisitos.filter(r => r.tipo && r.tipo.toLowerCase().includes('funcional'));
        const reqNoFuncionales = requisitos.filter(r => r.tipo && r.tipo.toLowerCase().includes('no-funcional'));
        const reqOtros = requisitos.filter(r => !r.tipo || (!r.tipo.toLowerCase().includes('funcional') && !r.tipo.toLowerCase().includes('no-funcional')));

        reqFuncionales.forEach((req, index) => {
            const reqId = `RF${index + 1}`;
            const prioridad = req.prioridad ? ` [${req.prioridad}]` : '';
            diagrama += `        ${reqId}["${req.nombre}${prioridad}"]\n`;
        });
        diagrama += '    end\n\n';

        if (reqNoFuncionales.length > 0) {
            diagrama += '    subgraph RequisitosNoFunc["Requisitos No Funcionales"]\n';
            reqNoFuncionales.forEach((req, index) => {
                const reqId = `RNF${index + 1}`;
                const prioridad = req.prioridad ? ` [${req.prioridad}]` : '';
                diagrama += `        ${reqId}["${req.nombre}${prioridad}"]\n`;
            });
            diagrama += '    end\n\n';
        }

        if (reqOtros.length > 0) {
            diagrama += '    subgraph RequisitosOtros["Otros Requisitos"]\n';
            reqOtros.forEach((req, index) => {
                const reqId = `RO${index + 1}`;
                const prioridad = req.prioridad ? ` [${req.prioridad}]` : '';
                diagrama += `        ${reqId}["${req.nombre}${prioridad}"]\n`;
            });
            diagrama += '    end\n\n';
        }

        requisitos.forEach((req, index) => {
            if (req.relaciones_requisitos && Array.isArray(req.relaciones_requisitos)) {
                req.relaciones_requisitos.forEach(rel => {
                    const tipoRelacion = rel.tipo_relacion || 'depende-de';
                    const reqIdOrigen = `R${index + 1}`;
                    const reqIdDestino = `R${index + 2}`;
                    diagrama += `    ${reqIdOrigen} -->|${tipoRelacion}| ${reqIdDestino}\n`;
                });
            }
        });

        return diagrama;
    };

    // Generar diagrama de historias de usuario
    const generarDiagramaHistorias = () => {
        if (historiasUsuario.length === 0) return '';

        let diagrama = 'graph TD\n';
        diagrama += '    subgraph Usuarios["Roles/Actores"]\n';

        const rolesSet = new Set();
        historiasUsuario.forEach(h => {
            if (h.actor_rol) {
                rolesSet.add(h.actor_rol);
            }
        });

        const rolesArray = Array.from(rolesSet);
        rolesArray.forEach((rol, index) => {
            const rolId = `ROL${index + 1}`;
            diagrama += `        ${rolId}["👤 ${rol}"]\n`;
        });
        diagrama += '    end\n\n';

        diagrama += '    subgraph Historias["Historias de Usuario"]\n';

        historiasUsuario.forEach((hu, index) => {
            const huId = `HU${index + 1}`;
            const titulo = hu.titulo ? hu.titulo.substring(0, 30) : 'Sin título';
            const prioridad = hu.prioridad ? ` [${hu.prioridad}]` : '';
            diagrama += `        ${huId}["${titulo}${prioridad}"]\n`;
        });
        diagrama += '    end\n\n';

        diagrama += '    subgraph Valores["Valor de Negocio"]\n';
        historiasUsuario.forEach((hu, index) => {
            if (hu.valor_negocio) {
                const huId = `HU${index + 1}`;
                const valor = hu.valor_negocio;
                const valorId = `VAL${index + 1}`;
                diagrama += `        ${valorId}["💰 ${valor}pts"]\n`;
                diagrama += `        ${huId} --> ${valorId}\n`;
            }
        });
        diagrama += '    end\n\n';

        historiasUsuario.forEach((hu, index) => {
            const huId = `HU${index + 1}`;
            if (hu.actor_rol) {
                const rolIndex = rolesArray.indexOf(hu.actor_rol);
                const rolId = `ROL${rolIndex + 1}`;
                diagrama += `    ${rolId} -->|participa| ${huId}\n`;
            }
        });

        return diagrama;
    };

    // Validar y cambiar tipo de diagrama si no hay datos
    useEffect(() => {
        if (tipoDiagrama === 'casos-uso' && casosUso.length === 0) {
            if (requisitos.length > 0) setTipoDiagrama('requisitos');
            else if (historiasUsuario.length > 0) setTipoDiagrama('historias');
        } else if (tipoDiagrama === 'requisitos' && requisitos.length === 0) {
            if (casosUso.length > 0) setTipoDiagrama('casos-uso');
            else if (historiasUsuario.length > 0) setTipoDiagrama('historias');
        } else if (tipoDiagrama === 'historias' && historiasUsuario.length === 0) {
            if (casosUso.length > 0) setTipoDiagrama('casos-uso');
            else if (requisitos.length > 0) setTipoDiagrama('requisitos');
        }
    }, [casosUso, requisitos, historiasUsuario, tipoDiagrama]);

    // Generar el diagrama según el tipo seleccionado
    useEffect(() => {
        setDiagramLoading(true);
        const timer = setTimeout(() => {
            let codigo = '';
            switch (tipoDiagrama) {
                case 'casos-uso':
                    codigo = generarDiagramaCasosUso();
                    break;
                case 'requisitos':
                    codigo = generarDiagramaRequisitos();
                    break;
                case 'historias':
                    codigo = generarDiagramaHistorias();
                    break;
                default:
                    codigo = '';
            }
            setCodigoMermaid(codigo);
            setDiagramLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [tipoDiagrama, casosUso, requisitos, historiasUsuario])

    // Renderizar el diagrama con Mermaid
    useEffect(() => {
        if (!codigoMermaid || !containerRef.current) return;

        const renderDiagram = async () => {
            try {
                containerRef.current.innerHTML = `<div class="mermaid">${codigoMermaid}</div>`;
                await mermaid.contentLoaded();
            } catch (error) {
                console.error('Error renderizando diagrama:', error);
                message.error('Error al renderizar el diagrama');
            }
        };

        renderDiagram();
    }, [codigoMermaid]);

    // Manejo de eventos para zoom y pan - prevenir scroll de página
    const handleWheel = (e) => {
        if (!wrapperRef.current) return;

        // Solo activa zoom si el control está sobre el diagrama
        const rect = wrapperRef.current.getBoundingClientRect();
        const isOverDiagram = e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (isOverDiagram) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            setZoom(prev => Math.max(25, Math.min(400, prev + delta)));
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setZoom(100);
        setPan({ x: 0, y: 0 });
    };

    // Descargar como PNG con alta calidad - COMPLETO
    const descargarPNG = async () => {
        try {
            message.loading('Generando imagen...');

            const svg = containerRef.current?.querySelector('svg');
            if (!svg) {
                message.error('No hay diagrama para descargar');
                return;
            }

            // Obtener el viewBox o dimensiones reales
            const viewBox = svg.getAttribute('viewBox');
            let width, height;

            if (viewBox) {
                const parts = viewBox.split(' ');
                width = parseFloat(parts[2]);
                height = parseFloat(parts[3]);
            } else {
                const bbox = svg.getBBox();
                width = bbox.width;
                height = bbox.height;
            }

            // Usar escala más alta para mejor calidad
            const scale = 4;
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;

            const ctx = canvas.getContext('2d');

            // Fondo blanco
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clonar y ajustar el SVG
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', width * scale);
            svgClone.setAttribute('height', height * scale);

            const svgData = new XMLSerializer().serializeToString(svgClone);
            const img = new Image();

            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png', 1);
                link.download = `diagrama-${tipoDiagrama}-${new Date().getTime()}.png`;
                link.click();
                message.success('Diagrama descargado en alta calidad');
            };

            img.onerror = () => {
                message.error('Error al procesar la imagen');
            };

            const encodedSvg = encodeURIComponent(svgData);
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
        } catch (error) {
            console.error('Error descargando diagrama:', error);
            message.error('Error al descargar el diagrama');
        }
    };

    // Descargar como SVG
    const descargarSVG = () => {
        try {
            const svg = containerRef.current?.querySelector('svg');
            if (!svg) {
                message.error('No hay diagrama para descargar');
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagrama-${tipoDiagrama}-${new Date().getTime()}.svg`;
            link.click();
            URL.revokeObjectURL(url);
            message.success('Diagrama descargado');
        } catch (error) {
            console.error('Error descargando diagrama:', error);
            message.error('Error al descargar el diagrama');
        }
    };

    // Recargar diagrama
    const recargar = () => {
        setDiagramLoading(true);
        const timer = setTimeout(() => {
            let codigo = '';
            switch (tipoDiagrama) {
                case 'casos-uso':
                    codigo = generarDiagramaCasosUso();
                    break;
                case 'requisitos':
                    codigo = generarDiagramaRequisitos();
                    break;
                case 'historias':
                    codigo = generarDiagramaHistorias();
                    break;
                default:
                    codigo = '';
            }
            setCodigoMermaid(codigo);
            setDiagramLoading(false);
            resetView();
            message.success('Diagrama recargado');
        }, 300);

        return () => clearTimeout(timer);
    };

    // Determinar si hay datos
    const tieneDatos = casosUso.length > 0 || requisitos.length > 0 || historiasUsuario.length > 0;
    const tieneDatosPorTipo = {
        'casos-uso': casosUso.length > 0,
        'requisitos': requisitos.length > 0,
        'historias': historiasUsuario.length > 0
    };

    const opcionesDiagrama = [
        {
            label: (
                <span>
                    <UserOutlined style={{ marginRight: '0.5rem' }} />
                    Casos de Uso {casosUso.length > 0 && `(${casosUso.length})`}
                </span>
            ),
            value: 'casos-uso',
            disabled: casosUso.length === 0
        },
        {
            label: (
                <span>
                    <FileTextOutlined style={{ marginRight: '0.5rem' }} />
                    Requisitos {requisitos.length > 0 && `(${requisitos.length})`}
                </span>
            ),
            value: 'requisitos',
            disabled: requisitos.length === 0
        },
        {
            label: (
                <span>
                    <BookOutlined style={{ marginRight: '0.5rem' }} />
                    Historias de Usuario {historiasUsuario.length > 0 && `(${historiasUsuario.length})`}
                </span>
            ),
            value: 'historias',
            disabled: historiasUsuario.length === 0
        }
    ];

    if (loading) {
        return (
            <Card style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)"
            }}>
                <Spin size="large" />
                <div style={{ marginTop: "1rem" }}>
                    Cargando datos...
                </div>
            </Card>
        );
    }

    if (!tieneDatos) {
        return (
            <Card style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)"
            }}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <div>
                            <p style={{
                                fontSize: '1.1rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text-primary)'
                            }}>
                                No hay información para generar diagramas
                            </p>
                            <p style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Crea al menos un requisito, caso de uso o historia de usuario para ver los diagramas UML
                            </p>
                        </div>
                    }
                />
            </Card>
        );
    }

    const zoomValue = zoom / 100;
    return (
        <div className="diagram-uml-container">
            {/* Controles superiores */}
            <Row gutter={[16, 16]} style={{ marginBottom: '1rem' }}>
                <Col xs={24} sm={12} md={8}>
                    <Select
                        value={tipoDiagrama}
                        onChange={(value) => {
                            if (tieneDatosPorTipo[value]) {
                                setTipoDiagrama(value);
                                resetView();
                            } else {
                                message.warning('No hay datos disponibles para este tipo de diagrama');
                            }
                        }}
                        options={opcionesDiagrama}
                        style={{ width: '100%' }}
                        className="diagram-select"
                    />
                </Col>
                <Col xs={24} sm={12} md={16}>
                    <div className="diagram-actions">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={recargar}
                            loading={diagramLoading}
                            className="diagram-btn"
                        >
                            Recargar
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={descargarSVG}
                            disabled={!codigoMermaid}
                            className="diagram-btn"
                        >
                            Descargar SVG
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={descargarPNG}
                            disabled={!codigoMermaid}
                            className="diagram-btn diagram-btn-primary"
                        >
                            Descargar PNG HD
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Diagrama Container */}
            <Card className="diagram-card">
                {codigoMermaid ? (
                    <div className="diagram-content">
                        {/* Área del diagrama */}
                        <div
                            ref={wrapperRef}
                            className={`diagram-viewer ${isDragging ? 'dragging' : ''}`}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div
                                ref={containerRef}
                                className="diagram-canvas"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomValue})`,
                                    transition: isDragging ? 'none' : 'transform 0.1s'
                                }}
                            >
                                {diagramLoading && <Spin size="large" />}
                            </div>
                        </div>

                        {/* Controles de zoom flotantes (inferior derecha) */}
                        <div className="diagram-zoom-controls">
                            <Button
                                icon={<ZoomOutOutlined />}
                                onClick={() => setZoom(prev => Math.max(25, prev - 10))}
                                disabled={zoom <= 25}
                                size="small"
                                className="zoom-btn"
                            />

                            <div className="zoom-value-container">
                                <Button
                                    size="small"
                                    className="zoom-value-btn"
                                    onClick={() => setShowZoomSlider(!showZoomSlider)}
                                >
                                    {zoom}%
                                </Button>

                                {showZoomSlider && (
                                    <div className="zoom-slider-popup">
                                        <Slider
                                            vertical
                                            min={25}
                                            max={400}
                                            value={zoom}
                                            onChange={setZoom}
                                            tooltipPlacement="left"
                                            tooltip={{
                                                formatter: (val) => `${val}%`
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <Button
                                icon={<ZoomInOutlined />}
                                onClick={() => setZoom(prev => Math.min(400, prev + 10))}
                                disabled={zoom >= 400}
                                size="small"
                                className="zoom-btn"
                            />

                            <Button
                                icon={<ReloadOutlined />}
                                onClick={resetView}
                                disabled={zoom === 100 && pan.x === 0 && pan.y === 0}
                                size="small"
                                className="zoom-btn"
                                title="Restablecer vista"
                            />
                        </div>

                        {/* Instrucciones flotantes */}
                        <div className="diagram-instructions">
                            <strong>Controles:</strong> Rueda del ratón para zoom • Arrastra para desplazarte
                        </div>
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div>
                                <p style={{
                                    fontSize: '1.1rem',
                                    marginBottom: '0.5rem',
                                    color: 'var(--text-primary)'
                                }}>
                                    {`No hay datos disponibles para ${tipoDiagrama === 'casos-uso' ? 'casos de uso' :
                                        tipoDiagrama === 'requisitos' ? 'requisitos' :
                                            'historias de usuario'
                                        }`}
                                </p>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Crea los elementos necesarios para generar este diagrama
                                </p>
                            </div>
                        }
                    />
                )}
            </Card>
        </div>
    );
};

export default DiagramasUMLSection;