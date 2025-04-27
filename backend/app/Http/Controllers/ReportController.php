<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function performance(Request $request)
    {
        try {
            // Validar el request
            $validated = $request->validate([
                'idusuario' => 'required|integer'  // Cambiado a minúsculas
            ]);

            // Obtener el keyusuario desde dim_usuario
            $keyUsuario = DB::connection('datamart_newton')
                ->table('dim_usuario')
                ->where('idusuario', $validated['idusuario'])
                ->value('keyusuario');

            if (!$keyUsuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado en el datamart.',
                    'data' => []
                ], 404);
            }

            // Consulta principal
            $rows = DB::connection('datamart_newton')
                ->table('hecho_simulacro as hs')
                ->join('dim_tiempo as t', 'hs.keytiempo', '=', 't.keytiempo')
                ->where('hs.keyusuario', $keyUsuario)
                ->select(
                    't.idfecha',
                    DB::raw('SUM(hs.puntajetotal) as puntaje')
                )
                ->groupBy('t.idfecha')
                ->orderBy('t.idfecha')
                ->get();

            // Formatear respuesta
            $formattedData = $rows->map(function ($item) {
                return [
                    'fecha' => date('d/m/Y', strtotime($item->idfecha)),
                    'puntaje' => (float)$item->puntaje
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Datos obtenidos correctamente',
                'data' => $formattedData
            ]);

        } catch (\Exception $e) {
            Log::error('Error en ReportController: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}