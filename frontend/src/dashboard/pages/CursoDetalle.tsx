import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaFilePdf,
  FaClone,
  FaVideo,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChevronLeft as FaChevronLeftSmall,
} from "react-icons/fa";

interface Material {
  idmaterial: number;
  idtema: number;
  tipomaterial: string; // "PDF", "Flashcards", "Video", "Solucionario", etc.
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

const CursoDetalle: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const curso = state?.curso;

  // Paginacion para temas (solo un tema visible a la vez)
  const [currentTemaIndex, setCurrentTemaIndex] = useState(0);

  // Paginacion por tipo material por tema: map temaId -> pagina actual
  const [materialPageByTema, setMaterialPageByTema] = useState<
    Record<number, number>
  >({});

  // Tipo activo por tema para tabs: map temaId -> tipo
  const [activeMaterialTabByTema, setActiveMaterialTabByTema] = useState<
    Record<number, string>
  >({});

  // Materiales cargados dinámicamente para cada tema
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
            // Inicializar pestaña activa y paginación por tema si no existe
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
            setMaterialPageByTema((prev) => {
              if (prev[tema.idtema]) return prev;
              return { ...prev, [tema.idtema]: 1 };
            });
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

  const iconForTipo = (tipomaterial: string) => {
    const commonClasses = "w-6 h-6 text-cyan-700";
    switch (tipomaterial) {
      case "PDF":
        return <FaFilePdf className={commonClasses} />;
      case "Flashcards":
        return <FaClone className={commonClasses} />;
      case "Video":
        return <FaVideo className={commonClasses} />;
      case "Solucionario":
        return <FaFileAlt className={commonClasses} />;
      default:
        return <FaFileAlt className={commonClasses} />;
    }
  };

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
          className="w-full h-full"
          style={{ border: "none", maxHeight: "80vh" }}
        />
      );
    } else if (
      modalMaterial.tipomaterial === "Video" ||
      modalMaterial.url.match(/\.(mp4|webm|ogg)$/i)
    ) {
      return (
        <video
          controls
          className="w-full h-full max-h-[80vh] max-w-full object-contain"
          style={{ display: "block" }}
        >
          <source src={src} />
          Tu navegador no soporta la reproducción de video.
        </video>
      );
    } else if (modalMaterial.url.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) {
      return (
        <div className="w-full h-[80vh] flex justify-center items-center">
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
        <div className="p-4 text-center">
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
              className={`px-5 py-2 rounded-full font-semibold whitespace-nowrap select-none transition
              ${
                activeTab === tipo
                  ? "bg-cyan-700 text-white shadow-lg shadow-cyan-300/50"
                  : "bg-cyan-100 text-cyan-700 hover:bg-cyan-300 hover:text-cyan-900"
              } cursor-pointer`}
              aria-current={activeTab === tipo ? "page" : undefined}
            >
              {tipo}
            </button>
          ))}
        </nav>

        {/* Grid materiales paginados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {materialesPaginados.map((mat) => (
            <button
              key={mat.idmaterial}
              onClick={() => openModal(mat)}
              className="flex flex-col items-center space-y-2 bg-cyan-50 rounded-2xl p-5 hover:bg-cyan-100 transition-shadow border border-transparent hover:border-cyan-500 shadow-md cursor-pointer select-none"
              aria-label={`${mat.tipomaterial}: ${mat.nombrematerial}`}
              type="button"
            >
              <span className="text-cyan-700">
                {iconForTipo(mat.tipomaterial)}
              </span>
              <span className="font-semibold text-cyan-900 text-center truncate max-w-full">
                {mat.nombrematerial}
              </span>
            </button>
          ))}
          {materialesPaginados.length === 0 && (
            <p className="text-cyan-700 italic col-span-full text-center select-none">
              No hay materiales para este tipo.
            </p>
          )}
        </div>

        {/* Paginacion para materiales */}
        {totalMaterialPages > 1 && (
          <div className="flex justify-center items-center space-x-4 my-12 select-none">
            <button
              onClick={() => handleChangeMaterialPage(currentMaterialPage - 1)}
              disabled={currentMaterialPage === 1}
              className={`p-2 border border-cyan-700 text-cyan-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-50 cursor-pointer`}
              aria-label="Página anterior de materiales"
              type="button"
            >
              <FaChevronLeftSmall className="w-4 h-4" />
            </button>
            <span className="font-semibold text-cyan-700 text-base">
              Página {currentMaterialPage} de {totalMaterialPages}
            </span>
            <button
              onClick={() => handleChangeMaterialPage(currentMaterialPage + 1)}
              disabled={currentMaterialPage === totalMaterialPages}
              className={`p-2 border border-cyan-700 text-cyan-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-50 cursor-pointer`}
              aria-label="Página siguiente de materiales"
              type="button"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Indicador de tema (Semana) y paginación con tooltip */}
        <div className="flex justify-between items-center space-x-6 mb-6 select-none">
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] p-4 relative shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Cerrar modal"
              className="absolute top-3 right-3 text-cyan-700 hover:text-cyan-900 font-bold text-xl cursor-pointer"
              type="button"
            >
              ×
            </button>
            <h3
              id="modal-title"
              className="text-xl font-semibold text-cyan-900 mb-4 select-text"
            >
              {modalMaterial.nombrematerial}
            </h3>
            <div className="overflow-hidden flex-grow">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CursoDetalle;