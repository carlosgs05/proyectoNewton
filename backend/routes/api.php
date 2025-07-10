<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\RolController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SimulacroController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\MetodoAprendizajeController;



Route::get('/generate-hash', function () {
    return bcrypt('marina123'); // Generará un hash compatible con Laravel
});


// Rutas de autenticación
Route::post('/login', [UsuarioController::class, 'login']);
Route::post('/logout', [UsuarioController::class, 'logout'])->middleware('auth:sanctum');


// Rutas roles
Route::get('/roles/listar', [RolController::class, 'getRoles']);
Route::post('/roles/crear', [RolController::class, 'createRol']);


// Ruta contraseña de seguridad del sistema
Route::get('/security-system-password', function () {
    return response()->json([
        'password' => env('SECURITY_WORK_PASSWORD')
    ]);
});

// Rutas usuarios
Route::get('/usuarios/listar', [UsuarioController::class, 'getUsuarios']);
Route::get('/usuarios/estudiantes', [UsuarioController::class, 'getOnlyEstudiantes']);
Route::post('/usuarios/crear', [UsuarioController::class, 'createUsuario']);
Route::put('/usuarios/{id}/personal-info', [UsuarioController::class, 'updatePersonalInfo']);
Route::put('/usuarios/{id}/password', [UsuarioController::class, 'updatePassword']);


// CURSOS
Route::get('/cursos/listar', [CursoController::class, 'ObtenerCursosYDetalles']);
Route::get('/cursos/datos-generales', [CursoController::class, 'obtenerDatosGeneralesCursos']);
Route::post('/cursos/registrar', [CursoController::class, 'storeCurso']);
Route::put('/cursos/{id}/actualizar', [CursoController::class, 'updateCurso']);
Route::delete('/cursos/{id}/eliminar', [CursoController::class, 'deleteCurso']);

// TEMAS
Route::post('/cursos/{idCurso}/temas/registrar', [CursoController::class, 'storeTema']);
Route::put('/temas/{id}/actualizar', [CursoController::class, 'updateTema']);
Route::delete('/temas/{id}/eliminar', [CursoController::class, 'deleteTema']);

// MATERIALES
Route::get('/temas/{idTema}/materiales/listar', [CursoController::class, 'getMaterialesByTema']);
Route::post('/temas/{idTema}/materiales/registrar', [CursoController::class, 'storeMaterial']);
Route::post('/materiales/{id}/actualizar', [CursoController::class, 'updateMaterial']);
Route::delete('/materiales/{id}/eliminar', [CursoController::class, 'deleteMaterial']);


// Rutas de simulacros
Route::get('/simulacros/listar', [SimulacroController::class, 'obtenerTodosLosSimulacros']);
Route::get('/simulacros/realizados', [SimulacroController::class, 'obtenerSimulacrosRealizados']);
Route::post('/simulacros/registrar', [SimulacroController::class, 'registrarSimulacroAdmin']);
Route::get('/simulacros/{idsimulacro}/estudiantes', [SimulacroController::class, 'obtenerEstudiantesPorSimulacro']);
Route::post('/registrar-simulacro-estudiante', [SimulacroController::class, 'registrarSimulacroEstudiante']);
Route::get('/simulacro/estudiante/{idusuario}/{fecha}', [SimulacroController::class, 'obtenerDatosSimulacroEstudiantePorFecha']);

// Rutas para notificaciones
Route::get('/notificaciones/{idusuario}', [NotificacionController::class, 'listarNotificaciones']);
Route::put('/notificaciones/{idnotificacion}/leer', [NotificacionController::class, 'marcarComoLeida']);


// Rutas de métodos de aprendizaje
Route::get('/metodos-aprendizaje/{idusuario}/{mes}/{anio}', [MetodoAprendizajeController::class, 'getMetodoAprendizajeEstudiante']);
Route::get('/cursos-temas', [MetodoAprendizajeController::class, 'getCursosConTemas']);
Route::get('/cursos-recomendados/{idusuario}/{mes}/{anio}', [MetodoAprendizajeController::class, 'getCursosRecomendados']);
Route::post('/metodos-aprendizaje/registrar', [MetodoAprendizajeController::class, 'registrarMetodoAprendizaje']);
Route::get('/obtener-materiales-exclusivos/{idusuario}/{mes}/{año}', [MetodoAprendizajeController::class, 'obtenerMaterialesExclusivos']);

// Rutas de reportes
Route::get('/runETL', [ReportController::class, 'runETL']);
Route::post('report/reporteSimulacrosPuntaje', [ReportController::class, 'reporteSimulacrosPuntaje']);
Route::get('/report/consumoMaterial', [ReportController::class, 'reportesMaterial']);
Route::post('/report/simulacroCursoDetalle', [ReportController::class, 'reporteSimulacroCursoDetalle']);
