import React, { useState, useEffect } from "react";
import { Avatar, Dropdown, Tooltip } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { removeToken } from "../../config";
import "../styles/navbar.css";

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [language, setLanguage] = useState("es");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    removeToken();
    if (onLogout) {
      onLogout();
    } else {
      navigate("/", { replace: true });
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

    const languageItems = [
    {
      key: "es",
      label: "Español",
      onClick: () => setLanguage("es"),
    },
    {
      key: "en",
      label: "English",
      onClick: () => setLanguage("en"),
    },
  ];

  const menuItems = [
    {
      key: 'perfil',
      icon: <UserOutlined />,
      label: 'Perfil',
      onClick: () => navigate("/usuario")
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate("/dashboard")
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar sesión',
      danger: true,
      onClick: handleLogout
    }
  ];

  return (
    <div className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/dashboard")}>
        <div className="navbar-brand-icon">T</div>
        <span>TDDMachine</span>
      </div>
      <div className="navbar-actions">

        <Tooltip title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>
          <button
            className="navbar-theme-btn"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
          </button>
        </Tooltip>

        <Dropdown
          menu={{ items: languageItems }}
          placement="bottomRight"
          trigger={["click"]}
          overlayClassName="navbar-dropdown"
        >
          <button className="navbar-theme-btn">
            <GlobalOutlined />
            <span>{language.toUpperCase()}</span>
          </button>
        </Dropdown>

        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={["click"]}
          overlayClassName="navbar-dropdown"
        >
          <Avatar size="large" icon={<UserOutlined />} className="navbar-avatar" />
        </Dropdown>
      </div>
    </div>
  );
};

export default Navbar;