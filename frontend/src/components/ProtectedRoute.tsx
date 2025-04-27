import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  roles?: number[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Si no está autenticado, redirige a login
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Si se especifican roles y el usuario no coincide, redirige
  if (roles && user && !roles.includes(user.rol.idrol)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Acceso permitido
  return <Outlet />;
};

export default ProtectedRoute;
