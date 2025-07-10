import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { FiBarChart2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext"; // Ajusta la ruta según tu estructura

interface GraficoDeLineasProps {
  data: Array<{
    fecha: string;
    puntaje: number;
  }>;
}

const calcularRectaDeTendencia = (
  datos: Array<{ fecha: string; puntaje: number }>
): { tendencia: number[] } => {
  const n = datos.length;
  if (n === 0) return { tendencia: [] };

  const xs = datos.map((_, i) => i);
  const ys = datos.map((d) => d.puntaje);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const tendencia = xs.map((x) => slope * x + intercept);

  return { tendencia };
};

const GraficoDeLineas: React.FC<GraficoDeLineasProps> = ({ data }) => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const puntajes = data.map((item) => item.puntaje);
  const minPuntaje = Math.min(...puntajes);
  const maxPuntaje = Math.max(...puntajes);
  const yDomain = [minPuntaje - 20, maxPuntaje + 20];

  const generateTicks = (min: number, max: number, step: number) => {
    const ticks: number[] = [];
    for (let i = Math.floor(min / step) * step; i <= max; i += step) {
      ticks.push(i);
    }
    return ticks;
  };

  const yTicks = generateTicks(minPuntaje - 20, maxPuntaje + 20, 20);
  const { tendencia } = calcularRectaDeTendencia(data);

  const dataConTendencia = data.map((d, i) => ({
    ...d,
    tendencia: tendencia[i],
  }));

  let hideTimeout: NodeJS.Timeout | null = null;

  const onDotMouseEnter = (
    event: React.MouseEvent<SVGCircleElement, MouseEvent>,
    index: number
  ) => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    const svg = event.currentTarget.ownerSVGElement;
    if (!svg || !containerRef.current) return;

    const pt = svg.createSVGPoint();
    pt.x = event.currentTarget.cx.baseVal.value;
    pt.y = event.currentTarget.cy.baseVal.value;

    const screenCTM = event.currentTarget.getScreenCTM();
    if (!screenCTM) return;

    const cursorpt = pt.matrixTransform(screenCTM);
    const containerRect = containerRef.current.getBoundingClientRect();

    setTooltipPos({
      x: cursorpt.x - containerRect.left,
      y: cursorpt.y - containerRect.top,
    });
    setHoverIndex(index);
  };

  const onDotMouseLeave = () => {
    hideTimeout = setTimeout(() => {
      setHoverIndex(null);
      setTooltipPos(null);
    }, 200);
  };

  const onTooltipMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  };
  
  const onTooltipMouseLeave = () => {
    hideTimeout = setTimeout(() => {
      setHoverIndex(null);
      setTooltipPos(null);
    }, 200);
  };

  return (
    <div
      className="w-full max-w-5xl py-2 relative select-none"
      ref={containerRef}
    >
      <div className="flex items-center justify-center mb-4">
        <FiBarChart2 className="text-2xl text-indigo-700 mr-2" />
        <h2 className="text-xl font-bold text-gray-700 text-center">
          Puntajes en Simulacros Realizados
        </h2>
      </div>

      <LineChart
        width={1100}
        height={480}
        data={dataConTendencia}
        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="#e5e7eb"
          vertical={false}
        />

        <XAxis
          dataKey="fecha"
          tick={{ fill: "#374151", fontSize: 14, fontWeight: 500 }}
          tickLine={{ stroke: "#d1d5db" }}
          padding={{ left: 20, right: 20 }}
          axisLine={{ stroke: "#d1d5db" }}
        />

        <YAxis
          domain={yDomain}
          ticks={yTicks}
          tick={{ fill: "#374151", fontSize: 14, fontWeight: 500 }}
          tickLine={{ stroke: "#d1d5db" }}
          axisLine={{ stroke: "#d1d5db" }}
        />

        <Legend
          wrapperStyle={{ paddingTop: "20px", fontSize: "14px" }}
          iconSize={24}
          formatter={(value) => (
            <span className="text-gray-600 font-medium text-base">{value}</span>
          )}
        />

        <Line
          type="monotone"
          dataKey="puntaje"
          name="Puntaje"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, index } = props;
            return (
              <React.Fragment key={`dot-${index}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth={2}
                  cursor="pointer"
                  onMouseEnter={(e) => onDotMouseEnter(e, index!)}
                  onMouseLeave={onDotMouseLeave}
                />
              </React.Fragment>
            );
          }}
          activeDot={{
            r: 8,
            fill: "#2563eb",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />

        <Line
          type="monotone"
          dataKey="tendencia"
          name="Tendencia"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>

      {/* Tooltip personalizado */}
      {hoverIndex !== null && tooltipPos && (
        <div
          onMouseEnter={onTooltipMouseEnter}
          onMouseLeave={onTooltipMouseLeave}
          className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg p-2 min-w-[180px] pointer-events-auto select-none font-sans text-sm text-black"
          style={{
            left: tooltipPos.x - 90,
            top: tooltipPos.y + 12,
          }}
        >
          <div className="flex items-center mb-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span>
              <strong>Fecha:</strong> {dataConTendencia[hoverIndex].fecha}
            </span>
          </div>

          <div className="flex items-center mb-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span>
              <strong>Puntaje:</strong>{" "}
              {dataConTendencia[hoverIndex].puntaje.toFixed(3)}
            </span>
          </div>

          <div className="flex items-center mb-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
            <span>
              <strong>Tendencia:</strong>{" "}
              {dataConTendencia[hoverIndex].tendencia.toFixed(3)}
            </span>
          </div>

          {hasRole(2) && (
            <button
              onClick={() =>
                navigate(
                  `/dashboard/rendimientoSimulacros/${encodeURIComponent(
                    dataConTendencia[hoverIndex].fecha
                  )}`
                )
              }
              className="mt-1 font-bold text-blue-600 hover:text-blue-800 transition-colors underline cursor-pointer"
            >
              Ver detalles
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GraficoDeLineas;
