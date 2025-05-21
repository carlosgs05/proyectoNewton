// src/components/contenidos/Contenidos.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { FaBook, FaPlus, FaChevronLeft, FaChevronRight, FaStream } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface Material {
  idmaterial: number;
  idtema: number;
  tipomaterial: string; // "PDF", "Flashcards", "Video", "Solucionario", etc.
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

const ITEMS_PER_PAGE = 5;

const Contenidos: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [page, setPage] = useState(1);

  // Estados para el modal (solo uso en modo administrador)
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTemas, setCurrentTemas] = useState<Tema[]>([]);
  const [currentCursoName, setCurrentCursoName] = useState<string>("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/cursos/listar")
      .then((res) => {
        if (res.data.success) {
          setCursos(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const totalPages = Math.ceil(cursos.length / ITEMS_PER_PAGE);
  const paginated = cursos.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const openTemasModal = (curso: Curso) => {
    setCurrentTemas(curso.temas);
    setCurrentCursoName(curso.nombrecurso);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  // ================================================
  // VISTA PARA ESTUDIANTE (permiso 4)
  // ================================================
  if (hasPermission(4)) {
    return (
      <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
        <h1 className="text-2xl font-bold mb-6 text-cyan-700 text-center uppercase">
          Mis Cursos
        </h1>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cursos.map((curso) => (
            <div
              key={curso.idcurso}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
              onClick={() =>
                navigate(`/dashboard/cursos/${curso.idcurso}`, {
                  state: { curso },
                })
              }
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                <FaBook className="inline-block mr-2 text-cyan-600" />
                {curso.nombrecurso}
              </h2>
              <p className="text-gray-600 text-sm">
                Temas: {curso.temas.length}
              </p>
            </div>
          ))}
          {cursos.length === 0 && (
            <p className="text-gray-500 italic col-span-full text-center">
              No hay cursos disponibles
            </p>
          )}
        </div>
      </div>
    );
  }

  // ================================================
  // VISTA PARA ADMINISTRADOR DE CONTENIDO (permiso 7)
  // ================================================
  if (hasPermission(7)) {
    return (
      <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
        <h1 className="text-2xl font-bold mb-4 text-cyan-700 text-center uppercase">
          Administración de Contenido
        </h1>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => (window.location.href = "/dashboard/cursos/nuevo")}
            className="flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md transition-all cursor-pointer"
          >
            <FaPlus className="mr-2 text-sm" />
            Registrar Curso
          </button>
        </div>

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
                <tr
                  key={curso.idcurso}
                  className="hover:bg-gray-100 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {curso.nombrecurso}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <button
                      onClick={() => openTemasModal(curso)}
                      className="flex items-center text-cyan-700 hover:text-cyan-900 transition-colors cursor-pointer"
                    >
                      <FaStream className="mr-1" /> Temas
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
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
              className="p-2.5 bg-white border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-cyan-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2.5 bg-white border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal de Temas (solo para admin) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
              {/* Encabezado del Modal */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                  Temas de “{currentCursoName}”
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer"
                >
                  <FiX size={24} />
                </button>
              </div>
              {/* Cuerpo del Modal: Tabla de Temas */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {currentTemas.length > 0 ? (
                  <table className="min-w-full bg-white divide-y divide-gray-200 border border-gray-200 table-auto">
                    <thead className="bg-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-white uppercase">
                          #
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-white uppercase">
                          Tema
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentTemas.map((tema, idx) => (
                        <tr
                          key={tema.idtema}
                          className="hover:bg-gray-100 transition-colors"
                        >
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-800">
                            {tema.nombretema}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">No hay temas.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================================================
  // SI EL USUARIO NO TIENE PERMISO 4 NI 7
  // ================================================
  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4 text-center text-gray-600">
      No tienes permisos para ver este contenido.
    </div>
  );
};

export default Contenidos;

