import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import RendimientoGeneral from "../../../components/RendimientoGeneral";
import RendimientoPorCurso from "../../../components/RendimientoPorCurso";
import { FaSpinner } from "react-icons/fa";

interface UserOption {
  value: number;
  label: string;
}

const customSelectStyles = {
  control: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    borderColor: "#0088a9",
    boxShadow: "none",
    "&:hover": { borderColor: "#006b7d" },
    cursor: "pointer",
    fontSize: "1rem",
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    zIndex: 1000,
  }),
  option: (p: any, s: any) => ({
    ...p,
    backgroundColor: s.isFocused ? "#e0f7fa" : "white",
    color: s.isFocused ? "#0088a9" : "#333",
  }),
  placeholder: (p: any) => ({ ...p, color: "#0088a9" }),
  singleValue: (p: any) => ({ ...p, color: "#004d59" }),
};

const RendimientoSimulacro: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [usuariosOptions, setUsuariosOptions] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "curso">("general");
  const [etlRunning, setEtlRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = hasPermission(6);
  const isEstudiante = hasPermission(3);

  useEffect(() => {
    // Ejecutar ETL antes de cualquier operación
    const runETL = async () => {
      try {
        setEtlRunning(true);
        setError(null);

        // Ejecutar el proceso ETL
        const etlResponse = await axios.get("https://proyectonewton-production.up.railway.app/api/runETL");

        if (!etlResponse.data.success) {
          throw new Error("Error al ejecutar ETL: " + etlResponse.data.message);
        }

        // Una vez completado el ETL, cargar datos según permisos
        if (isAdmin) {
          fetchUsuariosOptions();
        } else if (isEstudiante && user) {
          setSelectedUser({ value: user.idusuario, label: user.nombre });
        }
      } catch (err: any) {
        console.error("Error en el proceso ETL:", err);
        setError(
          err.response?.data?.message || err.message || "Error desconocido"
        );
      } finally {
        setEtlRunning(false);
      }
    };

    runETL();
  }, [user, isAdmin, isEstudiante]);

  const fetchUsuariosOptions = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(
        "https://proyectonewton-production.up.railway.app/api/usuarios/estudiantes"
      );
      if (res.data.success) {
        const options = res.data.data.map((u: any) => ({
          value: u.idusuario,
          label: `${u.nombre} ${u.apellido}`,
        }));
        setUsuariosOptions(options);
      }
    } catch (err) {
      console.error("Error al cargar usuarios", err);
      setError("Error al cargar la lista de estudiantes");
    } finally {
      setLoadingUsers(false);
    }
  };

  const canShowTabs = isEstudiante || (isAdmin && selectedUser !== null);

  if (etlRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4">
          <FaSpinner className="text-cyan-500" />
        </div>
        <p className="text-gray-600 text-lg">Cargando datos ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Error en el proceso
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-4 md:mx-8 lg:mx-8 mt-4 flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-extrabold text-center text-cyan-700 uppercase tracking-wide">
        Rendimiento en Simulacros
      </h2>

      {isAdmin && (
        <div className="max-w-6xl w-full">
          {loadingUsers ? (
            <p className="text-gray-600 text-lg text-center">
              Cargando usuarios...
            </p>
          ) : (
            <Select
              options={usuariosOptions}
              value={selectedUser}
              onChange={(opt) => setSelectedUser(opt)}
              placeholder="Seleccione un estudiante"
              styles={customSelectStyles}
              isClearable
            />
          )}
        </div>
      )}

      {canShowTabs ? (
        <div className="w-full">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8 justify-start">
              {["general", "curso"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "general" | "curso")}
                  className={`pb-4 px-1 text-sm font-medium uppercase tracking-wider cursor-pointer ${
                    activeTab === tab
                      ? "border-b-2 border-cyan-700 text-cyan-700"
                      : "text-gray-500 hover:text-cyan-700 border-b-2 border-transparent"
                  }`}
                >
                  {tab === "general"
                    ? "Historial de Puntajes"
                    : "Rendimiento por Cursos"}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "general" && selectedUser && (
            <RendimientoGeneral idusuario={selectedUser.value} />
          )}

          {activeTab === "curso" && selectedUser && (
            <RendimientoPorCurso idusuario={selectedUser.value} />
          )}
        </div>
      ) : (
        isAdmin && (
          <p className="text-gray-600 text-base text-center">
            Por favor seleccione un estudiante para ver el reporte.
          </p>
        )
      )}
    </div>
  );
};

export default RendimientoSimulacro;
