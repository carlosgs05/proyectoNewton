import React, { useEffect, useState, useMemo } from "react";
import GraficoColumnasApiladas, {
  DataPoint,
} from "../components/GraficoColumnasApiladas";
import axios from "axios";
import Select from "react-select";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import GaugeChart from "react-gauge-chart";
import {
  FaRegSmileBeam,
  FaRegFrown,
  FaRegMeh,
  FaChartLine,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

interface Props {
  idusuario: number;
}

interface CursoOption {
  value: number;
  label: string;
}

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

const customSelectStyles = {
  control: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    borderColor: "#0088a9",
    boxShadow: "none",
    "&:hover": { borderColor: "#006b7d" },
    cursor: "pointer",
    fontSize: "1rem",
    minHeight: "40px",
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    zIndex: 1000,
  }),
  option: (p: any, s: any) => ({
    ...p,
    backgroundColor: s.isFocused ? "#e0f7fa" : "white",
    color: s.isFocused ? "#0088a9" : "#333",
    cursor: "pointer",
  }),
  placeholder: (p: any) => ({ ...p, color: "#0088a9" }),
  singleValue: (p: any) => ({ ...p, color: "#004d59" }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: "2px",
    cursor: "pointer",
    color: "#aaa",
    "&:hover": { color: "#0088a9" },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: "2px",
    color: "#0088a9",
    "&:hover": { color: "#006b7d" },
  }),
};

const LOW_THRESHOLD = 29.99;
const HIGH_THRESHOLD = 59.99;

const getTrafficLightColor = (v: number): string =>
  v > HIGH_THRESHOLD ? "#16a34a" : v > LOW_THRESHOLD ? "#eab308" : "#dc2626";

const getIconByLevel = (valor: number) => {
  if (valor > HIGH_THRESHOLD)
    return <FaRegSmileBeam className="text-2xl text-cyan-600" />;
  if (valor > LOW_THRESHOLD)
    return <FaRegMeh className="text-2xl text-yellow-500" />;
  return <FaRegFrown className="text-2xl text-red-600" />;
};

const RendimientoPorCurso: React.FC<Props> = ({ idusuario }) => {
  const { hasPermission } = useAuth();
  const isEstudiante = hasPermission(3);

  const today = new Date();
  const [mesActual, setMesActual] = useState<number>(today.getMonth());
  const [anioActual, setAnioActual] = useState<number>(today.getFullYear());
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<CursoOption | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/cursos/datos-generales")
      .then((res) => {
        if (res.data.success) {
          const opts = res.data.data.map((c: any) => ({
            value: c.idcurso,
            label: c.nombrecurso,
          }));
          setCursos(opts);
        }
      });
  }, []);

  useEffect(() => {
    const payload: any = {
      idusuario,
      anio: anioActual,
      mes: monthNames[mesActual],
    };
    if (selectedCurso) {
      payload.idcurso = selectedCurso.value;
    }

    axios
      .post("http://localhost:8000/api/report/simulacroCursoDetalle", payload)
      .then((res) => {
        setData(res.data.success ? res.data.data : []);
      })
      .catch(() => setData([]));
  }, [idusuario, mesActual, anioActual, selectedCurso]);

  const dominioActual = useMemo(() => {
    const corr = data.reduce((sum, d) => sum + d.preguntasCorrectas, 0);
    const inc = data.reduce((sum, d) => sum + d.preguntasIncorrectas, 0);
    const total = corr + inc;
    return total === 0 ? 0 : Math.max(0, (corr / total) * 100);
  }, [data]);

  const tasaMejora = useMemo(() => {
    const n = data.length;
    if (n < 2) return 0;
    const xs = data.map((_, i) => i);
    const ys = data.map((d) => {
      const tot = d.preguntasCorrectas + d.preguntasIncorrectas;
      return tot === 0 ? 0 : (d.preguntasCorrectas / tot) * 100;
    });
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const pendiente = ys[0] === 0 ? 0 : (m / ys[0]) * 100;
    return Math.max(0, pendiente);
  }, [data]);

  const interpretacionCombinada = useMemo(() => {
    if (isEstudiante) {
      if (dominioActual >= 60 && tasaMejora >= 60) {
        return "¡Felicidades! No solo has demostrado un dominio sólido del curso, sino que también estás mejorando constantemente en cada simulacro. Este doble resultado indica que comprendes los contenidos y sigues avanzando. Mantén tu motivación, ya que este patrón sostenido te llevará al máximo rendimiento.";
      }
      if (dominioActual >= 60 && tasaMejora <= LOW_THRESHOLD) {
        return "Tienes un buen nivel de comprensión, pero tu rendimiento se ha mantenido estable últimamente. Esto puede indicar un estancamiento. Sería ideal que explores nuevas estrategias de estudio para seguir progresando y no quedarte en tu zona de confort.";
      }
      if (dominioActual <= LOW_THRESHOLD && tasaMejora >= 60) {
        return "Aunque tu nivel de dominio aún es bajo, estás mostrando una mejora progresiva y constante. Esto es muy positivo, ya que indica que estás aprendiendo. Sigue esforzándote, porque si mantienes este ritmo, pronto dominarás los temas.";
      }
      return "Tienes dificultades tanto para alcanzar un buen nivel de comprensión como para progresar entre simulacros. Esto podría deberse a métodos de estudio poco efectivos, falta de motivación o baja constancia. Te recomendamos organizar tus sesiones de práctica, pedir apoyo y concentrarte en objetivos específicos para mejorar.";
    } else {
      if (dominioActual >= 60 && tasaMejora >= 60) {
        return "El estudiante presenta un excelente desempeño general. Ha alcanzado un dominio elevado del curso y, además, mantiene una tendencia positiva de mejora. Esto sugiere que aplica correctamente sus conocimientos y continúa avanzando con éxito. Es un caso ejemplar.";
      }
      if (dominioActual >= 60 && tasaMejora <= LOW_THRESHOLD) {
        return "Aunque el estudiante domina los contenidos, su rendimiento reciente no ha mejorado significativamente. Esta falta de progreso podría reflejar una zona de confort o una disminución en el esfuerzo. Es recomendable revisar sus hábitos de práctica para evitar estancamientos.";
      }
      if (dominioActual <= LOW_THRESHOLD && tasaMejora >= 60) {
        return "A pesar de no haber alcanzado un dominio alto, el estudiante presenta una mejora progresiva constante. Esto sugiere una evolución positiva, por lo que es importante seguir reforzando el aprendizaje para consolidar sus avances.";
      }
      return "El estudiante presenta bajo dominio de los contenidos y no muestra mejoras significativas. Esto podría indicar dificultades persistentes o falta de motivación. Se recomienda realizar una evaluación detallada para establecer un plan de apoyo personalizado que lo ayude a mejorar.";
    }
  }, [dominioActual, tasaMejora, isEstudiante]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (mesActual === 0) {
                setMesActual(11);
                setAnioActual(anioActual - 1);
              } else {
                setMesActual(mesActual - 1);
              }
            }}
            className="p-2 bg-cyan-100 rounded-full cursor-pointer"
          >
            <FiChevronLeft size={20} />
          </button>
          <span className="text-cyan-700 font-semibold text-lg">
            {monthNames[mesActual]} {anioActual}
          </span>
          <button
            onClick={() => {
              const now = new Date();
              const maxMes = now.getMonth();
              const maxAnio = now.getFullYear();
              if (
                anioActual < maxAnio ||
                (anioActual === maxAnio && mesActual < maxMes)
              ) {
                if (mesActual === 11) {
                  setMesActual(0);
                  setAnioActual(anioActual + 1);
                } else {
                  setMesActual(mesActual + 1);
                }
              }
            }}
            className="p-2 bg-cyan-100 rounded-full cursor-pointer"
          >
            <FiChevronRight size={20} />
          </button>
        </div>

        <div className="w-1/2 min-w-[260px]">
          <Select
            options={cursos}
            value={selectedCurso}
            onChange={(opt) => setSelectedCurso(opt)}
            placeholder="Selecciona un curso"
            styles={customSelectStyles}
            isClearable
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg bg-white py-6 my-7 shadow">
        {data.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-gray-500 italic">
              No hay datos disponibles para este curso.
            </p>
          </div>
        ) : (
          <GraficoColumnasApiladas data={data} />
        )}
      </div>

      {selectedCurso && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              {
                title: "Dominio Actual (%)",
                value: Math.min(Math.max(dominioActual, 0), 100),
                color: getTrafficLightColor(dominioActual),
                icon: getIconByLevel(dominioActual),
                interpretacion:
                  dominioActual >= 60
                    ? "El estudiante ha alcanzado un nivel alto de dominio y comprensión del curso."
                    : dominioActual > LOW_THRESHOLD
                    ? "El estudiante se encuentra en proceso de mejora en su comprensión del curso."
                    : "El estudiante presenta bajo dominio del curso. Se recomienda reforzar los contenidos.",
              },
              {
                title: "Tasa de Mejora (%)",
                value: Math.min(Math.max(tasaMejora, 0), 100),
                color: getTrafficLightColor(tasaMejora),
                icon: getIconByLevel(tasaMejora),
                interpretacion:
                  tasaMejora >= 60
                    ? "El estudiante está mejorando significativamente en los últimos simulacros."
                    : tasaMejora > LOW_THRESHOLD
                    ? "El estudiante muestra una mejora moderada. Puede aumentar su ritmo con apoyo."
                    : "El estudiante no presenta una mejora significativa en los últimos simulacros",
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow p-6 flex flex-col items-center"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                  {kpi.title}
                </h3>
                <div className="w-full h-44 relative flex items-center justify-center">
                  <GaugeChart
                    id={`gauge-chart-${i}`}
                    nrOfLevels={3}
                    arcWidth={0.25}
                    colors={["#dc2626", "#eab308", "#16a34a"]}
                    percent={kpi.value / 100}
                    textColor="#374151"
                    needleColor="#374151"
                    needleBaseColor="#374151"
                    arcPadding={0.02}
                    hideText
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div
                  className="mt-10 text-4xl font-bold"
                  style={{ color: kpi.color }}
                >
                  {kpi.value.toFixed(2)}%
                </div>

                <div
                  className={`mt-2 flex items-center gap-2 text-sm font-medium`}
                  style={{ color: kpi.color }}
                >
                  {kpi.icon}
                  <span className="text-justify">{kpi.interpretacion}</span>
                </div>

                <div className="mt-6 w-full overflow-x-auto">
                  <table className="w-full text-sm text-left border rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-2">Color</th>
                        <th className="px-4 py-2">Rango</th>
                        <th className="px-4 py-2">Interpretación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          color: "#dc2626",
                          rango: "0% - 29.99%",
                          texto:
                            i === 0
                              ? "Dominio bajo. El estudiante debe reforzar los temas."
                              : "Mejora baja. No se perciben cambios importantes.",
                        },
                        {
                          color: "#eab308",
                          rango: "30.00% - 59.99%",
                          texto:
                            i === 0
                              ? "Dominio medio. El estudiante se encuentra en progreso."
                              : "Mejora moderada. Existe avance, pero aún es limitado.",
                        },
                        {
                          color: "#16a34a",
                          rango: "60.00% - 100%",
                          texto:
                            i === 0
                              ? "Dominio alto. El estudiante demuestra buena comprensión."
                              : "Mejora alta. El estudiante está mejorando significativamente.",
                        },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full"
                              style={{ backgroundColor: row.color }}
                            ></span>
                          </td>
                          <td className="px-4 py-2">{row.rango}</td>
                          <td className="px-4 py-2">{row.texto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-xl font-semibold text-cyan-700 mb-3 text-center flex justify-center items-center gap-2">
              <FaChartLine className="text-cyan-700" />
              Interpretación Combinada del Rendimiento por Curso
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              {interpretacionCombinada}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default RendimientoPorCurso;
