import React, { useEffect, useState, useRef } from "react";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2/dist/sweetalert2.all.js";
import axios from "axios";

interface Curso {
  idcurso: number;
  nombrecurso: string;
}

interface Tema {
  idtema: number;
  idcurso: number;
  nombretema: string;
}

interface Material {
  idmaterial: number;
  idtema: number;
  nombrematerial: string;
  tipomaterial: "Flashcards" | "PDF" | "Video" | "Solucionario";
  url: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 5;
const tiposMaterial: Material["tipomaterial"][] = [
  "Flashcards",
  "PDF",
  "Video",
  "Solucionario",
];

const MaterialesAdmin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { curso, tema } = location.state as { curso: Curso; tema: Tema };

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [activeTab, setActiveTab] =
    useState<Material["tipomaterial"]>("Flashcards");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [formMaterial, setFormMaterial] = useState<{
    idmaterial?: number;
    nombrematerial: string;
    tipomaterial: Material["tipomaterial"];
    url: string;
  }>({
    nombrematerial: "",
    tipomaterial: "Flashcards",
    url: "",
  });

  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewFileURL, setPreviewFileURL] = useState<string>("");
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal de Vista Previa (único modal)
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewURL, setPreviewURL] = useState<string>("");
  const [previewType, setPreviewType] = useState<
    "Flashcards" | "Video" | "PDF" | "Solucionario"
  >("Flashcards");

  useEffect(() => {
    fetchMateriales();
    return () => {
      if (previewFileURL) URL.revokeObjectURL(previewFileURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMateriales = () => {
    axios
      .get(`http://127.0.0.1:8000/api/temas/${tema.idtema}/materiales/listar`)
      .then((res: any) => {
        if (res.data.success) {
          setMateriales(res.data.data);
        }
      })
      .catch(() =>
        Swal.fire("Error", "No se pudo cargar los materiales", "error")
      );
  };

  const filtered = materiales.filter((m) => m.tipomaterial === activeTab);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const validate = () => {
    const errs: Record<string, string[]> = {};
    if (!formMaterial.nombrematerial.trim()) {
      errs.nombrematerial = ["El nombre es obligatorio."];
    }
    if (!archivo && !isEditing) {
      errs.archivo = ["Debe subir un archivo."];
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormMaterial((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => {
      const nuevos = { ...prev };
      delete nuevos[name];
      return nuevos;
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      setArchivo(file);
      if (previewFileURL) {
        URL.revokeObjectURL(previewFileURL);
      }
      setPreviewFileURL(URL.createObjectURL(file));
      setErrores((prev) => {
        const nuevos = { ...prev };
        delete nuevos.archivo;
        return nuevos;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const closeModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setHasSubmitted(false);
    setSaving(false);
    setUploadProgress(null);
    setErrores({});
    setFormMaterial({
      nombrematerial: "",
      tipomaterial: activeTab,
      url: "",
    });
    setArchivo(null);
    if (previewFileURL) {
      URL.revokeObjectURL(previewFileURL);
      setPreviewFileURL("");
    }
  };

  const openEditModal = (material: Material) => {
    setFormMaterial({
      idmaterial: material.idmaterial,
      nombrematerial: material.nombrematerial ?? "",
      tipomaterial: material.tipomaterial,
      url: material.url ?? "",
    });
    setArchivo(null);
    setPreviewFileURL("");
    setErrores({});
    setIsEditing(true);
    setHasSubmitted(false);
    setSaving(false);
    setUploadProgress(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setHasSubmitted(true);
    setSaving(true);
    setUploadProgress(0);

    if (!validate()) {
      setSaving(false);
      setUploadProgress(null);
      return;
    }

    const formData = new FormData();
    formData.append("nombrematerial", formMaterial.nombrematerial);
    formData.append("tipomaterial", formMaterial.tipomaterial);
    if (archivo) formData.append("archivo", archivo);

    const endpoint = isEditing
      ? `http://127.0.0.1:8000/api/materiales/${formMaterial.idmaterial}/actualizar`
      : `http://127.0.0.1:8000/api/temas/${tema.idtema}/materiales/registrar`;

    try {
      const res = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const porcentaje = Math.round(
            (event.loaded * 100) / (event.total || 1)
          );
          setUploadProgress(porcentaje);
        },
      });
      if (res.data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          Swal.fire("Éxito", res.data.message, "success");
          fetchMateriales();
          closeModal();
        }, 500);
      } else {
        setSaving(false);
        setUploadProgress(null);
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrores(err.response.data.errors);
      } else {
        Swal.fire("Error", "No se pudo completar la acción", "error");
      }
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará el material permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(
          `http://127.0.0.1:8000/api/materiales/${id}/eliminar`
        );
        if (res.data.success) {
          Swal.fire("Eliminado", res.data.message, "success");
          fetchMateriales();
        }
      } catch {
        Swal.fire("Error", "No se pudo eliminar el material", "error");
      }
    }
  };

  // Modal de Vista Previa: abre el modal y carga contenido según tipo archivo
  const openPreviewModal = (material: Material) => {
    setPreviewURL(`http://127.0.0.1:8000/${material.url}`);
    setPreviewType(material.tipomaterial);
    setPreviewModalOpen(true);
  };

  const closePreview = () => {
    setPreviewModalOpen(false);
    setPreviewURL("");
  };

  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
      {/* Breadcrumb */}
      <div className="flex items-center mb-4 space-x-2 text-sm text-cyan-700">
        <button
          onClick={() => navigate("/dashboard/contenido")}
          className="hover:underline cursor-pointer"
        >
          Cursos
        </button>
        <span>{">"}</span>
        <button
          onClick={() =>
            navigate(`/dashboard/cursos/${curso.idcurso}/temas`, {
              state: { curso },
            })
          }
          className="hover:underline cursor-pointer"
        >
          Temas
        </button>
        <span>{">"}</span>
        <span className="font-semibold">Materiales</span>
      </div>

      {/* Título */}
      <h1 className="text-2xl font-bold my-6 text-cyan-700 text-center uppercase">
        Materiales del Tema: {tema.nombretema}
      </h1>

      {/* Tabs y Registrar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {tiposMaterial.map((tipo) => (
            <button
              key={tipo}
              onClick={() => {
                setActiveTab(tipo);
                setFormMaterial((prev) => ({
                  ...prev,
                  tipomaterial: tipo,
                }));
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all cursor-pointer ${
                activeTab === tipo
                  ? "bg-cyan-700 text-white"
                  : "text-gray-700 hover:bg-cyan-600 hover:text-white"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setFormMaterial({
              nombrematerial: "",
              tipomaterial: activeTab,
              url: "",
            });
            setArchivo(null);
            setPreviewFileURL("");
            setErrores({});
            setIsEditing(false);
            setHasSubmitted(false);
            setSaving(false);
            setUploadProgress(null);
            setModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md cursor-pointer"
        >
          <FaPlus className="mr-2 text-sm" /> Registrar Material
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Vista
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((mat, idx) => (
              <tr key={mat.idmaterial} className="hover:bg-gray-100">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">
                  {mat.nombrematerial}
                </td>
                <td className="px-6 py-4 text-sm text-cyan-700">
                  <button
                    onClick={() => openPreviewModal(mat)}
                    className="flex items-center hover:text-cyan-900 cursor-pointer"
                  >
                    <FaEye />
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 space-x-4">
                  <button
                    onClick={() => openEditModal(mat)}
                    className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(mat.idmaterial)}
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
                  No hay materiales de tipo {activeTab}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          Mostrando {paginated.length} de {filtered.length} materiales
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

      {/* Modal de Formulario */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {isEditing ? "Editar Material" : "Registrar Material"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Nombre del Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Material
                </label>
                <input
                  type="text"
                  name="nombrematerial"
                  value={formMaterial.nombrematerial ?? ""}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    hasSubmitted && errores.nombrematerial
                      ? "border-red-500"
                      : "border-gray-300"
                  } bg-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-700`}
                />
                {hasSubmitted && errores.nombrematerial && (
                  <span className="text-red-600 text-sm mt-1 block">
                    {errores.nombrematerial[0]}
                  </span>
                )}
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`mt-1 w-full flex items-center justify-center text-sm text-gray-500 cursor-pointer border-2 border-dashed rounded-lg ${
                    formMaterial.tipomaterial === "Flashcards"
                      ? "aspect-square h-96"
                      : formMaterial.tipomaterial === "Video"
                      ? "aspect-video h-80"
                      : "h-16"
                  } ${
                    hasSubmitted && errores.archivo
                      ? "border-red-500"
                      : "border-cyan-400"
                  } bg-gray-100 relative`}
                >
                  {/* Preview dentro del form */}
                  {archivo ? (
                    formMaterial.tipomaterial === "Flashcards" ? (
                      <img
                        src={previewFileURL}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                    ) : formMaterial.tipomaterial === "Video" ? (
                      <video
                        src={previewFileURL}
                        className="w-full h-full object-contain"
                        controls
                      />
                    ) : (
                      <span className="px-2">{archivo.name}</span>
                    )
                  ) : isEditing && formMaterial.url ? (
                    formMaterial.tipomaterial === "Flashcards" ? (
                      <img
                        src={`http://127.0.0.1:8000/${formMaterial.url}`}
                        className="w-full h-full object-cover"
                        alt="actual"
                      />
                    ) : formMaterial.tipomaterial === "Video" ? (
                      <video
                        src={`http://127.0.0.1:8000/${formMaterial.url}`}
                        className="w-full h-full object-contain"
                        controls
                      />
                    ) : (
                      <span className="px-2">
                        {formMaterial.url.split("/").pop()}
                      </span>
                    )
                  ) : (
                    <span>Arrastra o haz clic para subir</span>
                  )}

                  {/* Ícono tacho para quitar */}
                  {(archivo || (isEditing && formMaterial.url)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchivo(null);
                        if (!archivo)
                          setFormMaterial((prev) => ({
                            ...prev,
                            url: "",
                          }));
                        setErrores((prev) => {
                          const nuevos = { ...prev };
                          delete nuevos.archivo;
                          return nuevos;
                        });
                        if (previewFileURL) {
                          URL.revokeObjectURL(previewFileURL);
                          setPreviewFileURL("");
                        }
                      }}
                      className="absolute top-2 right-2 text-red-600 cursor-pointer"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
                {hasSubmitted && errores.archivo && (
                  <span className="text-red-600 text-sm mt-1 block">
                    {errores.archivo[0]}
                  </span>
                )}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept={
                    formMaterial.tipomaterial === "Flashcards"
                      ? "image/*"
                      : formMaterial.tipomaterial === "Video"
                      ? "video/mp4"
                      : "application/pdf"
                  }
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      setArchivo(file);
                      if (previewFileURL) {
                        URL.revokeObjectURL(previewFileURL);
                      }
                      setPreviewFileURL(URL.createObjectURL(file));
                      setErrores((prev) => {
                        const nuevos = { ...prev };
                        delete nuevos.archivo;
                        return nuevos;
                      });
                    }
                  }}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <FaSpinner className="animate-spin" />}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Progreso */}
      {uploadProgress !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 text-center">
              Subiendo Material...
            </h2>
            <div className="w-full bg-gray-200 rounded-full overflow-hidden h-4">
              <div
                className="bg-cyan-700 h-4 transition-width duration-200"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600">
              {uploadProgress}% completado
            </p>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa (adaptado) */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          style={{ overflow: "hidden" }} // Evita scroll externo
        >
          <div
            className="bg-white rounded-xl w-full max-w-6xl shadow-xl flex flex-col"
            style={{
              height: "80vh", // Más alto que antes pero sin scroll
              maxHeight: "80vh",
            }}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Vista Previa</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                aria-label="Cerrar vista previa"
              >
                <FaTimes />
              </button>
            </div>
            <div
              className="flex-grow flex justify-center items-center p-6"
              style={{ minHeight: 0, overflow: "hidden" }}
            >
              {(previewType === "Flashcards" ||
                (previewType === "Solucionario" &&
                  previewURL.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i))) && (
                <img
                  src={previewURL}
                  alt="Vista previa"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  style={{ maxHeight: "100%", maxWidth: "100%" }}
                />
              )}
              {(previewType === "Video" ||
                (previewType === "Solucionario" &&
                  previewURL.match(/\.(mp4|webm|ogg)$/i))) && (
                <video
                  src={previewURL}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  style={{ maxHeight: "100%", maxWidth: "100%" }}
                />
              )}
              {(previewType === "PDF" ||
                (previewType === "Solucionario" &&
                  previewURL.match(/\.pdf$/i))) && (
                <iframe
                  src={previewURL}
                  title="Vista previa PDF"
                  className="w-full h-full rounded-lg"
                  style={{ border: "none" }}
                />
              )}
              {/* Archivos no soportados */}
              {!(
                previewType === "Flashcards" ||
                previewType === "Video" ||
                previewType === "PDF" ||
                previewType === "Solucionario"
              ) && (
                <div className="p-4 text-center">
                  <p className="mb-4 text-cyan-900 font-semibold">
                    Vista previa no disponible para este tipo de archivo.
                  </p>
                  <a
                    href={previewURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-cyan-700 text-white rounded hover:bg-cyan-900 transition"
                  >
                    Abrir archivo en nueva pestaña
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialesAdmin;
