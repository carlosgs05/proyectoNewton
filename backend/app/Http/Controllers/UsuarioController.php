<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class UsuarioController extends Controller
{
    public function getUsuarios()
    {
        try {
            $usuarios = Usuario::with(['rol.permisos'])->get();

            $usuarios = $usuarios->map(function ($usuario) {
                try {
                    $usuario->passwordenc = Crypt::decryptString($usuario->passwordenc);
                } catch (\Exception) {
                    $usuario->passwordenc = null;
                }
                return $usuario;
            });

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

    public function getOnlyEstudiantes()
    {
        try {
            $estudiantes = Usuario::where('idrol', 2)
                ->with(['rol.permisos'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $estudiantes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes'
            ], 500);
        }
    }

    public function createUsuario(Request $request)
    {
        try {
            $currentYear = date('Y');
            $estudianteRolId = 2;

            $reglas = [
                'nombre'          => ['required', 'string', 'max:50', 'regex:/^[\pL\sáéíóúÁÉÍÓÚñÑ]+$/u'],
                'apellido'        => ['required', 'string', 'max:50', 'regex:/^[\pL\sáéíóúÁÉÍÓÚñÑ]+$/u'],
                'dni'             => ['required', 'string', 'size:8', 'regex:/^[0-9]{8}$/', 'unique:dbnewton.usuario,dni'],
                'celular'         => ['required', 'string', 'size:9', 'regex:/^9[0-9]{8}$/'],
                'codigomatricula' => [
                    'required_if:idrol,' . $estudianteRolId,
                    'string',
                    'max:20',
                    'unique:dbnewton.usuario,codigomatricula',
                    function ($value, $fail) use ($currentYear) {
                        if (!preg_match('/^E' . $currentYear . '00\d{2,}$/', $value)) {
                            $fail("El formato debe ser E{$currentYear}00 seguido de mínimo 2 dígitos.");
                        }
                    },
                ],
                'idrol' => ['required', 'integer', 'exists:dbnewton.rol,idrol'],
            ];

            $mensajes = [
                'nombre.required'           => 'El nombre es obligatorio',
                'nombre.regex'              => 'El nombre solo permite letras y espacios',
                'apellido.required'         => 'El apellido es obligatorio',
                'apellido.regex'            => 'El apellido solo permite letras y espacios',
                'dni.required'              => 'El DNI es obligatorio',
                'dni.size'                  => 'El DNI debe tener 8 dígitos',
                'dni.unique'                => 'El DNI ya está registrado',
                'celular.required'          => 'El celular es obligatorio',
                'celular.size'              => 'El celular debe tener 9 dígitos',
                'codigomatricula.required_if' => 'El código de matrícula es obligatorio para estudiantes',
                'codigomatricula.unique'    => 'El código de matrícula ya existe',
                'idrol.required'            => 'El rol es obligatorio',
            ];

            $validated = $request->validate($reglas, $mensajes);

            $correoGenerado     = strtolower(substr($validated['nombre'], 0, 1))
                . ucfirst(strtolower($validated['apellido'])) . '@gmail.com';
            $plaintextPassword  = 'E' . $validated['dni'] . $currentYear;
            $hashedPassword     = bcrypt($plaintextPassword);
            $passwordEnc        = Crypt::encryptString($plaintextPassword);

            $usuarioData = [
                'nombre'          => $validated['nombre'],
                'apellido'        => $validated['apellido'],
                'dni'             => $validated['dni'],
                'correo'          => $correoGenerado,
                'contrasena'      => $hashedPassword,
                'celular'         => $validated['celular'],
                'codigomatricula' => $validated['codigomatricula'] ?? null,
                'idrol'           => $validated['idrol'],
                'passwordenc'     => $passwordEnc,
                'activo'          => false, // usuario aún no ha ingresado
            ];

            $usuario = Usuario::create($usuarioData);

            return response()->json([
                'success' => true,
                'data'    => [
                    'usuario'      => $usuario,
                    'credenciales' => [
                        'correo'    => $correoGenerado,
                        'contrasena' => $plaintextPassword
                    ]
                ],
                'message' => 'Usuario registrado exitosamente'
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en el servidor: ' . $e->getMessage()
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
            ->with('rol.permisos')
            ->first();

        if (!$usuario || !Hash::check($request->password, $usuario->contrasena)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // Si es su primer ingreso, aún no ha cambiado la contraseña => redirigir a cambio de contraseña
        if (!$usuario->activo) {
            return response()->json([
                'success' => true,
                'primer_ingreso' => true,
                'message' => 'Debe cambiar la contraseña para continuar',
                'user_id' => $usuario->idusuario
            ]);
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

    public function activarCuenta(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:dbnewton.usuario,idusuario',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $usuario = Usuario::findOrFail($request->user_id);
        $usuario->contrasena = bcrypt($request->new_password);
        $usuario->activo = true;
        $usuario->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña cambiada. Cuenta activada correctamente.'
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

    public function updatePersonalInfo(Request $request, $id)
    {
        $user = Usuario::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'dni' => [
                'required',
                'digits:8',
                Rule::unique('usuario', 'dni')->ignore($id, 'idusuario')
            ],
            'celular' => [
                'required',
                'digits:9',
                Rule::unique('usuario', 'celular')->ignore($id, 'idusuario')
            ]
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.string' => 'El nombre debe ser texto válido',
            'apellido.required' => 'El apellido es obligatorio',
            'apellido.string' => 'El apellido debe ser texto válido',
            'dni.required' => 'El DNI es obligatorio',
            'dni.digits' => 'El DNI debe tener 8 dígitos exactos',
            'dni.unique' => 'Este DNI ya está registrado',
            'celular.required' => 'El celular es obligatorio',
            'celular.digits' => 'El celular debe tener 9 dígitos exactos',
            'celular.unique' => 'Este celular ya está registrado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['nombre', 'apellido', 'dni', 'celular']));

        return response()->json([
            'success' => true,
            'message' => 'Información personal actualizada correctamente',
            'data' => $user
        ]);
    }

    public function updatePassword(Request $request, $id)
    {
        $user = Usuario::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'new_password' => [
                'required',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
            ]
        ], [
            'new_password.required' => 'La nueva contraseña es obligatoria',
            'new_password.confirmed' => 'Las contraseñas no coinciden',
            'new_password.regex' => 'La contraseña debe contener al menos: 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->contrasena = bcrypt($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente',
            'data' => $user
        ]);
    }
}
