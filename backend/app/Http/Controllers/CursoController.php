<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Models\Tema;
use App\Models\MaterialTema;
use Illuminate\Support\Str;

class CursoController extends Controller
{

    //-------------------------------------METODOS PARA CURSOS-------------------------------------//

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

    public function storeCurso(Request $request): JsonResponse
    {
        $errors = [];

        // Validaciones básicas
        if (!$request->has('nombrecurso') || trim($request->nombrecurso) === '') {
            $errors['nombrecurso'][] = 'El nombre del curso es obligatorio.';
        } elseif (Curso::where('nombrecurso', $request->nombrecurso)->exists()) {
            $errors['nombrecurso'][] = 'Ya existe un curso con este nombre.';
        }

        if (!empty($errors)) {
            return response()->json(['success' => false, 'errors' => $errors], 422);
        }

        try {
            $curso = Curso::create([
                'nombrecurso' => $request->nombrecurso,
                'created_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Curso creado correctamente.', 'data' => $curso]);
        } catch (\Exception $e) {
            Log::error('Error al registrar curso: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al crear el curso.'], 500);
        }
    }

    public function updateCurso(Request $request, $id): JsonResponse
    {
        $curso = Curso::find($id);
        if (!$curso) {
            return response()->json(['success' => false, 'message' => 'Curso no encontrado.'], 404);
        }

        $errors = [];

        if (!$request->has('nombrecurso') || trim($request->nombrecurso) === '') {
            $errors['nombrecurso'][] = 'El nombre del curso es obligatorio.';
        } elseif (Curso::where('nombrecurso', $request->nombrecurso)->where('idcurso', '!=', $id)->exists()) {
            $errors['nombrecurso'][] = 'Ya existe otro curso con este nombre.';
        }

        if (!empty($errors)) {
            return response()->json(['success' => false, 'errors' => $errors], 422);
        }

        try {
            $curso->nombrecurso = $request->nombrecurso;
            $curso->save();

            return response()->json(['success' => true, 'message' => 'Curso actualizado correctamente.', 'data' => $curso]);
        } catch (\Exception $e) {
            Log::error('Error al actualizar curso: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al actualizar el curso.'], 500);
        }
    }

    public function deleteCurso($id): JsonResponse
    {
        try {
            $curso = Curso::find($id);
            if (!$curso) {
                return response()->json(['success' => false, 'message' => 'Curso no encontrado.'], 404);
            }

            foreach ($curso->temas as $tema) {
                MaterialTema::where('idtema', $tema->idtema)->delete();
            }

            Tema::where('idcurso', $id)->delete();
            $curso->delete();

            return response()->json(['success' => true, 'message' => 'Curso y contenidos asociados eliminados.']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar curso: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al eliminar el curso.'], 500);
        }
    }

    //-------------------------------------FIN METODOS PARA CURSOS-------------------------------------//



    //-------------------------------------METODOS PARA TEMAS-------------------------------------//
    public function storeTema(Request $request, $idCurso): JsonResponse
    {
        $errors = [];

        if (!Curso::find($idCurso)) {
            return response()->json(['success' => false, 'message' => 'Curso no encontrado.'], 404);
        }

        if (!$request->has('nombretema') || trim($request->nombretema) === '') {
            $errors['nombretema'][] = 'El nombre del tema es obligatorio.';
        } elseif (Tema::where('nombretema', $request->nombretema)->where('idcurso', $idCurso)->exists()) {
            $errors['nombretema'][] = 'Ya existe un tema con este nombre en este curso.';
        }

        if (!empty($errors)) {
            return response()->json(['success' => false, 'errors' => $errors], 422);
        }

        try {
            $tema = Tema::create([
                'idcurso' => $idCurso,
                'nombretema' => $request->nombretema,
                'created_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Tema creado correctamente.', 'data' => $tema]);
        } catch (\Exception $e) {
            Log::error('Error al registrar tema: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al crear el tema.'], 500);
        }
    }

    public function updateTema(Request $request, $idTema): JsonResponse
    {
        $tema = Tema::find($idTema);
        if (!$tema) {
            return response()->json(['success' => false, 'message' => 'Tema no encontrado.'], 404);
        }

        $errors = [];

        if (!$request->has('nombretema') || trim($request->nombretema) === '') {
            $errors['nombretema'][] = 'El nombre del tema es obligatorio.';
        } elseif (Tema::where('nombretema', $request->nombretema)->where('idcurso', $tema->idcurso)->where('idtema', '!=', $idTema)->exists()) {
            $errors['nombretema'][] = 'Ya existe otro tema con este nombre en el curso.';
        }

        if (!empty($errors)) {
            return response()->json(['success' => false, 'errors' => $errors], 422);
        }

        try {
            $tema->nombretema = $request->nombretema;
            $tema->save();

            return response()->json(['success' => true, 'message' => 'Tema actualizado correctamente.', 'data' => $tema]);
        } catch (\Exception $e) {
            Log::error('Error al actualizar tema: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al actualizar el tema.'], 500);
        }
    }

    public function deleteTema($idTema): JsonResponse
    {
        try {
            $tema = Tema::find($idTema);
            if (!$tema) {
                return response()->json(['success' => false, 'message' => 'Tema no encontrado.'], 404);
            }

            MaterialTema::where('idtema', $idTema)->delete();
            $tema->delete();

            return response()->json(['success' => true, 'message' => 'Tema y materiales asociados eliminados.']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar tema: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al eliminar el tema.'], 500);
        }
    }

    //-------------------------------------FIN METODOS PARA TEMAS-------------------------------------//



    //-------------------------------------METODOS PARA MATERIALES-------------------------------------//

    public function getMaterialesByTema($idTema): JsonResponse
    {
        // 1) Validamos que el tema exista (o lanzará 404 automático con findOrFail)
        $tema = Tema::findOrFail($idTema);

        // 2) Cargamos sus materiales (relación hasMany en tu modelo Tema)
        //    Asegúrate en el modelo Tema:
        //    public function materiales() { return $this->hasMany(MaterialTema::class, 'idtema'); }
        $materiales = $tema->materiales()->orderBy('idmaterial', 'asc')->get();

        // 3) Devolvemos JSON con éxito y datos
        return response()->json([
            'success' => true,
            'data'    => $materiales,
        ]);
    }


    public function storeMaterial(Request $request, $idTema): JsonResponse
    {
        $errors = [];

        if (!Tema::find($idTema)) {
            return response()->json(['success' => false, 'message' => 'Tema no encontrado.'], 404);
        }

        if (!$request->has('tipomaterial') || trim($request->tipomaterial) === '') {
            $errors['tipomaterial'][] = 'El tipo de material es obligatorio.';
        }

        if (!$request->has('nombrematerial') || trim($request->nombrematerial) === '') {
            $errors['nombrematerial'][] = 'El nombre del material es obligatorio.';
        }

        if (!$request->hasFile('archivo')) {
            $errors['archivo'][] = 'El archivo es obligatorio.';
        }

        if (!empty($errors)) {
            return response()->json(['success' => false, 'errors' => $errors], 422);
        }

        try {
            $file = $request->file('archivo');

            $folderPath = public_path('materiales');
            if (!file_exists($folderPath)) {
                mkdir($folderPath, 0777, true);
            }

            $filename = now()->format('YmdHis') . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
            $file->move($folderPath, $filename);

            $material = MaterialTema::create([
                'idtema' => $idTema,
                'tipomaterial' => $request->tipomaterial,
                'nombrematerial' => $request->nombrematerial,
                'url' => 'materiales/' . $filename,
                'created_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Material registrado correctamente.', 'data' => $material]);
        } catch (\Exception $e) {
            Log::error('Error al registrar material: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al crear el material.'], 500);
        }
    }

    public function updateMaterial(Request $request, $id): JsonResponse
    {
        // 1) Buscar el material o falla con 404 automáticamente
        $material = MaterialTema::find($id);
        if (! $material) {
            return response()->json([
                'success' => false,
                'message' => 'Material no encontrado.',
            ], 404);
        }

        // 2) Validar campos
        $validated = $request->validate([
            'tipomaterial'   => 'required|in:Flashcards,PDF,Video,Solucionario',
            'nombrematerial' => 'required|string|max:255',
            'archivo'        => 'nullable|file',
        ], [
            'tipomaterial.required'   => 'El tipo de material es obligatorio.',
            'tipomaterial.in'         => 'El tipo de material no es válido.',
            'nombrematerial.required' => 'El nombre del material es obligatorio.',
            'archivo.file'            => 'El archivo debe ser un fichero válido.',
        ]);

        try {
            // 3) Si subió nuevo archivo, guardarlo
            if ($request->hasFile('archivo')) {
                $file       = $request->file('archivo');
                $folderPath = public_path('materiales');
                if (! file_exists($folderPath)) {
                    mkdir($folderPath, 0777, true);
                }
                $filename = now()
                    ->format('YmdHis') . '_' .
                    Str::slug(
                        pathinfo(
                            $file->getClientOriginalName(),
                            PATHINFO_FILENAME
                        )
                    )
                    . '.' .
                    $file->getClientOriginalExtension();

                $file->move($folderPath, $filename);
                $material->url = 'materiales/' . $filename;
            }

            // 4) Actualizar resto de campos
            $material->tipomaterial   = $validated['tipomaterial'];
            $material->nombrematerial = $validated['nombrematerial'];
            $material->save();

            // 5) Devolver éxito
            return response()->json([
                'success' => true,
                'message' => 'Material actualizado correctamente.',
                'data'    => $material,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al actualizar material: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno al actualizar el material.',
            ], 500);
        }
    }

    public function deleteMaterial($idMaterial): JsonResponse
    {
        try {
            $material = MaterialTema::find($idMaterial);
            if (!$material) {
                return response()->json(['success' => false, 'message' => 'Material no encontrado.'], 404);
            }

            $material->delete();

            return response()->json(['success' => true, 'message' => 'Material eliminado correctamente.']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar material: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno al eliminar el material.'], 500);
        }
    }

    //-------------------------------------FIN METODOS PARA MATERIALES-------------------------------------//

}
