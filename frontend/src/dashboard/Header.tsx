import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaSignOutAlt, FaBars, FaBell } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  toggleSidebar: () => void;
}

interface Notificacion {
  idnotificacion: number;
  idusuario: number;
  titulo: string;
  mensaje: string;
  url_destino: string;
  leida: boolean;
  created_at: string;
  updated_at: string | null;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estado para notificaciones y conteo de no leídas
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Refs para detectar clicks fuera del dropdown o el botón de campana
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const fetchNotifications = async () => {
      try {
        // Trae todas las notificaciones (leídas y no leídas)
        const resp = await axios.get(
          `https://proyectonewton-production.up.railway.app/api/notificaciones/${user?.idusuario}`
        );
        if (resp.data.success) {
          const data: Notificacion[] = resp.data.data;
          setNotificaciones(data);

          // Calcula cuántas no leídas
          const noLeidas = data.filter((n) => !n.leida).length;
          setUnreadCount(noLeidas);
        }
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    // Obtener notificaciones al montar
    if (user?.idusuario) {
      fetchNotifications();
      // Configurar polling cada 15 segundos
      pollingInterval = setInterval(fetchNotifications, 15000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [user]);

  // Maneja clicks fuera del dropdown para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownOpen &&
        dropdownRef.current &&
        bellRef.current &&
        !dropdownRef.current.contains(target) &&
        !bellRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleNotificationClick = async (noti: Notificacion) => {
    try {
      if (!noti.leida) {
        // Marca como leída en backend
        await axios.put(
          `https://proyectonewton-production.up.railway.app/api/notificaciones/${noti.idnotificacion}/leer`
        );
        // Actualiza localmente
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.idnotificacion === noti.idnotificacion
              ? { ...n, leida: true, updated_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
      // Redirige a la URL destino
      navigate(noti.url_destino);
      // Cierra el dropdown
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between 
      bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 
      text-white px-6 py-4 shadow-xl border-b border-gray-700"
    >
      <button
        className="md:hidden text-xl text-cyan-400 hover:text-cyan-300 transition-colors"
        onClick={toggleSidebar}
        aria-label="Mostrar sidebar"
      >
        <FaBars />
      </button>
      <div className="flex-1" /> {/* Espacio vacío para centrar */}
      {/* Icono de campana / Dropdown de notificaciones */}
      <div className="relative mr-4">
        <button
          ref={bellRef}
          onClick={toggleDropdown}
          className="relative p-2 rounded-full hover:bg-gray-700/40 transition-colors cursor-pointer"
          aria-label="Notificaciones"
        >
          <FaBell className="w-5 h-5 text-cyan-400 hover:text-cyan-300" />
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 inline-flex items-center justify-center
                             px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
            >
              {unreadCount}
            </span>
          )}
        </button>
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-96 h-96 overflow-y-auto
                       bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50"
          >
            {/* Botón “X” para cerrar */}
            <div className="flex justify-end p-2">
              <button
                onClick={() => setDropdownOpen(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
                aria-label="Cerrar notificaciones"
              >
                &times;
              </button>
            </div>
            {notificaciones.length === 0 && (
              <div className="p-4 text-gray-300">No tienes notificaciones.</div>
            )}
            {notificaciones.map((noti) => (
              <div
                key={noti.idnotificacion}
                onClick={() => handleNotificationClick(noti)}
                className={`cursor-pointer px-6 py-3 border-b border-gray-700 hover:bg-gray-700/50
                            ${
                              noti.leida
                                ? "bg-gray-800"
                                : "bg-gray-700 border-l-4 border-cyan-400"
                            }`}
              >
                <p
                  className={`${
                    noti.leida
                      ? "font-normal text-gray-300"
                      : "font-semibold text-white"
                  }`}
                >
                  {noti.titulo}
                </p>
                <p className="text-sm text-gray-400 mt-1">{noti.mensaje}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(noti.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
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
          className="p-2 rounded-full hover:bg-gray-700/40 transition-colors cursor-pointer"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt className="w-5 h-5 text-cyan-400 hover:text-cyan-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;
