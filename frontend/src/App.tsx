import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./autenticacion/Login";
import Layout from "../src/dashboard/Layout";
import Home from "./dashboard/pages/Home";
import Usuarios from "./dashboard/pages/Usuarios";
import ConsumoMaterial from "./dashboard/pages/reportes/ConsumoMaterial";
import RendimientoSimulacro from "./dashboard/pages/reportes/RendimientoSimulacro";
import Contenidos from "./dashboard/pages/Contenidos";
import CursoDetalle from "./dashboard/pages/CursoDetalle";
import MiPerfil from "./dashboard/pages/MiPerfil";
import TemasAdmin from "./dashboard/pages/TemasAdmin";
import MaterialesAdmin from "./dashboard/pages/MaterialesAdmin";
import Simulacros from "./dashboard/pages/Simulacros";
import DetallesSimulacro from "./dashboard/pages/reportes/DetalleSimulacro";
import MetodoEstudio from "./dashboard/pages/MetodoEstudio";
import MaterialPriorizado from "./dashboard/pages/MaterialPriorizado";

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
            <Route path="mi-perfil" element={<MiPerfil />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="contenido" element={<Contenidos />} />
            <Route path="material-exclusivo" element={<MaterialPriorizado />} />
            {/* Rutas protegidas para los contenidos */}
            <Route path="simulacros" element={<Simulacros />} />
            <Route path="cursos/:idcurso/temas" element={<TemasAdmin />} />
            <Route
              path="cursos/:idcurso/temas/:idtema/materiales"
              element={<MaterialesAdmin />}
            />
            <Route path="cursos/:idcurso" element={<CursoDetalle />} />
            <Route
              path="rendimientoSimulacros"
              element={<RendimientoSimulacro />}
            />
            <Route
              path="rendimientoSimulacros/:fecha"
              element={<DetallesSimulacro />}
            />
            <Route path="metodoEstudio" element={<MetodoEstudio />} />
            {/* Rutas protegidas para los reportes */}
            <Route path="consumoMaterial" element={<ConsumoMaterial />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
