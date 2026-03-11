import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader, Zap, Database, Code, TestTube } from "lucide-react";
import "../../../styles/pruebas.css";

// ─── Configuración de tipos ───────────────────────────────────────────────────
const TIPO_CONFIG = {
    unitaria: {
        label: "Unitarias",
        color: "#10b981",
        colorBg: "#ecfdf5",
        colorBorder: "#6ee7b7",
        colorText: "#065f46",
        colorBar: "#10b981",
        colorBarBg: "#d1fae5",
        icon: <TestTube size={16} />,
    },
    componente: {
        label: "Componente",
        color: "#8b5cf6",
        colorBg: "#f5f3ff",
        colorBorder: "#c4b5fd",
        colorText: "#4c1d95",
        colorBar: "#8b5cf6",
        colorBarBg: "#ede9fe",
        icon: <Code size={16} />,
    },
    sistema: {
        label: "Sistema",
        color: "#3b82f6",
        colorBg: "#eff6ff",
        colorBorder: "#93c5fd",
        colorText: "#1e3a8a",
        colorBar: "#3b82f6",
        colorBarBg: "#dbeafe",
        icon: <Database size={16} />,
    },
};

// ─── Limpiar mensaje del backend ──────────────────────────────────────────────
const limpiarMensaje = (msg) => {
    if (!msg) return "";
    return msg
        .replace(/\[\d+\/\d+\]\s*/g, "")
        .replace(/\[PROGRESO\]\s*/g, "")
        .replace(/^✓\s*/g, "")
        .trim();
};

// ─── Calcular % de progreso ───────────────────────────────────────────────────
const calcularProgreso = (estado, mensajeActual) => {
    if (estado === "ok") return 100;
    if (estado === "error" || estado === "pendiente") return 0;
    if (!mensajeActual) return 8;
    const msg = mensajeActual.toLowerCase();
    if (msg.includes("guardadas exitosamente") || msg.includes("guardados exitosamente")) return 95;
    if (msg.includes("guardando en bd") || msg.includes("guardando")) return 78;
    if (msg.includes("parseadas") || msg.includes("procesando json")) return 62;
    if (msg.includes("respuesta recibida")) return 52;
    if (msg.includes("enviando") && msg.includes("gemini")) return 38;
    if (msg.includes("cargando prompt")) return 22;
    if (msg.includes("iniciando")) return 10;
    return 28;
};

// ─── Tarjeta individual por tipo ──────────────────────────────────────────────
function TarjetaTipo({ tipo, estado, mensajeActual, pruebasGeneradas }) {
    const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.unitaria;

    const esPendiente = estado === "pendiente";
    const esCargando = estado === "cargando";
    const esOk = estado === "ok";
    const esError = estado === "error";

    const progresoPct = calcularProgreso(estado, mensajeActual);

    // Colores dinámicos por tipo — solo los que varían por tipo permanecen inline
    const borderColor = esPendiente ? "var(--border-color)" : esError ? "#fca5a5" : cfg.colorBorder;
    const bgColor = esPendiente ? "var(--bg-hover, #f9fafb)" : esError ? "var(--color-error-bg, #fef2f2)" : cfg.colorBg;
    const textColor = esPendiente ? "var(--text-secondary)" : esError ? "#dc2626" : cfg.colorText;
    const iconBg = esPendiente ? "var(--bg-hover, #e5e7eb)" : esError ? "var(--color-error-bg, #fee2e2)" : cfg.colorBg;
    const iconColor = esPendiente ? "var(--text-secondary)" : esError ? "#ef4444" : cfg.color;
    const barTrackBg = esPendiente ? "var(--border-color, #e5e7eb)" : esError ? "var(--color-error-bg, #fee2e2)" : cfg.colorBarBg;
    const barFillBg = esError ? "#f87171" : esOk ? "#10b981" : cfg.colorBar;

    return (
        <div
            className="tarjeta-tipo"
            style={{ borderColor, background: bgColor, opacity: esPendiente ? 0.55 : 1 }}
        >
            {/* Encabezado */}
            <div className="tarjeta-tipo__header">
                <div className="tarjeta-tipo__header-left">
                    <span className="tarjeta-tipo__icono" style={{ background: iconBg, color: iconColor }}>
                        {cfg.icon}
                    </span>
                    <span className="tarjeta-tipo__nombre" style={{ color: textColor }}>
                        Pruebas {cfg.label}
                    </span>
                    {esOk && pruebasGeneradas > 0 && (
                        <span className="tarjeta-tipo__badge-ok">
                            {pruebasGeneradas} generadas
                        </span>
                    )}
                </div>
                <div>
                    {esPendiente && <span className="tarjeta-tipo__estado-cola">En cola</span>}
                    {esCargando && <Loader size={18} className="tarjeta-tipo__spinner" style={{ color: cfg.color }} />}
                    {esOk && <CheckCircle size={18} style={{ color: "#10b981" }} />}
                    {esError && <XCircle size={18} style={{ color: "#ef4444" }} />}
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="tarjeta-tipo__barra-track" style={{ background: barTrackBg }}>
                <div
                    className="tarjeta-tipo__barra-fill"
                    style={{ background: barFillBg, width: `${progresoPct}%` }}
                />
            </div>

            {/* Mensaje */}
            <div className="tarjeta-tipo__mensaje">
                {esCargando && mensajeActual && (
                    <div className="tarjeta-tipo__mensaje-row">
                        <span className="tarjeta-tipo__dot-pulsante" style={{ background: cfg.color }} />
                        <p className="tarjeta-tipo__texto-mensaje" style={{ color: cfg.colorText }}>
                            {limpiarMensaje(mensajeActual)}
                        </p>
                    </div>
                )}
                {esCargando && !mensajeActual && (
                    <p className="tarjeta-tipo__texto-mensaje" style={{ color: cfg.colorText }}>Iniciando...</p>
                )}
                {esOk && (
                    <p className="tarjeta-tipo__texto-ok">
                        <CheckCircle size={12} />
                        Pruebas generadas y guardadas correctamente
                    </p>
                )}
                {esError && (
                    <p className="tarjeta-tipo__texto-error">
                        <XCircle size={12} />
                        Error al generar — se continuará con los demás tipos
                    </p>
                )}
                {esPendiente && (
                    <p className="tarjeta-tipo__texto-pendiente">Esperando turno...</p>
                )}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProgresoGeneracion({
    tipos = [],
    estadosPorTipo = {},
    mensajesPorTipo = {},
    pruebasPorTipo = {},
    proyectoNombre = "",
    totalGeneradas = 0,
    mensajeGlobal = "",
}) {
    const completados = tipos.filter((t) => estadosPorTipo[t] === "ok").length;
    const conError = tipos.filter((t) => estadosPorTipo[t] === "error").length;
    const progresoGlobal = tipos.length === 0 ? 0 : Math.round((completados / tipos.length) * 100);

    return (
        <div className="progreso-container">
            {/* Encabezado */}
            <div className="progreso-header">
                <div className="progreso-header-row">
                    <Zap size={20} style={{ color: "#f59e0b" }} />
                    <h3 className="progreso-titulo">Generando pruebas con IA</h3>
                </div>
                {proyectoNombre && (
                    <p className="progreso-subtitulo">
                        Proyecto: <span className="progreso-subtitulo-nombre">{proyectoNombre}</span>
                    </p>
                )}
            </div>

            {/* Barra global */}
            <div>
                <div className="progreso-barra-global-header">
                    <span className="progreso-barra-label">Progreso general</span>
                    <span className="progreso-barra-valor">
                        {completados}/{tipos.length} tipos · {progresoGlobal}%
                    </span>
                </div>
                <div className="progreso-barra-track">
                    <div
                        className="progreso-barra-fill-global"
                        style={{ width: `${progresoGlobal}%` }}
                    />
                </div>
                {totalGeneradas > 0 && (
                    <p className="progreso-barra-total">
                        {totalGeneradas} prueba{totalGeneradas !== 1 ? "s" : ""} guardada{totalGeneradas !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* Tarjetas por tipo */}
            <div className="progreso-tarjetas">
                {tipos.map((tipo) => (
                    <TarjetaTipo
                        key={tipo}
                        tipo={tipo}
                        estado={estadosPorTipo[tipo] || "pendiente"}
                        mensajeActual={mensajesPorTipo[tipo] || ""}
                        pruebasGeneradas={pruebasPorTipo[tipo] || 0}
                    />
                ))}
            </div>

            {/* Advertencia errores */}
            {conError > 0 && (
                <div className="progreso-alerta-error">
                    ⚠ {conError} tipo{conError > 1 ? "s" : ""} con error. Las pruebas de los demás tipos se guardaron correctamente.
                </div>
            )}

            {mensajeGlobal && (
                <p className="progreso-mensaje-global">{mensajeGlobal}</p>
            )}
        </div>
    );
}