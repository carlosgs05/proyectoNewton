import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import {
  FaLightbulb,
  FaChartLine,
  FaBalanceScale,
  FaRegClock,
} from "react-icons/fa";
import { FiX } from "react-icons/fi";

type MaterialTime = {
  name: string;
  valor: number;
};

const formatMinutes = (val: number) => `${val.toFixed(1)} min`;
const formatVeces = (val: number) => val.toFixed(1);

const MaterialChart: React.FC<{
  data: MaterialTime[];
  color: string;
  format: (val: number) => string;
  isVertical?: boolean;
}> = ({ data, color, format, isVertical = true }) => (
  <div className="h-[500px] bg-white shadow rounded-lg p-4">
    <ResponsiveContainer width="100%" height="100%">
      {isVertical ? (
        <BarChart
          data={data}
          margin={{ top: 30, right: 20, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={format}
            tick={{ fontSize: 14 }}
          />
          <Tooltip
            formatter={(v: number) => format(v)}
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
          />
          <Bar dataKey="valor" fill={color} barSize={48} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="valor"
              position="top"
              formatter={format}
              style={{ fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      ) : (
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14 }}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14 }}
          />
          <Tooltip
            formatter={(v: number) => format(v)}
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
          />
          <Bar dataKey="valor" fill={color} barSize={20} radius={[4, 4, 4, 4]}>
            <LabelList
              dataKey="valor"
              position="right"
              formatter={format}
              style={{ fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  </div>
);

type Recommendation = {
  icon: React.ReactNode;
  title: string;
  content: string;
};

const ConsumoMaterial: React.FC = () => {
  const [timeData, setTimeData] = useState<MaterialTime[]>([]);
  const [consumedData, setConsumedData] = useState<MaterialTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const MIN_HIGH_USAGE_MIN = 5; // minutos para considerar "alto uso"
  const MIN_LOW_USAGE_MIN = 3; // minutos para "bajo uso"
  const MIN_HIGH_FREQ = 7; // veces consumido para "alta frecuencia"
  const MIN_LOW_FREQ = 3; // veces consumido para "baja frecuencia"

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/report/consumoMaterial")
      .then((response) => {
        const { tiempo_uso, frecuencia_uso } = response.data.data;
        setTimeData(tiempo_uso);
        setConsumedData(frecuencia_uso);
        generateRecommendations(tiempo_uso, frecuencia_uso);
      })
      .catch((error) => {
        console.error("Error fetching material consumption:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const generateRecommendations = (
    tiempoUso: MaterialTime[],
    frecuenciaUso: MaterialTime[]
  ) => {
    const recs: Recommendation[] = [];

    const tiempoOrdenado = [...tiempoUso].sort((a, b) => b.valor - a.valor);
    const frecuenciaOrdenada = [...frecuenciaUso].sort(
      (a, b) => b.valor - a.valor
    );

    // Material con mayor tiempo de uso
    if (tiempoOrdenado.length > 0) {
      const topMaterial = tiempoOrdenado[0];
      if (topMaterial.valor >= MIN_HIGH_USAGE_MIN) {
        recs.push({
          icon: <FaLightbulb className="w-6 h-6" />,
          title: `Enfoque en Material Destacado: ${topMaterial.name}`,
          content: `El material "${
            topMaterial.name
          }" es el que más tiempo promedio usan los estudiantes, con aproximadamente ${topMaterial.valor.toFixed(
            1
          )} minutos por sesión. Esto indica que les resulta muy útil o fácil de entender, y que probablemente aporta mucho a su aprendizaje. Por eso, es buena idea invertir en mejorar y ampliar este tipo de material para mantener a los estudiantes interesados y aprovechar este formato que funciona tan bien.`,
        });
      }
    }

    // Material con menor tiempo de uso
    if (tiempoOrdenado.length > 1) {
      const lowMaterial = tiempoOrdenado[tiempoOrdenado.length - 1];
      if (lowMaterial.valor <= MIN_LOW_USAGE_MIN) {
        recs.push({
          icon: <FaBalanceScale className="w-6 h-6" />,
          title: `Evaluar Contenido de: ${lowMaterial.name}`,
          content: `Por otro lado, el material "${
            lowMaterial.name
          }" es el que menos tiempo usan, con solo ${lowMaterial.valor.toFixed(
            1
          )} minutos en promedio. Esto puede deberse a que no les gusta, que es difícil de usar o que no lo conocen bien. Se debería revisar este material para ver cómo mejorarlo y hacerlo más accesible o atractivo para los estudiantes.`,
        });
      }
    }

    // Material con mayor frecuencia de uso
    if (frecuenciaOrdenada.length > 0) {
      const topFreqMaterial = frecuenciaOrdenada[0];
      if (topFreqMaterial.valor >= MIN_HIGH_FREQ) {
        recs.push({
          icon: <FaChartLine className="w-6 h-6" />,
          title: `Material con Mayor Frecuencia: ${topFreqMaterial.name}`,
          content: `El material "${
            topFreqMaterial.name
          }" es el que más veces ingresan los estudiantes, con un promedio de ${topFreqMaterial.valor.toFixed(
            1
          )} accesos. Esto muestra que es un recurso muy consultado y útil para ellos, algo que se debería mantener actualizado y disponible para que siga siendo así.`,
        });
      }
    }

    // Material con baja frecuencia de uso y ampliado
    if (frecuenciaOrdenada.length > 1) {
      const lowFreqMaterial = frecuenciaOrdenada[frecuenciaOrdenada.length - 1];
      if (lowFreqMaterial.valor <= MIN_LOW_FREQ) {
        recs.push({
          icon: <FaRegClock className="w-6 h-6" />,
          title: `Material con Baja Frecuencia: ${lowFreqMaterial.name}`,
          content: `El material "${
            lowFreqMaterial.name
          }" tiene pocos accesos, con apenas ${lowFreqMaterial.valor.toFixed(
            1
          )} veces. Esto puede indicar que no es tan conocido o que no resulta atractivo para los estudiantes. Tal situación puede ser resultado de una promoción insuficiente o de una percepción de baja utilidad o dificultad para usarlo. Por eso, sería recomendable revisar su contenido, mejorar su calidad y facilitar su acceso, así como promocionarlo adecuadamente para que un mayor número de estudiantes lo utilicen y se beneficien.`,
        });
      }
    }

    // Relación entre frecuencia y tiempo de uso, con ejemplos concretos
    const flashcardsFreq =
      frecuenciaUso.find((m) => m.name.toLowerCase().includes("flashcards"))
        ?.valor ?? 0;
    const flashcardsTime =
      tiempoUso.find((m) => m.name.toLowerCase().includes("flashcards"))
        ?.valor ?? 0;
    const solucionarioFreq =
      frecuenciaUso.find((m) => m.name.toLowerCase().includes("solucionario"))
        ?.valor ?? 0;
    const solucionarioTime =
      tiempoUso.find((m) => m.name.toLowerCase().includes("solucionario"))
        ?.valor ?? 0;

    recs.push({
      icon: <FaLightbulb className="w-6 h-6" />,
      title: "Relación entre Frecuencia y Tiempo de Uso",
      content: `Es importante no solo ver cuántas veces ingresan a un material, sino cuánto tiempo permanecen en él. Por ejemplo, las Flashcards tienen un promedio de ${flashcardsFreq.toFixed(
        1
      )} accesos y ${flashcardsTime.toFixed(
        1
      )} minutos de uso, indicando que no solo entran varias veces sino que también se quedan estudiando el material. En cambio, el Solucionario tiene alrededor de ${solucionarioFreq.toFixed(
        1
      )} accesos y apenas ${solucionarioTime.toFixed(
        1
      )} minutos, lo que puede indicar que los estudiantes ingresan pero no dedican mucho tiempo a ese recurso. Esto nos ayuda a entender cuáles materiales realmente están siendo aprovechados y cuáles solo se consultan rápidamente, para decidir qué mejorar, promover o replantear.`,
    });

    // Comparación por cantidad de veces que ingresan a cada material
    recs.push({
      icon: <FaChartLine className="w-6 h-6" />,
      title: "Comparación de Materiales según Accesos Promedio",
      content: `Comparando la cantidad promedio de veces que los estudiantes ingresan a cada material, vemos claras diferencias. Por ejemplo, las Flashcards tienen un promedio de ${flashcardsFreq.toFixed(
        1
      )} accesos, mientras que el Solucionario sólo llega a ${solucionarioFreq.toFixed(
        1
      )} accesos. Esto muestra qué materiales prefieren y usan más, y cuáles están menos aprovechados. Con esta información, podemos enfocar esfuerzos en fortalecer y promocionar los recursos más valorados y buscar mejorar o darle mayor visibilidad a los menos usados, para tener una oferta más equilibrada y efectiva.`,
    });

    setRecommendations(recs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-extrabold mb-5 text-cyan-700 text-center uppercase">
          Reporte de Consumo de Materiales
        </h1>

        <button
          onClick={() => setShowRecommendations(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg
                     transition-all flex items-center shadow-md hover:shadow-lg cursor-pointer"
        >
          <FaLightbulb className="mr-2" />
          Ver Recomendaciones
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-cyan-600 mb-4 flex items-center">
              <FaRegClock className="mr-2" />
              Tiempo de Uso por Material (minutos)
            </h2>
            <MaterialChart
              data={timeData}
              color="#1E40AF"
              format={formatMinutes}
              isVertical={true}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-green-600 mb-4 flex items-center">
              <FaChartLine className="mr-2" />
              Frecuencia de Uso (veces consumido)
            </h2>
            <MaterialChart
              data={consumedData}
              color="#059669"
              format={formatVeces}
              isVertical={false}
            />
          </div>
        </div>

        {showRecommendations && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] overflow-y-auto relative shadow-xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaLightbulb className="mr-2 text-cyan-600" />
                  Recomendaciones Estratégicas
                </h3>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer"
                  aria-label="Cerrar recomendaciones"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 text-sm leading-relaxed">
                {recommendations.length === 0 ? (
                  <p className="text-gray-600">
                    No hay recomendaciones disponibles.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-start mb-3">
                          <span className="text-cyan-600 mr-3 mt-1">
                            {rec.icon}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {rec.title}
                          </h4>
                        </div>
                        <p className="text-gray-700 text-justify whitespace-pre-line">
                          {rec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumoMaterial;
