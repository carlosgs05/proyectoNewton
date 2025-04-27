import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const fullName = user ? `${user.nombre} ${user.apellido}` : 'Invitado';

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-4">
        Bienvenido, {fullName}
      </h1>
      <p className="text-gray-700 leading-relaxed mb-6">
        Este es tu panel de control. Desde aquí podrás gestionar usuarios, productos y todas las funcionalidades de la plataforma.
      </p>
    </div>
  );
};

export default Home;