import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";

type Material = {
  idmaterial: number;
  tipo: string;
  nombrematerial: string | null; // Añadido nombrematerial
  url: string;
};
type TemaAPI = {
  idtema: number;
  nombretema: string;
  materiales_exclusivos: Material[];
};
type CursoAPI = {
  idcurso: number;
  nombrecurso: string;
  temas: TemaAPI[];
};
type ApiResponse = {
  success: boolean;
  data?: {
    cursos: CursoAPI[];
  };
  message?: string;
};

// Iconos para cada tipo de material
const getMaterialIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "video":
      return "🎬";
    case "pdf":
      return "📄";
    case "solucionario":
      return "📝";
    case "flashcard":
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
    case "flashcard":
      return "Flashcards";
    default:
      return "Material";
  }
};

const MaterialPriorizado = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );
  const [cursos, setCursos] = useState<CursoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodologyError, setMethodologyError] = useState(false);

  // Estado para controlar los tipos de materiales visibles
  const [visibleMaterialTypes, setVisibleMaterialTypes] = useState<string[]>([
    "video",
    "pdf",
    "solucionario",
    "flashcard",
  ]);

  // Estado para el material seleccionado (para el modal)
  const [selectedItem, setSelectedItem] = useState<{
    material: Material;
    cursoId: number;
    temaId: number;
    cursoNombre: string;
    temaNombre: string;
  } | null>(null);

  // Estado para el filtro de curso
  const [filteredCourse, setFilteredCourse] = useState<number | null>(null);

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 items por página

  // Nombres de los meses
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  // Cambiar mes (para el selector)
  const changeMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
    setCurrentPage(1); // Resetear a primera página al cambiar mes
  };

  // Alternar visibilidad de tipo de material
  const toggleMaterialType = (type: string) => {
    if (visibleMaterialTypes.includes(type)) {
      setVisibleMaterialTypes(visibleMaterialTypes.filter((t) => t !== type));
    } else {
      setVisibleMaterialTypes([...visibleMaterialTypes, type]);
    }
    setCurrentPage(1); // Resetear a primera página al cambiar filtros
  };

  // Obtener materiales de la API
  useEffect(() => {
    const fetchMateriales = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);
      setMethodologyError(false);

      try {
        const response = await axios.get<ApiResponse>(
          `http://127.0.0.1:8000/api/obtener-materiales-exclusivos/${user.idusuario}/${currentMonth}/${currentYear}`
        );

        if (response.data.success && response.data.data) {
          setCursos(response.data.data.cursos);
          setMethodologyError(false);
        } else {
          // Manejo específico para error de metodología no encontrada
          if (response.data.message?.includes("No se encontró metodología")) {
            setMethodologyError(true);
            setCursos([]);
          } else {
            setError("No se pudieron cargar los materiales exclusivos");
          }
        }
      } catch (err) {
        // Manejar errores de conexión
        setError("Error al conectar con el servidor");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMateriales();
  }, [user, currentMonth, currentYear]);

  // Función para obtener todos los materiales visibles
  const getAllVisibleMaterials = () => {
    const allMaterials: {
      material: Material;
      cursoId: number;
      temaId: number;
      cursoNombre: string;
      temaNombre: string;
    }[] = [];

    cursos.forEach((curso) => {
      if (filteredCourse && curso.idcurso !== filteredCourse) return;

      curso.temas.forEach((tema) => {
        tema.materiales_exclusivos.forEach((material) => {
          const tipo = material.tipo.toLowerCase();
          if (visibleMaterialTypes.includes(tipo)) {
            allMaterials.push({
              material,
              cursoId: curso.idcurso,
              temaId: tema.idtema,
              cursoNombre: curso.nombrecurso,
              temaNombre: tema.nombretema,
            });
          }
        });
      });
    });

    return allMaterials;
  };

  // Calcular materiales paginados
  const allVisibleMaterials = getAllVisibleMaterials();
  const totalItems = allVisibleMaterials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allVisibleMaterials.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Cambiar página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Efecto para manejar el scroll al abrir el modal
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedItem]);

  // Resetear página cuando cambia el filtro de curso
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCourse]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">
            Cargando materiales exclusivos...
          </p>
        </div>
      </div>
    );
  }

  // Solo mostrar pantalla completa de error para errores de conexión
  if (error && !methodologyError) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-800 text-xl font-medium">{error}</p>
          <p className="text-gray-600 mt-2">
            Por favor, intenta nuevamente más tarde
          </p>
        </div>
      </div>
    );
  }

  // Preparar opciones para el select de cursos
  const courseOptions = [
    { value: null, label: "Todos los cursos" },
    ...cursos.map((curso) => ({
      value: curso.idcurso,
      label: curso.nombrecurso,
    })),
  ];

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Encabezado */}
      <header className="text-center">
        <h1 className="text-2xl font-extrabold mb-4 text-cyan-700 text-center uppercase tracking-wide">
          Materiales Recomendados
        </h1>
      </header>

      {/* Selector de mes y año */}
      <div className="flex justify-center my-2">
        <div className="p-4 flex items-center gap-4">
          <button
            onClick={() => changeMonth("prev")}
            className="p-2 bg-cyan-100 rounded-full hover:bg-cyan-200 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-black"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-cyan-700 text-lg font-semibold">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
          </div>

          <button
            onClick={() => changeMonth("next")}
            className="p-2 bg-cyan-100 rounded-full hover:bg-cyan-200 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-black"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="mb-8 px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filtros de tipos de materiales */}
          <div>
            <h2 className="text-base font-medium text-gray-600 mb-4">
              TIPOS DE MATERIALES
            </h2>
            <div className="flex flex-wrap gap-3">
              {["video", "pdf", "solucionario", "flashcard"].map((type) => (
                <button
                  key={type}
                  onClick={() => toggleMaterialType(type)}
                  className={`px-4 py-2 rounded-2xl text-base font-medium transition-all flex items-center cursor-pointer ${
                    visibleMaterialTypes.includes(type)
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-1">{getMaterialIcon(type)}</span>
                  {getMaterialTypeName(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por curso con React Select */}
          <div className="min-w-[350px]">
            <h2 className="text-base font-medium text-gray-600 mb-4">
              FILTRAR POR CURSO
            </h2>
            <Select
              options={courseOptions}
              value={courseOptions.find(
                (option) => option.value === filteredCourse
              )}
              onChange={(selectedOption) =>
                setFilteredCourse(selectedOption?.value || null)
              }
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Seleccionar curso"
              isSearchable
              menuPlacement="auto"
              maxMenuHeight={200}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "42px",
                  cursor: "pointer",
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 100,
                }),
              }}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de metodología no encontrada */}
      {methodologyError && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Metodología no asignada
          </h3>
          <p className="text-yellow-700">
            No se ha configurado una metodología de aprendizaje para{" "}
            <span className="font-semibold">
              {monthNames[currentMonth - 1]} de {currentYear}
            </span>
          </p>
          <p className="text-yellow-600 mt-2">
            Por favor selecciona otro mes o contacta con soporte
          </p>
        </div>
      )}

      {/* Contador de resultados */}
      {!methodologyError && totalItems > 0 && (
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Mostrando{" "}
            <span className="text-cyan-600 font-medium">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)}
            </span>{" "}
            de <span className="text-cyan-600 font-medium">{totalItems}</span>{" "}
            recursos
            {filteredCourse
              ? ` para ${
                  cursos.find((c) => c.idcurso === filteredCourse)?.nombrecurso
                }`
              : ""}
          </p>
        </div>
      )}

      {/* Listado de materiales */}
      {!methodologyError && totalItems > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map((item) => (
              <div
                key={item.material.idmaterial}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
              >
                {/* Encabezado de la tarjeta */}
                <div
                  className={`bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 flex items-center justify-center h-40`}
                >
                  <div className="text-center">
                    <span className="text-5xl text-cyan-600">
                      {getMaterialIcon(item.material.tipo)}
                    </span>
                    <h3 className="mt-2 text-cyan-800 font-semibold">
                      {getMaterialTypeName(item.material.tipo)}
                    </h3>
                  </div>
                </div>

                {/* Información del material */}
                <div className="p-4">
                  <h3 className="text-gray-800 font-semibold text-lg mb-2 group-hover:text-cyan-600 transition-colors">
                    {item.material.nombrematerial ||
                      getMaterialTypeName(item.material.tipo)}
                  </h3>

                  {/* Info del curso y tema */}
                  <div className="space-y-2 text-sm text-gray-600 mt-3">
                    <div className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded inline-block">
                      {item.cursoNombre}
                    </div>
                    <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                      {item.temaNombre}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginación */}
      {!methodologyError && totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-2">
            {/* Botón Anterior */}
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              } border border-gray-300 transition-colors`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Números de página */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentPage === number
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } border border-gray-300 transition-all cursor-pointer`}
                >
                  {number}
                </button>
              )
            )}

            {/* Botón Siguiente */}
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              } border border-gray-300 transition-colors`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Contador de páginas */}
          <div className="mt-4 text-gray-600 text-sm">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay materiales */}
      {totalItems === 0 && !loading && !methodologyError && (
        <div className="text-center py-12">
          <div className="text-5xl text-gray-300 mb-4">📭</div>
          <h3 className="text-xl font-medium text-gray-700">
            No hay recursos disponibles
          </h3>
          <p className="text-gray-500 mt-2">
            {filteredCourse || visibleMaterialTypes.length < 4
              ? "No hay materiales que coincidan con los filtros seleccionados."
              : "Aún no se ha elegido la metodología de aprendizaje para este mes."}
          </p>
        </div>
      )}

      {/* Modal de material */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado del modal (fijo) */}
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-4xl mr-3">
                  {getMaterialIcon(selectedItem.material.tipo)}
                </span>
                <div>
                  <h2 className="text-2xl font-bold">
                    {getMaterialTypeName(selectedItem.material.tipo)}
                  </h2>
                  <p className="text-cyan-100">
                    {selectedItem.material.tipo.toUpperCase()} •{" "}
                    {selectedItem.cursoNombre}
                  </p>
                </div>
              </div>

              {/* Botón de cerrar - más pequeño y sin fondo */}
              <button
                onClick={() => setSelectedItem(null)}
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {selectedItem.material.nombrematerial ||
                      getMaterialTypeName(selectedItem.material.tipo)}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                      {selectedItem.cursoNombre}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {getMaterialTypeName(selectedItem.material.tipo)}
                    </span>
                  </div>
                </div>

                {/* Visualización del recurso - contenedor flexible */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex">
                    {selectedItem.material.tipo.toLowerCase() === "video" ? (
                      <div className="w-full flex">
                        <video
                          controls
                          className="w-full h-full object-contain bg-black"
                          src={selectedItem.material.url}
                        >
                          Tu navegador no soporta el elemento de video.
                        </video>
                      </div>
                    ) : selectedItem.material.tipo.toLowerCase() === "pdf" ||
                      selectedItem.material.tipo.toLowerCase() ===
                        "solucionario" ? (
                      <iframe
                        src={selectedItem.material.url}
                        className="flex-1 w-full h-full border-0"
                        title={`Recurso ${selectedItem.material.tipo}`}
                      />
                    ) : selectedItem.material.tipo.toLowerCase() ===
                      "flashcard" ? (
                      <div className="flex-1 flex items-center justify-center p-4">
                        <img
                          src={selectedItem.material.url}
                          alt="Flashcard"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-6">
                        <div className="text-center">
                          <div className="text-4xl text-cyan-600 mb-3">
                            {getMaterialIcon(selectedItem.material.tipo)}
                          </div>
                          <p className="text-cyan-800 font-medium">
                            {getMaterialTypeName(selectedItem.material.tipo)}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Este material no tiene una vista previa disponible
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialPriorizado;
