import React from 'react'
import { ResponsiveContainer, Treemap } from 'recharts'

type Course = {
  name: string
  value: number
}

const data: Course[] = [
  { name: 'Historia', value: 70.0 },
  { name: 'Comunicología', value: 68.25 },
  { name: 'Análisis del Discurso', value: 62.5 },
  { name: 'Geografía', value: 58.0 },
  { name: 'Ciudadanía y Cívica', value: 57.7 },
  { name: 'Química', value: 57.45 },
  { name: 'Desarrollo Personal', value: 46.5 },
  { name: 'Matemática', value: 45.07 },
  { name: 'Física', value: 44.35 },
  { name: 'Inglés', value: 43.6 },
  { name: 'Economía', value: 42.0 },
  { name: 'Biología', value: 37.8 },
  { name: 'Literatura', value: 36.6 },
]

/**
 * Componente para pintar cada celda del treemap con color y texto.
 */
const CustomizedContent: React.FC<any> = ({
  x, y, width, height, name, value, index,
}) => {
  // Paleta de colores (puedes ajustarla)
  const colors = [
    '#1E90FF', '#800080', '#DAA520', '#DC143C', '#008080',
    '#00008B', '#FF69B4', '#8A2BE2', '#228B22', '#00CED1',
    '#FF8C00', '#00BFFF', '#FF4500',
  ]
  const fill = colors[index % colors.length]

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill, stroke: '#fff', strokeWidth: 2 }}
      />
      {width > 60 && height > 30 && (
        <>
          <text
            x={x + 4}
            y={y + 18}
            fill="#fff"
            fontSize={14}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + 4}
            y={y + 36}
            fill="#fff"
            fontSize={12}
          >
            {value.toFixed(2)}%
          </text>
        </>
      )}
    </g>
  )
}

const DificultadCursos: React.FC = () => {
  return (
    <div className="w-full h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-semibold mb-4">
        Porcentaje de Dificultad por Curso
      </h1>
      <div className="w-full h-96 bg-white shadow rounded-lg">
        <ResponsiveContainer>
          <Treemap
            data={data}
            dataKey="value"
            nameKey="name"
            content={<CustomizedContent />}
          />
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DificultadCursos