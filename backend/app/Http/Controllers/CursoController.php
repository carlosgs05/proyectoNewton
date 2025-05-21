<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CursoController extends Controller
{
    // Recupera todos los cursos con sus temas y materiales.
    public function getAllCursos(): JsonResponse
    {
        try {
            // Eager loading de temas y materiales
            $cursos = Curso::with(['temas.materiales'])->get();

            return response()->json([
                'success' => true,
                'message' => 'Cursos obtenidos correctamente',
                'data'    => $cursos
            ]);
        } catch (\Exception $e) {
            Log::error('Error en CursoController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los cursos'
            ], 500);
        }
    }
}
