import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Spin, message } from "antd";

import LoginForm from "./auth/login";
import Admin from "./administrador/admin";
import DashboardAdmin from "./administrador/DashboardAdmin";
import Usuario from "./usuarios/usuario";
import DashboardUsuario from "./usuarios/DashboardUsuario";
import PrivateRoute from "./components/PrivateRoute";

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
      console.error("Error en autenticación:", error);
      removeToken();
      setIsAuthenticated(false);
      setUserRole(null);
      setUserProfile(null);
      if (!error.message.includes("Error de conexión")) {
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
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "16px"
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
          isAuthenticated
            ? (userRole === "admin" 
                ? <DashboardAdmin userProfile={userProfile} onLogout={handleLogout} />
                : <DashboardUsuario userProfile={userProfile} onLogout={handleLogout} />)
            : <LoginForm onLoginSuccess={handleLoginSuccess} />
        }
      />

      {/* Rutas para usuarios normales */}
      <Route element={<PrivateRoute isAuthenticated={isAuthenticated} allowedRoles={["usuario"]} userRole={userRole} />}>
        <Route path="/dashboard/*" element={<DashboardUsuario userProfile={userProfile} onLogout={handleLogout} />} />
        <Route path="/usuario" element={<Usuario onLogout={handleLogout} />} />
      </Route>

      {/* Rutas para administradores */}
      <Route element={<PrivateRoute isAuthenticated={isAuthenticated} allowedRoles={["admin"]} userRole={userRole} />}>
        <Route path="/admin/dashboard" element={<DashboardAdmin userProfile={userProfile} onLogout={handleLogout} />} />
        <Route path="/admin/perfil" element={<Admin onLogout={handleLogout} />} />
        <Route path="/admin" element={<Admin onLogout={handleLogout} />} />
      </Route>

      <Route path="*" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
    </Routes>
  );
}

export default App;