<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RolController extends Controller
{
    public function getRoles()
    {
        try {
            $roles = Rol::with('permisos')->get();
            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles'
            ], 500);
        }
    }

    public function createRol(Request $request)
    {
        try {
            // Validación mejorada
            $validated = $request->validate([
                'nombre' => 'required|string|max:20|unique:dbnewton.rol,nombre'
            ]);

            DB::beginTransaction();
            
            $rol = Rol::create($validated);
            
            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $rol,
                'message' => 'Rol creado exitosamente'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear rol: ' . $e->getMessage()
            ], 500);
        }
    }

    public function showRol($id)
    {
        try {
            $rol = Rol::with('permisos')->findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $rol
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }
    }

    public function updateRol(Request $request, $id)
    {
        try {
            $rol = Rol::findOrFail($id);

            $validated = $request->validate([
                'Nombre' => 'required|string|max:20|unique:dbnewton.rol,Nombre,' . $id . ',idRol'
            ]);

            $rol->update($validated);

            return response()->json([
                'success' => true,
                'data' => $rol,
                'message' => 'Rol actualizado exitosamente'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar rol'
            ], 500);
        }
    }

    public function deleteRol($id)
    {
        try {
            $rol = Rol::findOrFail($id);
            $rol->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar rol'
            ], 500);
        }
    }
}
