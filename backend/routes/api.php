<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\RolController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ETLController;
use App\Http\Controllers\ReportController;



Route::get('/generate-hash', function () {
    return bcrypt('gustavo123'); // Generará un hash compatible con Laravel
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

// Rutas ETL
Route::prefix('etl')->group(function () {
    Route::post('/full', [ETLController::class, 'runFullETL']);
    Route::post('/usuario', [ETLController::class, 'runUsuarioETL']);
    Route::post('/tiempo', [ETLController::class, 'runTiempoETL']);
    Route::post('/tema', [ETLController::class, 'runTemaETL']);
});

// Rutas de reportes
Route::post('report/performance', [ReportController::class, 'performance']);