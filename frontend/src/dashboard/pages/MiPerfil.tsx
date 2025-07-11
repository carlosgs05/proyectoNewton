import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2/dist/sweetalert2.all.js";
import axios from "axios";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaHashtag,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaSpinner,
} from "react-icons/fa";

const MiPerfil: React.FC = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "privacidad">("personal");
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<Record<string, string[]>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [formPersonal, setFormPersonal] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    celular: "",
    codigomatricula: "",
  });

  const [passwords, setPasswords] = useState({
    new: "",
    confirm: "",
    show: false,
  });

  useEffect(() => {
    if (user) {
      setFormPersonal({
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni || "",
        celular: user.celular,
        codigomatricula: user.codigomatricula || "",
      });
    }
  }, [user]);

  if (!user) return null;

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormPersonal((prev) => ({ ...prev, [name]: value }));
    setPersonalErrors(prev => ({ ...prev, [name]: [] }));
  };

  const handleSavePersonal = async () => {
    setLoadingPersonal(true);
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await axios.put(`https://proyectonewton-production.up.railway.app/api/usuarios/${user.idusuario}/personal-info`, formPersonal);

      const updatedUser = {
        ...user,
        ...response.data.data,
      };

      if (token) {
        login(updatedUser, token);
      }

      Swal.fire({
        title: "Éxito",
        text: "Información personal actualizada",
        icon: "success",
        didClose: () => window.location.href = "/dashboard/mi-perfil"
      });

      setIsEditingPersonal(false);
      setPersonalErrors({});
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setPersonalErrors(error.response.data.errors);
      } else {
        Swal.fire("Error", "No se pudo actualizar la información", "error");
      }
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors(prev => ({ ...prev, [name]: [] }));
  };

  const toggleShow = () => setPasswords((prev) => ({ ...prev, show: !prev.show }));

  const handleSavePassword = async () => {
    setLoadingPassword(true);
    try {
      const response = await axios.put(`https://proyectonewton-production.up.railway.app/api/usuarios/${user.idusuario}/password`, {
        new_password: passwords.new,
        new_password_confirmation: passwords.confirm,
      });

      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const updatedUser = {
        ...user,
        ...response.data.data,
      };

      if (token) {
        login(updatedUser, token);
      }

      Swal.fire({
        title: "Éxito",
        text: "Contraseña actualizada",
        icon: "success",
        didClose: () => window.location.href = "/dashboard/mi-perfil"
      });

      setIsEditingPassword(false);
      setPasswords({ new: "", confirm: "", show: false });
      setPasswordErrors({});
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setPasswordErrors(error.response.data.errors);
      } else {
        Swal.fire("Error", "No se pudo actualizar la contraseña", "error");
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 mt-4">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-extrabold mb-5 text-cyan-700 text-center uppercase">
          Mi Perfil
        </h1>
        <p className="text-gray-600 mt-2 max-w-6xl text-base text-center">
          Administra tu información personal y configuración de seguridad. Aquí
          puedes actualizar tus datos de contacto y mantener tu cuenta protegida
          con una contraseña segura
        </p>
      </div>

      <div className="p-6">
        <div className="flex justify-center space-x-12 mb-6">
          {(["personal", "privacidad"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-semibold uppercase transition-all cursor-pointer
                ${
                  activeTab === tab
                    ? "bg-cyan-700 text-white shadow-sm"
                    : "text-gray-600 hover:bg-cyan-700 hover:text-white"
                }`}
            >
              {tab === "personal" ? "Información Personal" : "Privacidad"}
            </button>
          ))}
        </div>

        {activeTab === "personal" ? (
          <div className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-8 flex items-center gap-3 text-cyan-800 bg-cyan-50 p-4 rounded-lg">
              <FaInfoCircle className="text-lg shrink-0" />
              <span className="font-medium">
                Verifica que tu información personal esté actualizada para
                recibir notificaciones importantes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field icon={<FaUser className="text-gray-700" />} label="Nombre" name="nombre" value={formPersonal.nombre} disabled={!isEditingPersonal} onChange={handlePersonalChange} error={personalErrors.nombre?.[0]} />
              <Field icon={<FaUser className="text-gray-700" />} label="Apellido" name="apellido" value={formPersonal.apellido} disabled={!isEditingPersonal} onChange={handlePersonalChange} error={personalErrors.apellido?.[0]} />
              <Field icon={<FaIdCard className="text-gray-700" />} label="DNI" name="dni" value={formPersonal.dni} disabled={!isEditingPersonal} onChange={handlePersonalChange} error={personalErrors.dni?.[0]} />
              <Field icon={<FaPhone className="text-gray-700" />} label="Celular" name="celular" value={formPersonal.celular} disabled={!isEditingPersonal} onChange={handlePersonalChange} error={personalErrors.celular?.[0]} />
              {user.rol.idrol === 2 && (
                <Field icon={<FaHashtag className="text-gray-700" />} label="Código Matrícula" name="codigomatricula" value={formPersonal.codigomatricula} disabled />
              )}
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              {!isEditingPersonal ? (
                <button onClick={() => setIsEditingPersonal(true)} className="px-6 py-2.5 bg-transparent font-medium text-cyan-900 hover:text-cyan-700 cursor-pointer transition-colors">
                  Editar Información
                </button>
              ) : (
                <>
                  <button onClick={() => setIsEditingPersonal(false)} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-colors shadow-sm">
                    Cancelar
                  </button>
                  <button onClick={handleSavePersonal} disabled={loadingPersonal} className="px-6 py-2.5 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loadingPersonal && <FaSpinner className="animate-spin" />}
                    {loadingPersonal ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-8 flex items-center gap-3 text-cyan-800 bg-cyan-50 p-4 rounded-lg">
              <FaInfoCircle className="text-lg shrink-0" />
              <span className="font-medium">
                Protege tu cuenta con una contraseña segura y única.
                Recomendamos usar combinación de letras, números y símbolos.
              </span>
            </div>

            <div className="space-y-6">
              <Field icon={<FaEnvelope className="text-gray-700" />} label="Correo" name="correo" value={user.correo} disabled />
              <div className="relative">
                <Field icon={<FaLock className="text-gray-700" />} label="Contraseña" name="password" value="••••••••" disabled type={passwords.show ? "text" : "password"} />
                <button onClick={toggleShow} className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 cursor-pointer">
                  {passwords.show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {!isEditingPassword ? (
                <div className="flex justify-center">
                  <button onClick={() => setIsEditingPassword(true)} className="px-6 py-2.5 bg-transparent font-medium text-cyan-900 hover:text-cyan-700 cursor-pointer transition-colors">
                    Cambiar Contraseña
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <Field icon={<FaLock className="text-gray-700" />} label="Nueva contraseña" name="new" type={passwords.show ? "text" : "password"} value={passwords.new} onChange={handlePasswordChange} error={passwordErrors.new_password?.[0]} />
                  <Field icon={<FaLock className="text-gray-700" />} label="Confirmar contraseña" name="confirm" type={passwords.show ? "text" : "password"} value={passwords.confirm} onChange={handlePasswordChange} />
                  <div className="flex justify-center space-x-4 pt-4">
                    <button onClick={() => setIsEditingPassword(false)} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-colors shadow-sm">
                      Cancelar
                    </button>
                    <button onClick={handleSavePassword} disabled={loadingPassword} className="px-6 py-2.5 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                      {loadingPassword && <FaSpinner className="animate-spin" />}
                      {loadingPassword ? "Guardando..." : "Guardar Contraseña"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  error?: string;
}

const Field: React.FC<FieldProps> = ({
  icon,
  label,
  name,
  value,
  disabled,
  onChange,
  type = "text",
  error,
}) => (
  <div className="relative">
    <label className={`block text-sm font-medium ${error ? 'text-red-600' : 'text-gray-700'} mb-1.5`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <div className={`${error ? 'text-red-500' : 'text-gray-200'} bg-transparent rounded-l-lg p-2`}>
          {icon}
        </div>
      </div>
      <input
        type={type}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-200 
          focus:ring-1 transition-colors placeholder-gray-300
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-cyan-800 focus:ring-cyan-800'}`}
      />
      {error && (
        <span className="text-red-600 text-sm mt-1 block">{error}</span>
      )}
    </div>
  </div>
);

export default MiPerfil;


