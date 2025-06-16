import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import RendimientoGeneral from "../../../components/RendimientoGeneral";
import RendimientoPorCurso from "../../../components/RendimientoPorCurso";

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
  menu: (provided: any) => ({ ...provided, borderRadius: "12px", zIndex: 1000 }),
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

  const isAdmin = hasPermission(6);
  const isEstudiante = hasPermission(3);

  useEffect(() => {
    if (isAdmin) {
      fetchUsuariosOptions();
    } else if (isEstudiante && user) {
      setSelectedUser({ value: user.idusuario, label: user.nombre });
    }
  }, [user, isAdmin, isEstudiante]);

  const fetchUsuariosOptions = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/usuarios/estudiantes");
      if (res.data.success) {
        const options = res.data.data.map((u: any) => ({
          value: u.idusuario,
          label: `${u.nombre} ${u.apellido}`,
        }));
        setUsuariosOptions(options);
      }
    } catch (err) {
      console.error("Error al cargar usuarios", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const canShowTabs = isEstudiante || (isAdmin && selectedUser !== null);

  return (
    <div className="max-w-7xl mx-4 md:mx-8 lg:mx-8 mt-4 flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-extrabold text-center text-cyan-700 uppercase tracking-wide">
        Rendimiento en Simulacros
      </h2>

      {isAdmin && (
        <div className="max-w-6xl w-full">
          {loadingUsers ? (
            <p className="text-gray-600 text-lg text-center">Cargando usuarios...</p>
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
