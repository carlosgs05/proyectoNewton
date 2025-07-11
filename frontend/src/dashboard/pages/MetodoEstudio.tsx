import React, { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiYoutube, FiX } from "react-icons/fi";
import { FaBook, FaLightbulb, FaStar } from "react-icons/fa";
import {
  BsCardChecklist,
  BsFileEarmarkPdf,
  BsCameraVideo,
  BsFileEarmarkText,
} from "react-icons/bs";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2/dist/sweetalert2.all.js";

interface Tema {
  idtema: number;
  idcurso: number;
  nombretema: string;
  created_at: string;
}

interface Course {
  idcurso: number;
  nombrecurso: string;
  created_at?: string;
  temas: Tema[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Course[];
}

interface WeakCourse {
  nombrecurso: string;
  temas: {
    idtema: number;
    nombretema: string;
  }[];
  nrotemas: number;
}

interface WeakCoursesResponse {
  success: boolean;
  cursos: WeakCourse[];
}

interface MetodoAprendizajeResponse {
  success: boolean;
  message: string;
  data: {
    idmetodologia: number;
    idusuario: number;
    mes: string;
    año: number;
    lista_cursos: string;
    lista_recursos: string;
  } | null;
}

const MetodoEstudio: React.FC = () => {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<{
    [course: string]: number[];
  }>({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingWeakCourses, setLoadingWeakCourses] = useState(false);
  const [loadingMetodo, setLoadingMetodo] = useState(true);
  const [weakCoursesActive, setWeakCoursesActive] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [existingMethod, setExistingMethod] = useState<any>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(
    today.getMonth() + 1
  );
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

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

  // Videos explicativos para cada método
  const explanationVideos = {
    pomodoro: "https://www.youtube.com/embed/Q2I96FgZUHA",
    repeticion: "https://www.youtube.com/embed/PVj3DjuFGs4",
    activo: "https://www.youtube.com/embed/mJzOLghzUwA",
  };

  // Abrir modal de video
  const openVideoModal = (videoKey: keyof typeof explanationVideos) => {
    setCurrentVideoUrl(explanationVideos[videoKey]);
    setVideoModalOpen(true);
  };

  // Cerrar modal de video
  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setCurrentVideoUrl("");
  };

  // Inicializa topics vacío
  const initEmptyTopics = (courses: Course[]) => {
    const obj: { [key: string]: number[] } = {};
    courses.forEach((c) => {
      obj[c.nombrecurso] = [];
    });
    return obj;
  };

  // 1) Obtener todos los cursos
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          "https://proyectonewton-production.up.railway.app/api/cursos-temas"
        );
        if (response.data.success && response.data.data) {
          setAllCourses(response.data.data);
          setSelectedTopics(initEmptyTopics(response.data.data));
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchAllCourses();
  }, []);

  // 2) Obtener método de aprendizaje guardado
  useEffect(() => {
    const fetchMetodoAprendizaje = async () => {
      if (!user) return;
      setLoadingMetodo(true);
      try {
        const resp = await axios.get<MetodoAprendizajeResponse>(
          `https://proyectonewton-production.up.railway.app/api/metodos-aprendizaje/${user.idusuario}/${currentMonth}/${currentYear}`
        );

        if (resp.data.success && resp.data.data) {
          setExistingMethod(resp.data.data);

          // Parsear lista_cursos si existe
          if (resp.data.data.lista_cursos) {
            try {
              const cursosData = JSON.parse(resp.data.data.lista_cursos);
              if (cursosData && cursosData.cursos) {
                const cursos = cursosData.cursos.map((c: any) => c.nombrecurso);
                setSelectedCourses(cursos);

                // Llenar selectedTopics
                const newSelectedTopics: { [course: string]: number[] } = {};
                cursosData.cursos.forEach((curso: any) => {
                  newSelectedTopics[curso.nombrecurso] = curso.temas.map(
                    (t: any) => t.idtema
                  );
                });
                setSelectedTopics(newSelectedTopics);
              }
            } catch (e) {
              console.error("Error parsing lista_cursos:", e);
            }
          }
        } else {
          setExistingMethod(null);
          setSelectedCourses([]);
        }
      } catch (e) {
        console.error(e);
        setExistingMethod(null);
        setSelectedCourses([]);
      } finally {
        setLoadingMetodo(false);
        setWeakCoursesActive(false);
      }
    };
    fetchMetodoAprendizaje();
  }, [user, currentMonth, currentYear, reloadTrigger]);

  // 3) Lógica corregida de cursos débiles: relacionar por nombre de tema
  const fetchWeakCourses = async () => {
    if (!user || allCourses.length === 0) return;
    setLoadingWeakCourses(true);
    try {
      const resp = await axios.get<WeakCoursesResponse>(
        `https://proyectonewton-production.up.railway.app/api/cursos-recomendados/${user.idusuario}/${currentMonth}/${currentYear}`
      );
      const weakData = resp.data.cursos || [];

      // Construir mapa { cursoTotal: [temaId, ...] } buscando coincidencia por nombretema
      const mapaWeak: { [cursoTotal: string]: number[] } = {};
      weakData.forEach((wc) => {
        wc.temas.forEach((wt) => {
          // por cada tema recomendado, buscar en qué curso(s) total aparece
          allCourses.forEach((fc) => {
            const matchTema = fc.temas.find(
              (t) => t.nombretema === wt.nombretema
            );
            if (matchTema) {
              if (!mapaWeak[fc.nombrecurso]) mapaWeak[fc.nombrecurso] = [];
              if (!mapaWeak[fc.nombrecurso].includes(matchTema.idtema)) {
                mapaWeak[fc.nombrecurso].push(matchTema.idtema);
              }
            }
          });
        });
      });

      // Ordenar cursos por número de temas detectados y tomar los top 6
      const sorted = Object.entries(mapaWeak)
        .sort(([, temasA], [, temasB]) => temasB.length - temasA.length)
        .slice(0, 6)
        .map(([curso]) => curso);

      // Reiniciar todos los topics y asignar solo los débiles
      const reset = initEmptyTopics(allCourses);
      sorted.forEach((curso) => {
        reset[curso] = mapaWeak[curso].slice(0, 6);
      });

      setSelectedCourses(sorted);
      setSelectedTopics(reset);
      setWeakCoursesActive(true);
    } catch (e) {
      console.error("Error fetching weak courses:", e);
      setWeakCoursesActive(false);
    } finally {
      setLoadingWeakCourses(false);
    }
  };

  // Limpiar todos los cursos seleccionados
  const clearAllSelections = () => {
    setSelectedCourses([]);
    setWeakCoursesActive(false);

    // Limpiar todos los temas seleccionados
    const resetTopics: { [course: string]: number[] } = {};
    allCourses.forEach((course) => {
      resetTopics[course.nombrecurso] = [];
    });
    setSelectedTopics(resetTopics);
    setExpandedCourse(null);
  };

  // Manejar selección/deselección de cursos
  const toggleCourseSelection = (course: Course) => {
    const courseName = course.nombrecurso;

    if (selectedCourses.includes(courseName)) {
      setSelectedCourses(selectedCourses.filter((c) => c !== courseName));
      setSelectedTopics((prev) => ({
        ...prev,
        [courseName]: [],
      }));
      if (expandedCourse === course.idcurso) {
        setExpandedCourse(null);
      }
    } else {
      if (selectedCourses.length < 6) {
        setSelectedCourses([...selectedCourses, courseName]);
        // Si es un curso débil, mantener los temas débiles seleccionados
        if (!weakCoursesActive) {
          setSelectedTopics((prev) => ({
            ...prev,
            [courseName]: [],
          }));
        }
      }
    }
    setWeakCoursesActive(false);
  };

  // Manejar selección/deselección de temas
  const toggleTopicSelection = (courseName: string, topicId: number) => {
    setSelectedTopics((prev) => {
      const currentTopics = prev[courseName] || [];

      if (currentTopics.includes(topicId)) {
        return {
          ...prev,
          [courseName]: currentTopics.filter((id) => id !== topicId),
        };
      } else {
        if (currentTopics.length < 6) {
          return {
            ...prev,
            [courseName]: [...currentTopics, topicId],
          };
        }
      }
      return prev;
    });
  };

  // Generar plan de estudio y registrar
  const generateStudyPlan = async () => {
    if (!user) return;

    // Construir JSON con el formato requerido
    const studyPlanData = {
      cursos: allCourses
        .filter((course) => selectedCourses.includes(course.nombrecurso))
        .map((course) => ({
          nombrecurso: course.nombrecurso,
          idcurso: course.idcurso,
          temas: course.temas
            .filter((tema) =>
              selectedTopics[course.nombrecurso]?.includes(tema.idtema)
            )
            .map((tema) => ({
              idtema: tema.idtema,
              nombretema: tema.nombretema,
            })),
        })),
    };

    try {
      // Registrar método de aprendizaje
      const response = await axios.post(
        "https://proyectonewton-production.up.railway.app/api/metodos-aprendizaje/registrar",
        {
          idusuario: user.idusuario,
          mes: currentMonth,
          año: currentYear,
          lista_cursos: JSON.stringify(studyPlanData),
        }
      );

      if (response.data.success) {
        Swal.fire({
          title: "¡Éxito!",
          text: "Tu método de estudio ha sido registrado correctamente",
          icon: "success",
          confirmButtonText: "Aceptar",
        }).then(() => {
          // Recargar componente
          setReloadTrigger((prev) => prev + 1);
        });
      } else {
        throw new Error(response.data.message || "Error en el servidor");
      }
    } catch (error) {
      console.error("Error al registrar método de estudio:", error);
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al registrar tu método de estudio",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

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
  };

  // Alternar visibilidad de temas de un curso
  const toggleExpandCourse = (courseId: number) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  // Obtener el número de temas seleccionados para un curso
  const getSelectedTopicsCount = (courseName: string) => {
    return selectedTopics[courseName]?.length || 0;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Modal de video */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl mx-4 relative">
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <FiX className="text-gray-700 text-xl" />
            </button>

            <div className="aspect-video w-full">
              <iframe
                src={currentVideoUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video explicativo"
              ></iframe>
            </div>

            <div className="p-4 bg-gray-50">
              <p className="text-center text-gray-700 font-medium">
                Técnicas de estudio explicadas paso a paso
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-cyan-700 uppercase tracking-wide">
            Personaliza tu Método de Estudio
          </h1>
        </div>
      </div>

      {/* Selector de mes y año */}
      <div className="flex justify-center my-2">
        <div className="p-4 flex items-center gap-4">
          <button
            onClick={() => changeMonth("prev")}
            className="p-2 bg-cyan-100 rounded-full hover:bg-cyan-200 transition-colors cursor-pointer"
          >
            <FiChevronLeft className="text-black text-lg" />
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
            <FiChevronRight className="text-black text-lg" />
          </button>
        </div>
      </div>

      {loadingMetodo ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Selección de cursos */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-700 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FaBook className="mr-2" /> Selecciona tus cursos
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="bg-cyan-50 border-l-4 border-cyan-600 p-4 rounded-r-lg mb-4">
                  <p className="text-cyan-800 text-sm">
                    <span className="font-medium">Consejo:</span> Selecciona
                    hasta 6 cursos para un enfoque efectivo. Estudiantes que
                    priorizan sus estudios mejoran un 40% su rendimiento.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <span className="text-gray-700 font-medium bg-cyan-50 px-3 py-1 rounded-lg">
                      {selectedCourses.length} de 6 cursos seleccionados
                    </span>
                  </div>
                  {!existingMethod &&
                    (weakCoursesActive ? (
                      <button
                        onClick={clearAllSelections}
                        disabled={loadingWeakCourses}
                        className="px-4 py-2 text-cyan-700 hover:text-cyan-900 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        Limpiar selección
                      </button>
                    ) : (
                      <button
                        onClick={fetchWeakCourses}
                        disabled={loadingWeakCourses}
                        className="px-4 py-2 text-amber-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        {loadingWeakCourses
                          ? "Cargando..."
                          : "Marcar cursos débiles"}
                      </button>
                    ))}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Nota:</span> Haz clic en un
                  curso para ver y seleccionar sus temas
                </div>
              </div>

              {loadingCourses ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[700px] overflow-y-auto pr-2">
                  {allCourses.map((course) => (
                    <div
                      key={course.idcurso}
                      className={`border rounded-xl transition-all duration-200 ${
                        selectedCourses.includes(course.nombrecurso)
                          ? "border-cyan-500 bg-cyan-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      } ${existingMethod ? "opacity-75" : ""}`}
                    >
                      <div
                        className="p-3 flex items-start cursor-pointer"
                        onClick={() =>
                          !existingMethod && toggleCourseSelection(course)
                        }
                      >
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center mr-2 mt-0.5 ${
                            selectedCourses.includes(course.nombrecurso)
                              ? "bg-cyan-600 border-cyan-700"
                              : "border-gray-300"
                          } ${
                            existingMethod
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          {selectedCourses.includes(course.nombrecurso) && (
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <span
                            className={`text-sm ${
                              selectedCourses.includes(course.nombrecurso)
                                ? "font-medium text-cyan-800"
                                : "text-gray-700"
                            }`}
                          >
                            {course.nombrecurso}
                          </span>
                          {selectedCourses.includes(course.nombrecurso) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandCourse(course.idcurso);
                              }}
                              className="text-cyan-600 hover:text-cyan-800 ml-2"
                            >
                              {expandedCourse === course.idcurso ? (
                                <FiChevronLeft className="transform rotate-90" />
                              ) : (
                                <FiChevronRight className="transform rotate-90" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedCourses.includes(course.nombrecurso) &&
                        expandedCourse === course.idcurso && (
                          <div className="px-3 pb-3 ml-7">
                            <div className="text-xs text-gray-500 mb-2 flex justify-between">
                              <span>Temas del curso:</span>
                              <span>
                                {getSelectedTopicsCount(course.nombrecurso)} de
                                6 seleccionados
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                              {course.temas.map((tema) => (
                                <div
                                  key={tema.idtema}
                                  className={`flex items-start p-2 rounded-lg text-sm ${
                                    selectedTopics[
                                      course.nombrecurso
                                    ]?.includes(tema.idtema)
                                      ? "bg-cyan-100 border border-cyan-300"
                                      : "hover:bg-gray-100"
                                  } ${
                                    existingMethod
                                      ? "cursor-default"
                                      : "cursor-pointer"
                                  }`}
                                  onClick={(e) => {
                                    if (!existingMethod) {
                                      e.stopPropagation();
                                      toggleTopicSelection(
                                        course.nombrecurso,
                                        tema.idtema
                                      );
                                    }
                                  }}
                                >
                                  <div
                                    className={`h-4 w-4 rounded-full border flex-shrink-0 mt-0.5 mr-2 ${
                                      selectedTopics[
                                        course.nombrecurso
                                      ]?.includes(tema.idtema)
                                        ? "bg-cyan-600 border-cyan-700"
                                        : "border-gray-300"
                                    } ${
                                      existingMethod
                                        ? "cursor-not-allowed"
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    {selectedTopics[
                                      course.nombrecurso
                                    ]?.includes(tema.idtema) && (
                                      <div className="h-2 w-2 bg-white rounded-full ml-0.5 mt-0.5"></div>
                                    )}
                                  </div>
                                  <span className="text-gray-700">
                                    {tema.nombretema}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Preferencias y métodos */}
          <div className="space-y-8">
            {/* Preferencias de recursos de estudio */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-700 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FaLightbulb className="mr-2" /> Recursos de Estudio
                  Preferidos
                </h2>
              </div>

              <div className="p-6">
                <h3 className="font-medium text-gray-800 mb-4">
                  Los diferentes tipos de materiales que te ayudarán a estudiar
                  mejor:
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 transition-all flex flex-col items-center border-gray-200 hover:border-gray-300">
                    <div className="text-indigo-600 mb-2">
                      <BsCardChecklist className="text-2xl" />
                    </div>
                    <div className="font-medium">Flashcards</div>
                    <div className="text-xs text-gray-600 mt-1 text-center">
                      Tarjetas de estudio interactivas
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 transition-all flex flex-col items-center border-gray-200 hover:border-gray-300">
                    <div className="text-emerald-600 mb-2">
                      <BsFileEarmarkPdf className="text-2xl" />
                    </div>
                    <div className="font-medium">PDFs</div>
                    <div className="text-xs text-gray-600 mt-1 text-center">
                      Teoría en apuntes relevantes y útiles
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 transition-all flex flex-col items-center border-gray-200 hover:border-gray-300">
                    <div className="text-rose-600 mb-2">
                      <BsCameraVideo className="text-2xl" />
                    </div>
                    <div className="font-medium">Videos</div>
                    <div className="text-xs text-gray-600 mt-1 text-center">
                      Lecciones en video
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 transition-all flex flex-col items-center border-gray-200 hover:border-gray-300">
                    <div className="text-amber-600 mb-2">
                      <BsFileEarmarkText className="text-2xl" />
                    </div>
                    <div className="font-medium">Solucionarios</div>
                    <div className="text-xs text-gray-600 mt-1 text-center">
                      Explicaciones paso a paso
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Métodos recomendados */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-700 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FaStar className="mr-2" /> Métodos Recomendados
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Técnica Pomodoro */}
                  <div className="bg-gradient-to-r from-sky-50 to-sky-100 border-l-4 border-sky-500 p-5 rounded-xl shadow-sm">
                    <div className="font-bold text-sky-800 text-lg mb-2">
                      Técnica Pomodoro
                    </div>
                    <p className="text-sm text-sky-700 mb-3">
                      Estudia en bloques de 25 minutos con descansos de 5
                      minutos para mejorar la concentración y evitar el
                      agotamiento.
                    </p>
                    <button
                      onClick={() => openVideoModal("pomodoro")}
                      className="mt-2 flex items-center text-sky-700 hover:text-sky-900 text-sm cursor-pointer font-medium"
                    >
                      <FiYoutube className="mr-2" /> Ver videos explicativos
                    </button>
                  </div>

                  {/* Repetición espaciada */}
                  <div className="bg-gradient-to-r from-violet-50 to-violet-100 border-l-4 border-violet-500 p-5 rounded-xl shadow-sm">
                    <div className="font-bold text-violet-800 text-lg mb-2">
                      Repetición espaciada
                    </div>
                    <p className="text-sm text-violet-700 mb-3">
                      Revisa el material en intervalos crecientes (1 día, 3
                      días, 1 semana) para mejorar la retención a largo plazo.
                    </p>
                    <button
                      onClick={() => openVideoModal("repeticion")}
                      className="mt-2 flex items-center text-violet-700 hover:text-violet-900 text-sm cursor-pointer font-medium"
                    >
                      <FiYoutube className="mr-2" /> Ver videos explicativos
                    </button>
                  </div>

                  {/* Estudio activo */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 p-5 rounded-xl shadow-sm">
                    <div className="font-bold text-amber-800 text-lg mb-2">
                      Estudio activo
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      En lugar de solo leer, haz preguntas, crea resúmenes con
                      tus propias palabras y enseña el material a alguien más.
                    </p>
                    <button
                      onClick={() => openVideoModal("activo")}
                      className="mt-2 flex items-center text-amber-700 hover:text-amber-900 text-sm cursor-pointer font-medium"
                    >
                      <FiYoutube className="mr-2" /> Ver videos explicativos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {!existingMethod && (
        <div className="mt-8 flex justify-center">
          <button
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer font-medium text-[17px] flex items-center"
            onClick={generateStudyPlan}
          >
            Guardar mi método de estudio
          </button>
        </div>
      )}
    </div>
  );
};

export default MetodoEstudio;
