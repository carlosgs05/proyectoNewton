<?php

namespace App\Http\Controllers;

use App\Services\ETLService;
use Illuminate\Http\Request;

class ETLController extends Controller
{
    public function runFullETL(ETLService $etlService)
    {
        try {
            $etlService->runFullETL();
            return response()->json(['success' => true, 'message' => 'ETL completo ejecutado']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function runUsuarioETL(ETLService $etlService)
    {
        try {
            $etlService->clearAllDimensions();
            $etlService->cargarDimensionUsuario();
            return response()->json(['success' => true, 'message' => 'Dimensión Usuario cargada']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function runTiempoETL(ETLService $etlService)
    {
        try {
            $etlService->clearAllDimensions();
            $etlService->cargarDimensionTiempo();
            return response()->json(['success' => true, 'message' => 'Dimensión Tiempo cargada']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function runTemaETL(ETLService $etlService)
    {
        try {
            $etlService->clearAllDimensions();
            $etlService->cargarDimensionTema();
            return response()->json(['success' => true, 'message' => 'Dimensión Tema cargada']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}