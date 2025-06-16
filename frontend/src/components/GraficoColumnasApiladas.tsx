import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { FiBarChart2 } from "react-icons/fi";

export interface DataPoint {
  idfecha: string;
  preguntasEnBlanco: number;
  preguntasIncorrectas: number;
  preguntasCorrectas: number;
}

interface ChartProps {
  data: DataPoint[];
  className?: string;
}

const GraficoColumnasApiladas: React.FC<ChartProps> = ({
  data,
  className = "",
}) => {
  return (
    <div className={`w-full max-w-6xl mx-auto bg-white px-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <FiBarChart2 className="text-2xl text-indigo-700 mr-2" />
        <h2 className="text-xl font-bold text-gray-700 text-center">
          Rendimiento por Curso en Simulacros Realizados
        </h2>
      </div>

      {/* Chart Container */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
          >
            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              opacity={0.2}
            />

            {/* X Axis */}
            <XAxis
              dataKey="idfecha"
              tick={{ fill: "#374151", fontSize: 14, fontWeight: 500 }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
              interval={0}
            />

            {/* Y Axis */}
            <YAxis
              tick={{ fill: "#374151", fontSize: 14, fontWeight: 500 }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                borderColor: "#E5E7EB",
              }}
              itemStyle={{
                fontWeight: 500,
                fontSize: 14,
              }}
              labelStyle={{ color: "#4B5563", fontWeight: 600 }}
              formatter={(value: number, name: string) => {
                let color = "#000";
                if (name === "Preguntas en blanco") color = "#c2410c";
                else if (name === "Preguntas incorrectas") color = "#1e3a8a";
                else if (name === "Preguntas correctas") color = "#065f46";
                return <span style={{ color }}>{value}</span>;
              }}
            />

            {/* Legend */}
            <Legend
              wrapperStyle={{ paddingTop: "20px", fontSize: "14px" }}
              iconSize={24}
              formatter={(value) => (
                <span className="text-gray-600 font-medium text-base">
                  {value}
                </span>
              )}
            />

            {/* Bars */}
            <Bar
              dataKey="preguntasEnBlanco"
              name="Preguntas en blanco"
              fill="#c2410c"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="preguntasEnBlanco"
                position="top"
                style={{ fill: "#c2410c", fontWeight: 600 }}
              />
            </Bar>

            <Bar
              dataKey="preguntasIncorrectas"
              name="Preguntas incorrectas"
              fill="#1e3a8a"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="preguntasIncorrectas"
                position="top"
                style={{ fill: "#1e3a8a", fontWeight: 600 }}
              />
            </Bar>

            <Bar
              dataKey="preguntasCorrectas"
              name="Preguntas correctas"
              fill="#065f46"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="preguntasCorrectas"
                position="top"
                style={{ fill: "#065f46", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoColumnasApiladas;
