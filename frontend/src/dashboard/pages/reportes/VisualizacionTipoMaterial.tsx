// MultiReportTabs.tsx
import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts'

type MaterialTime = {
  name: string
  valor: number
}

const timeData: MaterialTime[] = [
  { name: 'Flashcards', valor: 3200 },
  { name: 'PDF',         valor: 3100 },
  { name: 'Video',       valor: 2400 },
  { name: 'Solucionario',valor: 1700 },
]

const consumedData: MaterialTime[] = [
  { name: 'PDF',         valor: 6.0 },
  { name: 'Flashcards',  valor: 5.8 },
  { name: 'Video',       valor: 4.0 },
  { name: 'Solucionario',valor: 3.0 },
]

/** Formatea el valor numérico (en segundos) a texto con 'mil' */
const formatMil = (val: number) => `${(val / 1000).toFixed(1)} mil`

/** Formatea el valor de veces consumido */
const formatVeces = (val: number) => val.toFixed(1)

/** Primer reporte: barras verticales de tiempo total */
const TimeBarChart: React.FC = () => (
  <div className="w-full h-96 bg-white shadow rounded-lg p-4">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14 }} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={formatMil} tick={{ fontSize: 14 }} />
        <Tooltip formatter={(v: number) => formatMil(v)} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Bar dataKey="valor" fill="#1E40AF" barSize={48} radius={[4,4,0,0]}>
          <LabelList dataKey="valor" position="top" formatter={formatMil} style={{ fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
)

/** Segundo reporte: barras horizontales de veces consumido */
const ConsumedBarChart: React.FC = () => (
  <div className="w-full h-96 bg-white shadow rounded-lg p-4">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={consumedData}
        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
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
        <Tooltip formatter={(v: number) => formatVeces(v)} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Bar dataKey="valor" fill="#059669" barSize={20} radius={[4,4,4,4]}>
          <LabelList
            dataKey="valor"
            position="right"
            formatter={formatVeces}
            style={{ fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
)

const VisualizacionTipoMaterial: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tiempo' | 'veces'>('tiempo')

  return (
    <div className="w-full p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Reportes de Materiales
        </h1>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('tiempo')}
            className={`px-4 py-2 -mb-px font-medium text-lg ${
              activeTab === 'tiempo'
                ? 'border-b-4 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tiempo Total
          </button>
          <button
            onClick={() => setActiveTab('veces')}
            className={`ml-6 px-4 py-2 -mb-px font-medium text-lg ${
              activeTab === 'veces'
                ? 'border-b-4 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Veces Consumido
          </button>
        </div>
        {/* Content */}
        {activeTab === 'tiempo' ? (
          <TimeBarChart />
        ) : (
          <ConsumedBarChart />
        )}
      </div>
    </div>
  )
}

export default VisualizacionTipoMaterial