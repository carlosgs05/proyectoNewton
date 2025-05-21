import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface Permission {
  idpermiso: number;
  nombre: string;
}

export interface Role {
  idrol: number;
  nombre: string;
  permisos: Permission[];
}

export interface User {
  iduser: number;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  codigomatricula: string | null;
  rol: Role;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roleId: number) => boolean;
  hasPermission: (permId: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");
    if (token && userData) {
      try {
        const parsed: User = JSON.parse(userData);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        logout();
      }
    }
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate("/dashboard", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  const hasRole = (roleId: number) => user?.rol.idrol === roleId;

  const hasPermission = (permId: number) => {
    return user?.rol.permisos.some((p) => p.idpermiso === permId) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, hasRole, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
