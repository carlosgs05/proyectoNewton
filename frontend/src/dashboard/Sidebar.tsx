import React, { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaHome,
  FaChevronDown,
  FaChevronRight,
  FaHistory,
  FaCube,
  FaThLarge,
  FaRegChartBar, // Nuevo icono para Reportes
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaBars, FaBook } from "react-icons/fa6";
import { PiExam } from "react-icons/pi";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
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

  const buttonBaseClasses =
    "w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-cyan-100 hover:bg-cyan-600 hover:text-white transition-all cursor-pointer";

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
          className="ml-auto md:hidden text-2xl text-gray-400 hover:text-cyan-500 focus:outline-none cursor-pointer"
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
            <FaThLarge className="w-4 h-4 mr-3" />
            <span className="text-[14px]">PRINCIPAL</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className={`${buttonBaseClasses}`}
          >
            <FaHome className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
            Home
          </button>
          {hasPermission(5) && (
            <button
              onClick={() => navigate("/dashboard/usuarios")}
              className={`${buttonBaseClasses} mt-1`}
            >
              <FaUser className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
              Usuarios
            </button>
          )}
        </div>

        {/* Sección Privacidad */}
        <div>
          <div className="flex items-center px-3 py-3 text-cyan-400 text-sm font-semibold tracking-wider border-b border-gray-700 mb-2">
            <FaLock className="w-4 h-4 mr-3" />
            <span className="text-[14px]">PRIVACIDAD</span>
          </div>
          <button
            onClick={() => navigate("/dashboard/mi-perfil")}
            className={`${buttonBaseClasses}`}
          >
            <FaUser className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
            Mi Perfil
          </button>
        </div>

        {/* Sección Mantenedor */}
        <div>
          <div className="flex items-center px-3 py-3 text-cyan-400 text-sm font-semibold tracking-wider border-b border-gray-700 mb-2">
            <FaBars className="w-4 h-4 mr-3" />
            <span className="text-[14px]">MENÚ</span>
          </div>
          <div className="space-y-1">
            <div
              ref={dropdownRef}
              onBlur={handleBlur}
              tabIndex={-1}
              className="relative"
            >
              <button
                onClick={() => navigate("/dashboard/contenido")}
                className={`${buttonBaseClasses}`}
              >
                <FaBook className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
                {hasRole(1)
                  ? "Contenido Educativo"
                  : hasRole(2)
                  ? "Cursos Disponibles"
                  : "Contenido Educativo"}
              </button>
              {hasPermission(1) && (
                <>
                  <button
                    onClick={() => navigate("/dashboard/simulacros")}
                    className={`${buttonBaseClasses}`}
                  >
                    <PiExam className="w-5 h-5 mr-3 min-w-[16px] text-cyan-400" />
                    Simulacros
                  </button>
                </>
              )}
              <button
                onClick={() => setReviewsOpen(!reviewsOpen)}
                className={`${buttonBaseClasses} justify-between`}
              >
                <div className="flex items-center">
                  <FaRegChartBar className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
                  Reportes
                </div>
                {reviewsOpen ? (
                  <FaChevronDown className="w-3 h-3 text-cyan-400" />
                ) : (
                  <FaChevronRight className="w-3 h-3 text-cyan-400" />
                )}
              </button>

              {reviewsOpen && (
                <div className="w-full space-y-1 mt-1 border-l-2 border-cyan-500">
                  <button
                    onClick={() => navigate("/dashboard/rendimientoSimulacros")}
                    className={`${buttonBaseClasses}`}
                  >
                    <FaHistory className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
                    Rendimiento en Simulacros
                  </button>

                  {hasPermission(6) && (
                    <>
                      <button
                        onClick={() => navigate("/dashboard/consumoMaterial")}
                        className={`${buttonBaseClasses}`}
                      >
                        <FaCube className="w-4 h-4 mr-3 min-w-[16px] text-cyan-400" />
                        Consumo de Material
                      </button>
                    </>
                  )}
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
