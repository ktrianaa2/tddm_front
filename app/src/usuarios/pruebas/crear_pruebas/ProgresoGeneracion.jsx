import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, Loader, Zap, Database, Code, TestTube, ChevronRight } from "lucide-react";

// ─── Configuración de tipos ───────────────────────────────────────────────────
const TIPO_CONFIG = {
  unitaria: {
    label: "Unitarias",
    color: "#10b981",       // emerald-500
    colorBg: "#ecfdf5",     // emerald-50
    colorBorder: "#6ee7b7", // emerald-300
    colorText: "#065f46",   // emerald-900
    colorBar: "#10b981",
    colorBarBg: "#d1fae5",
    icon: <TestTube size={16} />,
    pasos: [
      "Analizando requisitos funcionales...",
      "Identificando funciones y métodos a probar...",
      "Generando casos de prueba unitarios...",
      "Verificando cobertura de condiciones...",
      "Guardando pruebas en base de datos...",
    ],
  },
  componente: {
    label: "Componente",
    color: "#8b5cf6",       // purple-500
    colorBg: "#f5f3ff",
    colorBorder: "#c4b5fd",
    colorText: "#4c1d95",
    colorBar: "#8b5cf6",
    colorBarBg: "#ede9fe",
    icon: <Code size={16} />,
    pasos: [
      "Analizando casos de uso e integraciones...",
      "Identificando interacciones entre capas...",
      "Generando pruebas de integración de componentes...",
      "Configurando mocks de infraestructura...",
      "Guardando pruebas en base de datos...",
    ],
  },
  sistema: {
    label: "Sistema",
    color: "#3b82f6",       // blue-500
    colorBg: "#eff6ff",
    colorBorder: "#93c5fd",
    colorText: "#1e3a8a",
    colorBar: "#3b82f6",
    colorBarBg: "#dbeafe",
    icon: <Database size={16} />,
    pasos: [
      "Analizando flujos completos del sistema...",
      "Identificando actores y casos extremos...",
      "Generando pruebas end-to-end...",
      "Verificando precondiciones y postcondiciones...",
      "Guardando pruebas en base de datos...",
    ],
  },
};

// ─── Subcomponente: tarjeta de un tipo ────────────────────────────────────────
function TarjetaTipo({ tipo, estado }) {
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.unitaria;

  const [pasoActual, setPasoActual] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (estado === "cargando") {
      setPasoActual(0);
      intervalRef.current = setInterval(() => {
        setPasoActual((p) => {
          if (p < cfg.pasos.length - 2) return p + 1;
          return p;
        });
      }, 2800);
    } else if (estado === "ok") {
      clearInterval(intervalRef.current);
      setPasoActual(cfg.pasos.length - 1);
    } else if (estado === "error") {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [estado]);

  const progresoPct =
    estado === "ok"      ? 100
    : estado === "error" ? 0
    : estado === "cargando"
      ? Math.round(((pasoActual + 1) / cfg.pasos.length) * 90)
      : 0;

  const esPendiente = estado === "pendiente";
  const esCargando  = estado === "cargando";
  const esOk        = estado === "ok";
  const esError     = estado === "error";

  // Colores según estado
  const borderColor = esPendiente ? "#e5e7eb"
    : esError ? "#fca5a5"
    : cfg.colorBorder;

  const bgColor = esPendiente ? "#f9fafb"
    : esError ? "#fef2f2"
    : cfg.colorBg;

  const textColor = esPendiente ? "#9ca3af"
    : esError ? "#dc2626"
    : cfg.colorText;

  const iconBg = esPendiente ? "#e5e7eb"
    : esError ? "#fee2e2"
    : cfg.colorBg;

  const iconColor = esPendiente ? "#9ca3af"
    : esError ? "#ef4444"
    : cfg.color;

  return (
    <div style={{
      borderRadius: "12px",
      border: `2px solid ${borderColor}`,
      background: bgColor,
      padding: "16px",
      transition: "all 0.5s ease",
      opacity: esPendiente ? 0.6 : 1,
    }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            padding: "6px",
            borderRadius: "8px",
            background: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
          }}>
            {cfg.icon}
          </span>
          <span style={{ fontWeight: 600, fontSize: "14px", color: textColor }}>
            Pruebas {cfg.label}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {esPendiente && <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>En cola</span>}
          {esCargando  && <Loader size={18} style={{ color: cfg.color, animation: "spin 1s linear infinite" }} />}
          {esOk        && <CheckCircle size={18} style={{ color: "#10b981" }} />}
          {esError     && <XCircle    size={18} style={{ color: "#ef4444" }} />}
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{
        height: "6px",
        borderRadius: "9999px",
        background: esPendiente ? "#e5e7eb" : esError ? "#fee2e2" : cfg.colorBarBg,
        marginBottom: "12px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          borderRadius: "9999px",
          background: esError ? "#f87171" : esOk ? "#10b981" : cfg.colorBar,
          width: `${progresoPct}%`,
          transition: "width 0.7s ease-out",
        }} />
      </div>

      {/* Mensaje de paso actual */}
      <div style={{ minHeight: "20px" }}>
        {esCargando && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: cfg.color,
              display: "inline-block",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            <p style={{ fontSize: "12px", color: cfg.colorText, fontWeight: 500, margin: 0 }}>
              {cfg.pasos[pasoActual]}
            </p>
          </div>
        )}
        {esOk && (
          <p style={{ fontSize: "12px", color: "#059669", fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle size={12} />
            Pruebas generadas y guardadas correctamente
          </p>
        )}
        {esError && (
          <p style={{ fontSize: "12px", color: "#ef4444", fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <XCircle size={12} />
            Error al generar — se continuará con los demás tipos
          </p>
        )}
        {esPendiente && (
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Esperando turno...</p>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProgresoGeneracion({
  tipos = [],
  estadosPorTipo = {},
  proyectoNombre = "",
  totalGeneradas = 0,
  mensajeGlobal = "",
}) {
  const completados    = tipos.filter((t) => estadosPorTipo[t] === "ok").length;
  const conError       = tipos.filter((t) => estadosPorTipo[t] === "error").length;
  const progresoGlobal = tipos.length === 0 ? 0 : Math.round((completados / tipos.length) * 100);

  // Log animado de actividad
  const [logs, setLogs] = useState([
    { id: 0, tipo: "info", texto: "Iniciando generación de pruebas con IA..." },
  ]);
  const logsEndRef = useRef(null);
  const prevEstados = useRef({});

  useEffect(() => {
    const nuevosLogs = [];
    tipos.forEach((tipo) => {
      const prev   = prevEstados.current[tipo];
      const actual = estadosPorTipo[tipo];
      const label  = TIPO_CONFIG[tipo]?.label || tipo;

      if (prev !== actual) {
        if (actual === "cargando" && prev !== "cargando")
          nuevosLogs.push({ tipo: "info", texto: `Procesando pruebas de ${label}...` });
        if (actual === "ok")
          nuevosLogs.push({ tipo: "ok",   texto: `✓ Pruebas de ${label} generadas correctamente` });
        if (actual === "error")
          nuevosLogs.push({ tipo: "error", texto: `✗ Error en pruebas de ${label} — continuando...` });
      }
    });

    if (nuevosLogs.length > 0) {
      setLogs((prev) => [...prev, ...nuevosLogs.map((l, i) => ({ ...l, id: Date.now() + i }))]);
    }
    prevEstados.current = { ...estadosPorTipo };
  }, [estadosPorTipo]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <>
      {/* Animaciones CSS */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={{ width: "100%", maxWidth: "520px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Encabezado global */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
            <Zap size={20} style={{ color: "#f59e0b" }} />
            <h3 style={{ fontWeight: 700, color: "#1f2937", fontSize: "16px", margin: 0 }}>
              Generando pruebas con IA
            </h3>
          </div>
          {proyectoNombre && (
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              Proyecto: <span style={{ fontWeight: 500, color: "#374151" }}>{proyectoNombre}</span>
            </p>
          )}
        </div>

        {/* Barra de progreso global */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563" }}>Progreso general</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>
              {completados}/{tipos.length} tipos &nbsp;·&nbsp; {progresoGlobal}%
            </span>
          </div>
          <div style={{ height: "12px", background: "#f3f4f6", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: "9999px",
              background: "linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)",
              width: `${progresoGlobal}%`,
              transition: "width 0.7s ease-out",
            }} />
          </div>
          {totalGeneradas > 0 && (
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textAlign: "right" }}>
              {totalGeneradas} prueba{totalGeneradas !== 1 ? "s" : ""} guardada{totalGeneradas !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Tarjetas por tipo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tipos.map((tipo) => (
            <TarjetaTipo
              key={tipo}
              tipo={tipo}
              estado={estadosPorTipo[tipo] || "pendiente"}
            />
          ))}
        </div>

        {/* Panel de logs */}
        <div style={{ borderRadius: "12px", border: "1px solid #374151", background: "#111827", overflow: "hidden" }}>
          {/* Barra de título estilo terminal */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #374151", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace", marginLeft: "4px" }}>actividad</span>
          </div>
          {/* Contenido logs */}
          <div style={{ padding: "12px", height: "112px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", fontFamily: "monospace", fontSize: "12px" }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  color: log.tipo === "ok" ? "#34d399" : log.tipo === "error" ? "#f87171" : "#d1d5db",
                }}
              >
                <ChevronRight size={11} style={{ marginTop: "2px", flexShrink: 0, opacity: 0.6 }} />
                <span>{log.texto}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Advertencia si hay errores */}
        {conError > 0 && (
          <div style={{
            borderRadius: "8px",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            padding: "8px 12px",
            fontSize: "12px",
            color: "#92400e",
          }}>
            ⚠ {conError} tipo{conError > 1 ? "s" : ""} con error. Las pruebas de los demás tipos se guardaron correctamente.
          </div>
        )}

        {mensajeGlobal && (
          <p style={{ textAlign: "center", fontSize: "14px", color: "#6b7280", margin: 0 }}>{mensajeGlobal}</p>
        )}
      </div>
    </>
  );
}