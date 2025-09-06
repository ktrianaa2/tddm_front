import React, { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginForm from "./auth/login";
import Admin from "./administrador/admin";
import Usuario from "./usuarios/usuario";
import DashboardUsuario from "./usuarios/DashboardUsuario";

import {
  getStoredToken,
  API_ENDPOINTS,
  getWithAuth,
  removeToken,
} from "../config";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const navigate = useNavigate();

  const checkAuthentication = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      const response = await getWithAuth(API_ENDPOINTS.PROFILE, token);
      setIsAuthenticated(true);
      setUserRole(response.rol);
      setUserProfile(response);
    } catch (error) {
      console.error('Error en autenticación:', error);
      removeToken();
      setIsAuthenticated(false);
      setUserRole(null);
      setUserProfile(null);

      // Solo mostrar mensaje de error si no es un error de conexión inicial
      if (!error.message.includes('Error de conexión')) {
        message.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleLoginSuccess = () => {
    setTimeout(() => checkAuthentication(), 500);
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserProfile(null);
    message.success("Sesión cerrada exitosamente");
    // Forzar navegación inmediata
    navigate("/", { replace: true });
  };

  // Spinner de Ant Design en lugar del componente personalizado
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div>Verificando autenticación...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} replace />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/dashboard/*"
        element={
          isAuthenticated && userRole === "usuario" ? (
            <DashboardUsuario userProfile={userProfile} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/usuario"
        element={
          isAuthenticated && userRole === "usuario" ? (
            <Usuario userProfile={userProfile} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          isAuthenticated && userRole === "admin" ? (
            <Admin userProfile={userProfile} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;