import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Cambiado: useParams en lugar de useLocation
import { FaFilePdf } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";

const DetallesSimulacro: React.FC = () => {
  const { user } = useAuth();
  const { fecha: fechaEncoded } = useParams<{ fecha: string }>(); // Obtener el parámetro de la ruta

  // Decodificar la fecha
  const fechaParam = fechaEncoded ? decodeURIComponent(fechaEncoded) : null;
  
  // Función mejorada para formatear la fecha
  const formatDateForAPI = (dateString: string | null): string | null => {
    if (!dateString) return null;
    
    // Eliminar parámetros adicionales si existen
    const cleanDate = dateString.split('?')[0];
    
    // Intentar múltiples formatos
    const formats = [
      { regex: /(\d{2})\/(\d{2})\/(\d{4})/, handler: (match: RegExpMatchArray) => 
        `${match[3]}-${match[2]}-${match[1]}` }, // dd/mm/yyyy
      { regex: /(\d{4})-(\d{2})-(\d{2})/, handler: (match: RegExpMatchArray) => 
        `${match[1]}-${match[2]}-${match[3]}` }, // yyyy-mm-dd
      { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, handler: (match: RegExpMatchArray) => 
        `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` } // d/m/yyyy
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
  const [modalContent, setModalContent] = useState<"pdfexamen" | "pdfrespuestas" | "pdfsolucionario" | "pdfhojarespuesta" | "feedback" | null>(null);

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
          setError(`Formato de fecha inválido: ${fechaParam} (se esperaba dd/mm/yyyy)`);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/simulacro/estudiante/${user.idusuario}/${fecha}`
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

  const openModal = (type: "pdfexamen" | "pdfrespuestas" | "pdfsolucionario" | "pdfhojarespuesta" | "feedback") => {
    setModalContent(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
        <span className="ml-4 text-gray-700">Cargando datos del simulacro...</span>
      </div>
    );
  }

  // Mostrar errores
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-700">Error</h2>
        <p className="mt-2 text-red-600">{error}</p>
        {fechaParam && (
          <p className="mt-4 text-gray-600">
            <span className="font-medium">Fecha recibida:</span> {fechaParam}
          </p>
        )}
        {fecha && (
          <p className="text-gray-600">
            <span className="font-medium">Fecha formateada:</span> {fecha}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-cyan-700 mb-6">Detalles del Simulacro</h1>
      
      {simulacro && (
        <div className="space-y-6">
          {/* Información del Simulacro */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Información del Simulacro</h2>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Nombre del Simulacro:</span>
              <span>{simulacro.nombresimulacro}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Fecha:</span>
              <span>{fechaParam}</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => openModal("pdfexamen")}
                className="flex items-center px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                <FaFilePdf className="mr-2 text-red-500" />
                Ver Examen
              </button>
              <button
                onClick={() => openModal("pdfrespuestas")}
                className="flex items-center px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                <FaFilePdf className="mr-2 text-red-500" />
                Ver Respuestas Correctas
              </button>
              <button
                onClick={() => openModal("pdfsolucionario")}
                className="flex items-center px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                <FaFilePdf className="mr-2 text-red-500" />
                Ver Solucionario
              </button>
            </div>
          </div>

          {/* Datos del Estudiante */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Resultados del Estudiante</h2>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Puntaje Total:</span>
              <span className="font-semibold">{simulacro.puntajetotal}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Hoja de Respuestas:</span>
              <button
                onClick={() => openModal("pdfhojarespuesta")}
                className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                Ver Respuestas
              </button>
            </div>
            {simulacro.feedback && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">Feedback:</span>
                <button
                  onClick={() => openModal("feedback")}
                  className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  Ver Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalContent === "pdfexamen" && "Examen del Simulacro"}
                {modalContent === "pdfrespuestas" && "Respuestas Correctas"}
                {modalContent === "pdfsolucionario" && "Solucionario del Examen"}
                {modalContent === "pdfhojarespuesta" && "Hoja de Respuestas del Estudiante"}
                {modalContent === "feedback" && "Feedback"}
              </h2>
            </div>
            
            <div className="flex-grow overflow-auto p-4">
              {modalContent === "pdfexamen" && (
                <iframe
                  src={simulacro.pdfexamen}
                  width="100%"
                  height="500px"
                  className="border"
                  title="Examen del Simulacro"
                ></iframe>
              )}
              {modalContent === "pdfrespuestas" && (
                <iframe
                  src={simulacro.pdfrespuestas}
                  width="100%"
                  height="500px"
                  className="border"
                  title="Respuestas Correctas"
                ></iframe>
              )}
              {modalContent === "pdfsolucionario" && (
                <iframe
                  src={simulacro.pdfsolucionario}
                  width="100%"
                  height="500px"
                  className="border"
                  title="Solucionario del Examen"
                ></iframe>
              )}
              {modalContent === "pdfhojarespuesta" && (
                <iframe
                  src={simulacro.pdfhojarespuesta}
                  width="100%"
                  height="500px"
                  className="border"
                  title="Hoja de Respuestas del Estudiante"
                ></iframe>
              )}
              {modalContent === "feedback" && (
                <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
                  <p>{simulacro.feedback}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallesSimulacro;