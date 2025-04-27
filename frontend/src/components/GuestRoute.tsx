import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Si ya está logueado, redirige al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está logueado, deja pasar
  return <Outlet />;
};

export default GuestRoute;