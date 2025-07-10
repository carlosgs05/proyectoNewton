import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChevronLeft,
  FaChevronRight,
  FaChevronLeft as FaChevronLeftSmall,
} from "react-icons/fa";

interface Material {
  idmaterial: number;
  idtema: number;
  tipomaterial: string;
  url: string;
  nombrematerial: string;
  created_at: string;
}

interface Tema {
  idtema: number;
  idcurso: number;
  nombretema: string;
  created_at: string;
  materiales?: Material[];
}

interface Curso {
  idcurso: number;
  nombrecurso: string;
  created_at: string;
  temas: Tema[];
}

interface LocationState {
  curso?: Curso;
}

const ITEMS_PER_MATERIAL_PAGE = 9;

// Iconos para cada tipo de material
const getMaterialIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "video":
      return "🎬";
    case "pdf":
      return "📄";
    case "solucionario":
      return "📝";
    case "flashcards":
      return "🔖";
    default:
      return "📁";
  }
};

// Obtener nombre del material para mostrar
const getMaterialTypeName = (type: string) => {
  switch (type.toLowerCase()) {
    case "video":
      return "Video";
    case "pdf":
      return "PDF";
    case "solucionario":
      return "Solucionario";
    case "flashcards":
      return "Flashcards";
    default:
      return type;
  }
};

const CursoDetalle: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const curso = state?.curso;

  // Paginacion para temas
  const [currentTemaIndex, setCurrentTemaIndex] = useState(0);

  // Paginacion por tipo material por tema
  const [materialPageByTema, setMaterialPageByTema] = useState<
    Record<number, number>
  >({});

  // Tipo activo por tema para tabs
  const [activeMaterialTabByTema, setActiveMaterialTabByTema] = useState<
    Record<number, string>
  >({});

  // Materiales cargados dinámicamente
  const [temasConMateriales, setTemasConMateriales] = useState<
    Record<number, Material[]>
  >({});

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMaterial, setModalMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (!curso) return;
    // Cargar materiales para cada tema
    curso.temas.forEach((tema) => {
      axios
        .get(`http://127.0.0.1:8000/api/temas/${tema.idtema}/materiales/listar`)
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setTemasConMateriales((prev) => ({
              ...prev,
              [tema.idtema]: res.data.data,
            }));
            // Inicializar pestaña activa y paginación
            setActiveMaterialTabByTema((prev) => {
              if (prev[tema.idtema]) return { ...prev };
              const tipos = Array.from(
                new Set(res.data.data.map((m: Material) => m.tipomaterial))
              );
              return {
                ...prev,
                [tema.idtema]: tipos[0] ? String(tipos[0]) : "",
              };
            });
            setMaterialPageByTema((prev) => ({
              ...prev,
              [tema.idtema]: 1,
            }));
          }
        })
        .catch((err) => {
          console.error(
            `Error cargando materiales para tema ${tema.idtema}:`,
            err
          );
        });
    });
  }, [curso]);

  if (!curso) {
    navigate("/dashboard/contenidos");
    return null;
  }

  const totalTemas = curso.temas.length;
  const temaActual = curso.temas[currentTemaIndex];
  const materiales = temasConMateriales[temaActual?.idtema] || [];

  const tiposMaterialUnicos = Array.from(
    new Set(materiales.map((m) => m.tipomaterial))
  );

  const activeTab =
    activeMaterialTabByTema[temaActual.idtema] || tiposMaterialUnicos[0] || "";
  const currentMaterialPage = materialPageByTema[temaActual.idtema] || 1;

  // Filtrar materiales según pestaña activa y paginación
  const materialesFiltrados = materiales.filter(
    (m) => m.tipomaterial === activeTab
  );

  const totalMaterialPages = Math.ceil(
    materialesFiltrados.length / ITEMS_PER_MATERIAL_PAGE
  );
  const materialesPaginados = materialesFiltrados.slice(
    (currentMaterialPage - 1) * ITEMS_PER_MATERIAL_PAGE,
    currentMaterialPage * ITEMS_PER_MATERIAL_PAGE
  );

  const handleChangeTemaPage = (newPage: number) => {
    if (newPage < 0 || newPage >= totalTemas) return;
    setCurrentTemaIndex(newPage);
    // Reset paginacion y pestaña material para el nuevo tema
    const nuevoTema = curso.temas[newPage];
    const nuevosMateriales = temasConMateriales[nuevoTema.idtema] || [];
    const nuevosTipos = Array.from(
      new Set(nuevosMateriales.map((m) => m.tipomaterial))
    );
    setActiveMaterialTabByTema((prev) => ({
      ...prev,
      [nuevoTema.idtema]: nuevosTipos[0] || "",
    }));
    setMaterialPageByTema((prev) => ({
      ...prev,
      [nuevoTema.idtema]: 1,
    }));
  };

  const handleChangeMaterialTab = (tipo: string) => {
    setActiveMaterialTabByTema((prev) => ({
      ...prev,
      [temaActual.idtema]: tipo,
    }));
    // Reset paginacion material al cambiar pestaña
    setMaterialPageByTema((prev) => ({
      ...prev,
      [temaActual.idtema]: 1,
    }));
  };

  const handleChangeMaterialPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalMaterialPages) return;
    setMaterialPageByTema((prev) => ({
      ...prev,
      [temaActual.idtema]: newPage,
    }));
  };

  // Abrir modal con material seleccionado
  const openModal = (material: Material) => {
    setModalMaterial(material);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMaterial(null);
  };

  // Render contenido modal según tipo material
  const renderModalContent = () => {
    if (!modalMaterial) return null;
    const src = `http://127.0.0.1:8000/${modalMaterial.url}`;

    if (
      modalMaterial.tipomaterial === "PDF" ||
      modalMaterial.url.toLowerCase().endsWith(".pdf")
    ) {
      return (
        <iframe
          src={src}
          title={modalMaterial.nombrematerial}
          className="w-full h-full min-h-[40vh]"
          style={{ border: "none" }}
        />
      );
    } else if (
      modalMaterial.tipomaterial === "Video" ||
      modalMaterial.url.match(/\.(mp4|webm|ogg)$/i)
    ) {
      return (
        <video
          controls
          className="w-full h-full min-h-[40vh] max-w-full object-contain"
          style={{ display: "block" }}
        >
          <source src={src} />
          Tu navegador no soporta la reproducción de video.
        </video>
      );
    } else if (modalMaterial.url.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) {
      return (
        <div className="w-full min-h-[40vh] flex justify-center items-center">
          <img
            src={src}
            alt={modalMaterial.nombrematerial}
            className="max-w-full max-h-full object-contain"
            style={{ display: "block" }}
          />
        </div>
      );
    } else {
      return (
        <div className="p-4 text-center min-h-[40vh] flex flex-col justify-center">
          <p className="mb-4 text-cyan-900 font-semibold">
            Vista previa no disponible para este tipo de archivo.
          </p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-cyan-700 text-white rounded hover:bg-cyan-900 transition"
          >
            Abrir archivo
          </a>
        </div>
      );
    }
  };

  return (
    <>
      <div className="mx-4 md:mx-8 lg:mx-16 mt-6">
        {/* Botón volver */}
        <button
          onClick={() => navigate("/dashboard/contenido")}
          className="flex items-center text-cyan-700 hover:text-cyan-900 transition-colors mb-8 cursor-pointer select-none font-semibold"
          aria-label="Volver a Mis Cursos"
        >
          <FaChevronLeft className="mr-2 w-6 h-6" />
          Volver a Mis Cursos
        </button>

        {/* Título del Curso */}
        <h1 className="text-2xl font-extrabold text-cyan-800 text-center uppercase tracking-wider select-none">
          {curso.nombrecurso}
        </h1>

        {/* Nombre del tema */}
        <h2 className="text-xl font-semibold uppercase mt-6 mb-9 text-cyan-700 select-text">
          Semana {currentTemaIndex + 1}: {temaActual.nombretema}
        </h2>

        {/* Tabs por tipo material */}
        <nav
          aria-label="Tipos de material"
          className="mb-6 flex flex-wrap gap-4"
        >
          {tiposMaterialUnicos.length === 0 && (
            <p className="text-cyan-700 italic select-none">
              No hay materiales.
            </p>
          )}
          {tiposMaterialUnicos.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => handleChangeMaterialTab(tipo)}
              className={`px-4 py-2 rounded-2xl text-base font-medium transition-all flex items-center cursor-pointer ${
                activeTab === tipo
                  ? "bg-cyan-600 text-white shadow-md"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-current={activeTab === tipo ? "page" : undefined}
            >
              <span className="mr-1">{getMaterialIcon(tipo)}</span>
              {getMaterialTypeName(tipo)}
            </button>
          ))}
        </nav>

        {/* Grid materiales paginados en cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {materialesPaginados.map((mat) => (
            <div
              key={mat.idmaterial}
              onClick={() => openModal(mat)}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
            >
              <div
                className={`bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 flex items-center justify-center h-40`}
              >
                <div className="text-center">
                  <span className="text-5xl text-cyan-600">
                    {getMaterialIcon(mat.tipomaterial)}
                  </span>
                  <h3 className="mt-2 text-cyan-800 font-semibold">
                    {getMaterialTypeName(mat.tipomaterial)}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-gray-800 font-semibold text-lg mb-2">
                  {mat.nombrematerial}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mt-3">
                  <div className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded inline-block">
                    {curso.nombrecurso}
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                    {temaActual.nombretema}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {materialesPaginados.length === 0 && (
            <p className="text-cyan-700 italic col-span-full text-center select-none">
              No hay materiales para este tipo.
            </p>
          )}
        </div>

        {/* Paginacion para materiales */}
        {totalMaterialPages > 1 && (
          <div className="mt-8 flex flex-col items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleChangeMaterialPage(currentMaterialPage - 1)}
                disabled={currentMaterialPage === 1}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentMaterialPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                } border border-gray-300 transition-colors`}
              >
                <FaChevronLeftSmall className="w-4 h-4" />
              </button>
              {Array.from({ length: totalMaterialPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => handleChangeMaterialPage(number)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      currentMaterialPage === number
                        ? "bg-cyan-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } border border-gray-300 transition-all cursor-pointer`}
                  >
                    {number}
                  </button>
                )
              )}
              <button
                onClick={() => handleChangeMaterialPage(currentMaterialPage + 1)}
                disabled={currentMaterialPage === totalMaterialPages}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentMaterialPage === totalMaterialPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                } border border-gray-300 transition-colors`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 text-gray-600 text-sm">
              Página {currentMaterialPage} de {totalMaterialPages}
            </div>
          </div>
        )}

        {/* Indicador de tema (Semana) y paginación con tooltip */}
        <div className="flex justify-between items-center space-x-6 mb-6 select-none mt-8">
          <button
            onClick={() => handleChangeTemaPage(currentTemaIndex - 1)}
            disabled={currentTemaIndex === 0}
            className={`p-2 border border-cyan-700 text-cyan-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-50 cursor-pointer relative group`}
            aria-label="Tema anterior"
            type="button"
          >
            <FaChevronLeftSmall className="w-5 h-5" />
            {/* Tooltip */}
            {currentTemaIndex > 0 && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-cyan-700 text-white text-xs px-2 py-1 whitespace-nowrap select-none opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                Semana {currentTemaIndex}
              </span>
            )}
          </button>
          <button
            onClick={() => handleChangeTemaPage(currentTemaIndex + 1)}
            disabled={currentTemaIndex === totalTemas - 1}
            className={`p-2 border border-cyan-700 text-cyan-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-50 cursor-pointer relative group`}
            aria-label="Tema siguiente"
            type="button"
          >
            <FaChevronRight className="w-5 h-5" />
            {/* Tooltip */}
            {currentTemaIndex < totalTemas - 1 && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-cyan-700 text-white text-xs px-2 py-1 whitespace-nowrap select-none opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                Semana {currentTemaIndex + 2}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && modalMaterial && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado del modal */}
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-4xl mr-3">
                  {getMaterialIcon(modalMaterial.tipomaterial)}
                </span>
                <div>
                  <h2 className="text-2xl font-bold">
                    {getMaterialTypeName(modalMaterial.tipomaterial)}
                  </h2>
                  <p className="text-cyan-100">
                    {modalMaterial.tipomaterial.toUpperCase()} •{" "}
                    {curso.nombrecurso}
                  </p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="text-white hover:text-cyan-100 cursor-pointer"
                aria-label="Cerrar modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido del material */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex-1 flex flex-col">
                {/* Información del tema y curso */}
                <div className="mb-4">
                  <h3
                    id="modal-title"
                    className="text-xl font-semibold text-gray-800 mb-2"
                  >
                    {modalMaterial.nombrematerial}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                      {curso.nombrecurso}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {temaActual.nombretema}
                    </span>
                  </div>
                </div>

                {/* Visualización del recurso - Altura reducida */}
                <div className="h-[60vh] border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex">
                  {renderModalContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CursoDetalle;