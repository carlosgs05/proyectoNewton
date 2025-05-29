import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaFileExcel,
  FaSpinner,
} from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FiX } from "react-icons/fi";
import Swal from "sweetalert2/dist/sweetalert2.all.js";
import { BlobWriter, ZipWriter } from "@zip.js/zip.js";

interface Usuario {
  idusuario: number;
  codigomatricula?: string;
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
  celular: string;
  passwordenc: string;
  activo: boolean;
  rol: { idrol: number; nombre: "ESTUDIANTE" | "ADMINISTRADOR" };
}

const ITEMS_PER_PAGE = 5;

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tab, setTab] = useState<"ESTUDIANTE" | "ADMINISTRADOR">("ESTUDIANTE");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [securityPassword, setSecurityPassword] = useState<string>("");
  const [formData, setFormData] = useState({
    codigomatricula: "",
    nombre: "",
    apellido: "",
    dni: "",
    celular: "",
    idrol: tab === "ESTUDIANTE" ? 2 : 1,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/usuarios/listar")
      .then((res) => setUsuarios(res.data.data || []));
    axios
      .get("http://127.0.0.1:8000/api/security-system-password")
      .then((res) => {
        if (typeof res.data.password === "string")
          setSecurityPassword(res.data.password);
      });
  }, []);

  useEffect(() => {
    setPage(1);
    setFormData((f) => ({ ...f, idrol: tab === "ESTUDIANTE" ? 2 : 1 }));
  }, [tab]);

  useEffect(() => {
    if (modalOpen && tab === "ESTUDIANTE") {
      const estudiantes = usuarios.filter((u) => u.rol.nombre === "ESTUDIANTE");
      const currentYear = new Date().getFullYear();
      let lastNum = 0;
      if (estudiantes.length) {
        const lastCode = estudiantes[estudiantes.length - 1].codigomatricula!;
        const match = lastCode.match(new RegExp(`E${currentYear}00(\\d+)`));
        if (match) lastNum = +match[1];
      }
      setFormData((f) => ({
        ...f,
        codigomatricula: `E${currentYear}00${String(lastNum + 1).padStart(
          2,
          "0"
        )}`,
      }));
    }
  }, [modalOpen, tab, usuarios]);

  const filtered = usuarios.filter((u) => u.rol.nombre === tab);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const openModal = () => {
    setErrors({});
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setErrors({});
    setIsSubmitting(false);
    setFormData({
      codigomatricula: "",
      nombre: "",
      apellido: "",
      dni: "",
      celular: "",
      idrol: tab === "ESTUDIANTE" ? 2 : 1,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    setErrors((p) => {
      const c = { ...p };
      delete c[name];
      return c;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const payload = {
        codigomatricula: tab === "ESTUDIANTE" ? formData.codigomatricula : null,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: formData.dni.trim(),
        celular: formData.celular.trim(),
        idrol: formData.idrol,
      };
      const res = await axios.post(
        "http://127.0.0.1:8000/api/usuarios/crear",
        payload
      );
      const { correo, contrasena } = res.data.data.credenciales;
      await Swal.fire({
        icon: "success",
        title: "Usuario registrado",
        html: `<p><b>Correo:</b> ${correo}</p><p><b>Contraseña:</b> ${contrasena}</p>`,
        confirmButtonText: "OK",
      });
      window.location.reload();
    } catch (err: any) {
      if (err.response?.status === 422)
        setErrors(err.response.data.errors || {});
      else
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const createSheet = (title: string, data: any[], sheetName: string) => {
      const ws = workbook.addWorksheet(sheetName);
      const headers = Object.keys(data[0] || {});
      const colCount = headers.length;

      // Título en fila 3, separado dos filas en blanco antes
      ws.mergeCells(3, 2, 3, colCount + 1);
      const titleCell = ws.getCell(3, 2);
      titleCell.value = title;
      titleCell.font = {
        name: "Segoe UI",
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0097A7" },
      };
      titleCell.alignment = { horizontal: "center" };

      // Encabezados en fila 6
      headers.forEach((h, idx) => {
        const cell = ws.getCell(6, idx + 2);
        cell.value = h;
        cell.font = {
          name: "Segoe UI",
          size: 12,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF00796B" },
        };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF004D40" } },
          bottom: { style: "thin", color: { argb: "FF004D40" } },
          left: { style: "thin", color: { argb: "FF004D40" } },
          right: { style: "thin", color: { argb: "FF004D40" } },
        };
      });

      // Datos desde fila 7
      data.forEach((rowData, i) => {
        const rowNum = 7 + i;
        headers.forEach((key, j) => {
          const cell = ws.getCell(rowNum, j + 2);
          cell.value = (rowData as any)[key];
          cell.font = {
            name: "Segoe UI",
            size: 11,
            color: { argb: "FF004D40" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0F7FA" },
          };
          cell.alignment = { vertical: "middle", horizontal: "left" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0F7FA" } },
            bottom: { style: "thin", color: { argb: "FFE0F7FA" } },
            left: { style: "thin", color: { argb: "FFE0F7FA" } },
            right: { style: "thin", color: { argb: "FFE0F7FA" } },
          };
        });
      });

      // Auto-ajustar columnas (2 a colCount+1)
      for (let c = 2; c <= colCount + 1; c++) {
        const column = ws.getColumn(c);
        let maxLen = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const text = cell.value ? cell.value.toString() : "";
          if (text.length > maxLen) maxLen = text.length;
        });
        column.width = maxLen + 4;
      }
    };

    // Preparar datos
    const nuevos = filtered
      .filter((u) => !u.activo)
      .map((u) => ({
        ID: u.idusuario,
        Nombre: u.nombre,
        Apellido: u.apellido,
        DNI: u.dni,
        Correo: u.correo,
        Contraseña: u.passwordenc,
        Celular: u.celular,
        ...(tab === "ESTUDIANTE" && { "Código Matrícula": u.codigomatricula }),
      }));
    if (nuevos.length)
      createSheet("Listado de Usuarios Nuevos", nuevos, "Usuarios Nuevos");

    const activos = filtered
      .filter((u) => u.activo)
      .map((u) => ({
        ID: u.idusuario,
        Nombre: u.nombre,
        Apellido: u.apellido,
        DNI: u.dni,
        Correo: u.correo,
        Celular: u.celular,
        ...(tab === "ESTUDIANTE" && { "Código Matrícula": u.codigomatricula }),
      }));
    if (activos.length)
      createSheet("Listado de Usuarios Activos", activos, "Usuarios Activos");

    // Generar ZIP con contraseña
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const zipWriter = new ZipWriter(new BlobWriter("application/zip"), {
      password: securityPassword,
      encryptionStrength: 3,
    });
    const fileName = `Usuarios_${tab}_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    await zipWriter.add(fileName, new Response(blob).body!);
    const zipBlob = await zipWriter.close();
    saveAs(zipBlob, fileName.replace(".xlsx", ".zip"));
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

      {/* Modal de registro */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 space-y-6 border border-cyan-100 shadow-2xl">
            <div className="flex justify-center items-center relative">
              <h2 className="text-xl font-bold text-cyan-800 uppercase text-center">
                Nuevo {tab === "ESTUDIANTE" ? "Estudiante" : "Administrador"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer absolute right-0"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
                {tab === "ESTUDIANTE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Matrícula
                    </label>
                    <input
                      type="text"
                      name="codigomatricula"
                      value={formData.codigomatricula}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-400 rounded-lg text-gray-800 cursor-not-allowed"
                    />
                    {errors.codigomatricula && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.codigomatricula[0]}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      errors.nombre ? "border-red-500" : "border-gray-400"
                    } rounded-lg text-gray-800 focus:ring-1 outline-none transition`}
                  />
                  {errors.nombre && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.nombre[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      errors.apellido ? "border-red-500" : "border-gray-400"
                    } rounded-lg text-gray-800 focus:ring-1 outline-none transition`}
                  />
                  {errors.apellido && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.apellido[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNI
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      errors.dni ? "border-red-500" : "border-gray-400"
                    } rounded-lg text-gray-800 focus:ring-1 outline-none transition`}
                  />
                  {errors.dni && (
                    <p className="text-red-500 text-sm mt-1">{errors.dni[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Celular
                  </label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white border ${
                      errors.celular ? "border-red-500" : "border-gray-400"
                    } rounded-lg text-gray-800 focus:ring-1 outline-none transition`}
                  />
                  {errors.celular && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.celular[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center space-x-4 pt-6 border-t border-cyan-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 flex items-center justify-center bg-cyan-800 hover:bg-cyan-700 text-white rounded-lg shadow-md transition-colors cursor-pointer ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting && (
                    <FaSpinner className="animate-spin mr-2 w-4 h-4" />
                  )}
                  {isSubmitting ? "Registrando..." : "Registrar"}
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
