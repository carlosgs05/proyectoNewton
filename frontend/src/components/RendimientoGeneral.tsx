import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import GaugeChart from "react-gauge-chart";
import GraficoDeLineas from "./../components/GraficoDeLineas";
// import Select from "react-select";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { FaRegSmileBeam, FaRegFrown, FaRegMeh, FaChartLine } from "react-icons/fa";

interface Props {
  idusuario: number;
}

interface PerformanceData {
  fecha: string;
  puntaje: number;
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

const LOW_THRESHOLD = 29.99;
const HIGH_THRESHOLD = 59.99;

const getTrafficLightColor = (v: number): string =>
  v > HIGH_THRESHOLD ? "#16a34a" : v > LOW_THRESHOLD ? "#eab308" : "#dc2626";

const getIconByLevel = (valor: number) => {
  if (valor > HIGH_THRESHOLD) return <FaRegSmileBeam className="text-2xl text-cyan-600" />;
  if (valor > LOW_THRESHOLD) return <FaRegMeh className="text-2xl text-yellow-500" />;
  return <FaRegFrown className="text-2xl text-red-600" />;
};

// If you use react-select elsewhere, type the style functions properly to avoid warnings

const RendimientoGeneral: React.FC<Props> = ({ idusuario }) => {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission(6);
  const isEstudiante = hasPermission(3);

  const today = new Date();
  const [mesActual, setMesActual] = useState<number>(today.getMonth());
  const [anioActual, setAnioActual] = useState<number>(today.getFullYear());

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (idusuario) fetchPerformanceData(idusuario, mesActual, anioActual);
  }, [idusuario, mesActual, anioActual]);

  const fetchPerformanceData = async (id: number, mes: number, anio: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/report/reporteSimulacrosPuntaje", {
        idusuario: id,
        mes: monthNames[mes],
        anio: anio,
      });
      setPerformanceData(res.data.data || []);
    } catch {
      setError("Este alumno no rindió ningún simulacro aún");
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const { mejoraPercent, pendientePercent } = useMemo(() => {
    const n = performanceData.length;
    if (n < 2) return { mejoraPercent: 0, pendientePercent: 0 };
    const S1 = performanceData[0].puntaje;
    const Sn = performanceData[n - 1].puntaje;
    const mejoraPercent = ((Sn - S1) / S1) * 100;

    const xs = performanceData.map((_, i) => i);
    const ys = performanceData.map((d) => d.puntaje);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const pendientePercent = (m / S1) * 100;

    return { mejoraPercent, pendientePercent };
  }, [performanceData]);

  const getInterpretacionGrafico = (
    tipo: "mejora" | "pendiente",
    valor: number
  ) => {
    const isLow = valor <= LOW_THRESHOLD;
    const isMedium = valor > LOW_THRESHOLD && valor <= HIGH_THRESHOLD;
    const isHigh = valor > HIGH_THRESHOLD;

    if (tipo === "mejora") {
      if (isAdmin || isEstudiante) {
        if (valor <= 0)
          return isAdmin
            ? "No se ha registrado mejora en el rendimiento del estudiante"
            : "No has logrado mejorar tus resultados aún, sigue intentándolo";
        if (isLow)
          return isAdmin
            ? "La mejora total es baja. El estudiante apenas ha avanzado desde el primer simulacro"
            : "Has mejorado ligeramente desde tu primer simulacro, pero aún es muy poco para considerarlo significativo";
        if (isMedium)
          return isAdmin
            ? "El estudiante ha mostrado una mejora moderada a lo largo de los simulacros"
            : "Has mostrado una mejora moderada a lo largo de los simulacros";
        if (isHigh)
          return isAdmin
            ? "Alta mejora acumulada. El estudiante ha crecido significativamente"
            : "¡Excelente! Has mejorado muchísimo desde el primer simulacro";
      }
    }

    if (tipo === "pendiente") {
      if (isAdmin || isEstudiante) {
        if (valor <= 0)
          return isAdmin
            ? "No se observa una tendencia de progreso en los resultados del estudiante."
            : "No estás mostrando un patrón de mejora continua.";
        if (isLow)
          return isAdmin
            ? "Tendencia débil. El crecimiento entre simulacros es lento"
            : "Tu ritmo de mejora entre simulacros es bajo, debes esforzarte más";
        if (isMedium)
          return isAdmin
            ? "Tendencia moderada. El estudiante mantiene cierto crecimiento progresivo."
            : "Vas mejorando con regularidad en cada simulacro, pero aún puedes hacerlo mejor";
        if (isHigh)
          return isAdmin
            ? "Tendencia alta. El rendimiento del estudiante mejora constantemente en cada simulacro."
            : "¡Excelente ritmo! Estás mejorando constantemente en cada simulacro, sigue así";
      }
    }

    return "";
  };

  const gauges = [
    {
      title: "Mejora Total (%)",
      value: Math.min(Math.max(mejoraPercent, 0), 100),
      color: getTrafficLightColor(mejoraPercent),
      interpretation: getInterpretacionGrafico("mejora", mejoraPercent),
      icon: getIconByLevel(mejoraPercent),
      legend: [
        {
          color: "#dc2626",
          rango: `0% - ${LOW_THRESHOLD.toFixed(2)}%`,
          descripcion: isEstudiante
            ? "La mejora del estudiante ha sido mínima desde su primer simulacro"
            : "La mejora del estudiante ha sido mínima desde su primer simulacro",
        },
        {
          color: "#eab308",
          rango: `${(LOW_THRESHOLD + 0.01).toFixed(2)}% - ${HIGH_THRESHOLD.toFixed(2)}%`,
          descripcion: isEstudiante
            ? "El estudiante ha tenido una mejora moderada en su desempeño general"
            : "El estudiante ha tenido una mejora moderada en su desempeño general",
        },
        {
          color: "#16a34a",
          rango: `${(HIGH_THRESHOLD + 0.01).toFixed(2)}% - 100%`,
          descripcion: isEstudiante
            ? "El estudiante ha logrado una mejora significativa en su rendimiento global"
            : "El estudiante ha logrado una mejora significativa en su rendimiento global",
        },
      ],
    },
    {
      title: "Tendencia entre Simulacros (%)",
      value: Math.min(Math.max(pendientePercent, 0), 100),
      color: getTrafficLightColor(pendientePercent),
      interpretation: getInterpretacionGrafico("pendiente", pendientePercent),
      icon: getIconByLevel(pendientePercent),
      legend: [
        {
          color: "#dc2626",
          rango:
            `0% - ${LOW_THRESHOLD.toFixed(2)}%`,
          descripcion: isEstudiante
            ? "La tendencia del estudiante es débil. Requiere estrategias de mejora"
            : "La tendencia del estudiante es débil. Requiere estrategias de mejora",
        },
        {
          color: "#eab308",
          rango: `${(LOW_THRESHOLD + 0.01).toFixed(2)}% - ${HIGH_THRESHOLD.toFixed(2)}%`,
          descripcion: isEstudiante
            ? "El estudiante mejora entre simulacros con una tendencia aceptable"
            : "El estudiante mejora entre simulacros con una tendencia aceptable",
        },
        {
          color: "#16a34a",
          rango:
            `${(HIGH_THRESHOLD + 0.01).toFixed(2)}% - 100%`,
          descripcion: isEstudiante
            ? "El estudiante demuestra constancia y mejora sostenida entre simulacros"
            : "El estudiante demuestra constancia y mejora sostenida entre simulacros",
        },
      ],
    },
  ];

  const interpretacionCombinada = useMemo(() => {
    if (isEstudiante) {
      if (mejoraPercent <= 0 && pendientePercent <= 0)
        return "No se observa ninguna mejora en tus puntajes ni una tendencia positiva entre simulacros. Esto indica que, hasta el momento, no estás avanzando. Es posible que estés atravesando dificultades para comprender ciertos temas o mantener una constancia de estudio. Te recomendamos solicitar ayuda a tus docentes, revisar tus estrategias de preparación y no desanimarte. Aún puedes revertir esta situación con esfuerzo y organización.";
      if (mejoraPercent > HIGH_THRESHOLD && pendientePercent > HIGH_THRESHOLD)
        return "¡Increíble desempeño! Has demostrado una mejora clara desde tu primer simulacro y, además, estás avanzando con constancia en cada nuevo intento. Tu crecimiento es evidente y sostenido. Este nivel de progreso refleja una excelente preparación, compromiso con tu aprendizaje y aplicación efectiva de estrategias de estudio. ¡Sigue así, vas por un camino brillante!";
      if (mejoraPercent <= LOW_THRESHOLD && pendientePercent > HIGH_THRESHOLD)
        return "Aunque tu mejora total aún es baja, tu rendimiento viene mejorando progresivamente en los últimos simulacros. Eso indica que estás comenzando a aplicar estrategias más efectivas, y si mantienes ese ritmo, pronto verás una mejora acumulada más fuerte. No te desanimes por el resultado general, lo importante es que estás creciendo.";
      if (mejoraPercent > HIGH_THRESHOLD && pendientePercent <= LOW_THRESHOLD)
      return "Has mejorado bastante desde que comenzaste, pero tu rendimiento se ha estabilizado o estancado recientemente. Es posible que hayas alcanzado un nivel y te estés manteniendo en él sin seguir avanzando. " +
        "Intenta renovar tus métodos, desafiarte con nuevos contenidos o incluso cambiar tu ambiente de estudio para recuperar impulso.";
      return "Tu progreso es mixto. Has tenido avances, pero también momentos donde tu rendimiento se ha mantenido plano. Revisa tu evolución simulacro por simulacro para detectar cuándo avanzas más, en qué temas mejoras y en qué momentos debes reforzar. Lo importante es mantener el ritmo y no perder la motivación.";
    }

    // ADMIN
    if (mejoraPercent <= 0 && pendientePercent <= 0)
      return "El estudiante no presenta una mejora acumulada ni una tendencia positiva entre simulacros. Este comportamiento podría deberse a falta de comprensión de contenidos, desmotivación o problemas externos. Se recomienda intervenir con estrategias de refuerzo, seguimiento personalizado y, de ser necesario, asesoría pedagógica.";
    if (mejoraPercent > HIGH_THRESHOLD && pendientePercent > HIGH_THRESHOLD)
      return "El estudiante ha logrado un desempeño ejemplar: su mejora total respecto al primer simulacro es significativa, y mantiene un patrón de crecimiento estable en cada nueva evaluación. Este nivel de rendimiento refleja disciplina, dominio de los contenidos y capacidad de aplicación sostenida. Puede considerarse un caso modelo.";
    if (mejoraPercent <= LOW_THRESHOLD && pendientePercent > HIGH_THRESHOLD)
      return "Aunque el estudiante aún no acumula una mejora significativa, presenta una tendencia clara de crecimiento entre simulacros. Este es un indicador positivo de progreso reciente, por lo que se recomienda reforzar esa dinámica con motivación, apoyo docente y nuevos desafíos.";
    if (mejoraPercent > HIGH_THRESHOLD && pendientePercent <= LOW_THRESHOLD)
      return "El estudiante ha tenido un gran crecimiento desde el primer simulacro, sin embargo, su rendimiento actual se ha estancado. Esta situación puede responder a una falta de nuevas metas o repetición de estrategias que ya no son tan efectivas. Se sugiere ajustar las técnicas de estudio y renovar los contenidos de práctica.";
    return "El desempeño del estudiante combina elementos positivos y oportunidades de mejora. Ha logrado ciertos avances, pero aún debe sostener un ritmo continuo y superar momentos de estancamiento. Se sugiere una evaluación más detallada por simulacro para identificar puntos críticos y guiar su progreso.";
  }, [mejoraPercent, pendientePercent, isEstudiante, isAdmin]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-8">
      <div className="flex items-center justify-center gap-4">
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

      <div className="border border-gray-300 rounded-lg bg-white py-6 shadow">
        {loading ? (
          <p className="text-gray-600 text-lg text-center">Cargando datos...</p>
        ) : error ? (
          <p className="text-red-600 text-lg text-center">{error}</p>
        ) : performanceData.length === 0 ? (
          <p className="text-gray-600 text-lg text-center">No hay datos disponibles</p>
        ) : (
          <GraficoDeLineas data={performanceData} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {gauges.map((g, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow p-6 flex flex-col items-center"
          >
            <h3 className="text-xl font-bold text-gray-700 mb-2">{g.title}</h3>
            <div className="w-full h-48 flex items-center justify-center">
              <GaugeChart
                id={`gauge-chart-${i}`}
                nrOfLevels={3}
                arcWidth={0.25}
                colors={["#dc2626", "#eab308", "#16a34a"]}
                percent={g.value / 100}
                hideText
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="mt-6 text-4xl font-bold" style={{ color: g.color }}>
              {g.value.toFixed(2)}%
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-center" style={{ color: g.color }}>
              {g.icon}
              <span>{g.interpretation}</span>
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
                  {g.legend.map((l, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">
                        <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: l.color }} />
                      </td>
                      <td className="px-4 py-2">{l.rango}</td>
                      <td className="px-4 py-2">{l.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold text-cyan-700 mb-3 text-center flex items-center justify-center gap-2">
          <FaChartLine className="text-cyan-700" />
          Interpretación Combinada del Rendimiento
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed text-justify">
          {interpretacionCombinada}
        </p>
      </div>
    </div>
  );
};

export default RendimientoGeneral;
