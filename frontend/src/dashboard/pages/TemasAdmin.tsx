import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaArrowLeft,
  FaStream,
} from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2/dist/sweetalert2.all.js";

interface Curso {
  idcurso: number;
  nombrecurso: string;
}

interface Tema {
  idtema: number;
  idcurso: number;
  nombretema: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 5;

const TemasAdmin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const curso: Curso = location.state?.curso;

  const [temas, setTemas] = useState<Tema[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);
  const [formTema, setFormTema] = useState({ nombretema: "" });
  const [errors, setErrors] = useState<{ nombretema?: string[] }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemas();
  }, []);

  const fetchTemas = () => {
    axios
      .get("http://127.0.0.1:8000/api/cursos/listar")
      .then((res) => {
        if (res.data.success) {
          const cursoData = res.data.data.find(
            (c: Curso) => c.idcurso === curso.idcurso
          );
          if (cursoData) {
            setTemas(cursoData.temas);
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const totalPages = Math.ceil(temas.length / ITEMS_PER_PAGE);
  const paginated = temas.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const openModal = (tema?: Tema) => {
    setEditingTema(tema || null);
    setFormTema({ nombretema: tema?.nombretema || "" });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormTema({ nombretema: "" });
    setEditingTema(null);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormTema({ ...formTema, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleSave = () => {
    setSaving(true);
    const request = editingTema
      ? axios.put(
          `http://127.0.0.1:8000/api/temas/${editingTema.idtema}/actualizar`,
          formTema
        )
      : axios.post(
          `http://127.0.0.1:8000/api/cursos/${curso.idcurso}/temas/registrar`,
          formTema
        );

    request
      .then((res) => {
        if (res.data.success) {
          Swal.fire("Éxito", res.data.message, "success");
          fetchTemas();
          closeModal();
        }
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        } else {
          Swal.fire("Error", "No se pudo guardar el tema", "error");
        }
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (tema: Tema) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará el tema y todos los materiales asociados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((result: any) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://127.0.0.1:8000/api/temas/${tema.idtema}/eliminar`)
          .then((res) => {
            if (res.data.success) {
              Swal.fire("Eliminado", res.data.message, "success");
              fetchTemas();
            }
          })
          .catch(() =>
            Swal.fire("Error", "No se pudo eliminar el tema", "error")
          );
      }
    });
  };

  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
      <div className="flex items-center mb-4 space-x-2 text-sm text-cyan-700">
        <button
          onClick={() => navigate("/dashboard/contenido")}
          className="flex items-center hover:underline cursor-pointer"
        >
          <FaArrowLeft className="mr-1" /> Cursos
        </button>
        <span>{">"}</span>
        <span className="font-semibold">Temas</span>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-cyan-700 text-center uppercase">
        Temas del Curso: {curso.nombrecurso}
      </h1>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md cursor-pointer transition-colors duration-200"
        >
          <FaPlus className="mr-2 text-sm" /> Registrar Tema
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
                Nombre del Tema
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Materiales
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((tema, idx) => (
              <tr key={tema.idtema} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">
                  {tema.nombretema}
                </td>
                <td className="px-6 py-4 text-sm text-cyan-700">
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/cursos/${curso.idcurso}/temas/${tema.idtema}/materiales`,
                        { state: { curso, tema } }
                      )
                    }
                    className="flex items-center hover:text-cyan-900 cursor-pointer transition-colors"
                  >
                    <FaStream className="mr-1" /> Ver Materiales
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openModal(tema)}
                      className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors duration-200 cursor-pointer"
                      title="Editar"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tema)}
                      className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors duration-200 cursor-pointer"
                      title="Eliminar"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-gray-500 italic"
                >
                  No hay temas registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          Mostrando {paginated.length} de {temas.length} temas
        </span>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2.5 border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-cyan-700">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2.5 border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
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
                {editingTema ? "Editar Tema" : "Registrar Tema"}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Tema
              </label>
              <input
                type="text"
                name="nombretema"
                value={formTema.nombretema}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.nombretema ? "border-red-500" : "border-gray-300"
                } bg-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-700`}
              />
              {errors.nombretema && (
                <span className="text-red-600 text-sm mt-1 block">
                  {errors.nombretema[0]}
                </span>
              )}
              <div className="flex justify-center mt-6 space-x-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
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
};

export default TemasAdmin;
