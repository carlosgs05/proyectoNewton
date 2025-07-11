import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaFilePdf, FaStar, FaChartBar, FaFileExcel, FaDownload } from "react-icons/fa";
import { FiChevronLeft } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";

const DetallesSimulacro: React.FC = () => {
  const { user } = useAuth();
  const { fecha: fechaEncoded } = useParams<{ fecha: string }>();

  // Decodificar la fecha
  const fechaParam = fechaEncoded ? decodeURIComponent(fechaEncoded) : null;

  // Función para formatear la fecha
  const formatDateForAPI = (dateString: string | null): string | null => {
    if (!dateString) return null;

    // Eliminar parámetros adicionales si existen
    const cleanDate = dateString.split("?")[0];

    // Intentar múltiples formatos
    const formats = [
      {
        regex: /(\d{2})\/(\d{2})\/(\d{4})/,
        handler: (match: RegExpMatchArray) =>
          `${match[3]}-${match[2]}-${match[1]}`,
      },
      {
        regex: /(\d{4})-(\d{2})-(\d{2})/,
        handler: (match: RegExpMatchArray) =>
          `${match[1]}-${match[2]}-${match[3]}`,
      },
      {
        regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        handler: (match: RegExpMatchArray) =>
          `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(
            2,
            "0"
          )}`,
      },
    ];

    for (const format of formats) {
      const match = cleanDate.match(format.regex);
      if (match) {
        return format.handler(match);
      }
    }

    return null;
  };

  const fecha = formatDateForAPI(fechaParam);

  const [simulacro, setSimulacro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<
    | "pdfexamen"
    | "pdfrespuestas"
    | "pdfsolucionario"
    | "pdfhojarespuesta"
    | "feedback"
    | null
  >(null);
  
  // Estado para el acordeón del feedback
  const [activeAccordion, setActiveAccordion] = useState<'feedback' | 'temas' | null>('feedback');

  useEffect(() => {
    const fetchSimulacroData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Validaciones críticas
        if (!user) {
          setError("No se encontró información de usuario");
          setLoading(false);
          return;
        }

        if (!fecha) {
          setError(
            `Formato de fecha inválido: ${fechaParam} (se esperaba dd/mm/yyyy)`
          );
          setLoading(false);
          return;
        }

        const response = await fetch(
          `https://proyectonewton-production.up.railway.app/api/simulacro/estudiante/${user.idusuario}/${fecha}`
        );

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setSimulacro(data.data);
        } else {
          setError(data.message || "Error al obtener los datos del simulacro");
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
        setError("Error al cargar los datos. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchSimulacroData();
  }, [user, fecha, fechaParam]);

  const openModal = (
    type:
      | "pdfexamen"
      | "pdfrespuestas"
      | "pdfsolucionario"
      | "pdfhojarespuesta"
      | "feedback"
  ) => {
    setModalContent(type);
    setShowModal(true);
    
    // Inicializar acordeón cuando se abre modal de feedback
    if (type === "feedback") {
      setActiveAccordion('feedback');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
    setActiveAccordion(null);
  };

  // Manejar el cambio de sección en el acordeón
  const toggleAccordion = (section: 'feedback' | 'temas') => {
    if (activeAccordion === section) {
      setActiveAccordion(null);
    } else {
      setActiveAccordion(section);
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-600 mb-4"></div>
          <span className="text-gray-700 text-lg">
            Cargando datos del simulacro...
          </span>
        </div>
      </div>
    );
  }

  // Mostrar errores
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl shadow-lg max-w-3xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-red-700 mb-4">Error</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <div className="bg-white p-4 rounded-lg">
          {fechaParam && (
            <p className="text-gray-800 mb-2">
              <span className="font-medium">Fecha recibida:</span> {fechaParam}
            </p>
          )}
          {fecha && (
            <p className="text-gray-800">
              <span className="font-medium">Fecha formateada:</span> {fecha}
            </p>
          )}
        </div>
        <div className="mt-6">
          <Link
            to="/dashboard/rendimientoSimulacros"
            className="inline-flex items-center text-cyan-700 hover:text-cyan-900"
          >
            <FiChevronLeft className="mr-1" /> Volver a mis calificaciones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 mt-4">
      <div className="mb-8">
        <Link
          to="/dashboard/rendimientoSimulacros"
          className="inline-flex items-center text-cyan-700 hover:text-cyan-900 mb-4"
        >
          <FiChevronLeft className="mr-1" /> Volver a mis calificaciones
        </Link>
        <h1 className="text-2xl font-extrabold text-center text-cyan-700 uppercase tracking-wide">
          Detalles del Simulacro
        </h1>
      </div>

      {simulacro && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Encabezado con nombre y fecha */}
          <div className="bg-gradient-to-r from-cyan-700 to-teal-600 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {simulacro.nombresimulacro}
                </h2>
              </div>
              <div className="mt-4 md:mt-0 bg-white bg-opacity-20 rounded-xl px-4 py-2">
                <span className="text-sm font-medium">Puntaje total:</span>
                <span className="text-xl font-bold ml-2">
                  {simulacro.puntajetotal}
                </span>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sección de archivos del simulacro */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <HiOutlineDocumentDuplicate className="text-red-500 mr-2" /> Material del
                Simulacro
              </h3>

              <div className="space-y-4">
                <div
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openModal("pdfexamen")}
                >
                  <div className="flex items-center">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <FaFilePdf className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Examen</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Ver el examen completo
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openModal("pdfrespuestas")}
                >
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-lg mr-4">
                      <FaFileExcel className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Respuestas Correctas
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Clave de respuestas (Excel)
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openModal("pdfsolucionario")}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <FaFilePdf className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Solucionario
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Explicación de respuestas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de resultados del estudiante */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaChartBar className="text-cyan-600 mr-2" /> Tus Resultados
              </h3>

              <div className="space-y-4">
                <div
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openModal("pdfhojarespuesta")}
                >
                  <div className="flex items-center">
                    <div className="bg-amber-100 p-3 rounded-lg mr-4">
                      <FaFilePdf className="text-amber-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Hoja de Respuestas
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Ver tus respuestas
                      </p>
                    </div>
                  </div>
                </div>

                {simulacro.feedback && (
                  <div
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openModal("feedback")}
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-lg mr-4">
                        <FaStar className="text-purple-600 text-xl" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Feedback Personalizado
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Recomendaciones de estudio
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {simulacro.datossugerencias && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Cursos para reforzar
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(simulacro.datossugerencias).map(
                        (curso: any, index: number) => (
                          <div
                            key={index}
                            className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-sm"
                          >
                            {curso.nombrecurso}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-gradient-to-r from-cyan-700 to-teal-600 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {modalContent === "pdfexamen" && "Examen del Simulacro"}
                  {modalContent === "pdfrespuestas" && "Respuestas Correctas"}
                  {modalContent === "pdfsolucionario" &&
                    "Solucionario del Examen"}
                  {modalContent === "pdfhojarespuesta" && "Hoja de Respuestas"}
                  {modalContent === "feedback" && "Feedback Personalizado"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 cursor-pointer"
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
            </div>

            <div className={`flex-grow overflow-auto bg-gray-50 ${
              modalContent === 'feedback' ? 'p-0' : 'p-4'
            }`}>
              {modalContent === "pdfexamen" && (
                <div className="h-full">
                  <iframe
                    src={`https://proyectonewton-production.up.railway.app/${simulacro.pdfexamen}`}
                    width="100%"
                    height="100%"
                    className="border rounded-lg shadow-sm min-h-[500px]"
                    title="Examen del Simulacro"
                  ></iframe>
                </div>
              )}

              {modalContent === "pdfrespuestas" && (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="text-center max-w-md">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center mb-4">
                      <FaFileExcel className="text-green-600 text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Archivo Excel</h3>
                    <p className="text-gray-600 mb-6">
                      No podemos mostrar una vista previa de este archivo. Por favor, descárgalo para verlo.
                    </p>
                    <a 
                      href={`https://proyectonewton-production.up.railway.app/${simulacro.pdfrespuestas}`}
                      download
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaDownload className="mr-2" /> Descargar Excel
                    </a>
                  </div>
                </div>
              )}

              {modalContent === "pdfsolucionario" && (
                <div className="h-full">
                  <iframe
                    src={`https://proyectonewton-production.up.railway.app/${simulacro.pdfsolucionario}`}
                    width="100%"
                    height="100%"
                    className="border rounded-lg shadow-sm min-h-[500px]"
                    title="Solucionario del Examen"
                  ></iframe>
                </div>
              )}

              {modalContent === "pdfhojarespuesta" && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-full w-full flex items-center justify-center">
                    <img
                      src={`https://proyectonewton-production.up.railway.app/${simulacro.pdfhojarespuesta}`}
                      width="100%"
                      height="100%"
                      className="border-0 "
                      title="Hoja de Respuestas del Estudiante"
                      style={{ minHeight: '70vh' }}
                    ></img>
                  </div>
                </div>
              )}

              {modalContent === "feedback" && (
                <div className="bg-white rounded-xl shadow-sm">
                  {/* Sección Feedback Personalizado */}
                  <div 
                    className="border-b border-gray-200 cursor-pointer transition-all"
                    onClick={() => toggleAccordion('feedback')}
                  >
                    <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-t-xl">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <FaStar className="text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Feedback Personalizado</h3>
                      </div>
                      <span className={`transform transition-transform ${activeAccordion === 'feedback' ? 'rotate-0' : 'rotate-180'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    {activeAccordion === 'feedback' && (
                      <div className="p-4 pt-0">
                        <div className="bg-cyan-50 border-l-4 border-cyan-600 p-4 rounded-r-lg">
                          <p className="text-cyan-800">{simulacro.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sección Temas Recomendados */}
                  <div 
                    className="cursor-pointer transition-all"
                    onClick={() => toggleAccordion('temas')}
                  >
                    <div className="flex justify-between items-center p-4 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                          <FaChartBar className="text-cyan-600" />
                        </div>
                        <h3 className="font-bold text-gray-800">Temas Recomendados</h3>
                      </div>
                      <span className={`transform transition-transform ${activeAccordion === 'temas' ? 'rotate-0' : 'rotate-180'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    {activeAccordion === 'temas' && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {JSON.parse(simulacro.datossugerencias).map(
                            (curso: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                              >
                                <h5 className="font-bold text-cyan-700 mb-2">
                                  {curso.nombrecurso}
                                </h5>
                                <ul className="space-y-1">
                                  {curso.temas.map(
                                    (tema: any, temaIndex: number) => (
                                      <li
                                        key={temaIndex}
                                        className="flex items-start"
                                      >
                                        <span className="text-cyan-600 mr-2">
                                          •
                                        </span>
                                        <span>{tema.nombretema}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallesSimulacro;