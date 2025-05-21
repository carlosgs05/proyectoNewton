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
  FaTimes,
} from "react-icons/fa";

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

const recommendations = [
  {
    icon: <FaLightbulb className="w-6 h-6" />,
    title: "Enfoque en Materiales Destacados",
    content:
      "Los Flashcards lideran con 8.0 min de uso. Recomendamos incrementar contenido en este formato.",
  },
  {
    icon: <FaChartLine className="w-6 h-6" />,
    title: "Optimización de Recursos",
    content:
      "El solucionario muestra bajo tiempo de uso (2.0 min). Evaluar actualización de contenido.",
  },
  {
    icon: <FaBalanceScale className="w-6 h-6" />,
    title: "Balance de Formatos",
    content:
      "Mantener equilibrio entre PDF (6.0 min) y materiales visuales (Video 4.0 min).",
  },
  {
    icon: <FaRegClock className="w-6 h-6" />,
    title: "Distribución Temporal",
    content:
      "El tiempo total de 20.0 min muestra buena adopción. Priorizar formatos más efectivos.",
  },
];

const ConsumoMaterial: React.FC = () => {
  const [timeData, setTimeData] = useState<MaterialTime[]>([]);
  const [consumedData, setConsumedData] = useState<MaterialTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/report/consumoMaterial")
      .then((response) => {
        const { tiempo_uso, frecuencia_uso } = response.data.data;
        setTimeData(tiempo_uso);
        setConsumedData(frecuencia_uso);
      })
      .catch((error) => {
        console.error("Error fetching material consumption:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
        <h1 className="text-2xl font-bold mb-5 text-cyan-700 text-center uppercase">
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
            <div className="bg-white rounded-xl w-full max-w-3xl relative">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FaLightbulb className="mr-2 text-cyan-600" />
                  Recomendaciones Estratégicas
                </h3>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
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
                      <p className="text-gray-600 leading-relaxed pl-9">
                        {rec.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumoMaterial;
