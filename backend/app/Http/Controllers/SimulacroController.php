<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Simulacro;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SimulacroController extends Controller
{
    public function obtenerTodosLosSimulacros()
    {
        try {
            $simulacros = Simulacro::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Simulacros obtenidos correctamente',
                'data'    => $simulacros
            ]);
        } catch (\Exception $e) {
            Log::error('Error en SimulacroController@obtenerTodosLosSimulacros: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los simulacros'
            ], 500);
        }
    }

    public function obtenerSimulacrosRealizados()
    {
        try {
            $fechaActual = now(); // Obtiene la fecha y hora actual del sistema
            $simulacros = Simulacro::where('created_at', '<', $fechaActual)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Simulacros realizados hasta la fecha actual obtenidos correctamente',
                'data'    => $simulacros
            ]);
        } catch (\Exception $e) {
            Log::error('Error en SimulacroController@obtenerSimulacrosRealizados: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener simulacros realizados'
            ], 500);
        }
    }

    public function obtenerEstudiantesPorSimulacro($idsimulacro)
    {
        try {
            // Usamos join para obtener datos de usuario y puntaje + hoja_respuesta del simulacro
            $estudiantes = DB::connection('dbnewton')
                ->table('estudiante_simulacro as es')
                ->join('usuario as u', 'es.idusuario', '=', 'u.idusuario')
                ->where('es.idsimulacro', '=', $idsimulacro)
                ->select(
                    'u.idusuario',
                    'u.nombre',
                    'u.apellido',
                    'u.correo',
                    'es.puntajetotal',
                    'es.pdfhojarespuesta'
                )
                ->orderBy('es.puntajetotal', 'desc') // Ordenar por puntaje total
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Estudiantes que rindieron el simulacro obtenidos correctamente',
                'data'    => $estudiantes
            ]);
        } catch (\Exception $e) {
            Log::error('Error en SimulacroController@obtenerEstudiantesPorSimulacro: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes del simulacro'
            ], 500);
        }
    }

    public function registrarSimulacroAdmin(Request $request)
    {
        $request->validate([
            'nombresimulacro' => 'required|string|max:100',
            'fecha' => 'required|date_format:Y-m-d',
            'pdfexamen' => 'required|file|mimes:pdf',
            'pdfrespuestas' => 'required|file|mimes:xlsx',
            'pdfsolucionario' => 'required|file|mimes:pdf',
        ]);

        $nombreSimulacroInput = $request->input('nombresimulacro');

        // Validar que no exista ya un simulacro con ese nombre
        $existeSimulacro = DB::connection('dbnewton')
            ->table('simulacro')
            ->where('nombresimulacro', $nombreSimulacroInput)
            ->exists();

        if ($existeSimulacro) {
            return response()->json([
                'success' => false,
                'message' => "El nombre del simulacro '{$nombreSimulacroInput}' ya está registrado.",
            ], 422);
        }

        $nombreSimulacro = Str::slug($nombreSimulacroInput, '_');
        $fecha = $request->input('fecha'); // formato Y-m-d

        $carpetaDestino = public_path("simulacros/{$nombreSimulacro}");
        if (!file_exists($carpetaDestino)) {
            mkdir($carpetaDestino, 0755, true);
        }

        $nombreExamen = "examen_simulacro_{$fecha}.pdf";
        $nombreRespuestas = "respuestas_correctas_simulacro_{$fecha}.xlsx";
        $nombreSolucionario = "solucionario_examen_simulacro_{$fecha}.pdf";

        $request->file('pdfexamen')->move($carpetaDestino, $nombreExamen);
        $request->file('pdfrespuestas')->move($carpetaDestino, $nombreRespuestas);
        $request->file('pdfsolucionario')->move($carpetaDestino, $nombreSolucionario);

        $rutaExamen = "simulacros/{$nombreSimulacro}/{$nombreExamen}";
        $rutaRespuestas = "simulacros/{$nombreSimulacro}/{$nombreRespuestas}";
        $rutaSolucionario = "simulacros/{$nombreSimulacro}/{$nombreSolucionario}";

        try {
            // Insertar y obtener idsimulacro con RETURNING idsimulacro (PostgreSQL)
            $result = DB::connection('dbnewton')
                ->select(
                    'INSERT INTO simulacro (nombresimulacro, pdfexamen, pdfrespuestas, pdfsolucionario, created_at) VALUES (?, ?, ?, ?, ?) RETURNING idsimulacro',
                    [
                        $nombreSimulacroInput,
                        $rutaExamen,
                        $rutaRespuestas,
                        $rutaSolucionario,
                        $fecha . ' 00:00:00',
                    ]
                );

            if (empty($result)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo insertar el simulacro',
                ]);
            }

            $idSimulacro = $result[0]->idsimulacro;

            // Leer JSON directamente del archivo local
            $rutaArchivoJsonCursos = base_path('../python/cursos_examen.json');

            if (!file_exists($rutaArchivoJsonCursos)) {
                return response()->json([
                    'success' => false,
                    'message' => "Archivo JSON de cursos no encontrado en ruta: {$rutaArchivoJsonCursos}",
                ]);
            }

            $jsonCompletoCursos = file_get_contents($rutaArchivoJsonCursos);

            // Guardar archivo temporal para enviarlo a FastAPI
            $rutaJsonCursosTemporal = storage_path("app/temp_cursos_{$idSimulacro}.json");
            file_put_contents($rutaJsonCursosTemporal, $jsonCompletoCursos);

            // Llamar a FastAPI /ordenar-cursos-preguntas enviando PDF y JSON completo
            $responseCursosPreguntas = Http::attach(
                'pdf_file',
                file_get_contents($carpetaDestino . '/' . $nombreExamen),
                $nombreExamen
            )->attach(
                'json_file',
                file_get_contents($rutaJsonCursosTemporal),
                "cursos_{$idSimulacro}.json"
            )->post('https://proyectonewton.onrender.com/ordenar-cursos-preguntas');

            if ($responseCursosPreguntas->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al llamar a FastAPI ordenar-cursos-preguntas',
                    'error' => $responseCursosPreguntas->body(),
                ]);
            }
            $jsonCursosPreguntas = $responseCursosPreguntas->json();

            // Llamar a FastAPI /obtener-respuestas-admin enviando Excel
            $responseRespuestasAdmin = Http::attach(
                'file',
                file_get_contents($carpetaDestino . '/' . $nombreRespuestas),
                $nombreRespuestas
            )->post('https://proyectonewton.onrender.com/obtener-respuestas-admin');

            if ($responseRespuestasAdmin->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al llamar a FastAPI obtener-respuestas-admin',
                    'error' => $responseRespuestasAdmin->body(),
                ]);
            }
            $jsonRespuestasAdmin = $responseRespuestasAdmin->json();

            // Validar respuestas
            if (
                !isset($jsonCursosPreguntas['success'], $jsonRespuestasAdmin['success']) ||
                $jsonCursosPreguntas['success'] !== true || $jsonRespuestasAdmin['success'] !== true
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alguno de los endpoints FastAPI devolvió error',
                    'data_cursos_preguntas' => $jsonCursosPreguntas,
                    'data_respuestas_admin' => $jsonRespuestasAdmin,
                ]);
            }

            $datosCursosPreguntas = $jsonCursosPreguntas['data'];
            $datosRespuestas = $jsonRespuestasAdmin['data'];

            // Preparar inserción en simulacro_pregunta
            $insertSimulacroPreguntas = [];
            foreach ($datosCursosPreguntas as $cursoPregunta) {
                $nroPregunta = $cursoPregunta['numeropregunta'];
                $idCurso = $cursoPregunta['idcurso'];

                $opcionCorrecta = null;
                foreach ($datosRespuestas as $respuesta) {
                    if ($respuesta['numeropregunta'] == $nroPregunta) {
                        $opcionCorrecta = $respuesta['opcioncorrecta'];
                        break;
                    }
                }

                if ($opcionCorrecta === null) {
                    return response()->json([
                        'success' => false,
                        'message' => "No se encontró opción correcta para la pregunta {$nroPregunta}",
                    ]);
                }

                $insertSimulacroPreguntas[] = [
                    'idsimulacro' => $idSimulacro,
                    'numeropregunta' => $nroPregunta,
                    'idcurso' => $idCurso,
                    'opcioncorrecta' => $opcionCorrecta,
                ];
            }

            DB::connection('dbnewton')->table('simulacro_pregunta')->insert($insertSimulacroPreguntas);

            // --------------------------------------------------------------------------------
            // Aquí insertamos la notificación **para todos los estudiantes (rol = 2)**
            // --------------------------------------------------------------------------------

            // 1) Obtenemos todos los idusuario cuyo rol sea 2 (estudiante)
            $estudiantes = DB::connection('dbnewton')
                ->table('usuario')
                ->where('idrol', 2)
                ->pluck('idusuario');

            // 2) Para cada estudiante, creamos un array con los datos de la notificación
            $now = Carbon::now()->toDateTimeString(); // timestamp actual
            $notificacionesMasivas = [];
            foreach ($estudiantes as $idUsuario) {
                $notificacionesMasivas[] = [
                    'idusuario'   => $idUsuario,
                    'titulo'      => 'Nuevo simulacro disponible',
                    'mensaje'     => "Se ha registrado un simulacro «{$nombreSimulacroInput}» para la fecha {$fecha}  ¡No te lo pierdas!",
                    'url_destino' => null,
                    'leida'       => false,
                    'created_at'  => $now,
                    'updated_at'  => null,
                ];
            }

            if (!empty($notificacionesMasivas)) {
                // Insertamos todas en bloque
                DB::connection('dbnewton')->table('notificacion')->insert($notificacionesMasivas);
            }

            // Borra archivo temporal JSON
            unlink($rutaJsonCursosTemporal);

            return response()->json([
                'success' => true,
                'message' => 'Simulacro y preguntas guardadas correctamente.',
                'idSimulacro' => $idSimulacro,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error inesperado en el proceso',
                'error' => $e->getMessage(),
            ]);
        }
    }


    public function registrarSimulacroEstudiante(Request $request)
    {
        $request->validate([
            'idsimulacro' => 'required|integer|exists:simulacro,idsimulacro',
            'idusuario' => 'required|integer|exists:usuario,idusuario',
            'pdfhojarespuesta' => 'required|file|image|mimes:jpeg,png,jpg,bmp,tiff',
        ]);

        $idSimulacro = $request->idsimulacro;
        $idUsuario = $request->idusuario;

        // Validar duplicado
        $existe = DB::connection('dbnewton')
            ->table('estudiante_simulacro')
            ->where('idsimulacro', $idSimulacro)
            ->where('idusuario', $idUsuario)
            ->exists();

        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe un registro para este simulacro y estudiante.',
            ], 422);
        }

        try {
            DB::connection('dbnewton')->beginTransaction();

            // Procesar archivo
            $archivo = $request->file('pdfhojarespuesta');
            $nombreArchivo = "estudiante_{$idUsuario}_respuestas_{$idSimulacro}." . $archivo->getClientOriginalExtension();
            $rutaRelativa = "estudiantes_simulacros/" . $nombreArchivo;
            $rutaAbsoluta = public_path($rutaRelativa);

            if (!file_exists(public_path('estudiantes_simulacros'))) {
                mkdir(public_path('estudiantes_simulacros'), 0755, true);
            }

            $archivo->move(public_path('estudiantes_simulacros'), $nombreArchivo);

            // Llamar al servicio Python
            $response = Http::attach('file', file_get_contents($rutaAbsoluta), $nombreArchivo)
                ->post('https://proyectonewton.onrender.com/obtener-respuestas-estudiantes');

            if ($response->failed()) {
                DB::connection('dbnewton')->rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al comunicarse con el servicio de reconocimiento.',
                    'error' => $response->body(),
                ], 500);
            }

            $respuestas = $response->json()['data'] ?? [];

            // Obtener respuestas correctas
            $correctasDB = DB::connection('dbnewton')
                ->table('simulacro_pregunta')
                ->where('idsimulacro', $idSimulacro)
                ->pluck('opcioncorrecta', 'numeropregunta')
                ->toArray();

            $correctas = 0;
            $incorrectas = 0;
            $enblanco = 0;

            $respuestasAInsertar = [];

            foreach ($respuestas as $resp) {
                $numero = $resp['numeropregunta'];
                $opcion = $resp['opcionseleccionada'];

                if ($opcion === null || $opcion === '?') {
                    $enblanco++;
                    $resultado = false;
                } elseif (isset($correctasDB[$numero]) && strtoupper($opcion) === strtoupper($correctasDB[$numero])) {
                    $correctas++;
                    $resultado = true;
                } else {
                    $incorrectas++;
                    $resultado = false;
                }

                $respuestasAInsertar[] = [
                    'idsimulacro' => $idSimulacro,
                    'idusuario' => $idUsuario,
                    'numeropregunta' => $numero,
                    'opcionseleccionada' => $opcion,
                    'resultado' => $resultado,
                ];
            }

            // Calcular puntaje total
            $puntajetotal = ($correctas * 4.07) - ($incorrectas * 1.0175);

            /*****************************************************************
             * SECCIÓN PARA GENERAR EL JSON DE ERRORES POR CURSO
             *****************************************************************/

            // Paso 1: Filtrar solo las preguntas erradas
            $errores = array_filter($respuestasAInsertar, function ($respuesta) {
                return $respuesta['resultado'] === false;
            });

            // Paso 2: Obtener los números de pregunta erradas
            $numerosPreguntasErradas = array_column($errores, 'numeropregunta');

            // Paso 3: Obtener información de cursos y temas para las preguntas erradas
            $cursosConErrores = [];

            if (!empty($numerosPreguntasErradas)) {
                // Obtener relación pregunta-curso
                $preguntasConCurso = DB::connection('dbnewton')
                    ->table('simulacro_pregunta')
                    ->where('idsimulacro', $idSimulacro)
                    ->whereIn('numeropregunta', $numerosPreguntasErradas)
                    ->select('numeropregunta', 'idcurso')
                    ->get()
                    ->keyBy('numeropregunta');

                // Agrupar errores por curso
                $erroresPorCurso = [];

                foreach ($errores as $error) {
                    $numeroPregunta = $error['numeropregunta'];

                    if (isset($preguntasConCurso[$numeroPregunta])) {
                        $idcurso = $preguntasConCurso[$numeroPregunta]->idcurso;

                        if (!isset($erroresPorCurso[$idcurso])) {
                            $erroresPorCurso[$idcurso] = [];
                        }

                        $erroresPorCurso[$idcurso][] = $numeroPregunta;
                    }
                }

                // Obtener detalles de los cursos con errores
                if (!empty($erroresPorCurso)) {
                    $cursosIds = array_keys($erroresPorCurso);

                    // Obtener nombres de cursos
                    $cursos = DB::connection('dbnewton')
                        ->table('curso')
                        ->whereIn('idcurso', $cursosIds)
                        ->pluck('nombrecurso', 'idcurso')
                        ->toArray();

                    // Obtener temas para cada curso
                    $temasPorCurso = DB::connection('dbnewton')
                        ->table('tema')
                        ->whereIn('idcurso', $cursosIds)
                        ->select('idcurso', 'idtema', 'nombretema')
                        ->get()
                        ->groupBy('idcurso');

                    // Construir estructura final
                    foreach ($erroresPorCurso as $idcurso => $erroresCurso) {
                        $temasArray = [];

                        if (isset($temasPorCurso[$idcurso])) {
                            foreach ($temasPorCurso[$idcurso] as $tema) {
                                $temasArray[] = [
                                    'idtema' => $tema->idtema,
                                    'nombretema' => $tema->nombretema
                                ];
                            }
                        }

                        $cursosConErrores[] = [
                            'nombrecurso' => $cursos[$idcurso] ?? 'Curso Desconocido',
                            'idcurso' => $idcurso,
                            'lista_errores' => $erroresCurso,
                            'temas' => $temasArray
                        ];
                    }
                }
            }

            // Paso 4: Dividir en partes de máximo 3 cursos cada una
            $partesJSON = [];
            $partesCursos = array_chunk($cursosConErrores, 3);

            foreach ($partesCursos as $parte) {
                $partesJSON[] = [
                    'cursos' => $parte
                ];
            }

            /*****************************************************************
             * ENVÍO A API PYTHON Y PROCESAMIENTO DE RESPUESTA
             *****************************************************************/
            $feedbacksCompletos = [];
            $temasRecomendadosConsolidados = [];
            $feedbackCompleto = "";

            // Obtener nombre del simulacro para construir ruta
            $nombreSimulacro = DB::connection('dbnewton')
                ->table('simulacro')
                ->where('idsimulacro', $idSimulacro)
                ->value('nombresimulacro');

            //Obtener la fecha del simulacro
            $fechaSimulacro = DB::connection('dbnewton')
                ->table('simulacro')
                ->where('idsimulacro', $idSimulacro)
                ->value('created_at');

            if ($nombreSimulacro) {
                // Convertir el nombre a formato de carpeta
                $nombreCarpetaSimulacro = strtolower(str_replace(
                    [' ', '-', ':'],
                    '_',
                    $nombreSimulacro
                ));

                // Usar public_path para la carpeta simulacros dentro de public
                $rutaBaseSimulacros = public_path('simulacros');
                $rutaDirectorioSimulacro = $rutaBaseSimulacros . DIRECTORY_SEPARATOR . $nombreCarpetaSimulacro;

                // Verificar si el directorio existe
                if (is_dir($rutaDirectorioSimulacro)) {
                    // Buscar archivo PDF que comienza con "examen_simulacro"
                    $archivos = glob($rutaDirectorioSimulacro . DIRECTORY_SEPARATOR . 'examen_simulacro*.pdf');

                    if (!empty($archivos)) {
                        $rutaPdfSimulacro = $archivos[0];

                        // Enviar cada parte a la API de Python
                        foreach ($partesJSON as $parte) {
                            // Convertir el array a JSON sin escapar caracteres Unicode
                            $jsonData = json_encode($parte, JSON_UNESCAPED_UNICODE);

                            // Enviar con el método multipart
                            $responseFeedback = Http::asMultipart()
                                ->attach('file', file_get_contents($rutaPdfSimulacro), basename($rutaPdfSimulacro))
                                ->post('https://proyectonewton.onrender.com/feedback-simulacro', [
                                    'datos' => $jsonData
                                ]);

                            if ($responseFeedback->successful()) {
                                $respuestaPython = $responseFeedback->json();

                                // Guardar feedback
                                $feedbacksCompletos[] = $respuestaPython['feedback'];

                                // Consolidar temas recomendados
                                foreach ($respuestaPython['temas_recomendados'] as $cursoRecomendado) {
                                    $idcurso = $cursoRecomendado['idcurso'];

                                    if (!isset($temasRecomendadosConsolidados[$idcurso])) {
                                        $temasRecomendadosConsolidados[$idcurso] = [
                                            'nombrecurso' => $cursoRecomendado['nombrecurso'],
                                            'idcurso' => $idcurso,
                                            'temas' => []
                                        ];
                                    }

                                    // Agregar temas evitando duplicados
                                    foreach ($cursoRecomendado['temas'] as $tema) {
                                        $idtema = $tema['idtema'];

                                        // Verificar si el tema ya existe
                                        $existe = false;
                                        foreach ($temasRecomendadosConsolidados[$idcurso]['temas'] as $temaExistente) {
                                            if ($temaExistente['idtema'] === $idtema) {
                                                $existe = true;
                                                break;
                                            }
                                        }

                                        if (!$existe) {
                                            $temasRecomendadosConsolidados[$idcurso]['temas'][] = [
                                                'idtema' => $idtema,
                                                'nombretema' => $tema['nombretema']
                                            ];
                                        }
                                    }
                                }
                            } else {
                                $feedbacksCompletos[] = "Error al obtener feedback: " . $responseFeedback->status() . " - " . $responseFeedback->body();
                            }
                        }

                        $feedbackCompleto = implode("\n\n", $feedbacksCompletos);
                    } else {
                        $feedbackCompleto = "PDF del simulacro no encontrado en: $rutaDirectorioSimulacro";
                    }
                } else {
                    $feedbackCompleto = "Directorio de simulacro no encontrado: $rutaDirectorioSimulacro";
                }
            } else {
                $feedbackCompleto = "No se encontró el nombre del simulacro en la base de datos";
            }

            // Convertir el array consolidado a lista indexada
            $temasRecomendadosFinal = array_values($temasRecomendadosConsolidados);

            /*****************************************************************
             * INSERCIONES EN LA BASE DE DATOS
             *****************************************************************/

            // Insertar en estudiante_simulacro (con los nuevos campos)
            DB::connection('dbnewton')
                ->table('estudiante_simulacro')->insert([
                    'idsimulacro' => $idSimulacro,
                    'idusuario' => $idUsuario,
                    'pdfhojarespuesta' => $rutaRelativa,
                    'puntajetotal' => $puntajetotal,
                    'feedback' => $feedbackCompleto,
                    'datossugerencias' => json_encode($temasRecomendadosFinal, JSON_UNESCAPED_UNICODE),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            // Insertar en estudiante_respuesta
            DB::connection('dbnewton')->table('estudiante_respuesta')->insert($respuestasAInsertar);

            // Insertar notificación
            $now = now()->toDateTimeString();
            $fechaCodificada = rawurlencode($fechaSimulacro);
            DB::connection('dbnewton')->table('notificacion')->insert([
                'idusuario'   => $idUsuario,
                'titulo'      => 'Calificación de simulacro disponible',
                'mensaje'     => "Tus resultados y puntaje obtenidos en el «{$nombreSimulacro}» ya se encuentran disponibles, puedes revisarlos dando click en este mensaje o en la sección de Rendimiento",
                'url_destino' => "/dashboard/rendimientoSimulacros/{$fechaCodificada}",
                'leida'       => false,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);

            DB::connection('dbnewton')->commit();

            return response()->json([
                'success' => true,
                'message' => 'Simulacro registrado exitosamente.',
                'puntajetotal' => $puntajetotal,
            ]);
        } catch (\Exception $e) {
            DB::connection('dbnewton')->rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error inesperado en el proceso',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }


    public function obtenerDatosSimulacroEstudiantePorFecha($idusuario, $fecha)
    {
        try {
            // Buscar el simulacro que contiene la fecha en su nombre
            $simulacro = DB::connection('dbnewton')
                ->table('simulacro')
                ->where('nombresimulacro', 'like', '%' . $fecha . '%')
                ->first();

            if (!$simulacro) {
                // Si no se encuentra el simulacro con la fecha proporcionada
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró un simulacro con la fecha proporcionada.',
                ], 404);
            }

            // Obtener los datos del simulacro registrado en la tabla estudiante_simulacro
            $estudianteSimulacro = DB::connection('dbnewton')
                ->table('estudiante_simulacro')
                ->where('idsimulacro', $simulacro->idsimulacro)
                ->where('idusuario', $idusuario)
                ->first();

            if (!$estudianteSimulacro) {
                // Si no se encuentra el registro del estudiante para el simulacro
                return response()->json([
                    'success' => false,
                    'message' => 'El estudiante no tiene registros para el simulacro con la fecha proporcionada.',
                ], 404);
            }

            // Obtener los datos del simulacro desde la tabla simulacro
            $simulacroDatos = DB::connection('dbnewton')
                ->table('simulacro')
                ->where('idsimulacro', $simulacro->idsimulacro)
                ->first();

            if (!$simulacroDatos) {
                // Si no se encuentra información en la tabla de simulacros
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron los datos del simulacro.',
                ], 404);
            }

            // Preparar el formato de respuesta
            $responseData = [
                'success' => true,
                'message' => 'Datos obtenidos correctamente',
                'data' => [
                    'idsimulacro' => $simulacroDatos->idsimulacro,
                    'idusuario' => $estudianteSimulacro->idusuario,
                    'nombresimulacro' => $simulacroDatos->nombresimulacro,
                    'pdfexamen' => $simulacroDatos->pdfexamen,
                    'pdfrespuestas' => $simulacroDatos->pdfrespuestas,
                    'pdfsolucionario' => $simulacroDatos->pdfsolucionario,
                    'pdfhojarespuesta' => $estudianteSimulacro->pdfhojarespuesta,
                    'puntajetotal' => $estudianteSimulacro->puntajetotal,
                    'feedback' => $estudianteSimulacro->feedback,
                    'datossugerencias' => $estudianteSimulacro->datossugerencias,
                ]
            ];

            return response()->json($responseData);
        } catch (\Illuminate\Database\QueryException $e) {
            // Captura errores relacionados con la base de datos (SQL)
            Log::error('Error en SimulacroController@obtenerDatosSimulacroEstudiantePorFecha (DB Query): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error en la base de datos: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            // Captura cualquier otro tipo de error general
            Log::error('Error en SimulacroController@obtenerDatosSimulacroEstudiantePorFecha (General): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error inesperado: ' . $e->getMessage(),
            ], 500);
        }
    }
}
