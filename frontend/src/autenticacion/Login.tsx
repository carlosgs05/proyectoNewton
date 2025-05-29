import React, { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface LoginData {
  correo: string;
  password: string;
}

interface Permission {
  idpermiso: number;
  nombre: string;
}

interface Role {
  idrol: number;
  nombre: string;
  permisos: Permission[];
}

interface UserPayload {
  idusuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  dni: string;
  codigomatricula: string | null;
  idrol: number;
  created_at: string;
  updated_at: string;
  activo: boolean;
  rol: Role;
}

interface LoginResponse {
  success: boolean;
  primer_ingreso?: boolean;
  message?: string;
  access_token?: string;
  user?: UserPayload;
  user_id?: number; // Added user_id property
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    correo: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setRememberMe(checked);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post<LoginResponse>(
        "http://localhost:8000/api/login",
        formData
      );

      if (data.success && data.access_token && data.user) {
        const user = data.user;
        const access_token = data.access_token;

        const userData = {
          idusuario: user.idusuario,
          nombre: user.nombre,
          apellido: user.apellido,
          correo: user.correo,
          celular: user.celular,
          dni: user.dni,
          codigomatricula: user.codigomatricula,
          activo: user.activo,
          rol: {
            idrol: user.rol.idrol,
            nombre: user.rol.nombre,
            permisos: user.rol.permisos,
          },
        };

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("authToken", access_token);
        storage.setItem("userData", JSON.stringify(userData));

        axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        login(userData, access_token);
      } else if (data.primer_ingreso && data.user_id) {
        navigate(`/cambiar-password?id=${data.user_id}`, { replace: true });
      }
    } catch (err: any) {
      let msg = "Error al iniciar sesión";
      if (err.response?.status === 401) {
        msg = "Credenciales incorrectas";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="bg-cyan-600 p-3 rounded-full">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-cyan-500 mb-2">INICIAR SESIÓN</h1>
          <p className="text-gray-400">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-cyan-400 text-sm font-semibold mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="usuario@ejemplo.com"
              autoComplete="username"
              required
              className="w-full px-4 py-3 bg-gray-700 text-cyan-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent border border-gray-600 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-cyan-400 text-sm font-semibold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gray-700 text-cyan-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent border border-gray-600 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center justify-end mb-4">
            <a href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed enabled:cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Ingresando al sistema
              </div>
            ) : (
              "ACCEDER AL SISTEMA"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
