import React, { useEffect, useState } from 'react';
import GraficoDeLineas from '../../../components/GraficoDeLineas';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

interface PerformanceData {
  fecha: string;
  puntaje: number;
}

const HistorialSimulacro: React.FC = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        if (!user?.iduser) {
          setError('Usuario no autenticado');
          return;
        }

        const response = await axios.post('http://127.0.0.1:8000/api/report/performance', {
          idusuario: user.iduser
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        setPerformanceData(response.data.data);
      } catch (err) {
        setError('Error al cargar los datos de rendimiento');
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user]);

  return (
    <div>
      <div className="flex flex-col justify-center items-center">
        {loading ? (
          <div>Cargando datos...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : performanceData.length === 0 ? (
          <div>No hay datos disponibles</div>
        ) : (
          <GraficoDeLineas data={performanceData} />
        )}
      </div>
    </div>
  );
};

export default HistorialSimulacro;