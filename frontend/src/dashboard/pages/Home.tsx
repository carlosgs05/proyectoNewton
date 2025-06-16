import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaUsers,
  FaChartBar,
  FaBook,
  FaClipboardList,
  FaBookOpen,
  FaClipboardCheck,
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { FaLightbulb } from "react-icons/fa6";

const Home: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<
    "historial" | "consumption" | ""
  >("");

  // Estilos comunes
  const sectionTitleClasses =
    "text-2xl font-extrabold mb-5 text-cyan-700 text-center uppercase";
  const cardClasses =
    "bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer";
  const gridClasses = "grid gap-6 md:grid-cols-2 lg:grid-cols-3";

  const openModal = () => {
    setSelectedReport("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleViewReport = () => {
    if (!selectedReport) return;
    const routeMap = {
      historial: "/dashboard/rendimientoSimulacros",
      consumption: "/dashboard/consumoMaterial",
    } as const;
    navigate(routeMap[selectedReport]);
  };

  return (
    <div className="mx-8 mt-4">
      {hasRole(1) && (
        // Contenido para Administrador
        <div>
          <div className={sectionTitleClasses}>Panel de Administración</div>

          <p className="text-gray-700 text-base mb-8 leading-relaxed">
            Gestión completa de la plataforma: supervisión de usuarios,
            estadísticas globales y configuración del sistema
          </p>

          <div className={gridClasses}>
            <Link to="/dashboard/usuarios" className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaUsers className="mr-2 text-cyan-500" /> Gestión de Usuarios
              </h3>
              <p className="text-gray-600">
                Administra los permisos, roles y acceso de todos los usuarios
                registrados en la plataforma.
              </p>
            </Link>

            <Link to="/dashboard/contenido" className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaBook className="mr-2 text-cyan-500" /> Gestión de Contenido
              </h3>
              <p className="text-gray-600">
                Controla los materiales educativos, cursos disponibles y
                contenido académico.
              </p>
            </Link>

                        {/* Nuevo Card: Gestión de Simulacros para Admin */}
            <Link to="/dashboard/simulacros" className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaClipboardCheck className="mr-2 text-cyan-500" /> Gestión de
                Simulacros
              </h3>
              <p className="text-gray-600">
                Administra la creación, asignación y calificación de simulacros
                para estudiantes.
              </p>
            </Link>

            <div onClick={openModal} className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaChartBar className="mr-2 text-cyan-500" /> Estadísticas
                Globales
              </h3>
              <p className="text-gray-600">
                Accede a métricas detalladas sobre el uso de la plataforma y el
                rendimiento académico general.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasRole(2) && (
        // Contenido para Estudiante
        <div>
          <div className={sectionTitleClasses}>Mi Aprendizaje</div>

          <p className="text-gray-700 text-base mb-8 leading-relaxed">
            Continúa tu formación académica: accede a tus cursos, sigue tu
            progreso y encuentra nuevos materiales
          </p>

          <div className={gridClasses}>
            <Link to="/dashboard/contenido" className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaBookOpen className="mr-2 text-cyan-500" /> Cursos Disponibles
              </h3>
              <p className="text-gray-600">
                Revisa los cursos que tienes disponibles y los materiales que
                puedes consultar para tu aprendizaje
              </p>
            </Link>

            <Link to="/dashboard/recomendaciones" className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaLightbulb className="mr-2 text-cyan-500" /> Contenido
                Recomendado
              </h3>
              <p className="text-gray-600">
                Basado en tu rendimiento, se te sugiere contenido adicional para
                mejorar tu aprendizaje
              </p>
            </Link>

            <Link to="/dashboard/rendimientoSimulacros" className={cardClasses}>
              <h3 className="font-bold mb-2 text-gray-700 flex items-center">
                <FaClipboardList className="mr-2 text-cyan-500" /> Rendimiento en
                Simulacros
              </h3>
              <p className="text-gray-600">
                Consulta los resultados de tus simulacros realizados y revisa la
                retroalimentación otorgada para mejorar tu desempeño
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Modal de selección de reporte */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-cyan-700">
                Selecciona un reporte
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  selectedReport === "historial"
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-gray-200 hover:border-cyan-300"
                }`}
              >
                <input
                  type="radio"
                  name="report"
                  value="historial"
                  checked={selectedReport === "historial"}
                  onChange={() => setSelectedReport("historial")}
                  className="form-radio h-5 w-5 text-cyan-500"
                />
                <span className="ml-3 font-medium text-gray-700">
                  Rendimiento en simulacros
                </span>
              </label>

              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  selectedReport === "consumption"
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-gray-200 hover:border-cyan-300"
                }`}
              >
                <input
                  type="radio"
                  name="report"
                  value="consumption"
                  checked={selectedReport === "consumption"}
                  onChange={() => setSelectedReport("consumption")}
                  className="form-radio h-5 w-5 text-cyan-500"
                />
                <span className="ml-3 font-medium text-gray-700">
                  Consumo de material
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleViewReport}
                disabled={!selectedReport}
                className={`px-5 py-2 rounded-full font-semibold transition ${
                  selectedReport
                    ? "bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Ver reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;