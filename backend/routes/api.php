<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\RolController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\ETLController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SimulacroController;



Route::get('/generate-hash', function () {
    return bcrypt('marina123'); // Generará un hash compatible con Laravel
});


// Rutas de autenticación
Route::post('/login', [UsuarioController::class, 'login']);
Route::post('/logout', [UsuarioController::class, 'logout'])->middleware('auth:sanctum');


// Rutas roles
Route::get('/roles/listar', [RolController::class, 'getRoles']);
Route::post('/roles/crear', [RolController::class, 'createRol']);


// Rutas permisos


// Rutas usuarios
Route::get('/usuarios/listar', [UsuarioController::class, 'getUsuarios']);
Route::post('/usuarios/crear', [UsuarioController::class, 'createUsuario']);


// Rutas cursos
Route::get('/cursos/listar', [CursoController::class, 'getAllCursos']);

// Rutas ETL
Route::prefix('etl')->group(function () {
    Route::post('/full', [ETLController::class, 'runFullETL']);
    Route::post('/usuario', [ETLController::class, 'runUsuarioETL']);
    Route::post('/tiempo', [ETLController::class, 'runTiempoETL']);
    Route::post('/tema', [ETLController::class, 'runTemaETL']);
});

// Rutas de reportes
Route::post('report/performance', [ReportController::class, 'performance']);
Route::get('/report/consumoMaterial', [ReportController::class, 'reportesMaterial']);



// Ruta para procesar simulacro de un estudiante
Route::post('simulacro_estudiante/registrar', [SimulacroController::class, 'registrarSimulacroEstudiante']);