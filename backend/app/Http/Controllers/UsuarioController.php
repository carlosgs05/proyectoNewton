<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function getUsuarios()
    {
        try {
            $usuarios = Usuario::with('rol')->get();
            return response()->json([
                'success' => true,
                'data' => $usuarios
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios'
            ], 500);
        }
    }

    public function createUsuario(Request $request)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:50',
                'apellido' => 'required|string|max:50',
                'dni' => 'required|string|size:8|unique:dbnewton.usuario,dni',
                'correo' => 'required|email|unique:dbnewton.usuario,correo',
                'contrasena' => 'required|string|min:6',
                'celular' => 'required|string|max:9',
                'codigomatricula' => 'required|string|max:20',
                'idrol' => 'required|integer|exists:dbnewton.rol,idrol',
            ]);

            // Mapear campos y encriptar contraseña
            $usuarioData = [
                'nombre' => $validated['nombre'],
                'apellido' => $validated['apellido'],
                'dni' => $validated['dni'],
                'correo' => $validated['correo'],
                'contrasena' => bcrypt($validated['contrasena']),
                'celular' => $validated['celular'],
                'codigomatricula' => $validated['codigomatricula'],
                'idrol' => $validated['idrol']
            ];

            $usuario = Usuario::create($usuarioData);

            return response()->json([
                'success' => true,
                'data' => $usuario,
                'message' => 'Usuario creado exitosamente'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'correo' => 'required|email',
            'password' => 'required|string'
        ]);

        $usuario = Usuario::where('correo', $request->correo)
                    ->with('rol')
                    ->first();

        if (!$usuario || !Hash::check($request->password, $usuario->contrasena)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $usuario,
            'rol' => $usuario->rol
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }
}
