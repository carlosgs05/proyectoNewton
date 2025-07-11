import React, {
  FC,
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  DragEvent,
  MouseEvent,
  FormEvent,
  RefObject,
} from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
} from "react-icons/fa";
import { FiTrash, FiUploadCloud, FiX } from "react-icons/fi";
import Swal from "sweetalert2/dist/sweetalert2.all.js";
import Select from "react-select";

interface Simulacro {
  idsimulacro: number;
  created_at: string;
  nombresimulacro: string;
  pdfexamen: string;
  pdfrespuestas: string;
  pdfsolucionario: string;
}

interface SimulacroOption {
  value: number;
  label: string;
}

interface Estudiante {
  idusuario: number;
  nombre: string;
  apellido: string;
  correo?: string;
  puntajetotal: string;
  pdfhojarespuesta: string;
  codigomatricula?: string;
}

interface EstudianteOption {
  value: number;
  label: string;
  codigomatricula?: string;
  nombreCompleto?: string;
}

const ITEMS_PER_PAGE = 5;

const customSelectStyles = {
  control: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    borderColor: "#0088a9",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#006b7d",
    },
    cursor: "pointer",
    fontSize: "1rem",
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    zIndex: 1000,
    maxHeight: 200,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#e0f7fa" : "white",
    color: state.isFocused ? "#0088a9" : "#333",
    cursor: "pointer",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#0088a9",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#004d59",
  }),
};

// Icono PDF moderno estilo Samsung One UI
const PDFIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 12h1" />
    <path d="M8 16h1" />
    <path d="M12 12h1" />
    <path d="M16 16h1" />
    <path d="M10 12v4" />
  </svg>
);

// Icono Excel moderno estilo Samsung One UI
const ExcelIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
    <path d="M16 9h-3" />
  </svg>
);

const Simulacros: FC = () => {
  const { hasPermission } = useAuth();

  // Tabs: "gestión" o "calificación"
  const [activeTab, setActiveTab] = useState<"gestión" | "calificación">(
    "gestión"
  );

  // Estados para lista y paginación simulacros (pestaña gestión)
  const [simulacros, setSimulacros] = useState<Simulacro[]>([]);
  const [page, setPage] = useState<number>(1);

  // Modal de crear simulacro
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Campos del formulario (gestión)
  const [fecha, setFecha] = useState<string>("");

  const [archivoExamen, setArchivoExamen] = useState<File | null>(null);
  const [archivoHoja, setArchivoHoja] = useState<File | null>(null);
  const [archivoSolucionario, setArchivoSolucionario] = useState<File | null>(
    null
  );

  // Refs para inputs de archivo (gestión)
  const inputExamenRef = useRef<HTMLInputElement>(
    null
  ) as RefObject<HTMLInputElement>;
  const inputHojaRef = useRef<HTMLInputElement>(
    null
  ) as RefObject<HTMLInputElement>;
  const inputSolucionarioRef = useRef<HTMLInputElement>(
    null
  ) as RefObject<HTMLInputElement>;

  const [saving, setSaving] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Modal de vista previa de archivo (para PDFs/Excel - pestaña gestión)
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewFileType, setPreviewFileType] = useState<
    "pdf" | "excel" | null
  >(null);

  // Modal para vista previa imagen hoja respuesta (pestaña calificación)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [previewImageOpen, setPreviewImageOpen] = useState<boolean>(false);

  // Estados para asignar calificación
  const [simulacrosOptions, setSimulacrosOptions] = useState<SimulacroOption[]>(
    []
  );
  const [selectedSimulacro, setSelectedSimulacro] =
    useState<SimulacroOption | null>(null);

  // Estudiantes que rindieron el simulacro seleccionado
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  // Paginación para estudiantes en pestaña calificación
  const [pageEstudiantes, setPageEstudiantes] = useState<number>(1);

  const [loadingEstudiantes, setLoadingEstudiantes] = useState<boolean>(false);
  const [errorEstudiantes, setErrorEstudiantes] = useState<string>("");

  // Modal para asignar calificación (nuevo)
  const [modalAsignarCalificacionOpen, setModalAsignarCalificacionOpen] =
    useState(false);
  const [usuariosEstudiantesOptions, setUsuariosEstudiantesOptions] = useState<
    EstudianteOption[]
  >([]);
  const [selectedEstudiante, setSelectedEstudiante] =
    useState<EstudianteOption | null>(null);
  const [archivoImagenCalificacion, setArchivoImagenCalificacion] =
    useState<File | null>(null);
  const [previewCalificacionUrl, setPreviewCalificacionUrl] = useState<string>("");
  const [savingCalificacion, setSavingCalificacion] = useState<boolean>(false);
  const [uploadProgressCalificacion, setUploadProgressCalificacion] = useState<number | null>(null);

  // Ref para input de archivo de calificación
  const archivoInputCalificacionRef = useRef<HTMLInputElement>(null);

  // Al montar, cargar simulacros si tiene permiso 1
  useEffect(() => {
    if (hasPermission(1)) {
      fetchSimulacros();
      fetchSimulacrosOptions();
    }
  }, [hasPermission]);

  // Obtener simulacros para la tabla (pestaña gestión)
  const fetchSimulacros = () => {
    axios
      .get("http://127.0.0.1:8000/api/simulacros/listar", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })
      .then((res) => {
        if (res.data.success) {
          setSimulacros(res.data.data);
        }
      })
      .catch((err) => {
        console.error("Error al cargar simulacros:", err);
      });
  };

  // Obtener simulacros para el select (endpoint solicitado)
  const fetchSimulacrosOptions = () => {
    axios
      .get("http://127.0.0.1:8000/api/simulacros/realizados", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      })
      .then((res) => {
        if (res.data.success) {
          const opts = res.data.data.map((s: Simulacro) => ({
            value: s.idsimulacro,
            label: s.nombresimulacro,
          }));
          setSimulacrosOptions(opts);
        }
      })
      .catch((err) => {
        console.error("Error al cargar opciones de simulacros:", err);
      });
  };

  // Cargar estudiantes (para modal asignar calificación)
  const fetchUsuariosEstudiantesOptions = async () => {
    try {
      const response = await axios.get(
        "http://proyectonewton-production.up.railway.app/api/usuarios/estudiantes",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        }
      );
      if (response.data.success) {
        const opts = response.data.data.map((u: any) => ({
          value: u.idusuario,
          label: u.codigomatricula || `Código no disponible`, // Mostrar código matrícula aquí
          codigomatricula: u.codigomatricula,
          nombreCompleto: `${u.nombre} ${u.apellido}`,
        }));
        setUsuariosEstudiantesOptions(opts);
      }
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    }
  };

  // Paginación para tabla simulacros
  const totalPages = Math.ceil(simulacros.length / ITEMS_PER_PAGE);
  const paginated = simulacros.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Paginación para tabla estudiantes (pestaña calificación)
  const totalPagesEstudiantes = Math.ceil(estudiantes.length / ITEMS_PER_PAGE);
  const paginatedEstudiantes = estudiantes.slice(
    (pageEstudiantes - 1) * ITEMS_PER_PAGE,
    pageEstudiantes * ITEMS_PER_PAGE
  );

  // Abrir modal de crear simulacro
  const openModal = () => {
    setFecha("");
    setArchivoExamen(null);
    setArchivoHoja(null);
    setArchivoSolucionario(null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  // Abrir/Cerrar preview archivo (pestaña gestión)
  const openPreview = (fileUrl: string) => {
    const extension = fileUrl.split(".").pop()?.toLowerCase() || "";
    if (extension === "pdf") {
      setPreviewFileType("pdf");
      setPreviewUrl(fileUrl);
      setPreviewOpen(true);
    } else if (extension === "xlsx") {
      setPreviewFileType("excel");
      setPreviewUrl(fileUrl);
      setPreviewOpen(true);
    } else {
      Swal.fire(
        "Vista previa no soportada",
        "Solo se soporta vista previa para archivos PDF y Excel (.xlsx).",
        "info"
      );
    }
  };
  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewFileType(null);
  };

  // Abrir preview imagen hoja respuesta (pestaña calificación)
  // Aquí cambiamos para que modal sea independiente de pestañas y se muestre de inmediato
  const openPreviewImage = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageOpen(true);
  };
  const closePreviewImage = () => {
    setPreviewImageOpen(false);
    setPreviewImageUrl("");
  };

  // Manejo de arrastrar/soltar
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setter(files[0]);
    }
  };

  // Abrir selector de archivos oculto
  const openFileSelector = (inputRef: RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  // Cambiar archivo por selector
  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setter(files[0]);
    }
  };

  // Limpiar selección de archivo
  const clearFile = (
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    setter(null);
  };

  // Enviar formulario gestión simulacro
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fecha || !archivoExamen || !archivoHoja || !archivoSolucionario) {
      Swal.fire(
        "Error",
        "Ingrese fecha y los tres archivos requeridos.",
        "warning"
      );
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    const formData = new FormData();

    const nombreSimulacroGenerado = `SIMULACRO AREA B ${fecha}`;

    formData.append("nombresimulacro", nombreSimulacroGenerado);
    formData.append("fecha", fecha);
    formData.append("pdfexamen", archivoExamen);
    formData.append("pdfrespuestas", archivoHoja);
    formData.append("pdfsolucionario", archivoSolucionario);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/simulacros/registrar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          },
        }
      );
      if (res.data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          Swal.fire("Éxito", "Simulacro registrado correctamente.", "success");
          fetchSimulacros();
          fetchSimulacrosOptions();
          closeModal();
          setUploadProgress(null);
        }, 500);
      } else {
        setSaving(false);
        setUploadProgress(null);
      }
    } catch (error: any) {
      console.error("Error al registrar simulacro:", error);
      if (
        error.response &&
        error.response.status === 422 &&
        error.response.data.message
      ) {
        Swal.fire("Error", error.response.data.message, "error");
      } else {
        Swal.fire(
          "Error",
          error?.response?.data?.message || "Ocurrió un problema al registrar.",
          "error"
        );
      }
      setSaving(false);
      setUploadProgress(null);
    }
  };

  // Cargar estudiantes cuando se seleccione un simulacro
  useEffect(() => {
    if (selectedSimulacro) {
      fetchEstudiantes(selectedSimulacro.value);
      setPageEstudiantes(1); // reset paginación estudiantes
    } else {
      setEstudiantes([]);
      setErrorEstudiantes("");
      setPageEstudiantes(1);
    }
  }, [selectedSimulacro]);

  const fetchEstudiantes = async (idsimulacro: number) => {
    setLoadingEstudiantes(true);
    setErrorEstudiantes("");
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/simulacros/${idsimulacro}/estudiantes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        }
      );
      if (response.data.success) {
        setEstudiantes(response.data.data);
      } else {
        setEstudiantes([]);
        setErrorEstudiantes(
          response.data.message || "No se encontraron estudiantes."
        );
      }
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
      setErrorEstudiantes("Error al cargar la lista de estudiantes");
      setEstudiantes([]);
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  // Abrir modal asignar calificación
  const openModalAsignarCalificacion = () => {
    if (!selectedSimulacro) {
      Swal.fire("Error", "Debe seleccionar un simulacro primero.", "warning");
      return;
    }
    setSelectedEstudiante(null);
    setArchivoImagenCalificacion(null);
    setPreviewCalificacionUrl("");
    setModalAsignarCalificacionOpen(true);
    fetchUsuariosEstudiantesOptions();
  };

  // Cerrar modal asignar calificación
  const closeModalAsignarCalificacion = () => {
    setModalAsignarCalificacionOpen(false);
    setSelectedEstudiante(null);
    setArchivoImagenCalificacion(null);
    setPreviewCalificacionUrl("");
    setSavingCalificacion(false);
    setUploadProgressCalificacion(null);
  };

  // Manejo archivo imagen calificación - drag and drop, input change, clear
  const handleFileChangeCalificacion = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setArchivoImagenCalificacion(file);
      setPreviewCalificacionUrl(URL.createObjectURL(file));
    }
  };

  const handleDropCalificacion = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setArchivoImagenCalificacion(file);
      setPreviewCalificacionUrl(URL.createObjectURL(file));
    }
  };

  const clearFileCalificacion = () => {
    setArchivoImagenCalificacion(null);
    setPreviewCalificacionUrl("");
  };

  // Enviar formulario asignar calificación
  const handleSubmitCalificacion = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedSimulacro || !selectedEstudiante || !archivoImagenCalificacion) {
      Swal.fire(
        "Error",
        "Seleccione simulacro, estudiante y archivo de imagen.",
        "warning"
      );
      return;
    }

    setSavingCalificacion(true);
    setUploadProgressCalificacion(0);

    try {
      const formData = new FormData();
      formData.append("idsimulacro", String(selectedSimulacro.value));
      formData.append("idusuario", String(selectedEstudiante.value));
      formData.append("pdfhojarespuesta", archivoImagenCalificacion);

      const response = await axios.post(
        "http://proyectonewton-production.up.railway.app/api/registrar-simulacro-estudiante",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgressCalificacion(percentCompleted);
          },
        }
      );

      if (response.data.success) {
        setUploadProgressCalificacion(100);
        setTimeout(() => {
          Swal.fire("Éxito", "Simulacro estudiante registrado correctamente.", "success");
          fetchEstudiantes(selectedSimulacro.value);
          closeModalAsignarCalificacion();
          setUploadProgressCalificacion(null);
        }, 500);
      } else {
        setSavingCalificacion(false);
        setUploadProgressCalificacion(null);
      }
    } catch (error: any) {
      console.error("Error al registrar simulacro estudiante:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Ocurrió un error al registrar.",
        "error"
      );
      setSavingCalificacion(false);
      setUploadProgressCalificacion(null);
    }
  };

  // Si no tiene permiso 1, no renderizar nada
  if (!hasPermission(1)) {
    return null;
  }

  // Clases de estilo reutilizables
  const sectionTitleClasses =
    "text-2xl font-extrabold mb-6 text-cyan-700 text-center uppercase";
  const buttonPrimaryClasses =
    "flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md cursor-pointer";
  const tableContainerClasses =
    "overflow-x-auto rounded-xl border border-gray-200 shadow-md";
  const tableHeaderClasses =
    "px-6 py-4 text-left text-sm font-semibold text-white uppercase";
  const tableRowClasses = "hover:bg-gray-100";
  const paginationButtonClasses =
    "p-2.5 border border-cyan-700 text-cyan-700 hover:bg-cyan-50 rounded-lg disabled:opacity-50";
  const inputClasses =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500";
  const labelClasses = "block text-gray-700 font-medium mb-2";

  // Función para renderizar opción del Select en modal asignar calificación
  // Dos columnas: código matrícula (izq) y nombre completo (der)
  const formatOptionLabel = (option: EstudianteOption) => (
    <div className="flex justify-between w-full">
      <div className="font-mono text-sm text-cyan-800">{option.codigomatricula || option.label}</div>
      <div className="text-gray-700 ml-4 truncate">{option.nombreCompleto || ""}</div>
    </div>
  );

  // Mostrar código matrícula y nombre completo del estudiante seleccionado (debajo del Select en modal)
  const renderSelectedEstudianteInfo = () => {
    if (!selectedEstudiante) return null;
    return (
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm font-medium text-gray-800">
        <div>
          <label className="block mb-1 text-gray-600">Código Matrícula</label>
          <div className="font-mono text-cyan-700">{selectedEstudiante.codigomatricula || selectedEstudiante.label}</div>
        </div>
        <div>
          <label className="block mb-1 text-gray-600">Nombre Completo</label>
          <div>{selectedEstudiante.nombreCompleto || ""}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
      <h1 className={sectionTitleClasses}>Gestión de Simulacros</h1>

      {/* Pestañas con diseño tipo Usuarios.tsx */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8 justify-start">
          {(["gestión", "calificación"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 text-sm font-medium uppercase tracking-wider cursor-pointer ${
                activeTab === tab
                  ? "border-b-2 border-cyan-700 text-cyan-700"
                  : "text-gray-500 hover:text-cyan-700 border-b-2 border-transparent"
              }`}
            >
              {tab === "gestión" ? "Listar / Registrar" : "Asignar Calificación"}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la pestaña "Listar / Registrar" */}
      {activeTab === "gestión" && (
        <>
          {/* Botón para abrir modal */}
          <div className="flex justify-end mb-6">
            <button onClick={openModal} className={buttonPrimaryClasses}>
              <FaPlus className="mr-2 text-sm" /> Registrar Simulacro
            </button>
          </div>

          {/* Tabla de simulacros */}
          <div className={tableContainerClasses}>
            <table className="min-w-full bg-white">
              <thead className="bg-gray-600">
                <tr>
                  <th className={tableHeaderClasses}>Nombre</th>
                  <th className={tableHeaderClasses}>Fecha</th>
                  <th className={tableHeaderClasses}>Examen</th>
                  <th className={tableHeaderClasses}>Hoja Respuestas</th>
                  <th className={tableHeaderClasses}>Solucionario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((sim) => (
                  <tr key={sim.idsimulacro} className={tableRowClasses}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sim.nombresimulacro}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {new Date(sim.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          openPreview(
                            `http://127.0.0.1:8000${
                              sim.pdfexamen.startsWith("/") ? "" : "/"
                            }${sim.pdfexamen}`
                          )
                        }
                        className="p-2 rounded-full bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors duration-200 cursor-pointer"
                        title="Ver examen"
                      >
                        <PDFIcon className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          openPreview(
                            `http://127.0.0.1:8000${
                              sim.pdfrespuestas.startsWith("/") ? "" : "/"
                            }${sim.pdfrespuestas}`
                          )
                        }
                        className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors duration-200 cursor-pointer"
                        title="Ver hoja de respuestas"
                      >
                        <ExcelIcon className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          openPreview(
                            `http://127.0.0.1:8000${
                              sim.pdfsolucionario.startsWith("/") ? "" : "/"
                            }${sim.pdfsolucionario}`
                          )
                        }
                        className="p-2 rounded-full bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors duration-200 cursor-pointer"
                        title="Ver solucionario"
                      >
                        <PDFIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-gray-500 italic"
                    >
                      No hay simulacros registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación simulacros */}
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-gray-600">
              Mostrando {paginated.length} de {simulacros.length} simulacros
            </span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`${paginationButtonClasses} ${
                  page === 1 ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-cyan-700">
                Página {page} de {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || totalPages === 0}
                className={`${paginationButtonClasses} ${
                  page === totalPages || totalPages === 0
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal de registro de simulacro */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-7xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-cyan-800 bg-cyan-700 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    Registrar Simulacro
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 cursor-pointer"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    {/* Fila dividida en 3 columnas: Nombre (span 2) y Fecha (span 1) */}
                    <div className="mb-6 grid grid-cols-3 gap-4">
                      {/* Columna Nombre (span 2) */}
                      <div className="col-span-2">
                        <label htmlFor="nombre" className={labelClasses}>
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="nombre"
                          value={`SIMULACRO AREA B${fecha ? ` ${fecha}` : ""}`}
                          disabled
                          className={
                            inputClasses + " bg-gray-100 cursor-not-allowed"
                          }
                        />
                      </div>
                      {/* Columna Fecha (span 1) */}
                      <div>
                        <label htmlFor="fecha" className={labelClasses}>
                          Fecha del Simulacro
                        </label>
                        <input
                          type="date"
                          id="fecha"
                          value={fecha}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFecha(e.target.value)
                          }
                          className={inputClasses}
                          required
                        />
                      </div>
                    </div>

                    {/* Archivos PDF en 3 columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* PDF Examen */}
                      <div>
                        <label className={labelClasses}>Archivo Examen</label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition"
                          onClick={() => openFileSelector(inputExamenRef)}
                          onDrop={(e: DragEvent<HTMLDivElement>) =>
                            handleDrop(e, setArchivoExamen)
                          }
                          onDragOver={(e: DragEvent<HTMLDivElement>) =>
                            handleDragOver(e)
                          }
                        >
                          {archivoExamen ? (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                {archivoExamen.name}
                              </span>
                              <FiTrash
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                size={20}
                                onClick={(e: MouseEvent<SVGElement>) => {
                                  e.stopPropagation();
                                  clearFile(setArchivoExamen);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500">
                              <FiUploadCloud size={32} className="mb-2" />
                              <span>
                                Arrastra aquí o haz click para seleccionar
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="*"
                            ref={inputExamenRef}
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleFileChange(e, setArchivoExamen)
                            }
                          />
                        </div>
                      </div>

                      {/* PDF Hoja de Respuestas */}
                      <div>
                        <label className={labelClasses}>
                          Archivo Hoja de Respuestas
                        </label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition"
                          onClick={() => openFileSelector(inputHojaRef)}
                          onDrop={(e: DragEvent<HTMLDivElement>) =>
                            handleDrop(e, setArchivoHoja)
                          }
                          onDragOver={(e: DragEvent<HTMLDivElement>) =>
                            handleDragOver(e)
                          }
                        >
                          {archivoHoja ? (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                {archivoHoja.name}
                              </span>
                              <FiTrash
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                size={20}
                                onClick={(e: MouseEvent<SVGElement>) => {
                                  e.stopPropagation();
                                  clearFile(setArchivoHoja);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500">
                              <FiUploadCloud size={32} className="mb-2" />
                              <span>
                                Arrastra aquí o haz click para seleccionar
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="*"
                            ref={inputHojaRef}
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleFileChange(e, setArchivoHoja)
                            }
                          />
                        </div>
                      </div>

                      {/* PDF Solucionario */}
                      <div>
                        <label className={labelClasses}>Archivo Solucionario</label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition"
                          onClick={() => openFileSelector(inputSolucionarioRef)}
                          onDrop={(e: DragEvent<HTMLDivElement>) =>
                            handleDrop(e, setArchivoSolucionario)
                          }
                          onDragOver={(e: DragEvent<HTMLDivElement>) =>
                            handleDragOver(e)
                          }
                        >
                          {archivoSolucionario ? (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                {archivoSolucionario.name}
                              </span>
                              <FiTrash
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                size={20}
                                onClick={(e: MouseEvent<SVGElement>) => {
                                  e.stopPropagation();
                                  clearFile(setArchivoSolucionario);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500">
                              <FiUploadCloud size={32} className="mb-2" />
                              <span>
                                Arrastra aquí o haz click para seleccionar
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="*"
                            ref={inputSolucionarioRef}
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleFileChange(e, setArchivoSolucionario)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* BOTONES CANCELAR Y REGISTRAR */}
                    <div className="flex justify-center mt-6 space-x-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={saving}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {saving && <FaSpinner className="animate-spin" />}
                        {saving ? " Registrando..." : " Registrar"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal de previsualización (PDF y Excel) */}
          {previewOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-7xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-cyan-800 bg-cyan-700 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Vista Previa</h3>
                  <button
                    onClick={closePreview}
                    className="text-white hover:text-gray-200 cursor-pointer"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <div className="p-6">
                  {previewFileType === "pdf" && (
                    <iframe
                      src={previewUrl}
                      title="Vista Previa PDF"
                      className="w-full h-[600px] border"
                    />
                  )}
                  {previewFileType === "excel" && (
                    <div className="text-center">
                      <p className="mb-4 text-gray-700">
                        No se puede mostrar vista previa de archivos Excel.
                        Puede descargarlo aquí:
                      </p>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 cursor-pointer"
                        download
                      >
                        Descargar Excel
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contenido de la pestaña "Asignar Calificación" */}
      {activeTab === "calificación" && (
        <>
          <div className="max-w-6xl mx-auto mb-6 flex items-end space-x-4">
            <div className="flex-1">
              <label
                htmlFor="simulacroSelect"
                className="block mb-3 text-gray-700 font-semibold text-base"
              >
                Simulacro
              </label>
              <Select
                options={simulacrosOptions}
                value={selectedSimulacro}
                onChange={(option: SimulacroOption | null) =>
                  setSelectedSimulacro(option)
                }
                placeholder="Seleccione un simulacro"
                styles={customSelectStyles}
                isClearable
                isSearchable
                noOptionsMessage={() => "No hay simulacros disponibles"}
                className="cursor-pointer"
                menuPlacement="auto"
                menuShouldScrollIntoView={true}
                maxMenuHeight={200}
              />
            </div>
            <button
              disabled={!selectedSimulacro}
              onClick={openModalAsignarCalificacion}
              className={`px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg shadow-md disabled:opacity-50 ${
                !selectedSimulacro ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              Asignar Calificación
            </button>
          </div>

          <div className={tableContainerClasses}>
            <table className="min-w-full bg-white">
              <thead className="bg-gray-600">
                <tr>
                  <th className={tableHeaderClasses}>ID</th>
                  <th className={tableHeaderClasses}>Nombre</th>
                  <th className={tableHeaderClasses}>Apellido</th>
                  <th className={tableHeaderClasses}>Correo</th>
                  <th className={tableHeaderClasses}>Puntaje Total</th>
                  <th className={tableHeaderClasses}>Hoja de Respuesta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loadingEstudiantes ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <FaSpinner
                        className="animate-spin mx-auto text-cyan-700"
                        size={24}
                      />
                    </td>
                  </tr>
                ) : errorEstudiantes ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-red-600"
                    >
                      {errorEstudiantes}
                    </td>
                  </tr>
                ) : paginatedEstudiantes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500 italic"
                    >
                      Seleccione un simulacro para ver la lista de estudiantes
                    </td>
                  </tr>
                ) : (
                  paginatedEstudiantes.map((est) => (
                    <tr key={est.idusuario} className={tableRowClasses}>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {est.idusuario}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {est.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {est.apellido}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {est.correo || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-cyan-700 font-semibold">
                        {Number(est.puntajetotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            openPreviewImage(
                              `http://proyectonewton-production.up.railway.app/${
                                est.pdfhojarespuesta.startsWith("/")
                                  ? est.pdfhojarespuesta.slice(1)
                                  : est.pdfhojarespuesta
                              }`
                            )
                          }
                          className="p-2 rounded-full bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors duration-200 cursor-pointer"
                          title="Ver hoja de respuesta"
                        >
                          <PDFIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación estudiantes */}
          <div className="flex justify-between items-center mt-6 max-w-6xl mx-auto">
            <span className="text-sm text-gray-600">
              Mostrando {paginatedEstudiantes.length} de {estudiantes.length}{" "}
              estudiantes
            </span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPageEstudiantes((p) => Math.max(p - 1, 1))}
                disabled={pageEstudiantes === 1}
                className={`${paginationButtonClasses} ${
                  pageEstudiantes === 1 ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-cyan-700">
                Página {pageEstudiantes} de {totalPagesEstudiantes || 1}
              </span>
              <button
                onClick={() =>
                  setPageEstudiantes((p) => Math.min(p + 1, totalPagesEstudiantes))
                }
                disabled={pageEstudiantes === totalPagesEstudiantes || totalPagesEstudiantes === 0}
                className={`${paginationButtonClasses} ${
                  pageEstudiantes === totalPagesEstudiantes || totalPagesEstudiantes === 0
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Asignar Calificación */}
      {modalAsignarCalificacionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-6 border border-cyan-100 shadow-2xl">
            <div className="flex justify-center items-center relative">
              <h2 className="text-xl font-bold text-cyan-800 uppercase text-center">
                Asignar Calificación
              </h2>
              <button
                onClick={closeModalAsignarCalificacion}
                className="text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer absolute right-0"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitCalificacion} className="space-y-5 h-full">
              <div>
                <label
                  htmlFor="estudianteSelect"
                  className="block mb-2 text-gray-700 font-semibold"
                >
                  Estudiante (Código Matrícula)
                </label>
                <Select
                  options={usuariosEstudiantesOptions}
                  value={selectedEstudiante}
                  onChange={(option: EstudianteOption | null) =>
                    setSelectedEstudiante(option)
                  }
                  placeholder="Seleccione un estudiante"
                  styles={customSelectStyles}
                  isClearable
                  isSearchable
                  noOptionsMessage={() => "No hay estudiantes disponibles"}
                  className="cursor-pointer"
                  menuPlacement="auto"
                  menuShouldScrollIntoView={true}
                  maxMenuHeight={200}
                  id="estudianteSelect"
                  formatOptionLabel={formatOptionLabel}
                />
                {renderSelectedEstudianteInfo()}
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-semibold">
                  Imagen Hoja de Respuestas
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-[400px] text-center flex items-center justify-center cursor-pointer hover:border-indigo-500 transition relative"
                  onClick={() => {
                    if (archivoInputCalificacionRef.current) {
                      archivoInputCalificacionRef.current.click();
                    }
                  }}
                  onDrop={handleDropCalificacion}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {previewCalificacionUrl ? (
                    <>
                      <button
                        type="button"
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFileCalificacion();
                        }}
                        title="Eliminar imagen"
                      >
                        <FiTrash size={18} />
                      </button>
                      <img
                        src={previewCalificacionUrl}
                        alt="Previsualización"
                        className="object-fit w-full h-full rounded-lg"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <FiUploadCloud size={32} className="mb-2" />
                      <span>Arrastra aquí o haz click para seleccionar</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={archivoInputCalificacionRef}
                    className="hidden"
                    onChange={handleFileChangeCalificacion}
                  />
                </div>
              </div>

              <div className="flex justify-center space-x-4 pt-6 border-t border-cyan-100">
                <button
                  type="button"
                  onClick={closeModalAsignarCalificacion}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                  disabled={savingCalificacion}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCalificacion}
                  className={`px-6 py-2.5 flex items-center justify-center bg-cyan-800 hover:bg-cyan-700 text-white rounded-lg shadow-md transition-colors cursor-pointer ${
                    savingCalificacion ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {savingCalificacion && (
                    <FaSpinner className="animate-spin mr-2 w-4 h-4" />
                  )}
                  {savingCalificacion ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de previsualización imagen hoja respuesta (independiente de pestañas) */}
      {previewImageOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full shadow-xl overflow-hidden">
            <div className="p-6 border-b border-cyan-800 bg-cyan-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Hoja de Respuesta</h3>
              <button
                onClick={closePreviewImage}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 flex justify-center">
              <img
                src={previewImageUrl}
                alt="Hoja de Respuesta"
                className="max-h-[600px] w-auto object-contain border"
              />
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso para registro de simulacro */}
      {uploadProgress !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Registrando Simulacro...
              </h2>
            </div>
            <div className="w-full bg-gray-200 rounded-full overflow-hidden h-4">
              <div
                className="bg-cyan-700 h-4 transition-width duration-200"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-base text-gray-600">
              {uploadProgress}% completado
            </p>
          </div>
        </div>
      )}

      {/* Barra de progreso para asignar calificación */}
      {uploadProgressCalificacion !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Asignando Calificación...
              </h2>
            </div>
            <div className="w-full bg-gray-200 rounded-full overflow-hidden h-4">
              <div
                className="bg-cyan-700 h-4 transition-width duration-200"
                style={{ width: `${uploadProgressCalificacion}%` }}
              ></div>
            </div>
            <p className="text-center text-base text-gray-600">
              {uploadProgressCalificacion}% completado
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulacros;