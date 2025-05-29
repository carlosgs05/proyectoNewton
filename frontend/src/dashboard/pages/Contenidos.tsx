import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaStream,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaBook,
} from "react-icons/fa";
import Swal from "sweetalert2/dist/sweetalert2.all.js";
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

const ITEMS_PER_PAGE = 5;

const Contenidos: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [formCurso, setFormCurso] = useState({ nombrecurso: "" });
  const [errors, setErrors] = useState<{ nombrecurso?: string[] }>({});
  const [saving, setSaving] = useState(false);

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

  const openModal = (curso?: Curso) => {
    setEditingCurso(curso || null);
    setFormCurso({ nombrecurso: curso?.nombrecurso || "" });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormCurso({ nombrecurso: "" });
    setEditingCurso(null);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormCurso({ ...formCurso, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleSave = () => {
    setSaving(true);
    const request = editingCurso
      ? axios.put(
          `http://127.0.0.1:8000/api/cursos/${editingCurso.idcurso}/actualizar`,
          formCurso
        )
      : axios.post("http://127.0.0.1:8000/api/cursos/registrar", formCurso);

    request
      .then((res) => {
        if (res.data.success) {
          Swal.fire("Éxito", res.data.message, "success");
          fetchCursos();
          closeModal();
        }
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        } else {
          Swal.fire("Error", "No se pudo guardar el curso", "error");
        }
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (curso: Curso) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el curso y todos sus temas y materiales.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((result: any) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://127.0.0.1:8000/api/cursos/${curso.idcurso}/eliminar`)
          .then((res) => {
            if (res.data.success) {
              Swal.fire("Eliminado", res.data.message, "success");
              fetchCursos();
            }
          })
          .catch(() =>
            Swal.fire("Error", "No se pudo eliminar el curso", "error")
          );
      }
    });
  };

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

  if (hasPermission(7)) {
    return (
      <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
        <h1 className="text-2xl font-bold mb-4 text-cyan-700 text-center uppercase">
          Administración de Contenido
        </h1>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md cursor-pointer"
          >
            <FaPlus className="mr-2 text-sm" /> Registrar Curso
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                  Acciones
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
                      <FaStream className="mr-1" /> Ver Temas
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 space-x-4">
                    <button
                      onClick={() => openModal(curso)}
                      className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(curso)}
                      className="text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <FaTrash />
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

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCurso ? "Editar Curso" : "Registrar Curso"}
                </h3>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Curso
                </label>
                <input
                  type="text"
                  name="nombrecurso"
                  value={formCurso.nombrecurso}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.nombrecurso ? "border-red-500" : "border-gray-300"
                  } bg-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-700`}
                />
                {errors.nombrecurso && (
                  <span className="text-red-600 text-sm mt-1 block">
                    {errors.nombrecurso[0]}
                  </span>
                )}

                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {saving && <FaSpinner className="animate-spin" />}{" "}
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Contenidos;
