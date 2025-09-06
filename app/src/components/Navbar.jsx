import React from "react";
import { Avatar, Dropdown, Menu } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { removeToken } from "../../config";
import "../styles/navbar.css";

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken(); // Limpiar token
    if (onLogout) {
      onLogout(); // Llamar al callback del padre que actualizará el estado
    } else {
      // Fallback en caso de que no se pase onLogout
      navigate("/", { replace: true });
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="perfil" icon={<UserOutlined />} onClick={() => navigate("/usuario")}>
        Perfil
      </Menu.Item>
      <Menu.Item key="dashboard" icon={<DashboardOutlined />} onClick={() => navigate("/dashboard")}>
        Dashboard
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger onClick={handleLogout}>
        Cerrar sesión
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/dashboard")}>
        TDDMachine
      </div>
      <div className="navbar-actions">
        <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
          <Avatar size="large" icon={<UserOutlined />} className="navbar-avatar" />
        </Dropdown>
      </div>
    </div>
  );
};

export default Navbar;