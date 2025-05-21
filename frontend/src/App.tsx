import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './autenticacion/Login';
import Layout from '../src/dashboard/Layout';
import Home from './dashboard/pages/Home';
import Usuarios from './dashboard/pages/Usuarios';
import DificultadCursos from './dashboard/pages/reportes/DificultadCursos';
import ConsumoMaterial from './dashboard/pages/reportes/ConsumoMaterial';
import HistorialSimulacro from './dashboard/pages/reportes/HistorialSimulacro';
import Contenidos from './dashboard/pages/Contenidos';
import CursoDetalle from './dashboard/pages/CursoDetalle';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta raíz: login */}
        <Route element={<GuestRoute />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* Ruta protegida para dashboard (cualquier rol logueado) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path='usuarios' element={<Usuarios />} />
            <Route path='contenido' element={<Contenidos />} />
            <Route path="cursos/:idcurso" element={<CursoDetalle />} />
            <Route path='historialPuntajes' element={<HistorialSimulacro />} />
            {/* Rutas protegidas para los reportes */}
            <Route path='dificultadCursos' element={<DificultadCursos />} />
            <Route path='consumoMaterial' element={<ConsumoMaterial />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;