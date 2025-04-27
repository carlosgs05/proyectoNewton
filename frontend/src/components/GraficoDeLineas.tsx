import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface GraficoDeLineasProps {
  data: Array<{
    fecha: string;
    puntaje: number;
  }>;
}

const GraficoDeLineas: React.FC<GraficoDeLineasProps> = ({ data }) => {
  const puntajes = data.map(item => item.puntaje);
  const minPuntaje = Math.min(...puntajes);
  const maxPuntaje = Math.max(...puntajes);

  const yDomain = [minPuntaje - 20, maxPuntaje + 20];

  const generateTicks = (min: number, max: number, step: number) => {
    const ticks = [];
    for (let i = Math.floor(min / step) * step; i <= max; i += step) {
      ticks.push(i);
    }
    return ticks;
  };

  const yTicks = generateTicks(minPuntaje - 20, maxPuntaje + 20, 20);

  return (
    <div className="w-full max-w-6xl pt-7 px-6 pb-2 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Rendimiento en Simulacros (Puntaje vs Fecha)
      </h2>

      <div className="w-full overflow-x-auto">
        <LineChart
          width={1100}
          height={490}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#e5e7eb"
            vertical={false}
          />

          <XAxis
            dataKey="fecha"
            tick={{
              fill: '#374151',
              fontSize: 14,  // Aumentado de 12 a 14
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
            tickLine={{ stroke: '#d1d5db' }}
            padding={{ left: 20, right: 20 }}
            axisLine={{ stroke: '#d1d5db' }}
          />

          <YAxis
            domain={yDomain}
            ticks={yTicks}
            tick={{
              fill: '#374151',
              fontSize: 14,  // Aumentado de 12 a 14
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
            tickLine={{ stroke: '#d1d5db' }}
            axisLine={{ stroke: '#d1d5db' }}
          />

          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '12px',
              fontSize: '14px',  // Añadido tamaño de fuente
            }}
            itemStyle={{
              color: '#3b82f6',
              fontWeight: 500,
              fontSize: '14px'  // Añadido tamaño de fuente
            }}
          />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',  // Añadido tamaño de fuente
            }}
            iconSize={24}  // Aumentado el tamaño del icono
            formatter={(value) => (
              <span className="text-gray-600 font-medium text-base">
                {value}
              </span>
            )}
          />

          <Line
            type="monotone"
            dataKey="puntaje"
            name="Puntaje"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{
              fill: '#3b82f6',
              stroke: '#ffffff',
              strokeWidth: 2,
              r: 5,
              className: 'hover:r-6 transition-all'
            }}
            activeDot={{
              r: 8,
              fill: '#2563eb',
              stroke: '#ffffff',
              strokeWidth: 2,
            }}
            className="transition-colors duration-200"
          />
        </LineChart>
      </div>
    </div>
  );
};

export default GraficoDeLineas;