import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChevronLeft, FaChevronRight, FaPlus, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Usuario {
  idusuario: number;
  codigomatricula?: string;
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
  celular: string;
  rol: {
    idrol: number;
    nombre: "ESTUDIANTE" | "ADMINISTRADOR";
  };
}

const ITEMS_PER_PAGE = 5;

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tab, setTab] = useState<"ESTUDIANTE" | "ADMINISTRADOR">("ESTUDIANTE");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigomatricula: "",
    nombre: "",
    apellido: "",
    dni: "",
    correo: "",
    celular: "",
    rol: tab,
  });

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/usuarios/listar")
      .then((res) => setUsuarios(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setPage(1);
    setFormData((f) => ({ ...f, rol: tab }));
  }, [tab]);

  const filtered = usuarios.filter((u) => u.rol.nombre === tab);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    axios
      .post("http://127.0.0.1:8000/api/usuarios", formData)
      .then((res) => {
        setUsuarios((u) => [...u, res.data.data]);
        closeModal();
      })
      .catch((err) => console.error(err));
  };

  const exportToExcel = () => {
    if (filtered.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((user) => ({
        ID: user.idusuario,
        ...(tab === "ESTUDIANTE" && { "Código Matrícula": user.codigomatricula }),
        Nombres: user.nombre,
        Apellidos: user.apellido,
        DNI: user.dni,
        Correo: user.correo,
        Celular: user.celular,
        Rol: user.rol.nombre,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `${tab === "ESTUDIANTE" ? "Estudiantes" : "Administradores"}`
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(data, `Usuarios_${tab === "ESTUDIANTE" ? "Estudiantes" : "Administradores"}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
      <h1 className="text-2xl font-bold mb-4 text-cyan-700 text-center uppercase">
        Gestión de Usuarios
      </h1>
      <div className="flex justify-end items-center gap-4">
        <button
          onClick={exportToExcel}
          className="mt-6 mb-5 flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md transition-all cursor-pointer"
        >
          <FaFileExcel className="mr-2 text-sm" />
          Exportar {tab === "ESTUDIANTE" ? "Estudiantes" : "Admins"}
        </button>
        <button
          onClick={openModal}
          className="mt-6 mb-5 flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md transition-all cursor-pointer"
        >
          <FaPlus className="mr-2 text-sm" />
          Registrar {tab === "ESTUDIANTE" ? "Estudiante" : "Admin"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {(["ESTUDIANTE", "ADMINISTRADOR"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTab(r)}
              className={`pb-4 px-1 text-sm font-medium uppercase tracking-wider cursor-pointer ${
                tab === r
                  ? "border-b-2 border-cyan-700 text-cyan-700"
                  : "text-gray-500 hover:text-cyan-700 border-b-2 border-transparent"
              }`}
            >
              {r === "ESTUDIANTE" ? "Estudiantes" : "Administradores"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md mt-8">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                #
              </th>
              {tab === "ESTUDIANTE" && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                  Código Matrícula
                </th>
              )}
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Nombre Completo
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                DNI
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Correo
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Celular
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((u, i) => (
              <tr
                key={u.idusuario}
                className="hover:bg-gray-100 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                  {(page - 1) * ITEMS_PER_PAGE + i + 1}
                </td>
                {tab === "ESTUDIANTE" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {u.codigomatricula}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {u.nombre} {u.apellido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {u.dni}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {u.correo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {u.celular}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={tab === "ESTUDIANTE" ? 6 : 5}
                  className="px-6 py-8 text-center text-sm text-gray-500 italic"
                >
                  No se encontraron usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          Mostrando {paginated.length} de {filtered.length} resultados
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-6 border border-cyan-100 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-cyan-800">
                Nuevo {tab === "ESTUDIANTE" ? "Estudiante" : "Administrador"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-cyan-600 transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tab === "ESTUDIANTE" && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-700 mb-2">
                      Código Matrícula
                    </label>
                    <input
                      type="text"
                      name="codigomatricula"
                      value={formData.codigomatricula}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-cyan-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-cyan-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-cyan-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-2">
                    DNI
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-cyan-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-2">
                    Correo
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-cyan-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-2">
                    Celular
                  </label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-cyan-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-cyan-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-md transition-colors"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
