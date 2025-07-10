import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FaLayerGroup,
  FaThLarge,
} from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Material {
  idmaterial: number;
  idtema: number;
  tipomaterial: string;
  url: string;
  created_at: string;
}

interface Tema {
  idtema: number;
  idcurso: number;
  nombretema: string;
  created_at: string;
  materiales: Material[];
}

interface Curso {
  idcurso: number;
  nombrecurso: string;
  created_at: string;
  temas: Tema[];
}

// Ahora ITEMS_PER_PAGE es 6 para mostrar 6 cursos por página
const ITEMS_PER_PAGE = 6;

const Contenidos: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = () => {
    axios
      .get("http://127.0.0.1:8000/api/cursos/listar")
      .then((res) => {
        if (res.data.success) {
          setCursos(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  };

  const totalPages = Math.ceil(cursos.length / ITEMS_PER_PAGE);
  const paginated = cursos.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (hasPermission(4)) {
    return (
      <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
        <h1 className="text-2xl font-extrabold mb-8 text-cyan-700 text-center uppercase tracking-wide">
          Mis Cursos
        </h1>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {paginated.length > 0 ? (
            paginated.map((curso) => (
              <div
                key={curso.idcurso}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col justify-center items-center p-8 text-center border border-transparent hover:border-cyan-500"
                onClick={() =>
                  navigate(`/dashboard/cursos/${curso.idcurso}`, {
                    state: { curso },
                  })
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/dashboard/cursos/${curso.idcurso}`, {
                      state: { curso },
                    });
                  }
                }}
              >
                <div className="bg-cyan-100 rounded-full p-4 mb-4 inline-flex items-center justify-center">
                  <FaLayerGroup className="text-cyan-600 w-12 h-12" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 truncate max-w-full px-2">
                  {curso.nombrecurso}
                </h2>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic col-span-full text-center">
              No hay cursos disponibles
            </p>
          )}
        </div>

        {/* Paginación */}
        <div className="flex justify-between items-center mt-8 max-w-md mx-auto">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={`p-3 rounded-lg border border-cyan-600 text-cyan-600 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer`}
            aria-label="Página anterior"
          >
            <FaChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-700 font-medium">
            Página {page} de {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
            className={`p-3 rounded-lg border border-cyan-600 text-cyan-600 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer`}
            aria-label="Página siguiente"
          >
            <FaChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (hasPermission(7)) {
    return (
      <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
        <h1 className="text-2xl font-extrabold mb-8 text-cyan-700 text-center uppercase">
          Administración de Contenido
        </h1>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                  Nombre del Curso
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                  Temas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginated.map((curso, idx) => (
                <tr key={curso.idcurso} className="hover:bg-gray-100">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {curso.nombrecurso}
                  </td>
                  <td className="px-6 py-4 text-sm text-cyan-700">
                    <button
                      onClick={() =>
                        navigate(`/dashboard/cursos/${curso.idcurso}/temas`, {
                          state: { curso },
                        })
                      }
                      className="flex items-center hover:text-cyan-900 cursor-pointer"
                    >
                      <FaThLarge className="mr-1" /> Ver Temas
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500 italic"
                  >
                    No hay cursos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Mostrando {paginated.length} de {cursos.length} cursos
          </span>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2.5 border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-cyan-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2.5 border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Contenidos;