<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\Simulacro;
use App\Models\EstudianteSimulacro;
use App\Models\MetodoAprendizaje;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use App\Models\MaterialTema;
use Throwable;

class MetodoAprendizajeController extends Controller
{
    public function getCursosRecomendados($idusuario, $mes, $anio)
    {
        // Validar parámetros
        if (!is_numeric($idusuario) || !is_numeric($mes) || !is_numeric($anio)) {
            return response()->json(['error' => 'Parámetros inválidos'], 400);
        }

        // Calcular mes anterior
        try {
            $fecha = Carbon::createFromDate($anio, $mes, 1);
            $mesAnterior = $fecha->subMonth();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Fecha inválida'], 400);
        }

        // Obtener IDs de simulacros del mes anterior
        $simulacros = Simulacro::whereMonth('created_at', $mesAnterior->month)
            ->whereYear('created_at', $mesAnterior->year)
            ->pluck('idsimulacro');

        if ($simulacros->isEmpty()) {
            return response()->json(['cursos' => []]);
        }

        // Obtener registros de estudiante_simulacro
        $registros = EstudianteSimulacro::whereIn('idsimulacro', $simulacros)
            ->where('idusuario', $idusuario)
            ->whereNotNull('datossugerencias')
            ->get();

        $cursosAgregados = [];

        foreach ($registros as $registro) {
            $datosSugerencias = json_decode($registro->datossugerencias, true);

            if (!is_array($datosSugerencias)) continue;

            foreach ($datosSugerencias as $curso) {
                $idCurso = $curso['idcurso'];

                // Inicializar curso si no existe
                if (!isset($cursosAgregados[$idCurso])) {
                    $cursosAgregados[$idCurso] = [
                        'nombrecurso' => $curso['nombrecurso'],
                        'temas' => []
                    ];
                }

                // Agregar temas únicos
                foreach ($curso['temas'] as $tema) {
                    $idTema = $tema['idtema'];

                    // Evitar duplicados dentro del mismo curso
                    if (!isset($cursosAgregados[$idCurso]['temas'][$idTema])) {
                        $cursosAgregados[$idCurso]['temas'][$idTema] = [
                            'idtema' => $idTema,
                            'nombretema' => $tema['nombretema']
                        ];
                    }
                }
            }
        }

        // Preparar estructura final
        $resultado = ['cursos' => []];

        foreach ($cursosAgregados as $idCurso => $curso) {
            $temas = array_values($curso['temas']);

            $resultado['cursos'][] = [
                'nombrecurso' => $curso['nombrecurso'],
                'temas' => $temas,
                'nrotemas' => count($temas)
            ];
        }

        return response()->json($resultado);
    }

    public function getCursosConTemas()
    {
        $cursos = Curso::with('temas')->get();

        return response()->json([
            'success' => true,
            'data' => $cursos
        ]);
    }

    public function getMetodoAprendizajeEstudiante($idusuario, $mes, $anio)
    {
        // Validar parámetros
        if (!is_numeric($idusuario) || !is_numeric($mes) || !is_numeric($anio)) {
            return response()->json(['error' => 'Parámetros inválidos'], 400);
        }

        // Validar rango de mes
        $mes = (int) $mes;
        if ($mes < 1 || $mes > 12) {
            return response()->json(['error' => 'Mes fuera de rango'], 400);
        }

        // Mapeo de números a nombres de mes en español
        $nombresMes = [
            1  => 'Enero',
            2  => 'Febrero',
            3  => 'Marzo',
            4  => 'Abril',
            5  => 'Mayo',
            6  => 'Junio',
            7  => 'Julio',
            8  => 'Agosto',
            9  => 'Septiembre',
            10 => 'Octubre',
            11 => 'Noviembre',
            12 => 'Diciembre',
        ];
        $mesNombre = $nombresMes[$mes];

        // Obtener el método de aprendizaje consultando por nombre de mes
        $metodo = MetodoAprendizaje::where('idusuario', $idusuario)
            ->where('mes', $mesNombre)
            ->where('año', $anio)
            ->first();

        if (!$metodo) {
            return response()->json([
                'success' => false,
                'message' => 'Método de aprendizaje no encontrado',
                'data'    => null
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Método de aprendizaje encontrado',
            'data'    => $metodo
        ]);
    }

    public function registrarMetodoAprendizaje(Request $request)
    {
        try {
            // 1. Validación mejorada con mensajes personalizados
            $validator = Validator::make($request->all(), [
                'idusuario'     => 'required|integer|exists:usuario,idusuario',
                'mes'           => 'required|integer|between:1,12',
                'año'           => 'required|integer|min:2000',
                'lista_cursos'  => 'required|json',
            ], [
                'idusuario.exists' => 'El usuario especificado no existe',
                'mes.between' => 'El mes debe estar entre 1 y 12',
                'lista_cursos.json' => 'El campo lista_cursos debe ser un JSON válido',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // 2. Mapear número de mes a nombre en español
            $nombresMes = [
                1  => 'Enero',
                2  => 'Febrero',
                3  => 'Marzo',
                4  => 'Abril',
                5  => 'Mayo',
                6  => 'Junio',
                7  => 'Julio',
                8  => 'Agosto',
                9  => 'Septiembre',
                10 => 'Octubre',
                11 => 'Noviembre',
                12 => 'Diciembre',
            ];

            $mesNumero = (int) $data['mes'];
            $mesNombre = $nombresMes[$mesNumero] ?? 'Desconocido';

            // 3. Crear el nuevo registro
            $metodo = MetodoAprendizaje::create([
                'idusuario'    => $data['idusuario'],
                'mes'          => $mesNombre,
                'año'          => $data['año'],
                'lista_cursos' => $data['lista_cursos'],
            ]);

            // 4. Responder al cliente
            return response()->json([
                'success' => true,
                'message' => 'Método de aprendizaje registrado correctamente',
                'data'    => $metodo
            ], 201);
        } catch (Throwable $e) {
            Log::error('Error en registrarMetodoAprendizaje: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error'   => config('app.debug') ? $e->getMessage() : 'Contacte al administrador'
            ], 500);
        }
    }

    public function obtenerMaterialesExclusivos(int $idusuario, int $mes, int $año): JsonResponse
    {
        try {
            // Convertir número de mes a nombre
            $meses = [
                1 => 'Enero',
                2 => 'Febrero',
                3 => 'Marzo',
                4 => 'Abril',
                5 => 'Mayo',
                6 => 'Junio',
                7 => 'Julio',
                8 => 'Agosto',
                9 => 'Septiembre',
                10 => 'Octubre',
                11 => 'Noviembre',
                12 => 'Diciembre'
            ];

            if (!isset($meses[$mes])) {
                return response()->json([
                    'success' => true,
                    'status' => 'invalid_month',
                    'message' => 'El mes debe ser un valor entre 1 y 12',
                    'data' => ['cursos' => []]
                ]);
            }

            $nombreMes = $meses[$mes];

            // Buscar el registro en metodo_aprendizaje
            $metodo = MetodoAprendizaje::where('idusuario', $idusuario)
                ->where('mes', $nombreMes)
                ->where('año', $año)
                ->first();

            if (!$metodo) {
                return response()->json([
                    'success' => true,
                    'status' => 'no_methodology',
                    'message' => 'No se encontró metodología para el usuario, mes y año especificados',
                    'data' => ['cursos' => []]
                ]);
            }

            // Decodificar el JSON
            $listaCursos = json_decode($metodo->lista_cursos, true);

            if (!$listaCursos || !isset($listaCursos['cursos'])) {
                return response()->json([
                    'success' => true,
                    'status' => 'invalid_structure',
                    'message' => 'El formato de lista_cursos es incorrecto',
                    'data' => ['cursos' => []]
                ]);
            }

            $resultado = [];

            // Recorrer cada curso
            foreach ($listaCursos['cursos'] as $curso) {
                if (empty($curso['temas']) || !is_array($curso['temas'])) {
                    continue;
                }

                $cursoData = [
                    'idcurso' => $curso['idcurso'] ?? null,
                    'nombrecurso' => $curso['nombrecurso'] ?? 'Curso sin nombre',
                    'temas' => []
                ];

                // Recorrer cada tema del curso
                foreach ($curso['temas'] as $tema) {
                    $idtema = $tema['idtema'] ?? null;
                    $nombretema = $tema['nombretema'] ?? 'Tema sin nombre';

                    if (!$idtema) {
                        continue;
                    }

                    // OBTENER MATERIALES POR idtema (en minúsculas para PostgreSQL)
                    $materiales = MaterialTema::where('idtema', $idtema)
                        ->where('exclusivo', true)
                        ->get(['idmaterial', 'tipomaterial', 'url'])
                        ->map(function ($material) {
                            return [
                                'idmaterial' => $material->idmaterial,
                                'tipo' => $material->tipomaterial,
                                'nombrematerial' => $material->nombrematerial ?? 'Material sin nombre',
                                'url' => $material->url
                            ];
                        })
                        ->toArray();

                    $cursoData['temas'][] = [
                        'idtema' => $idtema,
                        'nombretema' => $nombretema,
                        'materiales_exclusivos' => $materiales
                    ];
                }

                $resultado[] = $cursoData;
            }

            return response()->json([
                'success' => true,
                'status' => 'success',
                'message' => count($resultado) > 0
                    ? 'Materiales exclusivos obtenidos correctamente'
                    : 'No se encontraron materiales exclusivos para los cursos seleccionados',
                'data' => ['cursos' => $resultado]
            ]);
        } catch (Throwable $e) {
            Log::error("Error en obtenerMaterialesExclusivos: " . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => true,
                'status' => 'server_error',
                'message' => 'Ocurrió un error al procesar la solicitud',
                'data' => ['cursos' => []]
            ]);
        }
    }
}
