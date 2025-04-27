import React from 'react';
import { FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { useAuth }from '../context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between 
      bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 
      text-white px-6 py-4 shadow-xl border-b border-gray-700">
      
      <button
        className="md:hidden text-xl text-cyan-400 hover:text-cyan-300 transition-colors"
        onClick={toggleSidebar}
        aria-label="Mostrar sidebar"
      >
        <FaBars />
      </button>

      <div className="flex-1" /> {/* Espacio vacío para centrar */}

      {/* Perfil / Logout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-cyan-600 rounded-full">
            <FaUser className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-cyan-300">{user?.nombre}</span>
        </div>
        <button 
          onClick={logout} 
          className="p-2 rounded-full hover:bg-gray-700/40 transition-colors"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt className="w-5 h-5 text-cyan-400 hover:text-cyan-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;