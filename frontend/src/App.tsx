import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './autenticacion/Login';
import Layout from '../src/dashboard/Layout';
import Home from './dashboard/pages/Home';
import HistorialSimulacro from './dashboard/pages/reportes/HistorialSimulacro';

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
            <Route path='historialPuntajes' element={<HistorialSimulacro />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;