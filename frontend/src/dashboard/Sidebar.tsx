// SidebarAdmin.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  FaTachometerAlt,
  FaUser,
  FaLock,
  FaTools,
  FaStar,
  FaHome,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const navigate = useNavigate();
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setReviewsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setTimeout(() => setReviewsOpen(false), 100);
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 ease-in-out z-50
        flex flex-col shadow-2xl border-r border-gray-700
      `}
    >
      {/* Branding */}
      <div className="flex items-center px-6 py-5 border-b border-gray-700">
        <img
          className="object-cover w-14 h-14 rounded-full"
          src="/assets/logo.png"
          alt="Logo"
        />
        <h1 className="text-2xl font-bold text-cyan-500 ml-3">NEWTON</h1>
        <button
          className="ml-auto md:hidden text-2xl text-gray-400 hover:text-cyan-500"
          onClick={toggle}
          aria-label="Cerrar sidebar"
        >
          &times;
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {/* Sección Principal */}
        <div>
          <div className="flex items-center px-3 py-3 text-cyan-400 text-sm font-semibold tracking-wider border-b border-gray-700 mb-2">
            <FaHome className="w-4 h-4 mr-3" />
            <span className="text-[14px]">PRINCIPAL</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
          >
            <FaTachometerAlt className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
            Dashboard
          </button>
        </div>

        {/* Sección Privacidad */}
        <div>
          <div className="flex items-center px-3 py-3 text-cyan-400 text-sm font-semibold tracking-wider border-b border-gray-700 mb-2">
            <FaLock className="w-4 h-4 mr-3" />
            <span className="text-[14px]">PRIVACIDAD</span>
          </div>
          <button
            onClick={() => navigate("/admin/perfil")}
            className="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
          >
            <FaUser className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
            Mi Perfil
          </button>
        </div>

        {/* Sección Mantenedor */}
        <div>
          <div className="flex items-center px-3 py-3 text-cyan-400 text-sm font-semibold tracking-wider border-b border-gray-700 mb-2">
            <FaTools className="w-4 h-4 mr-3" />
            <span className="text-[14px]">MANTENEDOR</span>
          </div>
          <div className="space-y-1">
            {/* Dropdown de Reportes */}
            <div
              ref={dropdownRef}
              onBlur={handleBlur}
              tabIndex={-1}
              className="relative"
            >
              <button
                onClick={() => setReviewsOpen(!reviewsOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
              >
                <div className="flex items-center">
                  <FaStar className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
                  Reportes
                </div>
                {reviewsOpen ? (
                  <FaChevronDown className="w-3 h-3 text-cyan-400" />
                ) : (
                  <FaChevronRight className="w-3 h-3 text-cyan-400" />
                )}
              </button>

              {reviewsOpen && (
                <div className="ml-6 space-y-1 mt-1">
                  <button
                    onClick={() => navigate("/dashboard/historialPuntajes")}
                    className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
                  >
                    <span className="w-4 h-4 mr-3 min-w-[16px]"></span>
                    Historial de Puntajes
                  </button>
                  <button
                    onClick={() => navigate("")}
                    className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
                  >
                    <span className="w-4 h-4 mr-3 min-w-[16px]"></span>
                    Datos de Simulacros
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/dificultadCursos")}
                    className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
                  >
                    <span className="w-4 h-4 mr-3 min-w-[16px]"></span>
                    Dificultad de Cursos
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/vistasTipoMaterial")}
                    className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-all text-cyan-100 text-sm"
                  >
                    <span className="w-4 h-4 mr-3 min-w-[16px]"></span>
                    Vistas por Tipo de Material
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
