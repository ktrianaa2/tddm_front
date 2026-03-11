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

    // Generar diagrama de casos de uso con formato UML mejorado
    const generarDiagramaCasosUso = () => {
        if (casosUso.length === 0) return '';

        let diagrama = `graph TD\n`;
        diagrama += `    classDef actor fill:#e8f4f8,stroke:#0099cc,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef usecase fill:#fff4e6,stroke:#ff9933,stroke-width:3px,color:#000\n`;
        diagrama += `    classDef system fill:#f0f0f0,stroke:#333,stroke-width:2px,color:#000\n\n`;

        // Crear conjunto de actores
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

        // Crear el sistema (rectángulo que contiene los casos de uso)
        diagrama += `    subgraph SISTEMA["SISTEMA"]\n`;
        diagrama += `        direction LR\n`;

        casosUso.forEach((cu, index) => {
            const cuId = `UC${index + 1}`;
            const prioridad = cu.prioridad ? ` [${cu.prioridad}]` : '';
            // Usar sintaxis de elipse para casos de uso
            diagrama += `        ${cuId}["${cu.nombre}${prioridad}"]\n`;
        });

        diagrama += `    end\n`;
        diagrama += `    SISTEMA:::system\n\n`;

        // Agregar actores fuera del sistema
        actoresArray.forEach((actor, index) => {
            const actorId = `ACTOR${index + 1}`;
            diagrama += `    ${actorId}["👤<br/>${actor}"]\n`;
            diagrama += `    ${actorId}:::actor\n`;
        });

        // Conexiones entre actores y casos de uso
        casosUso.forEach((cu, index) => {
            const cuId = `UC${index + 1}`;
            if (cu.actores) {
                const actores = cu.actores.split(',').map(a => a.trim());
                actores.forEach(actor => {
                    const actorIndex = actoresArray.indexOf(actor);
                    const actorId = `ACTOR${actorIndex + 1}`;
                    diagrama += `    ${actorId} --> ${cuId}\n`;
                });
            }
        });

        return diagrama;
    };

    // Generar diagrama de requisitos mejorado
    const generarDiagramaRequisitos = () => {
        if (requisitos.length === 0) return '';

        let diagrama = `graph TD\n`;
        diagrama += `    classDef reqFunc fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef reqNoFunc fill:#bbdefb,stroke:#1565c0,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef reqOther fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef sistema fill:#f0f0f0,stroke:#333,stroke-width:2px,color:#000\n\n`;

        const reqFuncionales = requisitos.filter(r => r.tipo && r.tipo.toLowerCase().includes('funcional'));
        const reqNoFuncionales = requisitos.filter(r => r.tipo && r.tipo.toLowerCase().includes('no-funcional'));
        const reqOtros = requisitos.filter(r => !r.tipo || (!r.tipo.toLowerCase().includes('funcional') && !r.tipo.toLowerCase().includes('no-funcional')));

        diagrama += `    subgraph REQS["REQUISITOS DEL SISTEMA"]\n`;

        if (reqFuncionales.length > 0) {
            diagrama += `        subgraph RF["Requisitos Funcionales"]\n`;
            reqFuncionales.forEach((req, index) => {
                const reqId = `RF${index + 1}`;
                const prioridad = req.prioridad ? ` [${req.prioridad}]` : '';
                diagrama += `            ${reqId}["${req.nombre}${prioridad}"]\n`;
            });
            diagrama += `        end\n`;
        }

        if (reqNoFuncionales.length > 0) {
            diagrama += `        subgraph RNF["Requisitos No Funcionales"]\n`;
            reqNoFuncionales.forEach((req, index) => {
                const reqId = `RNF${index + 1}`;
                const prioridad = req.prioridad ? ` [${req.prioridad}]` : '';
                diagrama += `            ${reqId}["${req.nombre}${prioridad}"]\n`;
            });
            diagrama += `        end\n`;
        }

        if (reqOtros.length > 0) {
            diagrama += `        subgraph RO["Otros Requisitos"]\n`;
            reqOtros.forEach((req, index) => {
                const reqId = `RO${index + 1}`;
                const prioridad = req.prioridad ? ` [${req.prioridad}]` : '';
                diagrama += `            ${reqId}["${req.nombre}${prioridad}"]\n`;
            });
            diagrama += `        end\n`;
        }

        diagrama += `    end\n`;
        diagrama += `    REQS:::sistema\n\n`;

        // Aplicar clases a requisitos
        reqFuncionales.forEach((_, index) => {
            diagrama += `    RF${index + 1}:::reqFunc\n`;
        });
        reqNoFuncionales.forEach((_, index) => {
            diagrama += `    RNF${index + 1}:::reqNoFunc\n`;
        });
        reqOtros.forEach((_, index) => {
            diagrama += `    RO${index + 1}:::reqOther\n`;
        });

        return diagrama;
    };

    // Generar diagrama de historias de usuario mejorado
    const generarDiagramaHistorias = () => {
        if (historiasUsuario.length === 0) return '';

        let diagrama = `graph TD\n`;
        diagrama += `    classDef actor fill:#e8f4f8,stroke:#0099cc,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef historia fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef valor fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000\n`;
        diagrama += `    classDef sistema fill:#f0f0f0,stroke:#333,stroke-width:2px,color:#000\n\n`;

        const rolesSet = new Set();
        historiasUsuario.forEach(h => {
            if (h.actor_rol) rolesSet.add(h.actor_rol);
        });

        const rolesArray = Array.from(rolesSet);

        // Agregar actores
        diagrama += `    subgraph ACTORES["ACTORES DEL SISTEMA"]\n`;
        rolesArray.forEach((rol, index) => {
            const rolId = `ROL${index + 1}`;
            diagrama += `        ${rolId}["👤<br/>${rol}"]\n`;
        });
        diagrama += `    end\n`;
        diagrama += `    ACTORES:::sistema\n\n`;

        // Agregar historias
        diagrama += `    subgraph HISTORIAS["HISTORIAS DE USUARIO"]\n`;
        historiasUsuario.forEach((hu, index) => {
            const huId = `HU${index + 1}`;
            const titulo = hu.titulo ? hu.titulo.substring(0, 25) : 'Sin título';
            const prioridad = hu.prioridad ? ` [${hu.prioridad}]` : '';
            diagrama += `        ${huId}["${titulo}${prioridad}"]\n`;
        });
        diagrama += `    end\n\n`;

        // Aplicar clases
        historiasUsuario.forEach((_, index) => {
            diagrama += `    HU${index + 1}:::historia\n`;
        });

        // Conexiones
        historiasUsuario.forEach((hu, index) => {
            const huId = `HU${index + 1}`;
            if (hu.actor_rol) {
                const rolIndex = rolesArray.indexOf(hu.actor_rol);
                const rolId = `ROL${rolIndex + 1}`;
                diagrama += `    ${rolId} --> |realiza| ${huId}\n`;
            }
            if (hu.valor_negocio) {
                const valorId = `VAL${index + 1}`;
                diagrama += `    ${valorId}["💰 ${hu.valor_negocio} pts"]\n`;
                diagrama += `    ${valorId}:::valor\n`;
                diagrama += `    ${huId} --> ${valorId}\n`;
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
    }, [tipoDiagrama, casosUso, requisitos, historiasUsuario]);

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

    const handleWheel = (e) => {
        if (!wrapperRef.current) return;
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

    const descargarPNG = async () => {
        try {
            message.loading('Generando imagen...');
            const svg = containerRef.current?.querySelector('svg');
            if (!svg) {
                message.error('No hay diagrama para descargar');
                return;
            }

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

            const scale = 4;
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

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

            const encodedSvg = encodeURIComponent(svgData);
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
        } catch (error) {
            console.error('Error descargando diagrama:', error);
            message.error('Error al descargar el diagrama');
        }
    };

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

    const tieneDatos = casosUso.length > 0 || requisitos.length > 0 || historiasUsuario.length > 0;
    const tieneDatosPorTipo = {
        'casos-uso': casosUso.length > 0,
        'requisitos': requisitos.length > 0,
        'historias': historiasUsuario.length > 0
    };

    const opcionesDiagrama = [
        {
            label: <span><UserOutlined style={{ marginRight: '0.5rem' }} />Casos de Uso {casosUso.length > 0 && `(${casosUso.length})`}</span>,
            value: 'casos-uso',
            disabled: casosUso.length === 0
        },
        {
            label: <span><FileTextOutlined style={{ marginRight: '0.5rem' }} />Requisitos {requisitos.length > 0 && `(${requisitos.length})`}</span>,
            value: 'requisitos',
            disabled: requisitos.length === 0
        },
        {
            label: <span><BookOutlined style={{ marginRight: '0.5rem' }} />Historias {historiasUsuario.length > 0 && `(${historiasUsuario.length})`}</span>,
            value: 'historias',
            disabled: historiasUsuario.length === 0
        }
    ];

    if (loading) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <Spin size="large" />
                <div style={{ marginTop: "1rem" }}>Cargando datos...</div>
            </Card>
        );
    }

    if (!tieneDatos) {
        return (
            <Card style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No hay información para generar diagramas" />
            </Card>
        );
    }

    const zoomValue = zoom / 100;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 300px)', minHeight: '600px', gap: '1rem' }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Select
                        value={tipoDiagrama}
                        onChange={(value) => {
                            if (tieneDatosPorTipo[value]) {
                                setTipoDiagrama(value);
                                resetView();
                            }
                        }}
                        options={opcionesDiagrama}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={16}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button icon={<ReloadOutlined />} onClick={recargar} loading={diagramLoading}>Recargar</Button>
                        <Button icon={<DownloadOutlined />} onClick={descargarSVG} disabled={!codigoMermaid}>Descargar SVG</Button>
                        <Button icon={<DownloadOutlined />} onClick={descargarPNG} disabled={!codigoMermaid} type="primary">Descargar PNG HD</Button>
                    </div>
                </Col>
            </Row>

            <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div
                    ref={wrapperRef}
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        cursor: 'grab',
                        position: 'relative',
                        background: '#fafafa',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px'
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        ref={containerRef}
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomValue})`,
                            transformOrigin: 'top center',
                            display: 'inline-block',
                            minWidth: '100%',
                            padding: '2rem',
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                    >
                        {diagramLoading && <Spin size="large" />}
                    </div>

                    {/* Controles de zoom */}
                    <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        display: 'flex',
                        gap: '6px',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 10
                    }}>
                        <Button icon={<ZoomOutOutlined />} onClick={() => setZoom(prev => Math.max(25, prev - 10))} disabled={zoom <= 25} size="small" />
                        <Button size="small" onClick={() => setShowZoomSlider(!showZoomSlider)} style={{ minWidth: '56px' }}>{zoom}%</Button>
                        <Button icon={<ZoomInOutlined />} onClick={() => setZoom(prev => Math.min(400, prev + 10))} disabled={zoom >= 400} size="small" />
                        <Button icon={<ReloadOutlined />} onClick={resetView} disabled={zoom === 100 && pan.x === 0 && pan.y === 0} size="small" />
                    </div>

                    {/* Instrucciones */}
                    <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '16px',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        color: '#666',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 10
                    }}>
                        <strong>Controles:</strong> Rueda del ratón para zoom • Arrastra para desplazarte
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DiagramasUMLSection;