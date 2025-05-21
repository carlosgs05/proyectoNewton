// src/components/contenidos/CursoDetalle.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaFilePdf,
  FaClone,
  FaVideo,
  FaFileAlt,
  FaChevronLeft,
} from "react-icons/fa";

interface Material {
  idmaterial: number;
  idtema: number;
  tipomaterial: string; // "PDF", "Flashcards", "Video", "Solucionario", etc.
  url: string;
  created_at: string;
}

interface Tema {
  idtema: number;
  idcurso: number;
  nombretema: string;
  created_at: string;
  materiales: Material[];
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

const CursoDetalle: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const curso = state?.curso;

  // Si no existe el curso en el state (p. ej. ingresa directamente), regresamos a la lista
  if (!curso) {
    navigate("/dashboard/contenidos");
    return null;
  }

  // Función auxiliar para elegir un icono según el tipo de material
  const iconForTipo = (tipomaterial: string) => {
    switch (tipomaterial) {
      case "PDF":
        return <FaFilePdf className="w-5 h-5 text-gray-600" />;
      case "Flashcards":
        return <FaClone className="w-5 h-5 text-gray-600" />;
      case "Video":
        return <FaVideo className="w-5 h-5 text-gray-600" />;
      case "Solucionario":
        return <FaFileAlt className="w-5 h-5 text-gray-600" />;
      default:
        return <FaFileAlt className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4">
      {/* Botón “Volver a Mis Cursos” */}
      <button
        onClick={() => navigate("/dashboard/contenido")}
        className="flex items-center text-cyan-700 hover:text-cyan-900 transition-colors mb-6 cursor-pointer"
      >
        <FaChevronLeft className="mr-2 w-5 h-5" />
        Volver a Mis Cursos
      </button>

      {/* Título del Curso */}
      <h1 className="text-3xl font-bold text-cyan-700 mb-8 text-center uppercase">
        {curso.nombrecurso}
      </h1>

      {/* Para cada tema, renderizamos un “bloque de semana” */}
      {curso.temas.map((tema, idx) => (
        <div key={tema.idtema} className="mb-10">
          {/* Encabezado: “Semana X: nombre del tema” */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Semana {idx + 1}:{" "}
              <span className="font-medium">{tema.nombretema}</span>
            </h2>
          </div>

          {/* Contenedor de materiales de esta semana */}
          <div className="space-y-2 border border-gray-200 rounded-lg p-4">
            {tema.materiales.length > 0 ? (
              tema.materiales.map((mat) => (
                <a
                  key={mat.idmaterial}
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 bg-white rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <span className="mr-3">{iconForTipo(mat.tipomaterial)}</span>
                  <span className="text-gray-800 font-medium">
                    {mat.tipomaterial}: Recurso {mat.idmaterial}
                  </span>
                </a>
              ))
            ) : (
              <p className="text-gray-500 italic">
                No hay materiales disponibles para esta semana.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CursoDetalle;