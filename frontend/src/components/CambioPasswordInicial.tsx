import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const CambioPasswordInicial: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userId = params.get("id");

  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userId || isNaN(Number(userId))) {
      setError("Acceso no autorizado. Parámetro faltante o inválido.");
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.new_password !== formData.confirm_password) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      await axios.post("https://proyectonewton-production.up.railway.app/api/activar-cuenta", {
        user_id: userId,
        new_password: formData.new_password,
        new_password_confirmation: formData.confirm_password,
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al actualizar la contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!userId || isNaN(Number(userId))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Acceso no autorizado
          </h1>
          <p className="text-gray-300">
            El parámetro de identificación del usuario no está presente o es
            inválido.
          </p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-6 px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-3xl shadow-xl border border-gray-700 p-8">
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <div className="bg-cyan-600 p-3 rounded-full">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c1.104 0 2-.896 2-2V7a4 4 0 10-8 0v2c0 1.104.896 2 2 2v2a2 2 0 002 2 2 2 0 002-2v-2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-cyan-500">
            Cambiar Contraseña Inicial
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Por seguridad, debes establecer una nueva contraseña personalizada
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-cyan-400 text-sm mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-cyan-100 rounded-xl border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-cyan-400 text-sm mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-cyan-100 rounded-xl border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && (
            <p className="text-green-400 text-sm text-center">
              Contraseña actualizada. Redirigiendo...
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-70"
          >
            {loading ? "Guardando..." : "Guardar y Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CambioPasswordInicial;
