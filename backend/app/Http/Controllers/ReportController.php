<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{

    public function runETL()
    {
        try {
            // Ejecutar el procedimiento almacenado en la conexión datamart
            DB::connection('datamart_newton')->statement('CALL sp_refresh_etl()');

            return response()->json([
                'success' => true,
                'message' => 'Proceso ETL ejecutado correctamente'
            ]);
        } catch (\Exception $e) {
            // Registrar el error
            Log::error('Error en ETL: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar ETL: ' . $e->getMessage()
            ], 500);
        }
    }


    // Obtener el rendimiento del usuario en los simulacros
    public function reporteSimulacrosPuntaje(Request $request)
    {
        try {
            // Validar el request
            $validated = $request->validate([
                'idusuario' => 'required|integer',
                'anio' => 'required|integer',
                'mes' => 'required|string' // Mes en texto, por ejemplo: "Junio"
            ]);

            // Convertir nombre del mes a número
            $meses = [
                'Enero' => 1,
                'Febrero' => 2,
                'Marzo' => 3,
                'Abril' => 4,
                'Mayo' => 5,
                'Junio' => 6,
                'Julio' => 7,
                'Agosto' => 8,
                'Septiembre' => 9,
                'Octubre' => 10,
                'Noviembre' => 11,
                'Diciembre' => 12,
            ];
            $mesNumero = $meses[$validated['mes']] ?? null;

            if (!$mesNumero) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mes inválido',
                    'data' => []
                ], 422);
            }

            // Obtener keyusuario desde dim_usuario
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

            // Consulta principal con filtros de año y mes
            $rows = DB::connection('datamart_newton')
                ->table('hecho_simulacro as hs')
                ->join('dim_tiempo as t', 'hs.keytiempo', '=', 't.keytiempo')
                ->where('hs.keyusuario', $keyUsuario)
                ->whereYear('t.idfecha', $validated['anio'])
                ->whereMonth('t.idfecha', $mesNumero)
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
            Log::error('Error en ReportController (performance): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Obtener el tiempo promedio de uso de los materiales en minutos
    public function reportesMaterial()
    {
        try {
            // Promedio de tiempo de uso en MINUTOS con decimales (2 decimales)
            $tiempoUso = DB::connection('datamart_newton')
                ->table('hecho_consumo_material as hcm')
                ->join('dim_material as m', 'hcm.keymaterial', '=', 'm.keymaterial')
                ->select(
                    'm.tipomaterial as name',
                    // ROUND(AVG(segundos) / 60.0, 1) AS valor
                    DB::raw('ROUND(AVG(hcm.tiempototalseg) / 60.0, 1) as valor')  // Promedio en minutos :contentReference[oaicite:0]{index=0}
                )
                ->groupBy('m.tipomaterial')
                ->orderBy('valor', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'name'  => $this->mapMaterialName($item->name),
                        'valor' => (float) $item->valor  // Ya viene con 1 decimal
                    ];
                });

            // Promedio de frecuencia de uso (numero de veces consumido)
            $frecuenciaUso = DB::connection('datamart_newton')
                ->table('hecho_consumo_material as hcm')
                ->join('dim_material as m', 'hcm.keymaterial', '=', 'm.keymaterial')
                ->select(
                    'm.tipomaterial as name',
                    // ROUND(AVG(vecesconsumido), 1) AS valor
                    DB::raw('ROUND(AVG(hcm.vecesconsumido), 1) as valor')  // Promedio de veces consumidas :contentReference[oaicite:1]{index=1}
                )
                ->groupBy('m.tipomaterial')
                ->orderBy('valor', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'name'  => $this->mapMaterialName($item->name),
                        'valor' => round((float) $item->valor, 1)  // Se asegura 1 decimal
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Datos obtenidos correctamente',
                'data'    => [
                    'tiempo_uso'     => $this->ensureAllMaterials($tiempoUso),
                    'frecuencia_uso' => $this->ensureAllMaterials($frecuenciaUso),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error en ReporteMaterialController: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    private function mapMaterialName($tipoMaterial)
    {
        // Mapear nombres según requerimientos
        return match ($tipoMaterial) {
            'flashcard'    => 'Flashcards',
            'pdf'          => 'PDF',
            'video'        => 'Video',
            'solucionario' => 'Solucionario',
            default        => $tipoMaterial,
        };
    }

    private function ensureAllMaterials($collection)
    {
        // Asegurar que todos los materiales estén presentes incluso con 0
        $defaults = [
            ['name' => 'Flashcards',   'valor' => 0],
            ['name' => 'PDF',          'valor' => 0],
            ['name' => 'Video',        'valor' => 0],
            ['name' => 'Solucionario', 'valor' => 0],
        ];

        return collect($defaults)
            ->map(function ($default) use ($collection) {
                $found = $collection->firstWhere('name', $default['name']);
                return $found ?: $default;
            })
            ->sortByDesc('valor')
            ->values();
    }


    public function reporteSimulacroCursoDetalle(Request $request)
    {
        try {
            // Validación
            $validated = $request->validate([
                'idusuario' => 'required|integer',
                'anio' => 'required|integer',
                'mes' => 'required|string', // Recibes nombre: "Junio"
                'idcurso' => 'nullable|integer',
            ]);

            // Convertir nombre del mes a número
            $meses = [
                'Enero' => 1,
                'Febrero' => 2,
                'Marzo' => 3,
                'Abril' => 4,
                'Mayo' => 5,
                'Junio' => 6,
                'Julio' => 7,
                'Agosto' => 8,
                'Septiembre' => 9,
                'Octubre' => 10,
                'Noviembre' => 11,
                'Diciembre' => 12,
            ];
            $mesNumero = $meses[$validated['mes']] ?? null;

            if (!$mesNumero) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mes inválido',
                    'data' => []
                ], 422);
            }

            // Obtener keyUsuario
            $keyUsuario = DB::connection('datamart_newton')
                ->table('dim_usuario')
                ->where('idusuario', $validated['idusuario'])
                ->value('keyusuario');

            if (!$keyUsuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado.',
                    'data' => []
                ], 404);
            }

            // Base de la consulta
            $query = DB::connection('datamart_newton')
                ->table('hecho_simulacro as hs')
                ->join('dim_tiempo as t', 'hs.keytiempo', '=', 't.keytiempo')
                ->where('hs.keyusuario', $keyUsuario)
                ->whereYear('t.idfecha', $validated['anio'])
                ->whereMonth('t.idfecha', $mesNumero);

            // Si se envía idcurso, filtrar por ese curso
            if (!empty($validated['idcurso'])) {
                $keyCurso = DB::connection('datamart_newton')
                    ->table('dim_curso')
                    ->where('idcurso', $validated['idcurso'])
                    ->value('keycurso');

                if (!$keyCurso) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Curso no encontrado.',
                        'data' => []
                    ], 404);
                }

                $query->where('hs.keycurso', $keyCurso);
            }

            // Continuar con el resto de la consulta
            $rows = $query->select(
                't.idfecha',
                DB::raw('SUM(hs.enblanco) as enblanco'),
                DB::raw('SUM(hs.incorrectas) as incorrectas'),
                DB::raw('SUM(hs.correctas) as correctas')
            )
                ->groupBy('t.idfecha')
                ->orderBy('t.idfecha')
                ->get();

            // Formateo para el frontend
            $formatted = $rows->map(fn($item) => [
                'idfecha' => date('d/m/Y', strtotime($item->idfecha)),
                'preguntasEnBlanco' => (int) $item->enblanco,
                'preguntasIncorrectas' => (int) $item->incorrectas,
                'preguntasCorrectas' => (int) $item->correctas,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos obtenidos correctamente.',
                'data' => $formatted,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en reporteSimulacroCursoDetalle: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
